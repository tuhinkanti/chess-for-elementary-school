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

    // Check if messages exists and is an array
    // We cast to any for check, or use type guard
    const b = body as Record<string, unknown>;

    if (!('messages' in b)) {
        return { valid: false, error: 'Messages are required' };
    }

    if (!Array.isArray(b.messages)) {
         return { valid: false, error: 'Messages must be an array' };
    }

    if (b.messages.length === 0) {
        return { valid: false, error: 'Messages cannot be empty' };
    }

    // Security: Limit array size to prevent DoS via excessive tokens
    if (b.messages.length > 50) {
        return { valid: false, error: 'Too many messages' };
    }

    // Security: Validate individual messages
    for (const msg of b.messages) {
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: 'Invalid message format' };
        }

        const message = msg as Record<string, unknown>;

        // Validate role
        if (!['user', 'assistant', 'system'].includes(message.role as string)) {
            return { valid: false, error: 'Invalid message role' };
        }

        // Validate content length to prevent DoS
        if (typeof message.content !== 'string') {
            return { valid: false, error: 'Message content must be a string' };
        }

        if (message.content.length > 1000) {
            return { valid: false, error: 'Message content exceeds maximum length' };
        }
    }

    // Security: Limit system prompt length if provided
    if ('systemPrompt' in b) {
        if (typeof b.systemPrompt === 'string' && b.systemPrompt.length > 2000) {
            return { valid: false, error: 'System prompt exceeds maximum length' };
        }
    }

    return { valid: true };
}
