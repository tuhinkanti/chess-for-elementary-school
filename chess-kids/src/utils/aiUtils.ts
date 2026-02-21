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
    const MAX_MESSAGES = 50;
    const MAX_MESSAGE_LENGTH = 1000;
    const MAX_SYSTEM_PROMPT_LENGTH = 5000;
    const VALID_ROLES = ['user', 'assistant'];

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

    if (b.messages.length > MAX_MESSAGES) {
        return { valid: false, error: `Too many messages (max ${MAX_MESSAGES})` };
    }

    for (const msg of b.messages) {
        if (typeof msg !== 'object' || msg === null) {
            return { valid: false, error: 'Invalid message format' };
        }

        const m = msg as Record<string, unknown>;

        if (!('role' in m) || typeof m.role !== 'string' || !VALID_ROLES.includes(m.role)) {
            return { valid: false, error: 'Invalid message role' };
        }

        if (!('content' in m) || typeof m.content !== 'string') {
            return { valid: false, error: 'Invalid message content' };
        }

        if (m.content.length > MAX_MESSAGE_LENGTH) {
            return { valid: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` };
        }
    }

    if ('systemPrompt' in b) {
        if (typeof b.systemPrompt !== 'string') {
             return { valid: false, error: 'Invalid systemPrompt format' };
        }
        if (b.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
            return { valid: false, error: `System prompt too long (max ${MAX_SYSTEM_PROMPT_LENGTH} chars)` };
        }
    }

    return { valid: true };
}
