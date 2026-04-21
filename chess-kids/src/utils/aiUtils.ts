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

    if ('systemPrompt' in b) {
        if (typeof b.systemPrompt !== 'string') {
            return { valid: false, error: 'systemPrompt must be a string' };
        }
        if (b.systemPrompt.length > 2000) {
            return { valid: false, error: 'systemPrompt exceeds maximum length of 2000 characters' };
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

    if (b.messages.length > 50) {
        return { valid: false, error: 'Too many messages (maximum 50)' };
    }

    for (let i = 0; i < b.messages.length; i++) {
        const msg = b.messages[i];
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: `Invalid message at index ${i}` };
        }

        const { role, content } = msg as { role?: unknown, content?: unknown };

        if (role !== 'user' && role !== 'assistant' && role !== 'system') {
            return { valid: false, error: `Invalid role at index ${i}. Must be user, assistant, or system.` };
        }

        if (typeof content !== 'string') {
            return { valid: false, error: `Message content must be a string at index ${i}` };
        }

        if (content.length > 1000) {
            return { valid: false, error: `Message content exceeds maximum length of 1000 characters at index ${i}` };
        }
    }

    return { valid: true };
}
