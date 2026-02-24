import { z } from 'zod';

export function extractJson(text: string): unknown {
    if (!text || typeof text !== 'string') {
        return null;
    }

    // 1. Try finding the first '{' and last '}' (Prioritize this for robustness)
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose > firstOpen) {
        const potentialJson = text.substring(firstOpen, lastClose + 1);
        try {
            return JSON.parse(potentialJson);
        } catch {
            // Continue if substring parse fails
        }
    }

    // 2. Try parsing a JSON code block (```json ... ```)
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            return JSON.parse(codeBlockMatch[1]);
        } catch {
            // Continue if code block parse fails
        }
    }

    // 3. Try direct parsing as last resort
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export const TutorRequestSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
    })).min(1, "Messages cannot be empty"),
    systemPrompt: z.string().optional(),
});

export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export function validateTutorRequest(body: unknown): { valid: boolean; error?: string } {
    const result = TutorRequestSchema.safeParse(body);
    if (!result.success) {
        // Try to access issues or errors depending on Zod version (v4 uses issues?)
        const issues = result.error.issues || (result.error as any).errors || [];
        return { valid: false, error: issues.map((e: any) => e.message).join(', ') };
    }
    return { valid: true };
}

export const TutorResponseSchema = z.object({
    message: z.string(),
    mood: z.enum(['encouraging', 'thinking', 'surprised', 'celebrating']),
    highlightSquare: z.string().optional(),
    drawArrow: z.string().optional(), // Format: "e2-e4"
    learnedFacts: z.array(z.string()).optional(),
});

export type TutorResponse = z.infer<typeof TutorResponseSchema>;
