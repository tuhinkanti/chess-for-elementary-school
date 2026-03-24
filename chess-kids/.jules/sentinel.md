## 2024-03-24 - [Fix DoS and token exhaustion risk]
**Vulnerability:** Unbounded Context Window Token Usage. The `validateTutorRequest` did not enforce limits on the maximum array size of `messages` or the content length per message.
**Learning:** External or user-controlled arrays passed to LLMs must be strictly bounded. Otherwise, users can inject large amounts of data to exhaust context windows or rack up expensive API token costs (Denial of Wallet).
**Prevention:** Always enforce strict length validations on array size and string contents for any input passed into an AI model prompt.
