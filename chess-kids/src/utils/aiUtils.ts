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

    const MAX_CONTENT_LENGTH = 1000;
    const VALID_ROLES = ['user', 'assistant', 'system'];

    for (const msg of b.messages as Record<string, unknown>[]) {
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: 'Each message must be an object' };
        }

        if (!msg.role || typeof msg.role !== 'string' || !VALID_ROLES.includes(msg.role)) {
            return { valid: false, error: "Message role must be 'user', 'assistant', or 'system'" };
        }

        if (typeof msg.content !== 'string') {
            return { valid: false, error: 'Message content must be a string' };
        }

        if (msg.content.length > MAX_CONTENT_LENGTH) {
            return { valid: false, error: `Message content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` };
        }
    }

    return { valid: true };
}
