## 2026-02-14 - Prompt Injection via Client-Side Construction
**Vulnerability:** The client (`tutorService.ts`) was constructing the AI system prompt, which included the persona and safety instructions, and sending it to the backend (`api/tutor.ts`). This allowed a malicious user to override the system prompt via the API.
**Learning:** Never trust the client to define the AI's behavior or safety rules. The client should only provide data (context), and the server should construct the prompt.
**Prevention:** Move all prompt construction logic to the server. Define strict interfaces for client data (e.g., `GameContext`) and only accept that data in the API.
