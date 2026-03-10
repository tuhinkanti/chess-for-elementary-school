## 2025-03-08 - Fixed AI Prompt Injection Vulnerability in Tutor API
**Vulnerability:** The AI API (`/api/tutor`) accepted a raw `systemPrompt` from client requests. A malicious user could override this prompt, bypassing the configured AI persona and rules to generate unrestricted or harmful output while consuming backend quota.
**Learning:** System prompts and security boundaries must always be generated server-side. The client should only send contextual variables (`fen`, `studentContext`), never the raw instruction text.
**Prevention:** Avoid passing raw `systemPrompt` fields via API. Send state context from client to server, and construct the prompt backend-side.
