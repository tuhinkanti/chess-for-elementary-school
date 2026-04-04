## 2024-04-04 - [Missing Input Length Limits]
**Vulnerability:** The AI tutor endpoint lacked length limits for user-provided prompts, and allowed arbitrarily large numbers of messages, risking Denial of Service (DoS) and excessive token usage against the AI provider.
**Learning:** External AI services are sensitive to large payloads. Validating not just the structure but the size of inputs is crucial to prevent resource exhaustion and cost spikes.
**Prevention:** Always implement bounded limits (e.g., maximum array lengths, string length restrictions) for any data passed directly to third-party APIs or costly operations.
