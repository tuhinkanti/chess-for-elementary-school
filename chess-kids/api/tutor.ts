// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Model Configuration
const MODELS = {
    local: {
        provider: 'local',
        modelId: 'qwen3-30b-a3b-2507',
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'lm-studio'
    },
    claude: {
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
    },
    gemini: {
        provider: 'google',
        modelId: 'gemini-2.0-flash',
    }
} as const;

// Input Validation Schema
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
});

const TutorRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1),
    systemPrompt: z.string().optional()
});

function getModel() {
    const config = MODELS[provider as keyof typeof MODELS] || MODELS.gemini;

    switch (config.provider) {
        case 'local':
            const lmStudio = createOpenAI({
                baseURL: (config as any).baseURL,
                apiKey: (config as any).apiKey
            });
            return lmStudio.chat(config.modelId);
        case 'anthropic':
            return anthropic(config.modelId);
        case 'google':
        default:
            return google(config.modelId);
    }
}

// Simple In-Memory Rate Limiting
const requestCounts = new Map<string, { count: number, expiry: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    let record = requestCounts.get(ip);

    if (!record || now > record.expiry) {
        record = { count: 0, expiry: now + RATE_LIMIT_WINDOW };
        requestCounts.set(ip, record);
    }

    if (record.count >= MAX_REQUESTS) {
        return true;
    }

    record.count++;
    return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (checkRateLimit(ip)) {
        return res.status(429).json({
            message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
            mood: 'thinking'
        });
    }

    try {
        const result = TutorRequestSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: 'Invalid request body', details: result.error.format() });
        }

        const { messages, systemPrompt } = result.data;

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
            messages: fullMessages as any,
        });

        // Robust JSON Extraction
        let jsonString = text;
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = text.substring(firstBrace, lastBrace + 1);
        }

        try {
            const parsed = JSON.parse(jsonString);
            return res.status(200).json(parsed);
        } catch {
            // If not valid JSON, wrap the text in a TutorResponse structure
            return res.status(200).json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error: any) {
        console.error('AI Tutor API Error:', JSON.stringify({
            message: error.message,
            stack: error.stack,
            body: req.body
        }));

        // Handle quota/rate limit errors
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
            return res.status(200).json({
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking'
            });
        }

        return res.status(500).json({
            error: "Internal Server Error"
        });
    }
}
// Trigger review
