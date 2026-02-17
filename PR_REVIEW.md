# Code Review Report

## Summary
This review covers the current state of the `chess-kids` codebase. Several critical issues were identified regarding type safety, code duplication, performance, and security.

## 1. Build & Configuration

*   **Finding**: Backend files (`api/tutor.ts`, `server.js`) are excluded from `tsconfig.json`.
    *   **Impact**: These files are not type-checked during `npm run build`, allowing potential type errors to reach production.
    *   **Suggestion**: Create a separate `tsconfig.server.json` for backend code or include these files in `tsconfig.json`.
*   **Finding**: Dependencies `express`, `cors`, and `dotenv` are listed in `devDependencies`.
    *   **Impact**: If `server.js` is intended for production use, the application will fail to start in a production environment where only `dependencies` are installed.
    *   **Suggestion**: Move these packages to `dependencies` in `package.json` if `server.js` is a production artifact.

## 2. Backend Logic (`server.js` vs `api/tutor.ts`)

*   **Finding**: Significant code duplication exists between `server.js` (Node server) and `api/tutor.ts` (Vercel function).
    *   **Impact**: Maintenance burden. `server.js` lacks recent improvements found in `api/tutor.ts` (e.g., `extractJson` utility, `validateTutorRequest`).
*   **Finding**: `server.js` uses fragile `JSON.parse` directly on AI responses.
    *   **Impact**: If the AI returns markdown code blocks, parsing fails. `api/tutor.ts` correctly uses `extractJson`.
    *   **Suggestion**: Refactor to share logic (e.g., allow `server.js` to import `src/utils/aiUtils.ts` via `tsx` or a build step).
*   **Finding**: `server.js` has no request validation.
    *   **Impact**: Security risk. Malformed requests can crash the server or cause unexpected behavior.
    *   **Suggestion**: Import and use `validateTutorRequest`.

## 3. Component Logic (`src/components/ChessBoard.tsx`)

*   **Finding**: `customArrows` prop type definition mismatch.
    *   **Details**: The interface defines `customArrows` as `string[][]` (tuples), but the code maps them to objects `{ startSquare, endSquare, color }`. The `react-chessboard` library typically expects tuples or specific objects depending on version. The mapping logic:
        ```typescript
        customArrows.map(arrow => ({ startSquare: arrow[0], endSquare: arrow[1], ... }))
        ```
        suggests the input is tuples. Verify if `react-chessboard` `arrows` prop supports the object format produced.
*   **Finding**: Fragile turn forcing logic.
    *   **Details**: `game.fen().replace(/ [bw] /, ' w ')` is a hacky way to force White's turn.
    *   **Impact**: May break with unexpected FEN formats or have side effects on game state (en passant, move clocks).
    *   **Suggestion**: Use `chess.js` API to manipulate turn if possible, or validate FEN structure before replacement.
*   **Finding**: Derived state anti-pattern.
    *   **Details**: State updates inside the render body (`if (fen !== prevFen) ...`) can cause performance issues and are generally discouraged.
    *   **Suggestion**: Use `useEffect` to synchronize internal `chess.js` state with the `fen` prop.

## 4. Performance (`src/pages/LessonPage.tsx`)

*   **Finding**: Broken Memoization.
    *   **Details**: `highlightSquares` and `customArrows` props passed to `ChessBoard` are created as new arrays on every render:
        ```typescript
        highlightSquares={latestResponse?.highlightSquare ? [latestResponse.highlightSquare] : []}
        customArrows={latestResponse?.drawArrow ? [latestResponse.drawArrow.split('-')] : []}
        ```
    *   **Impact**: This causes `ChessBoard` (and `react-chessboard`) to re-render unnecessarily on every parent render, defeating the internal `useMemo`.
    *   **Suggestion**: Wrap these calculations in `useMemo` within `LessonPage`.

## 5. Type Safety & Error Handling

*   **Finding**: Unsafe Type Assertions.
    *   **Details**: `tutorService.ts` casts API response `as TutorResponse` without validation.
    *   **Suggestion**: Use a runtime validation library like `zod` to ensure the API response matches the expected schema.
*   **Finding**: `server.js` TypeScript error.
    *   **Details**: `import dotenv from 'dotenv'` causes "Module has no default export" error in some configurations.
    *   **Suggestion**: Use `import * as dotenv from 'dotenv'` or `import 'dotenv/config'`.

## 6. Storage (`src/services/memory/memoryService.ts`)

*   **Finding**: Synchronous Storage Operations.
    *   **Details**: The service uses `localStorage` synchronously.
    *   **Impact**: Can block the main thread if data size grows large.
    *   **Suggestion**: Refactor to an asynchronous interface (returning Promises) to allow for future migration to `IndexedDB` or backend storage without breaking the API.

## 7. Security

*   **Finding**: Missing Rate Limiting.
    *   **Details**: Neither `api/tutor.ts` nor `server.js` implements rate limiting.
    *   **Impact**: Vulnerable to abuse/DoS.
    *   **Suggestion**: Implement a rate limiting middleware or use a provider like Vercel KV / Upstash.
