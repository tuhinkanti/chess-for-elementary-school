// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { extractJson, validateTutorRequest } from '../src/utils/aiUtils.js';
import { getModel } from '../src/config/aiConfig.js';

const provider = process.env.AI_PROVIDER || 'local';

// Simple in-memory rate limiting (per container instance)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 2000; // 2 seconds between requests

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate Limiting
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const lastRequest = rateLimit.get(ip) || 0;

    if (now - lastRequest < RATE_LIMIT_WINDOW_MS) {
        return res.status(429).json({
            error: 'Too many requests',
            message: "Whoa there, slow down! Even wizards need a moment to think.",
            mood: 'thinking'
        });
    }
    rateLimit.set(ip, now);

    try {
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
            model: getModel(provider),
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

        // Handle quota/rate limit errors specifically if possible
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
             return res.status(503).json({
                error: 'Service Unavailable',
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking'
            });
        }

        return res.status(500).json({
            error: 'Internal Server Error',
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking'
        });
    }
}
