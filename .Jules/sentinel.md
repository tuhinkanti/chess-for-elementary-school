## 2026-02-11 - Missing Validation in Serverless Functions
**Vulnerability:** Input validation was completely missing in `api/tutor.ts`, allowing potentially unlimited payloads and malformed data to be passed to the AI provider.
**Learning:** Serverless functions often bypass standard middleware stacks (like Express validation), leading to gaps where developers assume frameworks handle it.
**Prevention:** Always validate `req.body` explicitly in the handler entry point, especially for serverless functions.
