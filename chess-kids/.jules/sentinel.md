## 2024-05-20 - Missing Input Length Limits on API Endpoint
**Vulnerability:** The AI tutor API endpoint (`/api/tutor`) accepted an arbitrary number of messages and unbounded message contents without length limitations. This made the endpoint vulnerable to Denial of Service (DoS) and resource exhaustion attacks by allowing attackers to send massive payloads.
**Learning:** External API endpoints, especially those accepting arrays or strings that get processed by backend services or LLMs, must have strict length and count constraints. Always set explicit bounds to prevent resource exhaustion.
**Prevention:** Always validate and bound user input at the edge. Ensure schema validation (like maximum array length and maximum string length) is enforced for all external requests.
