/**
 * Chess Tutor Service - Multi-Provider AI
 * 
 * This service communicates with the /api/tutor endpoint which supports:
 * - Local LLM (LM Studio with Qwen)
 * - Google Gemini
 * - Anthropic Claude
 * 
 * Provider is selected via AI_PROVIDER environment variable on the server.
 */
import { z } from 'zod';

const TutorResponseSchema = z.object({
    message: z.string(),
    mood: z.enum(['encouraging', 'thinking', 'surprised', 'celebrating']),
    highlightSquare: z.string().optional(),
    drawArrow: z.string().optional(),
    learnedFacts: z.array(z.string()).optional(),
});

interface TutorResponse {
    message: string;
    mood: "encouraging" | "thinking" | "surprised" | "celebrating";
    highlightSquare?: string;
    drawArrow?: string; // Format: "e2-e4"
    learnedFacts?: string[]; // New facts learned about the student
}

interface GameContext {
    fen: string;
    lastMove?: string; // PGN notation or UCI
    lessonObjective?: string;
    studentContext?: string; // Memory-based context about the student
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

class ChessTutorService {
    private apiEndpoint = import.meta.env.VITE_API_ENDPOINT || '/api/tutor';

    /**
     * Chat with Gloop - supports multi-turn conversations
     */
    async chat(messages: ChatMessage[], context?: GameContext): Promise<TutorResponse> {
        const systemPrompt = this.constructSystemPrompt(context);

        // Convert chat messages to API format
        const apiMessages = messages.length > 0
            ? messages.map(m => ({ role: m.role, content: m.content }))
            : [{ role: 'user' as const, content: 'Help me with this chess position!' }];

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    systemPrompt
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Validate response with Zod
            const parsed = TutorResponseSchema.safeParse(data);

            if (!parsed.success) {
                console.warn("AI Tutor response validation failed:", parsed.error);
                // Attempt to recover if at least message exists, otherwise fallback
                if (data && typeof data.message === 'string') {
                    return data as TutorResponse;
                }
                 return {
                    message: "I'm having a little trouble thinking clearly right now. Can we try again?",
                    mood: "thinking"
                };
            }

            return parsed.data;
        } catch (error: any) {
            console.error("AI Tutor Error:", error);

            return {
                message: "I'm having a little trouble thinking right now, but keep trying!",
                mood: "thinking"
            };
        }
    }

    /**
     * Legacy method - for backwards compatibility
     */
    async getAdvice(context: GameContext): Promise<TutorResponse> {
        return this.chat([], context);
    }

    private constructSystemPrompt(context?: GameContext): string {
        let studentInfo = '';

        if (context?.studentContext) {
            // Truncate student context to prevent token overflow
            const MAX_CONTEXT_LENGTH = 1000;
            const safeContext = context.studentContext.length > MAX_CONTEXT_LENGTH
                ? context.studentContext.substring(0, MAX_CONTEXT_LENGTH) + "...(truncated)"
                : context.studentContext;

            studentInfo = `\n## What You Know About This Student\n${safeContext}\n`;
        }

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
}

// Export a singleton instance
export const tutorService = new ChessTutorService();
export type { TutorResponse, GameContext, ChatMessage };
