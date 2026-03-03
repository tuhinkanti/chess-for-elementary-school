
## $(date +%Y-%m-%d) - [CRITICAL] Fixed System Prompt Injection Vulnerability
**Vulnerability:** The AI tutor endpoint (`/api/tutor`) blindly trusted a client-provided `systemPrompt` in the request body, allowing arbitrary prompt injection. A malicious user could send a custom `systemPrompt` to completely overwrite the AI's behavior, bypassing guardrails.
**Learning:** System prompts must always be strictly constructed and controlled on the server-side to maintain AI safety boundaries. Never allow the client to specify the system prompt directly.
**Prevention:** Construct the `systemPrompt` securely on the backend using only the necessary state/context provided by the client, and explicitly filter out any `role: 'system'` messages sent by the client.
