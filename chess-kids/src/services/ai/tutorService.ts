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
import { constructSystemPrompt } from './prompts';
import type { TutorResponse, GameContext, ChatMessage } from './types';

// Zod Schema for Runtime Validation of the Response
const TutorResponseSchema = z.object({
    message: z.string(),
    mood: z.enum(["encouraging", "thinking", "surprised", "celebrating"]),
    highlightSquare: z.string().optional(),
    drawArrow: z.string().optional(),
    learnedFacts: z.array(z.string()).optional(),
});

class ChessTutorService {
    // Use env variable or default relative path
    // In Vite, env vars are exposed on import.meta.env
    private apiEndpoint = import.meta.env.VITE_API_ENDPOINT || '/api/tutor';

    /**
     * Chat with Gloop - supports multi-turn conversations
     */
    async chat(messages: ChatMessage[], context?: GameContext): Promise<TutorResponse> {
        const systemPrompt = constructSystemPrompt(context);

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
                 if (response.status === 429) {
                     return {
                        message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                        mood: "thinking"
                    };
                }
                throw new Error(`API error: ${response.status}`);
            }

            const rawData = await response.json();

            // Validate response with Zod
            const validation = TutorResponseSchema.safeParse(rawData);

            if (validation.success) {
                return validation.data;
            } else {
                console.warn("Invalid API response format:", validation.error);
                // Fallback
                return {
                    message: typeof rawData.message === 'string' ? rawData.message : "I'm having a little trouble thinking clearly.",
                    mood: "thinking"
                };
            }
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
}

// Export a singleton instance
export const tutorService = new ChessTutorService();
export type { TutorResponse, GameContext, ChatMessage } from './types';
