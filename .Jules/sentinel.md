## 2026-03-02 - [Missing Input Limits on Serverless Function]
**Vulnerability:** The AI tutor endpoint (`/api/tutor`) accepted requests with an unbounded number of messages and unbounded message lengths, relying only on basic type checks.
**Learning:** Even when basic type checking exists, failing to enforce runtime boundary constraints on external inputs (like arrays and strings) can lead to Denial of Service (DoS) and excessive token usage/billing exhaustion, especially for AI-related serverless functions.
**Prevention:** Always implement explicit maximum length boundaries for strings and arrays in external input validators before passing data to expensive operations.
