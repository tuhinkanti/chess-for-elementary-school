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
    if (!body || typeof body !== 'object' || body === null) {
        return { valid: false, error: 'Invalid request body' };
    }

    const b = body as Record<string, unknown>;

    // Validate systemPrompt (optional)
    if ('systemPrompt' in b) {
        if (typeof b.systemPrompt !== 'string') {
            return { valid: false, error: 'systemPrompt must be a string' };
        }
        if (b.systemPrompt.length > 5000) {
            return { valid: false, error: 'systemPrompt is too long (max 5000 chars)' };
        }
    }

    if (!('messages' in b)) {
        return { valid: false, error: 'Messages are required' };
    }

    if (!Array.isArray(b.messages)) {
         return { valid: false, error: 'Messages must be an array' };
    }

    if (b.messages.length === 0) {
        return { valid: false, error: 'Messages cannot be empty' };
    }

    if (b.messages.length > 10) {
        return { valid: false, error: 'Too many messages (max 10)' };
    }

    for (const msg of b.messages) {
        if (typeof msg !== 'object' || msg === null) {
            return { valid: false, error: 'Each message must be an object' };
        }

        const m = msg as Record<string, unknown>;

        if (!('role' in m) || typeof m.role !== 'string') {
            return { valid: false, error: 'Message role is required and must be a string' };
        }

        // We only allow user and assistant roles from client. System role is handled by backend.
        if (!['user', 'assistant'].includes(m.role)) {
            return { valid: false, error: `Invalid role: ${m.role}. Must be 'user' or 'assistant'` };
        }

        if (!('content' in m) || typeof m.content !== 'string') {
            return { valid: false, error: 'Message content is required and must be a string' };
        }

        if (m.content.length > 1000) {
             return { valid: false, error: 'Message content is too long (max 1000 chars)' };
        }
    }

    return { valid: true };
}
