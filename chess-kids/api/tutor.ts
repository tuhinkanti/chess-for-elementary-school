// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

// Constants for Model Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'local';

const MODELS = {
    LOCAL: 'qwen3-30b-a3b-2507',
    CLAUDE: 'claude-sonnet-4-20250514',
    GEMINI: 'gemini-2.0-flash'
};

const LM_STUDIO_CONFIG = {
    baseURL: 'http://localhost:1234/v1',
    apiKey: 'lm-studio'
};

// Simple In-Memory Rate Limiter (Note: This is per-instance, not global across serverless invocations)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const requestCounts = new Map<string, { count: number, resetTime: number }>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return false;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return true;
    }

    record.count++;
    return false;
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface TutorRequestBody {
    messages: ChatMessage[];
    systemPrompt?: string;
}

function isValidMessage(msg: any): msg is ChatMessage {
    return (
        typeof msg === 'object' &&
        msg !== null &&
        ['user', 'assistant', 'system'].includes(msg.role) &&
        typeof msg.content === 'string'
    );
}

function validateBody(body: any): body is TutorRequestBody {
    if (typeof body !== 'object' || body === null) return false;
    if (!Array.isArray(body.messages)) return false;
    if (body.messages.length === 0) return false;
    return body.messages.every(isValidMessage);
}

function extractJson(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
}

function getModel() {
    switch (AI_PROVIDER) {
        case 'local':
            const lmStudio = createOpenAI(LM_STUDIO_CONFIG);
            return lmStudio.chat(MODELS.LOCAL);
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
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (isRateLimited(ip)) {
         return res.status(429).json({
            message: "I'm thinking too fast! Give me a moment to catch my breath.",
            mood: 'thinking'
        });
    }

    try {
        if (!validateBody(req.body)) {
             return res.status(400).json({ error: 'Invalid request body. "messages" array is required.' });
        }

        const { messages, systemPrompt } = req.body;

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

        const jsonText = extractJson(text);

        try {
            const parsed = JSON.parse(jsonText);
            return res.status(200).json(parsed);
        } catch {
            return res.status(200).json({
                message: text, // Fallback to raw text if JSON parsing fails
                mood: 'encouraging'
            });
        }
    } catch (error: any) {
        console.error('AI Tutor API Error:', error);

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
