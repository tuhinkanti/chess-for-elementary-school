// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

const MODELS = {
    LOCAL: 'qwen3-30b-a3b-2507',
    CLAUDE: 'claude-sonnet-4-20250514',
    GEMINI: 'gemini-2.0-flash'
};

const RequestSchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string()
    })).min(1),
    systemPrompt: z.string().optional()
});

function getModel() {
    switch (provider) {
        case 'local':
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio' // LM Studio doesn't require a real key
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat(MODELS.LOCAL);
        case 'claude':
            return anthropic(MODELS.CLAUDE);
        case 'gemini':
        default:
            return google(MODELS.GEMINI);
    }
}

function extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const parseResult = RequestSchema.safeParse(req.body);

        if (!parseResult.success) {
            return res.status(400).json({ error: 'Invalid request body', details: parseResult.error });
        }

        const { messages, systemPrompt } = parseResult.data;

        // Build the full prompt with system context and conversation history
        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        const fullMessages = [
            { role: 'system' as const, content: systemMessage },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
        ];

        const { text } = await generateText({
            model: getModel(),
            messages: fullMessages,
        });

        // Try to parse as JSON (for structured TutorResponse)
        try {
            const cleanedText = extractJSON(text);
            const parsed = JSON.parse(cleanedText);
            return res.status(200).json(parsed);
        } catch {
            // If not valid JSON, wrap the text in a TutorResponse structure
            return res.status(200).json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error: any) {
        console.error('AI Tutor API Error:', error);

        // Handle quota/rate limit errors
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
            return res.status(200).json({
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking'
            });
        }

        return res.status(200).json({
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking'
        });
    }
}
// Trigger review
