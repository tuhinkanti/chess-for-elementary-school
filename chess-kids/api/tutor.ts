// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Configuration for models to avoid hardcoding in function body
const MODEL_CONFIG = {
    local: {
        baseUrl: 'http://localhost:1234/v1',
        model: 'qwen3-30b-a3b-2507',
        apiKey: 'lm-studio'
    },
    claude: {
        model: 'claude-sonnet-4-20250514'
    },
    gemini: {
        model: 'gemini-2.0-flash'
    }
};

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const RequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1, "Messages are required"),
    systemPrompt: z.string().optional(),
});

function getModel() {
    switch (provider) {
        case 'local':
            const lmStudio = createOpenAI({
                baseURL: MODEL_CONFIG.local.baseUrl,
                apiKey: MODEL_CONFIG.local.apiKey
            });
            return lmStudio.chat(MODEL_CONFIG.local.model);
        case 'claude':
            return anthropic(MODEL_CONFIG.claude.model);
        case 'gemini':
        default:
            return google(MODEL_CONFIG.gemini.model);
    }
}

function extractJson(text: string): any {
    try {
        // First try direct parse
        return JSON.parse(text);
    } catch {
        // Try to extract JSON from markdown code blocks or raw text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                return null;
            }
        }
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Validate request body
        const validation = RequestSchema.safeParse(req.body);

        if (!validation.success) {
            console.warn('Invalid request body:', validation.error);
            return res.status(400).json({ error: 'Invalid request body', details: validation.error.format() });
        }

        const { messages, systemPrompt } = validation.data;

        // Build the full prompt with system context and conversation history
        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        const fullMessages = [
            { role: 'system' as const, content: systemMessage },
            ...messages
        ];

        const { text } = await generateText({
            model: getModel(),
            messages: fullMessages,
        });

        // Robust JSON extraction
        const parsed = extractJson(text);

        if (parsed) {
            return res.status(200).json(parsed);
        } else {
             // If not valid JSON, wrap the text in a TutorResponse structure
             // Log this occurrence as it indicates the model isn't following instructions well
             console.warn('AI Model failed to return valid JSON', { textResponse: text });
             return res.status(200).json({
                message: text,
                mood: 'encouraging'
            });
        }

    } catch (error: any) {
        // Structured error logging
        console.error('AI Tutor API Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            provider
        });

        // Handle quota/rate limit errors
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
            return res.status(200).json({
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
