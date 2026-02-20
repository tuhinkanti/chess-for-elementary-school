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

    // Strict Security Validations
    if (b.messages.length > 50) {
        return { valid: false, error: 'Too many messages (max 50)' };
    }

    // System Prompt Length Check
    if ('systemPrompt' in b && typeof b.systemPrompt === 'string') {
        if (b.systemPrompt.length > 5000) {
            return { valid: false, error: 'System prompt too long (max 5000 chars)' };
        }
    }

    // Message Content Validation
    for (const msg of b.messages) {
        if (typeof msg !== 'object' || msg === null) {
            return { valid: false, error: 'Invalid message format' };
        }

        const m = msg as Record<string, unknown>;

        if (!('role' in m) || !('content' in m)) {
            return { valid: false, error: 'Messages must have role and content' };
        }

        if (typeof m.content !== 'string') {
            return { valid: false, error: 'Message content must be a string' };
        }

        if (m.content.length > 1000) {
            return { valid: false, error: 'Message content too long (max 1000 chars)' };
        }

        // Role validation
        // 'system' role is typically internal only, but we allow 'user' and 'assistant' from client.
        if (typeof m.role !== 'string' || !['user', 'assistant'].includes(m.role)) {
             return { valid: false, error: 'Invalid role (must be user or assistant)' };
        }
    }

    return { valid: true };
}
