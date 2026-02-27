// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { extractJson } from '../src/utils/aiUtils.js';
import { getModel, AI_CONFIG, type AIProvider } from '../src/config/aiConfig.js';
import { z } from 'zod';

// Validation Schema
const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(2000), // Enforce reasonable length
});

const RequestSchema = z.object({
    messages: z.array(MessageSchema).min(1).max(50),
    systemPrompt: z.string().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Validate Request Body
        const parseResult = RequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: 'Invalid request',
                details: parseResult.error.format()
            });
        }

        const { messages, systemPrompt } = parseResult.data;

        // Build the full prompt with system context and conversation history
        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        // Security: Filter out any client-supplied 'system' messages to prevent prompt injection
        const safeMessages = messages.filter(m => m.role !== 'system');

        const fullMessages = [
            { role: 'system' as const, content: systemMessage },
            ...safeMessages
        ];

        // Use the centralized model configuration
        const model = getModel(process.env.AI_PROVIDER as AIProvider || AI_CONFIG.provider);

        const { text } = await generateText({
            model,
            messages: fullMessages,
        });

        // Try to parse as JSON (for structured TutorResponse)
        const parsed = extractJson(text);
        if (parsed !== null) {
            return res.status(200).json(parsed);
        }

        // If not valid JSON, wrap the text in a TutorResponse structure
        return res.status(200).json({
            message: text,
            mood: 'encouraging'
        });

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('AI Tutor API Error:', error);

        // Handle quota/rate limit errors
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
            return res.status(429).json({
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking'
            });
        }

        return res.status(500).json({
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking'
        });
    }
}
