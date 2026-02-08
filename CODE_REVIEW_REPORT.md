# Code Review Report

This report outlines the findings from a detailed code review of the `chess-kids` project, focusing on correctness, TypeScript best practices, code quality, performance, security, and error handling.

## 1. Backend API (`chess-kids/api/tutor.ts`)

### Correctness and Logic
*   **Issue**: Implicit return type for `getModel`.
    *   **Suggestion**: Explicitly define the return type for `getModel` (e.g., `LanguageModel` from `ai` SDK) to ensure consistency and type safety.
*   **Issue**: `provider` variable relies on `process.env.AI_PROVIDER` being available globally, which might be undefined in some environments.
    *   **Suggestion**: Use a configuration object or validation function to ensure `AI_PROVIDER` is set and valid.

### TypeScript Best Practices
*   **Issue**: Usage of `any` in `catch (error: any)`.
    *   **Suggestion**: Use `unknown` for the error type and then use type guards (e.g., `if (error instanceof Error)`) to safely access properties like `message`. This prevents runtime errors if `error` is not an object.

### Security
*   **Issue**: The API accepts `systemPrompt` directly from `req.body`.
    *   **Suggestion**: **Critical Security Vulnerability.** Allowing the client to specify the `systemPrompt` enables Prompt Injection attacks where a user could override the tutor's persona or instructions. The `systemPrompt` should be defined strictly on the server-side, or at least validated against a whitelist if customization is necessary.

### Error Handling
*   **Issue**: Generic error handling.
    *   **Suggestion**: While returning a friendly message to the user is good, the underlying error should be logged with more context (e.g., request ID, input params) to a monitoring service, not just `console.error`.

## 2. Profile Context (`chess-kids/src/context/ProfileContext.tsx`)

### Correctness and Logic
*   **Issue**: `JSON.parse(saved)` in `useState` initialization lacks error handling.
    *   **Suggestion**: Wrap `JSON.parse` in a `try-catch` block. If `localStorage` contains corrupted JSON, the app will crash on startup. Fallback to `defaultProgress` on error.

### TypeScript Best Practices
*   **Issue**: Implicit return type for `ProfileProvider`.
    *   **Suggestion**: Explicitly type the return value of `ProfileProvider` as `JSX.Element`.
*   **Issue**: `ProfileContext` value type inference.
    *   **Suggestion**: Ensure the value passed to `ProfileContext.Provider` strictly matches the `ProfileContextType` definition to avoid accidental mismatches.

### Performance
*   **Issue**: `useEffect` updates `localStorage` on every state change.
    *   **Suggestion**: For a small app this is likely fine, but as the profile data grows, `JSON.stringify` can become a bottleneck. Consider using a `useDebounce` hook or a more efficient storage strategy (e.g., IndexedDB) if data size increases.

## 3. Chess Board Component (`chess-kids/src/components/ChessBoard.tsx`)

### Correctness and Logic
*   **Issue**: Anti-pattern: Syncing state in render body (`if (fen !== prevFen)`).
    *   **Suggestion**: Move this logic into a `useEffect` hook:
        ```typescript
        useEffect(() => {
          setGame(new Chess(fen));
          setSelectedSquare(null);
          setMoveSquares({});
        }, [fen]);
        ```
        This ensures side effects are handled at the correct lifecycle stage and avoids potential infinite loops or React warnings.
*   **Issue**: Manual FEN manipulation: `whiteTurnFen = game.fen().replace(/ [bw] /, ' w ')`.
    *   **Suggestion**: This is fragile and potentially incorrect if it forces White's turn when it should be Black's (or vice versa) based on the actual game rules. If the intention is to allow free play regardless of turn, use `chess.js` API to set the turn properly or validate against the expected turn.

### TypeScript Best Practices
*   **Issue**: Usage of `as any` in `options` and `customArrows`.
    *   **Suggestion**:
        *   Define a proper interface for `Chessboard` options or import the types from `react-chessboard`.
        *   `customArrows` is typed as `string[][]` in props but seemingly passed as is. Ensure `react-chessboard` accepts this format or transform it to the expected `Arrow` type (e.g., `[string, string, string?]`).

### Error Handling
*   **Issue**: `try-catch` in `handleMove` swallows errors completely.
    *   **Suggestion**: Log the error to the console or a monitoring service so developers can debug why a move failed (e.g., invalid move, engine error).

## 4. Lesson Engine (`chess-kids/src/data/lessonEngine.ts`)

### Correctness and Logic
*   **Issue**: `distance` calculation: `Math.abs(toRank - fromRank)`.
    *   **Suggestion**: This only calculates vertical distance (rank difference).
        *   For Rooks moving horizontally, distance is 0, which is incorrect.
        *   For Bishops/Queens, it ignores file difference.
        *   **Fix**: Calculate max(abs(rankDiff), abs(fileDiff)) for Chebyshev distance, or specialized logic per piece type if "distance" means "squares moved".
*   **Issue**: `checkObjectiveComplete` uses `state.lastMove` without validation of *when* the move happened.
    *   **Suggestion**: Ensure `lastMove` is cleared or timestamped. A previous move satisfying "move a pawn" might instantly complete a subsequent "move a pawn" objective if state isn't reset.

### TypeScript Best Practices
*   **Issue**: `LessonConfig` type defines `fen` as `string | null`.
    *   **Suggestion**: Stick to this contract. Ensure consumers (like `ChessBoard`) handle `null` gracefully (which `ChessBoard` seems to do by defaulting to `start`, but explicit checks are better).

## 5. Lesson Page (`chess-kids/src/pages/LessonPage.tsx`)

### Logic and State Management
*   **Issue**: **State Pollution**. When advancing to the next objective, `resetObjectiveState` is **not** called.
    *   **Consequence**: `lessonState.lastMove`, `lessonState.tappedSquares`, and `lessonState.answeredCorrectly` persist between objectives.
    *   **Scenario**:
        1.  Objective 1: "Move any piece" -> User moves e2-e4. `lastMove` is set. Objective completes.
        2.  Objective 2: "Move a pawn" -> `checkObjectiveComplete` runs immediately. `lastMove` (e2-e4) is still present and is a pawn move. Objective 2 completes instantly without user interaction.
    *   **Fix**: Call `resetObjectiveState` (or similar logic) when setting the new objective index.
        ```typescript
        // In useEffect where objective completes:
        setLessonState(prev => {
          const newState = resetObjectiveState(prev); // You need to implement/export this to keep completedObjectives
          // Actually, you might just want to clear specific fields:
          return {
            ...prev,
            currentObjectiveIndex: nextIndex,
            completedObjectives: newCompleted,
            // Reset transient state
            lastMove: undefined,
            tappedSquares: new Set(), // If objectives should start fresh
            answeredCorrectly: false
          };
        });
        ```

## Summary

The codebase is generally well-structured and uses modern React patterns. However, there are significant logic issues in the **Lesson Engine** state management that could break the user experience (auto-completing objectives). The **Backend API** has a critical security vulnerability regarding prompt injection. Addressing these points will significantly improve the robustness and security of the application.
