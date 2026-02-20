# Code Review Report: Chess Kids Project

This document provides a comprehensive code review for the current state of the `chess-kids` project, focusing on security, architecture, correctness, and TypeScript best practices.

## 1. Security & Critical Issues

### 🔴 System Prompt Injection Vulnerability
*   **File:** `chess-kids/api/tutor.ts`, `chess-kids/server.js`, `chess-kids/src/services/ai/tutorService.ts`
*   **Finding:** The `systemPrompt` is constructed on the client (`tutorService.ts`) and sent directly to the server in the request body. The server (`api/tutor.ts` and `server.js`) accepts this prompt and uses it to instruct the AI model.
*   **Impact:** A malicious user can intercept the request and modify the `systemPrompt` to bypass safety guidelines, jailbreak the AI persona, or extract internal instructions.
*   **Suggestion:**
    *   **Move System Prompt Construction to Server:** The server should only accept context data (e.g., `fen`, `lessonObjective`, `studentContext`). The system prompt logic should reside entirely on the server.
    *   **Remove `systemPrompt` from Request Body:** The API schema should not allow the client to dictate the system prompt.

### 🔴 Missing Input Validation & Rate Limiting
*   **File:** `chess-kids/api/tutor.ts`, `chess-kids/server.js`
*   **Finding:** The API endpoint lacks rate limiting and robust input validation beyond basic existence checks.
*   **Impact:** The API is vulnerable to abuse (Denial of Service) and excessive cost from model usage.
*   **Suggestion:** Implement rate limiting (e.g., using Upstash/Redis for Vercel, or a memory store for `server.js`). Use a schema validation library like `zod` to validate `messages` structure (role, content length) and `context` fields.

## 2. Architecture & Maintainability

### ⚠️ Code Duplication (DRY Violation)
*   **File:** `chess-kids/api/tutor.ts`, `chess-kids/server.js`
*   **Finding:** The core AI interaction logic, model selection, and error handling are duplicated between the Vercel function (`api/tutor.ts`) and the local development server (`server.js`).
*   **Impact:** Changes to one file (e.g., adding a new model or fixing a bug) must be manually replicated in the other, leading to inconsistency and drift.
*   **Suggestion:** extract the core logic into a shared service or utility function (e.g., `src/server/aiHandler.ts`) that can be imported by both. Note that `server.js` may need to be converted to TypeScript (`server.ts`) and run with `tsx` to support this cleanly.

### ⚠️ Imports from `src` in API Routes
*   **File:** `chess-kids/api/tutor.ts`
*   **Finding:** The API route imports from `../src/utils/aiUtils.js`. While this often works in Vercel/Next.js, it creates a tight coupling between the frontend source and backend API, which can cause build issues if the project structure changes or if deployed differently.
*   **Suggestion:** Consider moving shared code to a dedicated `shared/` directory or ensuring the build pipeline correctly handles these cross-directory imports.

## 3. Correctness & Logic

### ⚠️ Unreliable JSON Parsing
*   **File:** `chess-kids/src/utils/aiUtils.ts`
*   **Finding:** The `extractJson` function relies on nested `try-catch` blocks and simple string matching, which can be brittle if the AI output contains multiple JSON-like structures or unexpected formatting.
*   **Suggestion:** Simplify the logic. Use a regex to find the *first* valid JSON object block (e.g., from first `{` to matching `}`) and parse it. Remove the recursive/nested `try-catch` structure for readability.

### ⚠️ React State Management Anti-Pattern
*   **File:** `chess-kids/src/components/ChessBoard.tsx`
*   **Finding:** The component uses a "derived state" pattern inside the render body: `if (fen !== prevFen) { setGame(...); ... }`. This triggers an immediate re-render during the current render phase.
*   **Suggestion:** Use `useEffect` with `[fen]` dependency to update the internal game state, or use a `key` prop on the `ChessBoard` component in the parent to force a remount when `fen` changes.

### ⚠️ Incorrect Prop Usage
*   **File:** `chess-kids/src/components/ChessBoard.tsx`
*   **Finding:** The `customArrows` prop is typed as `string[][]`, but `react-chessboard` (v5+) expects `[string, string, string?][]` (tuple). Casting to `any` or passing incompatible types may cause runtime errors or rendering issues.
*   **Suggestion:** Update the `ChessBoardProps` interface to strictly type `customArrows` as `[string, string, string?][]` and remove any `any` casts.

## 4. TypeScript Best Practices

### ⚠️ Excessive Use of `any`
*   **File:** `chess-kids/api/tutor.ts`, `chess-kids/src/services/ai/tutorService.ts`
*   **Finding:** Explicit `any` is used in catch blocks (`error: any`) and some variable declarations.
*   **Suggestion:** Use `unknown` for errors in catch blocks and narrow the type using type guards (e.g., `if (error instanceof Error)`). Avoid `any` entirely to maintain type safety.

### ⚠️ Unsafe Type Assertions
*   **File:** `chess-kids/api/tutor.ts`
*   **Finding:** `req.body as { ... }` is used without validation.
*   **Suggestion:** Use a runtime validation library (like `zod`) to ensure the incoming data matches the expected type before casting.

## 5. Code Quality & Performance

### ⚠️ Hardcoded Values & "Magic Strings"
*   **File:** `chess-kids/api/tutor.ts`, `chess-kids/server.js`
*   **Finding:** Model names (`qwen3-30b...`, `claude-sonnet...`) and API endpoints are hardcoded.
*   **Suggestion:** Move these configuration values to environment variables or a central configuration file (`src/config/aiConfig.ts`).

### ⚠️ Inline Styles
*   **File:** `chess-kids/src/components/TutorMascot.tsx`
*   **Finding:** A large `<style>` block is used within the component.
*   **Suggestion:** Move styles to a CSS module or a dedicated CSS file to improve readability and separation of concerns.

### ⚠️ Synchronous Storage Operations
*   **File:** `chess-kids/src/services/memory/memoryService.ts`
*   **Finding:** Uses synchronous `localStorage` for potentially large data structures.
*   **Suggestion:** As the application grows, consider using an asynchronous storage solution (like `idb` for IndexedDB) to prevent blocking the main thread.

## 6. Configuration

### ⚠️ DevDependencies in Production Code
*   **File:** `chess-kids/package.json`
*   **Finding:** `express`, `cors`, and `dotenv` are listed in `devDependencies`, but are used in `server.js`. If `server.js` is intended for production use (e.g., a custom server deployment), these must be in `dependencies`.
*   **Suggestion:** Move these packages to `dependencies` if `server.js` is a production artifact.
