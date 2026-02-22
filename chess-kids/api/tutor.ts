// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { getModel } from '../src/config/aiConfig.js';
import { extractJson, validateTutorRequest } from '../src/utils/aiUtils.js';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Simple in-memory rate limiting (Note: resets on function cold start)
// For production, use Redis/Upstash
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // Allow enough for a session

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowKey = `${ip}:${Math.floor(now / RATE_LIMIT_WINDOW)}`;
    const count = rateLimitMap.get(windowKey) || 0;

    if (count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    rateLimitMap.set(windowKey, count + 1);

    // Cleanup to prevent memory leak
    if (rateLimitMap.size > 1000) {
        rateLimitMap.clear();
    }

    return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Rate limiting
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        if (!checkRateLimit(clientIp)) {
            return res.status(429).json({
                error: 'Too many requests. Please try again later.',
                mood: 'thinking'
            });
        }

        const validation = validateTutorRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { messages, systemPrompt } = req.body as {
            messages: ChatMessage[];
            systemPrompt?: string;
        };

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

        const { text } = await generateText({
            model: getModel(),
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
