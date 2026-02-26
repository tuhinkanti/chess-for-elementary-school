import { z } from 'zod';

// ==========================================
// Shared Types
// ==========================================

export interface TutorResponse {
    message: string;
    mood: "encouraging" | "thinking" | "surprised" | "celebrating";
    highlightSquare?: string;
    drawArrow?: string; // Format: "e2-e4"
    learnedFacts?: string[]; // New facts learned about the student
}

export interface GameContext {
    fen: string;
    lastMove?: string; // PGN notation or UCI
    lessonObjective?: string;
    studentContext?: string; // Memory-based context about the student
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// ==========================================
// Validation Schemas
// ==========================================

export const TutorResponseSchema = z.object({
    message: z.string(),
    mood: z.enum(["encouraging", "thinking", "surprised", "celebrating"]),
    highlightSquare: z.string().optional(),
    drawArrow: z.string().optional(),
    learnedFacts: z.array(z.string()).optional(),
});

export const GameContextSchema = z.object({
    fen: z.string(),
    lastMove: z.string().optional(),
    lessonObjective: z.string().optional(),
    studentContext: z.string().optional(),
});

export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

export const TutorRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1),
    context: GameContextSchema.optional(),
});

// ==========================================
// Utility Functions
// ==========================================

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

export function validateTutorRequest(body: unknown): { valid: boolean; error?: string; data?: z.infer<typeof TutorRequestSchema> } {
    const result = TutorRequestSchema.safeParse(body);
    if (!result.success) {
        return { valid: false, error: result.error.errors.map(e => e.message).join(', ') };
    }
    return { valid: true, data: result.data };
}

export function truncateContext(context: string, maxLength: number = 2000): string {
    if (context.length <= maxLength) return context;
    return context.substring(0, maxLength) + '... (truncated)';
}

export function constructSystemPrompt(context?: GameContext): string {
    const safeStudentContext = context?.studentContext
        ? truncateContext(context.studentContext)
        : '';

    const studentInfo = safeStudentContext
        ? `\n## What You Know About This Student\n${safeStudentContext}\n`
        : '';

    const boardInfo = context?.fen
        ? `\nCurrent Board (FEN): ${context.fen}\nLast Move: ${context.lastMove || "None"}`
        : '';

    return `
You are Grandmaster Gloop, a friendly, magical chess tutor for a 7-year-old.
${studentInfo}
Goal: Help the student with their current lesson in a fun, encouraging way.
Objective: ${context?.lessonObjective || "Play a good move"}
${boardInfo}

Instructions:
1. Be encouraging, concise, and use simple words.
2. If the user made a mistake, explain WHY plainly (no complex notation).
3. Reference what you know about the student's strengths and struggles if relevant.
4. Keep responses SHORT - 1-3 sentences max for young learners.
5. Identify NEW facts about the student based on this interaction (e.g., "Student struggles with knights", "Student likes visual hints") and include them in 'learnedFacts'.
6. Always respond with valid JSON.

Response format:
{
  "message": string (your friendly response),
  "mood": "encouraging" | "thinking" | "surprised" | "celebrating",
  "highlightSquare": string (optional),
  "drawArrow": string (optional "e2-e4"),
  "learnedFacts": string[] (optional list of new observations)
}
    `.trim();
}
