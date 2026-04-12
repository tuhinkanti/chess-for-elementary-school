## 2024-04-12 - Missing Input Validation Bounds (DoS Risk)
 **Vulnerability:** The AI tutor API endpoint (`api/tutor.ts` and `server.js`) accepted an unbounded number of messages, each with an unbounded length, which could lead to Denial of Service (DoS) and excessive LLM token usage.
 **Learning:** Without strict explicit length and count boundaries on incoming AI message arrays and strings, attackers can submit massive payloads that exhaust server memory or downstream API quota/tokens, especially when schema validation libraries like Zod are absent.
 **Prevention:** Always enforce strict length (`maxLength`) and count (`maxItems`) limitations manually on all incoming user payloads sent to AI endpoints if schema validation libraries are not utilized.
