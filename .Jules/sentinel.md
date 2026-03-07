## 2024-05-15 - [CRITICAL] Fix prompt injection vulnerability in AI Tutor API
**Vulnerability:** The AI Tutor API endpoints (`api/tutor.ts` and `server.js`) accepted the `systemPrompt` directly from the client request body and used it directly in the prompt payload sent to the LLM provider.
**Learning:** This is a classic prompt injection vulnerability where an attacker can arbitrarily alter the behavior of the AI by sending a custom `systemPrompt` from the frontend.
**Prevention:** Construct the `systemPrompt` on the backend using only trusted context data (like game state or student progress) provided by the client, and never trust a pre-constructed system prompt sent directly from the client.
