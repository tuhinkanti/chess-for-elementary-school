## 2024-05-18 - [Prompt Injection Vulnerability]
**Vulnerability:** System prompt was constructed on the client-side and sent directly to the server, making it vulnerable to tampering by a malicious user.
**Learning:** The system prompt contains the instructions that guide the AI's behavior. If the client can modify this prompt, they can completely alter the AI's intended functionality.
**Prevention:** Construct the system prompt on the server-side, using safe parameters passed from the client, rather than accepting the complete prompt from the client directly.
