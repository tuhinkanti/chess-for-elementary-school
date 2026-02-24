## 2026-02-24 - Prompt Injection in AI Tutor API
**Vulnerability:** The `/api/tutor` endpoint (both in `api/tutor.ts` and `server.js`) accepted a raw `systemPrompt` from the client request body, allowing complete override of the AI persona and instructions.
**Learning:** This existed because the initial implementation prioritized flexibility (client-side prompt construction) over security, likely for easier frontend experimentation without redeploying the backend.
**Prevention:** Always construct sensitive prompts (like system instructions) on the server side using trusted inputs (e.g., game state context) rather than accepting raw prompt strings from the client.
