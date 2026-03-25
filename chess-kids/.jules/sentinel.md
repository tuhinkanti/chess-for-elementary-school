## 2024-05-25 - Prevent DoS via Prompt/Token Injection in AI Tutor API
**Vulnerability:** The AI API `/api/tutor` accepts any number of messages with arbitrary length and roles from the client, leading to potential Denial of Service (DoS) and excessive token usage costs.
**Learning:** Client-supplied conversational data intended for AI processing should have strictly defined length, array size, and content constraints just like traditional API endpoints to protect backend AI provider quotas and application stability.
**Prevention:** Implement strict length and role validation on all elements of the `messages` array before passing them to the AI provider.
