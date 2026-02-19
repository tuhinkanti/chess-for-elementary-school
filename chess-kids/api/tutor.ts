// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { extractJson, validateTutorRequest } from '../src/utils/aiUtils.js';
import { AI_MODELS } from '../src/config/aiConfig.js';

const provider = process.env.AI_PROVIDER || 'local';

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute
const requestCounts = new Map<string, { count: number, resetTime: number }>();

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface TutorRequestBody {
    messages: ChatMessage[];
    systemPrompt?: string;
}

function getModel() {
    switch (provider) {
        case 'local': {
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: AI_MODELS.local.baseURL,
                apiKey: AI_MODELS.local.apiKey
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat(AI_MODELS.local.modelId);
        }
        case 'claude':
            return anthropic(AI_MODELS.claude.modelId);
        case 'gemini':
        default:
            return google(AI_MODELS.gemini.modelId);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate Limiting
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const limitData = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > limitData.resetTime) {
        limitData.count = 0;
        limitData.resetTime = now + RATE_LIMIT_WINDOW;
    }

    if (limitData.count >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    limitData.count++;
    requestCounts.set(ip, limitData);

    try {
        const validation = validateTutorRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { messages, systemPrompt } = req.body as TutorRequestBody;

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
// Trigger review
