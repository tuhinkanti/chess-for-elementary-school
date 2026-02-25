# Detailed Code Review: Chess Kids Project

This document outlines a comprehensive review of the `chess-kids` codebase, focusing on security, correctness, best practices, and maintainability.

## 1. Critical Security Vulnerability: Prompt Injection

### Finding
The backend API endpoint (`api/tutor.ts`) and the local development server (`server.js`) are vulnerable to **Prompt Injection**. The code accepts a `systemPrompt` field directly from the request body and uses it to construct the AI's system message.

**Location:** `chess-kids/api/tutor.ts` and `chess-kids/server.js`

```typescript
const { messages, systemPrompt } = req.body;
// ...
const systemMessage = systemPrompt || `You are Grandmaster Gloop...`;
```

### Impact
A malicious user can override the system prompt entirely by sending a custom `systemPrompt` in the JSON body. This allows them to bypass safety filters, change the AI's persona, or extract sensitive instructions.

### Recommendation
*   **Remove client-side control:** Do not accept `systemPrompt` from the client request body. The system prompt should be defined exclusively on the server side.
*   **Validate input:** Ensure `req.body` only contains the expected `messages` array and strictly validate its structure.

## 2. Frontend Logic & React Anti-Patterns

### Finding A: Derived State in Render Body (`ChessBoard.tsx`)
The `ChessBoard` component updates state directly within the render function body when props change.

**Location:** `chess-kids/src/components/ChessBoard.tsx`

```typescript
if (fen !== prevFen) {
    setPrevFen(fen);
    setGame(new Chess(fen));
    // ...
}
```

### Impact
This pattern causes an immediate re-render every time `fen` changes, which can lead to performance issues and unpredictable behavior. React's strict mode may trigger this multiple times.

### Recommendation
*   **Use `useEffect`:** Move the state synchronization logic into a `useEffect` hook dependent on `[fen]`.
    ```typescript
    useEffect(() => {
        setGame(new Chess(fen));
        setSelectedSquare(null);
        setMoveSquares({});
    }, [fen]);
    ```
*   **Lift State:** Ideally, lift the game state up to the parent component (`LessonPage`) to avoid duplicating state between `fen` prop and internal `game` object.

### Finding B: Race Conditions in Chat (`useChessTutor.ts`)
The `sendMessage` function uses a stale closure variable `updatedMessages` when updating state after an async API call.

**Location:** `chess-kids/src/hooks/useChessTutor.ts`

```typescript
const updatedMessages = [...messages, newUserMessage];
setMessages(updatedMessages);
// ... await API call ...
setMessages([...updatedMessages, assistantMessage]);
```

### Impact
If the user sends another message while the AI is thinking, the `messages` state will update, but `updatedMessages` inside the closure remains the old version. When the API response returns, it will overwrite the newer messages with the old state plus the assistant's reply, causing message loss.

### Recommendation
*   **Functional Updates:** Use the functional form of `setMessages` to ensure updates are based on the latest state.
    ```typescript
    setMessages(prev => [...prev, assistantMessage]);
    ```

## 3. Backend Logic & Architecture

### Finding A: Code Duplication
The core AI logic (model selection, provider configuration) is duplicated between `server.js` (for local dev) and `api/tutor.ts` (for production).

### Impact
Changes to model configuration or logic must be applied in two places, increasing the risk of inconsistency and bugs.

### Recommendation
*   **Shared Utility:** Extract the model configuration and provider logic into a shared utility file (e.g., `src/utils/aiConfig.ts`) that can be imported by both environments.

### Finding B: Hardcoded Secrets
API keys and URLs (e.g., `lm-studio`, `localhost:1234`) are hardcoded in `server.js` and `api/tutor.ts`.

### Recommendation
*   **Environment Variables:** Use `process.env` for all sensitive values and configuration endpoints. Create a `.env.example` file to document required variables.

## 4. Performance: Synchronous Storage

### Finding
The `MemoryService` uses synchronous `localStorage` operations for all data persistence.

**Location:** `chess-kids/src/services/memory/memoryService.ts`

```typescript
private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
}
```

### Impact
As the student's memory grows (facts, history), serializing and writing the entire store synchronously will block the main thread, causing UI freezes (jank) during auto-saves.

### Recommendation
*   **Asynchronous Storage:** Switch to an asynchronous storage solution like `IndexedDB` (using a wrapper like `idb-keyval`) to keep the main thread responsive.
*   **Debouncing:** Implement debouncing for save operations to reduce the frequency of writes.

## 5. Maintainability: Inline Styles

### Finding
The `TutorMascot` component contains a large block of inline CSS within a `<style>` tag.

**Location:** `chess-kids/src/components/TutorMascot.tsx`

### Impact
This makes the component harder to read and maintain. Syntax highlighting and linting for CSS are lost, and styles are not reusable.

### Recommendation
*   **CSS Modules / External File:** Move the styles to a separate `TutorMascot.module.css` or `TutorMascot.css` file.

## 6. Type Safety

### Finding
The code uses `any` in several places, particularly in error handling and API response parsing.

**Example:** `catch (error: any)` in `api/tutor.ts`.

### Recommendation
*   **Structured Error Handling:** Define a custom error type or use `unknown` with type guards to safely handle errors.
*   **Zod Validation:** Use a runtime validation library like `zod` to validate API responses instead of unchecked type assertions (`as TutorResponse`).

---

**End of Review**
