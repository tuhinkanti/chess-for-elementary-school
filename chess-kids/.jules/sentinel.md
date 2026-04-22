## 2024-04-22 - Fix missing input length limits (DoS risk)
**Vulnerability:** The AI tutor endpoints lacked input size limits, exposing the application to DoS attacks and excessive AI token billing.
**Learning:** Always enforce length constraints on external API proxies to prevent resource exhaustion.
**Prevention:** Add explicit bounds and validation on arrays, text fields, and system prompts before sending data to external APIs.
