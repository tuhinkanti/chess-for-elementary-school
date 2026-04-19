
## 2024-05-18 - Missing Input Length Limits on LLM API Route (DoS risk)
**Vulnerability:** The AI tutor endpoint accepted message arrays without any bounds on the number of messages, the length of individual messages, or the length of the system prompt.
**Learning:** Implicit trust in the size of client-provided arrays when interfacing directly with LLM generation APIs (like `generateText`) creates a severe vector for Resource Exhaustion and Denial of Service (DoS) attacks. A malicious user could send thousands of messages or massive strings, exhausting server memory, hitting API rate limits, or incurring massive LLM token usage costs.
**Prevention:** Always enforce explicit bounds (length limitations) on arrays and string attributes being submitted to external AI APIs in the request validation layer.
