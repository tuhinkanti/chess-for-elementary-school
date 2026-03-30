## 2026-03-30 - Add Input Length Limits to Tutor API
**Vulnerability:** Missing input validation allowed excessively large payloads to the backend AI prompt. This could result in DoS attacks by consuming server resources or token exhaustion attacks when sent to the AI provider.
**Learning:** The existing `validateTutorRequest` checked array existence and size (length > 0) but didn't impose a maximum array bound (e.g. 50 items) or string content length bound (e.g. 1000 characters). Unbounded AI prompt arrays are a security vulnerability.
**Prevention:** Always set explicit bounds (length limitations) on arrays and string attributes being submitted to external AI APIs to prevent resource exhaustion.
