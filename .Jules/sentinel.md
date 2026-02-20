# Sentinel's Security Journal

## 2026-02-20 - [Missing Input Validation on LLM Endpoint]
**Vulnerability:** The `/api/tutor` endpoint accepted unlimited messages and arbitrary content lengths without strict validation. This allowed potential DoS attacks via huge payloads and resource exhaustion through expensive LLM generation calls.
**Learning:** Basic existence checks (`if (!messages)`) are insufficient for public APIs, especially those triggering costly backend processes like LLM inference. Strict schema validation (length, type, allowed values) is critical.
**Prevention:** Implement strict schema validation (e.g., max message count, max content length, allowed roles) for all user inputs before passing them to backend services.
