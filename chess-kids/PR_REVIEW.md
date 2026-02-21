# Code Review: Chess Kids Project

This document outlines the findings of a detailed code review performed on the current codebase.

## 1. Security (Critical)

### 🚨 Client-Side System Prompt Construction (Prompt Injection Vulnerability)
- **File(s):** `src/services/ai/tutorService.ts`, `api/tutor.ts`, `server.js`
- **Issue:** The `tutorService` constructs the system prompt (which contains the AI persona instructions) on the client side and sends it to the backend via the request body (`systemPrompt`). The backend (`api/tutor.ts` and `server.js`) accepts this parameter and uses it to instruct the AI model.
- **Risk:** A malicious user can intercept the request and modify the `systemPrompt` to bypass safety controls, alter the AI's behavior, or extract information. This is a classic Prompt Injection vulnerability.
- **Recommendation:**
  - Move the system prompt construction logic entirely to the backend (`api/tutor.ts`).
  - The API should only accept `messages` and context data (FEN, last move, student summary) in the request body.
  - Remove the `systemPrompt` field from the API request schema.

## 2. Performance

### ⚠️ Synchronous LocalStorage Access
- **File(s):** `src/services/memory/memoryService.ts`
- **Issue:** The `saveToStorage` method writes to `localStorage` synchronously. As the memory store grows (facts, summaries, session logs), this serialization and write operation can block the main thread, causing UI jank.
- **Recommendation:** Wrap the storage operation in a `setTimeout(..., 0)` or use an async storage wrapper (like `idb-keyval`) to offload the work from the main thread.

### ⚠️ Inefficient Data Processing
- **File(s):** `src/services/memory/memoryService.ts`
- **Issue:** The `regenerateSummary` method iterates over the `hotWarmFacts` array multiple times using chained `.filter()` and `.map()` calls to extract strengths, gaps, and preferences.
- **Recommendation:** Refactor this into a single loop (e.g., `for...of` or `reduce`) to categorize facts in one pass. This will improve performance, especially as the number of facts grows.

### ⚠️ Component State Synchronization
- **File(s):** `src/components/ChessBoard.tsx`
- **Issue:** The component derives internal state (`game`, `selectedSquare`, etc.) from the `fen` prop using `useState`. While it attempts to sync via checking `fen !== prevFen` during render, this pattern is error-prone and can lead to desynchronization or double renders.
- **Recommendation:** Use a `useEffect` to update the internal game state when the `fen` prop changes, or lift the game state up entirely to the parent component (`LessonPage`) to avoid duplication.

## 3. Code Quality & Maintainability

### ⚠️ Large Inline Style Blocks
- **File(s):** `src/components/TutorMascot.tsx`, `src/pages/LessonPage.tsx`
- **Issue:** These files contain large `<style>` blocks (100+ lines) at the end of the file. This violates separation of concerns and makes the component logic harder to read.
- **Recommendation:** Move these styles to separate CSS modules (e.g., `TutorMascot.module.css`) or use a CSS-in-JS library properly.

### ⚠️ Code Duplication in Backend Logic
- **File(s):** `server.js`, `api/tutor.ts`
- **Issue:** `server.js` (used for local dev?) completely duplicates the logic of `api/tutor.ts` (Vercel function). Any fix applied to one (e.g., adding validation) must be manually applied to the other. Currently, `server.js` lacks the validation logic present in `api/tutor.ts`.
- **Recommendation:** Extract the core AI interaction logic into a shared utility or service that both entry points can import. Alternatively, use a tool like `vercel dev` to run the API function locally instead of a separate `server.js`.

### ⚠️ Hardcoded AI Model Configuration
- **File(s):** `server.js`, `api/tutor.ts`
- **Issue:** Model identifiers (e.g., `qwen3-30b-a3b-2507`, `gemini-2.0-flash`) are hardcoded in the switch statements.
- **Recommendation:** Centralize model configuration in a config file (e.g., `src/config/aiConfig.ts`) so it can be managed in one place.

## 4. TypeScript Best Practices

### ⚠️ Use of `any`
- **File(s):** `api/tutor.ts`
- **Issue:** The catch block uses `error: any`. While sometimes unavoidable in catch blocks, it's better to use `unknown` and type guards or helper functions to safely extract error messages.
- **Recommendation:** Use `unknown` and a utility like `getErrorMessage(error)` to ensure type safety.

### ⚠️ Interface Mismatch
- **File(s):** `src/hooks/useStudentMemory.ts` vs `src/services/memory/memoryService.ts`
- **Issue:** The `addFact` function in the hook does not expose the optional `relatedEntities` argument that the underlying service method accepts.
- **Recommendation:** Update the hook's `addFact` signature to match the service method, allowing components to pass related entities.

## 5. Correctness

### ⚠️ Missing Input Validation in Server
- **File(s):** `server.js`
- **Issue:** Unlike `api/tutor.ts`, `server.js` does not use the `validateTutorRequest` utility. It does manual checks which are less robust.
- **Recommendation:** Import and use `validateTutorRequest` in `server.js` to ensure consistent validation logic across environments.

### ⚠️ Fragile Effect Chains
- **File(s):** `src/pages/LessonPage.tsx`
- **Issue:** The logic for checking objective completion relies on a complex `useEffect` with many dependencies. This can be fragile and hard to debug.
- **Recommendation:** Consider moving the objective check logic into the event handlers (e.g., `onMove`, `onSquareTap`) directly, rather than relying on a reactive effect that watches state changes. This makes the flow explicit ("User moves -> Check objective -> Update state").
