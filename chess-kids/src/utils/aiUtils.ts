export const AI_MODELS = {
    LOCAL: 'qwen3-30b-a3b-2507',
    CLAUDE: 'claude-sonnet-4-20250514',
    GEMINI: 'gemini-2.0-flash',
};

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequests = new Map<string, number[]>();

export function rateLimit(ip: string): boolean {
    const now = Date.now();
    const requests = ipRequests.get(ip) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    recentRequests.push(now);
    ipRequests.set(ip, recentRequests);

    // Lazy cleanup: If map gets too big, clear it (simple strategy)
    if (ipRequests.size > 1000) {
        ipRequests.clear();
    }

    return true;
}

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

    if (b.messages.length > 10) {
        return { valid: false, error: 'Too many messages' };
    }

    for (const msg of b.messages) {
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: 'Invalid message format' };
        }
        if (!('role' in msg) || !['user', 'assistant', 'system'].includes(msg.role)) {
            return { valid: false, error: 'Invalid message role' };
        }
        if (!('content' in msg) || typeof msg.content !== 'string') {
            return { valid: false, error: 'Invalid message content' };
        }
        if (msg.content.length > 1000) {
            return { valid: false, error: 'Message too long (max 1000 chars)' };
        }
    }

    return { valid: true };
}
