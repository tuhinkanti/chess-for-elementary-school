# Code Review Report: Chess Kids

## Summary

This report details the findings from a comprehensive review of the `chess-kids` codebase. The review covers correctness, TypeScript best practices, code quality, performance, error handling, security, and architectural principles.

**Overall Assessment:**
The codebase is well-structured and follows a clear component-based architecture. However, several critical issues were identified, particularly regarding security (prompt injection), performance (React re-renders), and TypeScript strictness (`any` usage). Addressing these is recommended before further feature development.

---

## 1. Critical Issues (P0)

### 1.1 Security: Potential Prompt Injection & Client-Controlled System Prompt
**File:** `src/services/ai/tutorService.ts`, `api/tutor.ts`

**Issue:**
The `tutorService` constructs the full system prompt on the client side and sends it to the backend via the `systemPrompt` body parameter. The backend (`api/tutor.ts`) accepts this prompt blindly.
- **Risk:** A malicious user could intercept the request and inject instructions to override the AI's persona or extract sensitive information (if any were present in the context).
- **Recommendation:** Move the system prompt construction logic entirely to the backend (`api/tutor.ts`). The client should only send the necessary context (FEN, objective, student facts), and the server should assemble the final prompt.

### 1.2 Code Duplication (DRY Violation)
**File:** `server.js` vs `api/tutor.ts`

**Issue:**
The AI handling logic, including provider selection and prompt construction, is duplicated almost verbatim between the local development server (`server.js`) and the Vercel serverless function (`api/tutor.ts`).
- **Risk:** Changes made to one file (e.g., adding a new model or fixing a bug) may not be propagated to the other, leading to inconsistent behavior between development and production environments.
- **Recommendation:** Extract the core AI logic into a shared utility function or module that both `server.js` and `api/tutor.ts` can import.

### 1.3 Performance: `setState` in `useEffect`
**File:** `src/components/TutorMascot.tsx`

**Issue:**
The component calls `setIsExpanded(true)` inside a `useEffect` dependent on `messages.length`.
```typescript
useEffect(() => {
  if (messages.length > 0) {
    setIsExpanded(true);
  }
}, [messages.length]);
```
- **Impact:** This causes a double render every time a message is added (one for the prop change, one for the state update).
- **Recommendation:** Consider controlling the expansion state from the parent component (`LessonPage`) or initializing the state based on the prop if applicable. If the behavior is "expand on new message", this pattern is acceptable but inefficient; consider using a ref or memoized value if possible, or accept the trade-off but document it.

---

## 2. Major Findings (P1)

### 2.1 TypeScript Best Practices: Usage of `any`
**Files:** `src/components/ChessBoard.tsx`, `api/tutor.ts`

**Issue:**
Explicit `any` is used to bypass type checking in several places.
- `ChessBoard.tsx`: `customArrows as any` and `options as any`.
- `api/tutor.ts`: `catch (error: any)`.
- **Impact:** defeat the purpose of TypeScript, hiding potential bugs.
- **Recommendation:**
    - Define a proper interface for `customArrows` (likely `[string, string][]` for `react-chessboard`).
    - Use `unknown` for error catching and narrow the type with type guards.

### 2.2 Performance: Missing Memoization for Object/Array Props
**File:** `src/pages/LessonPage.tsx`

**Issue:**
Arrays for `highlightSquares` and `customArrows` are created fresh on every render of `LessonPage`.
```typescript
highlightSquares={latestResponse?.highlightSquare ? [latestResponse.highlightSquare] : []}
```
- **Impact:** This breaks `React.memo` (or `useMemo`) optimizations in child components like `ChessBoard`, causing unnecessary re-renders of the heavy chessboard component.
- **Recommendation:** Wrap these array creations in `useMemo`.

### 2.3 React Pattern: Derived State in Render
**File:** `src/components/ChessBoard.tsx`

**Issue:**
The component syncs the internal `chess.js` instance with the `fen` prop inside the render body:
```typescript
if (fen !== prevFen) {
  setPrevFen(fen);
  setGame(new Chess(fen));
  // ...
}
```
- **Impact:** This forces an immediate re-render during the render phase. While React handles this, it is generally safer and more predictable to use `useEffect` or `key` prop to reset state.
- **Recommendation:** Use `useEffect(() => { setGame(new Chess(fen)); }, [fen])` or pass `key={fen}` to the component to reset it completely when FEN changes.

---

## 3. Minor Findings (P2)

### 3.1 Hardcoded Strings & Magic Values
**Files:** `src/data/lessonEngine.ts`, `src/services/ai/tutorService.ts`

**Issue:**
- AI model names (`qwen3-30b...`, `gemini-2.0-flash`) are hardcoded in multiple places.
- Mood strings ('encouraging', 'thinking') are repeated literals.
- **Recommendation:** Use strict Enums or Constants for these values to prevent typos and ease updates.

### 3.2 Linting Errors
**Command:** `npm run lint`

**Issue:**
The codebase fails linting with `eslint`.
- `no-case-declarations` in `api/tutor.ts`.
- `prefer-const` in `ExploreBoard.tsx`.
- `react-hooks/set-state-in-effect` in `TutorMascot.tsx`.
- **Recommendation:** Run `npm run lint -- --fix` and manually address the remaining issues.

### 3.3 Dependency Management
**File:** `package.json`

**Issue:**
`express` and `cors` are in `devDependencies`.
- **Recommendation:** If `server.js` is intended for production deployment (e.g., on a VPS), these should be in `dependencies`. If `server.js` is strictly for local dev (and Vercel handles production), this is acceptable but should be documented.

---

## 4. Specific Recommendations for Next Steps

1.  **Refactor AI Logic:** Create a shared `aiUtils.ts` file (or similar) that both the frontend (for types) and backend (for logic) can rely on, or strictly separate them.
2.  **Fix Critical Security:** Update `api/tutor.ts` to ignore `systemPrompt` from the body and construct it securely on the server using `lessonEngine` data.
3.  **Strict TypeScript:** Enable `noImplicitAny` in `tsconfig.json` (if not already strictly enforced) and remove all `as any` casts.
4.  **Optimize Rendering:** Apply `useMemo` in `LessonPage.tsx` for array props passed to `ChessBoard`.
