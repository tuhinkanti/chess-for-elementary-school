# Code Review Report

This document outlines a detailed code review of the `chess-kids` project, focusing on correctness, TypeScript best practices, code quality, performance, and security.

## 1. Backend API (`chess-kids/api/tutor.ts`)

### Security & Logic
*   **Critical Vulnerability (Prompt Injection)**: The API accepts a `systemPrompt` field in the request body (`req.body.systemPrompt`) and prioritizes it over the default system prompt.
    *   **Finding**: `const systemMessage = systemPrompt || ...` allows a malicious client to override the AI's persona and safety constraints.
    *   **Suggestion**: Remove the ability for the client to send a `systemPrompt`. Construct the system prompt entirely on the server-side to ensure the AI's behavior cannot be manipulated.
*   **Input Validation**: `req.body` is cast to a type without runtime validation of the content (other than `messages` being an array).
    *   **Finding**: `req.body as { ... }` is unsafe. `validateTutorRequest` only checks if `messages` is an array, not the content of messages.
    *   **Suggestion**: Use a schema validation library like `zod` to validate the entire request body structure, including message content types.

### TypeScript Best Practices
*   **Error Handling**: The `catch` block uses `error: any` with an `eslint-disable-line`.
    *   **Suggestion**: Type the error as `unknown` and use type guards (e.g., `instanceof Error`) to safely access error properties.

## 2. Component (`chess-kids/src/components/ChessBoard.tsx`)

### React Best Practices
*   **Side Effects in Render**: The component uses a "derived state" pattern inside the render body to sync `chess.js` state: `if (fen !== prevFen) { setGame(...) }`.
    *   **Finding**: Writing to state during render causes an immediate re-render and can lead to inconsistencies or performance issues.
    *   **Suggestion**: Move this logic to a `useEffect(() => { ... }, [fen])` hook.
*   **Prop Types**: `customArrows` is defined as `string[][]` but likely expects `[string, string][]` (tuples) for better type safety.
    *   **Suggestion**: strict typing: `customArrows?: [string, string][]`.

### Logic
*   **State Management**: `handleMove` updates the local `game` state using `setGame(new Chess(nextFen))`. However, it also calls `onMove`, which likely updates the `fen` prop in the parent.
    *   **Finding**: This creates a potential race condition where the local state updates, then the prop updates, triggering the derived state reset again.
    *   **Suggestion**: If the component is controlled (via `fen` prop), rely on the prop update to sync state, or use an uncontrolled mode. Avoid dual sources of truth.

## 3. Services

### AI Service (`chess-kids/src/services/ai/tutorService.ts`)
*   **Security/Architecture**: The `constructSystemPrompt` method resides on the client.
    *   **Finding**: While convenient, this exposes the prompt logic to the client. Since the API currently accepts a `systemPrompt` override, this reinforces the security vulnerability.
    *   **Suggestion**: Move prompt construction logic to the server (`api/tutor.ts`) and remove it from the client service.
*   **Type Safety**: The `chat` method casts the API response: `return data as TutorResponse`.
    *   **Finding**: No runtime guarantee that the API response matches the interface.
    *   **Suggestion**: Validate the response with `zod` before returning.
*   **Configuration**: The API endpoint `/api/tutor` is hardcoded.
    *   **Suggestion**: Use an environment variable (e.g., `import.meta.env.VITE_API_ENDPOINT`) for flexibility across environments.

### Memory Service (`chess-kids/src/services/memory/memoryService.ts`)
*   **Performance**: The service uses synchronous `localStorage` operations (`getItem`, `setItem`) for every read/write.
    *   **Finding**: As the memory dataset grows, these synchronous IO operations will block the main thread, causing UI jank.
    *   **Suggestion**: Refactor to use an asynchronous storage mechanism (like `IndexedDB` via `idb`) or at least treat the interface as asynchronous (return Promises) to allow for future migration without breaking the API.
*   **Type Mismatch**: `addFact` implementation handles `relatedEntities`, but the hook wrapper (`useStudentMemory`) does not expose it.

## 4. Hooks

### `useStudentMemory` (`chess-kids/src/hooks/useStudentMemory.ts`)
*   **Correctness**: The `addFact` wrapper function signature does not match the service's `addFact`.
    *   **Finding**: `relatedEntities` argument is missing in the hook's `addFact`.
    *   **Suggestion**: Update the hook signature to include `relatedEntities?: string[]` and pass it to the service.

### `useChessTutor` (`chess-kids/src/hooks/useChessTutor.ts`)
*   **Logic**: `startConversation` overwrites the message history: `setMessages([assistantMessage])`.
    *   **Finding**: This clears any previous context, which might be intended for a "new" conversation, but if the user expects history to persist across "Ask Gloop" clicks, this is a bug.
    *   **Suggestion**: Verify if this is intended behavior. If context should be preserved, use `setMessages(prev => [...prev, assistantMessage])`.

## 5. Pages (`chess-kids/src/pages/LessonPage.tsx`)

### Performance
*   **Memoization Breakage**: `highlightSquares` and `customArrows` props passed to `ChessBoard` are created as new arrays/objects on every render.
    *   **Finding**:
        ```typescript
        highlightSquares={latestResponse?.highlightSquare ? [latestResponse.highlightSquare] : []}
        customArrows={latestResponse?.drawArrow ? [latestResponse.drawArrow.split('-')] : []}
        ```
        This defeats `React.memo` or `useMemo` optimizations inside `ChessBoard`, causing it to re-render on every parent render.
    *   **Suggestion**: Memoize these values using `useMemo` before passing them to the component.

### Maintainability
*   **Inline Styles**: The component contains a large `<style>` block.
    *   **Suggestion**: Move styles to a CSS module or the existing `App.css` to improve readability and separation of concerns.

## Summary
The codebase is functional but contains critical security flaws regarding prompt injection and several performance bottlenecks related to React rendering and synchronous storage. Addressing the API security and `ChessBoard` rendering issues should be the highest priority.
