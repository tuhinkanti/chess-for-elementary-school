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

import {
    type TutorResponse,
    type GameContext,
    type ChatMessage,
    TutorResponseSchema
} from '../../utils/aiUtils';

class ChessTutorService {
    // Use environment variable for endpoint, defaulting to relative path
    private apiEndpoint = import.meta.env.VITE_API_ENDPOINT || '/api/tutor';

    /**
     * Chat with Gloop - supports multi-turn conversations
     */
    async chat(messages: ChatMessage[], context?: GameContext): Promise<TutorResponse> {
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
                    context // Send context to server for prompt construction
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            // Validate response using Zod
            const result = TutorResponseSchema.safeParse(data);
            if (!result.success) {
                console.warn("Invalid TutorResponse format:", result.error);
                // Fallback or re-throw?
                // Since data might still be usable (e.g. just message), we could try to salvage,
                // but strictly we should ensure it matches.
                // For robustness, if 'message' and 'mood' exist, we might accept it, but safeParse is strict.
                // Let's return a safe fallback if validation fails but log the error.
                return {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    message: (data as any).message || "I'm having a little trouble speaking clearly right now.",
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    mood: (data as any).mood || "thinking"
                } as TutorResponse;
            }

            return result.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export type { TutorResponse, GameContext, ChatMessage };
