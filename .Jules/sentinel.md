## 2024-05-22 - Prompt Injection via System Prompt Override
**Vulnerability:** The AI Tutor API accepted a `systemPrompt` parameter from the client, allowing full override of the "Grandmaster Gloop" persona and safety guidelines.
**Learning:** Offloading prompt construction to the client for flexibility creates a significant security gap where business logic and safety guardrails can be bypassed.
**Prevention:** Always construct system prompts and enforce critical instructions (persona, output format) on the server side. Accept only necessary context (e.g., FEN, user info) from the client.
