## 2026-03-13 - [Missing Input Length Limit on AI Prompts]
**Vulnerability:** The AI tutor endpoint accepted chat messages without any length restrictions on the content.
**Learning:** This missing validation leaves the application vulnerable to Denial of Service (DoS) attacks where a user could send massive payloads, consuming server memory, causing excessive latency, and potentially draining AI provider tokens.
**Prevention:** Always implement explicit maximum length validations (e.g., 1000 characters) on any user-provided string that will be passed into an LLM context or processed by the server.
