## 2024-05-14 - Prevent AI Endpoint DoS via Payload Validation
**Vulnerability:** The AI tutor endpoints (`/api/tutor` and `server.js`) accepted variable-length message payloads without explicitly enforcing bounds on the number of messages or the length of message content.
**Learning:** External API wrappers that loop over user-supplied arrays or text blocks are susceptible to resource exhaustion or unexpected token consumption limits when strict bounds checks aren't performed at the schema validation layer.
**Prevention:** Always implement max-length assertions (`messages.length <= 50`, `content.length <= 1000`) within core API validation logic (e.g., `validateTutorRequest`) prior to submitting payloads to upstream LLM providers.
