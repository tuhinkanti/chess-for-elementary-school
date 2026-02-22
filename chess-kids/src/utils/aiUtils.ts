import { z } from 'zod';

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

export const TutorRequestSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
    })).min(1, 'Messages cannot be empty'),
    systemPrompt: z.string().optional(),
});

export const TutorResponseSchema = z.object({
    message: z.string(),
    mood: z.enum(["encouraging", "thinking", "surprised", "celebrating"]),
    highlightSquare: z.string().optional(),
    drawArrow: z.string().optional(),
    learnedFacts: z.array(z.string()).optional(),
});

/**
 * Validates the tutor request body using Zod schema.
 * Returns validation result compatible with previous implementation but powered by Zod.
 */
export function validateTutorRequest(body: unknown): { valid: boolean; error?: string } {
    const result = TutorRequestSchema.safeParse(body);
    if (!result.success) {
        // Format the error message
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return { valid: false, error: errors };
    }
    return { valid: true };
}
