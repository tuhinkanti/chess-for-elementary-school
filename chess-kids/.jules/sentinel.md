## 2026-04-29 - Missing Input Validation Bounds on AI Endpoints
**Vulnerability:** The AI Tutor API (`api/tutor.ts` and `server.js`) accepted `messages` and `systemPrompt` without enforcing limits on message count, individual message length, or system prompt length. This could allow an attacker to send massive payloads, consuming excessive server memory and AI API tokens, potentially leading to resource exhaustion (DoS).
**Learning:** When forwarding client data to an external AI API, missing bound checks on arrays and strings directly translates to unbounded external API costs and local memory consumption.
**Prevention:** Always set explicit bounds (length limitations) on arrays and string attributes being submitted to external AI APIs to prevent resource exhaustion and DoS attacks.
