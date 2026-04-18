## 2025-05-14 - Missing API Input Length Limits
**Vulnerability:** The AI tutor API (`/api/tutor` and `server.js`) lacked proper length validations on inbound requests for `messages` and `systemPrompt` attributes, meaning a large payload could result in token exhaustion or Denial of Service (DoS) attacks.
**Learning:** Even internal helper methods like `validateTutorRequest` need explicitly enforced bounds, and these must be actively applied to both production (Vercel) and development (local Node.js) API implementations to avoid discrepancy and potential exploitation.
**Prevention:** Always implement explicit input validation checks that enforce reasonable maximum length limits for string sizes, array counts, and known enumerations (e.g., roles) immediately upon handling an API payload.
