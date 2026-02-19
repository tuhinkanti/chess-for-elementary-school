# Code Review: Chess Kids (AI Tutor)

## 1. Summary

This review covers the `chess-kids` codebase, focusing on security, correctness, TypeScript practices, and maintainability.

**Critical Findings:**
- **Security Vulnerability:** Prompt injection risk due to client-side system prompt construction.
- **Logic Discrepancy:** Missing rate limiting in `api/tutor.ts`.
- **Maintainability:** Code duplication between `api/tutor.ts` and `server.js`.
- **Correctness:** Missing production dependencies in `package.json`.

---

## 2. Detailed Findings

### A. Security & Performance

#### `api/tutor.ts` & `server.js` (Prompt Injection)
- **Finding:** The API accepts a `systemPrompt` from the request body (`req.body.systemPrompt`).
- **Risk:** High. A malicious user can override the AI persona and instructions.
- **Suggestion:**
  - Remove `systemPrompt` from the request body schema.
  - Generate the system prompt exclusively on the server side using trusted inputs (e.g., lesson context).
  - Use the `GameContext` only to populate specific placeholders in a server-defined template.

#### `api/tutor.ts` (Rate Limiting)
- **Finding:** The code handles upstream 429 errors but lacks the in-memory rate limiting mentioned in project documentation (20 req/min/IP).
- **Suggestion:** Implement a rate limiter (e.g., using a `Map` or Redis) middleware to prevent abuse.

#### `server.js` (JSON Parsing)
- **Finding:** Uses `JSON.parse(text)` without a try-catch block or fallback for the initial parse attempt, making it brittle to non-JSON LLM outputs.
- **Suggestion:** Use the robust `extractJson` utility (or similar logic) in `server.js`.

### B. Correctness & Logic

#### `package.json`
- **Finding:** `express`, `cors`, and `dotenv` are listed under `devDependencies`.
- **Issue:** If the application is deployed to a Node.js environment (e.g., Heroku, VPS) instead of Vercel Serverless, `npm run server` will fail in production mode (`npm install --production`).
- **Suggestion:** Move these packages to `dependencies`.

#### `tsconfig.json`
- **Finding:** The `api/` directory is excluded from compilation (not in `include`).
- **Issue:** Type errors in backend code (`api/tutor.ts`) are not caught during build.
- **Suggestion:** Add `"api"` to the `include` array or create a separate `tsconfig.server.json`.

#### `src/utils/aiUtils.ts`
- **Finding:** `validateTutorRequest` does not enforce the strict constraints mentioned in documentation (e.g., max message length, array size).
- **Suggestion:** Implement robust validation (e.g., using `zod`) to enforce:
  - `messages` array length (e.g., max 50).
  - `content` string length (e.g., max 1000 chars).
  - `role` values (`user` | `assistant`).

### C. TypeScript Best Practices

#### `api/tutor.ts` & `src/services/ai/tutorService.ts`
- **Finding:** Usage of `any` in error handling (`catch (error: any)`).
- **Suggestion:** Use `unknown` and type narrowing (e.g., `if (error instanceof Error) ...`) for safer error handling.

#### `src/components/ChessBoard.tsx`
- **Finding:** The `onDrop` prop uses a custom `PieceDropHandlerArgs` interface but might be mismatching `react-chessboard`'s expected signature depending on the version.
- **Finding:** Props are passed via an `options` object spread, which bypasses strong prop validation if the library supports direct props.
- **Suggestion:** Verify `react-chessboard` types and pass props directly if possible for better type safety.

### D. Code Quality & Maintainability

#### `server.js` vs `api/tutor.ts`
- **Finding:** Significant logic duplication (prompt construction, model selection, error handling).
- **Suggestion:** Extract shared logic into a common module (e.g., `src/server/aiHandler.ts`) that can be imported by both the Express server and Vercel function.

#### `src/components/TutorMascot.tsx`
- **Finding:** Uses a large `<style>` block for CSS.
- **Suggestion:** Move styles to a CSS Module (`TutorMascot.module.css`) or use a utility-first framework (if available) to improve readability and separation of concerns.

#### `src/components/ChessBoard.tsx`
- **Finding:** "Derived State" anti-pattern:
  ```typescript
  if (fen !== prevFen) {
    setPrevFen(fen);
    setGame(new Chess(fen));
    // ...
  }
  ```
- **Suggestion:** Use `useEffect` to synchronize `game` state with the `fen` prop, or use a `key` on the component to force remounting when `fen` changes.

---

## 3. Recommended Action Plan

1.  **Fix Security:** Remove `systemPrompt` from client-server contract immediately. Move prompt generation to `api/tutor.ts`.
2.  **Unify Backend Logic:** Refactor `server.js` and `api/tutor.ts` to share a common handler.
3.  **Harden Types:** Update `tsconfig.json` to include `api/` and replace `any` with specific types.
4.  **Fix Dependencies:** Move server deps to `dependencies` in `package.json`.
5.  **Refactor Components:** Clean up `ChessBoard.tsx` state management and `TutorMascot.tsx` styling.
