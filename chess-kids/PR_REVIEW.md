# Code Review Findings

This document contains a detailed code review of the `chess-kids` project, focusing on correctness, TypeScript best practices, code quality, performance, security, error handling, and adherence to principles.

## 1. Backend (`api/tutor.ts` and `server.js`)

### Correctness and Logic
*   **Issue:** The `systemPrompt` is constructed on the client (`src/services/ai/tutorService.ts`) and passed to the backend via `req.body`.
    *   **Reasoning:** This allows a malicious client to override the system prompt (Prompt Injection), potentially bypassing safety guardrails or altering the persona.
    *   **Suggestion:** Move the `systemPrompt` construction logic entirely to the backend (`api/tutor.ts` and `server.js`). The client should only send the `GameContext` or user message, and the server should decide the prompt based on that context.
*   **Issue:** `req.body` is cast to `{ messages: ChatMessage[]; systemPrompt?: string; }` without validation.
    *   **Reasoning:** If `req.body` is malformed or missing fields, it could crash the server or lead to unexpected behavior.
    *   **Suggestion:** Use a validation library like `zod` or manual checks to ensure `req.body` matches the expected schema before processing.

### TypeScript Best Practices
*   **Issue:** The `api` directory is excluded from `tsconfig.json` (based on `include: ["src", ...]`).
    *   **Reasoning:** Backend code is not being type-checked during the build process, increasing the risk of runtime errors.
    *   **Suggestion:** Add `"api"` to the `include` array in `tsconfig.json`.
*   **Issue:** Usage of `any` in error handling: `catch (error: any)`.
    *   **Reasoning:** Losing type safety on errors makes it harder to handle specific error types correctly.
    *   **Suggestion:** Use `catch (error: unknown)` and type guards (e.g., `if (error instanceof Error)`) to safely access error properties.

### Code Quality & Maintainability
*   **Issue:** Significant code duplication between `api/tutor.ts` (Vercel function) and `server.js` (Local Express server).
    *   **Reasoning:** Violates DRY (Don't Repeat Yourself). Changes to logic (e.g., model selection, prompt construction) must be applied in two places, increasing the risk of inconsistency.
    *   **Suggestion:** Extract the core logic (model selection, prompt construction, API call) into a shared utility function (e.g., `src/lib/ai-handler.ts` or similar) that both `server.js` and `api/tutor.ts` import. Note: Since `server.js` is outside `src` and uses CommonJS/ESM mix, this might require some build step adjustments or a shared folder.

### Performance & Security
*   **Issue:** Hardcoded API key `apiKey: 'lm-studio'` in `server.js` and `api/tutor.ts`.
    *   **Reasoning:** While currently for a local instance, this pattern is dangerous if real keys are used.
    *   **Suggestion:** Always use environment variables for API keys (`process.env.LM_STUDIO_API_KEY`).
*   **Issue:** `provider` selection logic hardcodes specific models (`qwen3-30b-a3b-2507`, `gemini-2.0-flash`).
    *   **Reasoning:** Hardcoding models makes it difficult to update or switch models without code changes.
    *   **Suggestion:** Move model names to environment variables or a configuration file.

## 2. Frontend Service (`src/services/ai/tutorService.ts`)

### Correctness and Logic
*   **Issue:** Logic for constructing the system prompt is exposed on the client.
    *   **Reasoning:** As mentioned above, this is a security risk and leaks business logic to the client.
    *   **Suggestion:** Remove `constructSystemPrompt` from the client service. Pass `GameContext` directly to the API.

### Error Handling
*   **Issue:** `catch (error: any)` is used, and it returns a generic error message.
    *   **Reasoning:** Masking the real error can make debugging difficult.
    *   **Suggestion:** Log the specific error details (which is done) but also consider returning a more specific error code to the UI if possible, while keeping the user-facing message friendly.

### Adherence to Principles
*   **Issue:** `TutorResponse` interface is defined here but also redefined in `src/components/TutorMascot.tsx` (as `ChatMessage` with `mood` property).
    *   **Reasoning:** Violates DRY.
    *   **Suggestion:** Export `TutorResponse` from a shared types file (e.g., `src/types/ai.ts`) and import it in both places.

## 3. Context (`src/context/ProfileContext.tsx` and `src/hooks/useProfile.ts`)

### Maintainability & Adherence to Principles
*   **Issue:** `useProfile` hook is defined and exported in *both* `src/context/ProfileContext.tsx` and `src/hooks/useProfile.ts`.
    *   **Reasoning:** Violates DRY. If one implementation changes and the other doesn't, it causes inconsistent behavior depending on which file is imported.
    *   **Suggestion:** Remove the `export function useProfile` from `src/context/ProfileContext.tsx`. Keep the implementation in `src/hooks/useProfile.ts` as the single source of truth.

## 4. Components (`src/components/ChessBoard.tsx`)

### React Best Practices
*   **Issue:** Derived state pattern `if (fen !== prevFen) { setGame(new Chess(fen)); ... }` inside the render body.
    *   **Reasoning:** This is an anti-pattern (derived state). It can lead to unexpected bugs and is hard to follow.
    *   **Suggestion:** Use a `useEffect` hook to update the game state when `fen` changes, or better yet, use a `key` prop on the `ChessBoard` component from the parent to force a re-mount when the game changes. Alternatively, memoize the `Chess` instance.
*   **Issue:** `game.fen().replace(/ [bw] /, ' w ')` logic in `handleMove`.
    *   **Reasoning:** Manually manipulating FEN strings to force a turn is fragile and potentially incorrect.
    *   **Suggestion:** Use `chess.js` API to manage turns or valid FEN generation.

### TypeScript Best Practices
*   **Issue:** Usage of `as any` in `Chessboard` props (`customArrows as any`, `options as any`).
    *   **Reasoning:** Bypasses type safety.
    *   **Suggestion:** Define proper interfaces for `customArrows` and extend the `Chessboard` props interface if necessary to support the required properties without casting to `any`.

## 5. Components (`src/components/ExploreBoard.tsx`)

### Performance
*   **Issue:** `getSquareStyle` is called for every square in every render.
    *   **Reasoning:** While likely not a major bottleneck for 64 squares, it creates new object references which can cause unnecessary re-renders of children (though `motion.button` handles some of this).
    *   **Suggestion:** Memoize the styles or the board generation if performance issues arise.

## 6. Components (`src/components/TutorMascot.tsx`)

### Code Quality
*   **Issue:** `<style>` tag used inside the component.
    *   **Reasoning:** Non-idiomatic for a React project which typically uses CSS modules, styled-components, or a global CSS file. Harder to maintain and lint.
    *   **Suggestion:** Move styles to `TutorMascot.css` or use a CSS-in-JS solution consistent with the rest of the project.

### TypeScript Best Practices
*   **Issue:** `ChatMessage` interface redefines `mood` property which is also in `TutorResponse`.
    *   **Reasoning:** duplication.
    *   **Suggestion:** Use the shared `TutorResponse` type or a shared `ChatMessage` type.
