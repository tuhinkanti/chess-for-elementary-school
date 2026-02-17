export function extractJson(text: string): unknown {
    if (!text || typeof text !== 'string') {
        return null;
    }

    try {
        // 1. Try direct parsing
        return JSON.parse(text);
    } catch {
        // 2. Try parsing a JSON code block (```json ... ```)
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch {
                // Continue if code block parse fails
            }
        }

        // 3. Try finding the first '{' and last '}'
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose > firstOpen) {
            const potentialJson = text.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(potentialJson);
            } catch {
                return null;
            }
        }

        return null;
    }
}

export function validateTutorRequest(body: unknown): { valid: boolean; error?: string } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Invalid request body' };
    }

    const b = body as Record<string, unknown>;

    // 1. Validate 'messages'
    if (!('messages' in b)) {
        return { valid: false, error: 'Messages are required' };
    }

    if (!Array.isArray(b.messages)) {
         return { valid: false, error: 'Messages must be an array' };
    }

    const messages = b.messages as unknown[];

    if (messages.length === 0) {
        return { valid: false, error: 'Messages cannot be empty' };
    }

    // Security: Limit number of messages to prevent DoS/token exhaustion
    if (messages.length > 50) {
        return { valid: false, error: 'Too many messages (max 50)' };
    }

    for (const msg of messages) {
        if (typeof msg !== 'object' || msg === null) {
            return { valid: false, error: 'Invalid message format' };
        }

        const m = msg as Record<string, unknown>;
        const { role, content } = m;

        // Security: Strict role validation
        if (role !== 'user' && role !== 'assistant') {
            return { valid: false, error: 'Invalid role (must be user or assistant)' };
        }

        // Security: Content validation
        if (typeof content !== 'string') {
            return { valid: false, error: 'Content must be a string' };
        }

        if (content.length > 1000) {
            return { valid: false, error: 'Message content too long (max 1000 chars)' };
        }
    }

    // 2. Validate 'systemPrompt' (optional)
    if ('systemPrompt' in b) {
        const prompt = b.systemPrompt;
        // If it exists, it must be a string
        if (typeof prompt !== 'string') {
            return { valid: false, error: 'System prompt must be a string' };
        }
        // Limit length to prevent massive prompt injection
        if (prompt.length > 5000) {
             return { valid: false, error: 'System prompt too long (max 5000 chars)' };
        }
    }

    return { valid: true };
}
