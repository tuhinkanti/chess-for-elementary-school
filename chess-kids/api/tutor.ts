// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Configuration
const MODELS = {
    local: {
        model: 'qwen3-30b-a3b-2507',
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'lm-studio'
    },
    claude: 'claude-sonnet-4-20250514',
    gemini: 'gemini-2.0-flash'
};

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // Allow 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number, startTime: number }>();

// Schema Definitions
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const RequestBodySchema = z.object({
    messages: z.array(ChatMessageSchema),
    systemPrompt: z.string().optional(),
});

const TutorResponseSchema = z.object({
    message: z.string(),
    mood: z.enum(['encouraging', 'thinking', 'surprised', 'celebrating']),
    highlightSquare: z.string().optional(),
    drawArrow: z.string().optional(),
    learnedFacts: z.array(z.string()).optional(),
});

function getModel() {
    switch (provider) {
        case 'local':
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: MODELS.local.baseURL,
                apiKey: MODELS.local.apiKey
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat(MODELS.local.model);
        case 'claude':
            return anthropic(MODELS.claude);
        case 'gemini':
        default:
            return google(MODELS.gemini);
    }
}

function extractJson(text: string): any {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text); // Fallback to direct parse
    } catch (e) {
        throw new Error('Failed to extract JSON from response');
    }
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return true;
    }

    if (now - record.startTime > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
        return true;
    }

    if (record.count >= MAX_REQUESTS) {
        return false;
    }

    record.count++;
    return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const ip = (Array.isArray(req.headers['x-forwarded-for'])
        ? req.headers['x-forwarded-for'][0]
        : req.headers['x-forwarded-for']) || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(ip)) {
        console.warn(`[Rate Limit] Blocked request from ${ip}`);
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    try {
        // Validate request body
        const result = RequestBodySchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ error: 'Invalid request body', details: result.error.format() });
        }

        const { messages, systemPrompt } = result.data;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required' });
        }

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

        // Try to parse as JSON (for structured TutorResponse)
        try {
            const parsed = extractJson(text);
            const validatedResponse = TutorResponseSchema.parse(parsed);
            return res.status(200).json(validatedResponse);
        } catch (parseError) {
            // If not valid JSON or validation fails, wrap the text in a TutorResponse structure
            return res.status(200).json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error: any) {
        console.error(`[AI Tutor Error] Provider: ${provider}`, {
            message: error.message,
            stack: error.stack,
            response: error.response?.data
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
