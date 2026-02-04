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

interface TutorResponse {
    message: string;
    mood: "encouraging" | "thinking" | "surprised" | "celebrating";
    highlightSquare?: string;
    drawArrow?: string; // Format: "e2-e4"
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
    private apiEndpoint = '/api/tutor';

    /**
     * Chat with Gloop - supports multi-turn conversations
     */
    async chat(messages: ChatMessage[], context?: GameContext): Promise<TutorResponse> {
        const systemPrompt = this.constructSystemPrompt(context);
        const MAX_MESSAGE_LENGTH = 500;

        // Convert chat messages to API format
        const apiMessages = messages.length > 0
            ? messages.map(m => ({
                role: m.role,
                content: m.content.substring(0, MAX_MESSAGE_LENGTH)
            }))
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
            return data as TutorResponse;
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
        const studentInfo = context?.studentContext
            ? `\n## What You Know About This Student\n${context.studentContext}\n`
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
5. Always respond with valid JSON.

Response format:
{
  "message": string (your friendly response),
  "mood": "encouraging" | "thinking" | "surprised" | "celebrating"
}
    `.trim();
    }
}

// Export a singleton instance
export const tutorService = new ChessTutorService();
export type { TutorResponse, GameContext, ChatMessage };
