## 2026-04-08 - [DoS Protection] Prevent AI Token Exhaustion via Input Constraints
**Vulnerability:** The AI tutor request validation (`validateTutorRequest` in `aiUtils.ts`) failed to enforce array length or string length limits for incoming messages, exposing the API to Denial of Service and excessive token consumption through large arrays or massive string payloads.
**Learning:** Functions that parse and validate inputs should never rely purely on types/existence checks but must also enforce sane upper bounds for counts and string lengths to constrain resource usage early.
**Prevention:** Always implement max-length limits on strings and size limits on arrays in validation functions, particularly when those inputs directly control downstream resource-intensive systems like AI models.
