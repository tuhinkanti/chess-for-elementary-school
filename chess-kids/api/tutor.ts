// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { extractJson } from '../src/utils/aiUtils.js';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Model Configurations
const MODELS = {
    LOCAL: process.env.LOCAL_MODEL_ID || 'qwen3-30b-a3b-2507',
    CLAUDE: process.env.CLAUDE_MODEL_ID || 'claude-3-5-sonnet-20241022',
    GEMINI: process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash'
};

// Rate Limiting Configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const requestCounts = new Map<string, { count: number; expires: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (record) {
        if (now > record.expires) {
            requestCounts.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
            return true;
        }
        if (record.count >= MAX_REQUESTS_PER_WINDOW) {
            return false;
        }
        record.count++;
        return true;
    } else {
        requestCounts.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
        return true;
    }
}

// Request Validation Schema
const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
});

const TutorRequestSchema = z.object({
    messages: z.array(MessageSchema).min(1, "Messages cannot be empty"),
    systemPrompt: z.string().optional()
});

function getModel() {
    switch (provider) {
        case 'local': {
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio'
            });
            return lmStudio.chat(MODELS.LOCAL);
        }
        case 'claude':
            return anthropic(MODELS.CLAUDE);
        case 'gemini':
        default:
            return google(MODELS.GEMINI);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate Limiting
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({
            error: 'Too many requests',
            message: "I need a little break to recharge my magic! Try again in a minute."
        });
    }

    try {
        // Validate request body
        const parseResult = TutorRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: 'Invalid request',
                details: parseResult.error.format()
            });
        }

        const { messages, systemPrompt } = parseResult.data;

        // System Prompt
        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        // Security: Filter out any client-supplied 'system' messages
        const safeMessages = messages.filter(m => m.role !== 'system');

        const fullMessages = [
            { role: 'system' as const, content: systemMessage },
            ...safeMessages
        ];

        const { text } = await generateText({
            model: getModel(),
            messages: fullMessages,
        });

        const parsed = extractJson(text);
        if (parsed !== null) {
            return res.status(200).json(parsed);
        }

        return res.status(200).json({
            message: text,
            mood: 'encouraging'
        });

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('[AI Tutor API Error]', {
            error: error.message,
            stack: error.stack,
            ip: clientIp
        });

        // Handle specific provider errors if possible
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
             // Upstream rate limit
             return res.status(429).json({
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking'
            });
        }

        // Generic Server Error
        return res.status(500).json({
            error: 'Internal Server Error',
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking'
        });
    }
}
