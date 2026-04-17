## 2025-05-14 - Add Input Length Limits to AI Tutor Request

**Vulnerability:** The AI tutor endpoint (`/api/tutor`) accepted unconstrained messages payloads, lacking character length constraints on `systemPrompt` and `message.content`, as well as array limits on `messages`. This exposed the application to Denial of Service (DoS) attacks via resource exhaustion and potential excessive upstream API token usage or bill shock.
**Learning:** In LLM integrations, it is essential to filter roles (e.g., prevent system prompt injection by user) AND strictly bound the size of content strings and dialogue arrays to defend against malicious input vectors. Validating just the presence of the properties `if (!messages)` is insufficient.
**Prevention:** Implement comprehensive backend validation that strictly limits text lengths (e.g., max 1000 chars for content, 2000 for system prompt), enforcing strict bounds before proxying requests to external AI APIs.
