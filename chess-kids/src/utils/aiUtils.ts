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

    // DoS / Token Exhaustion Prevention
    if (b.messages.length > 50) {
        return { valid: false, error: 'Messages exceed maximum allowed limit (50)' };
    }

    // Validate each message content
    for (const msg of b.messages) {
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: 'Invalid message object' };
        }

        const msgObj = msg as Record<string, unknown>;

        if (!('role' in msgObj) || typeof msgObj.role !== 'string' || !['user', 'assistant'].includes(msgObj.role)) {
            return { valid: false, error: 'Invalid or missing role in message' };
        }

        if (!('content' in msgObj) || typeof msgObj.content !== 'string') {
            return { valid: false, error: 'Invalid or missing content in message' };
        }

        if (msgObj.content.length > 1000) {
            return { valid: false, error: 'Message content exceeds maximum allowed length (1000 characters)' };
        }
    }

    return { valid: true };
}
