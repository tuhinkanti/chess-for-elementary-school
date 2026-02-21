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

    // Check if messages exists and is an array
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

    // Validate individual messages
    for (const msg of b.messages) {
        if (typeof msg !== 'object' || msg === null) {
            return { valid: false, error: 'Invalid message format' };
        }

        const m = msg as Record<string, unknown>;

        if (!('role' in m) || !('content' in m)) {
            return { valid: false, error: 'Message must have role and content' };
        }

        if (typeof m.role !== 'string' || typeof m.content !== 'string') {
             return { valid: false, error: 'Message role and content must be strings' };
        }

        if (!['user', 'assistant', 'system'].includes(m.role)) {
             return { valid: false, error: 'Invalid message role. Must be user, assistant, or system.' };
        }
    }

    return { valid: true };
}
