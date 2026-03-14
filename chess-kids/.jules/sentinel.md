## 2024-03-14 - Prevent LLM DoS & Prompt Injection
**Vulnerability:** The AI tutor endpoint accepted arbitrarily long user input and unchecked roles, which could lead to excessive LLM token usage (DoS) and potential prompt injection.
**Learning:** `api/tutor.ts` relied only on shallow structural checks in `validateTutorRequest` instead of validating the inner contents of the `messages` array payload.
**Prevention:** Implement strict runtime type validation, allowlist valid roles, and enforce a reasonable maximum length (1000 chars) for all AI message contents.
