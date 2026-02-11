// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Rate Limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute
const rateLimitMap = new Map<string, { count: number, startTime: number }>();

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

// Validation Schemas
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const RequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1, "Messages are required"),
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
                baseURL: process.env.LOCAL_LLM_BASE_URL || 'http://localhost:1234/v1',
                apiKey: 'lm-studio' // LM Studio doesn't require a real key
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat(process.env.LOCAL_LLM_MODEL || 'qwen3-30b-a3b-2507');
        case 'claude':
            return anthropic(process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514');
        case 'gemini':
        default:
            return google(process.env.GEMINI_MODEL || 'gemini-2.0-flash');
    }
}

/**
 * Robustly extract JSON from AI response, handling markdown code blocks.
 */
function extractJson(text: string): any {
    try {
        // First try direct parse
        return JSON.parse(text);
    } catch {
        // Try to find JSON block using regex to find first { and last }
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
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

    // Rate Limiting Check
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    try {
        // Validate request body
        const parseResult = RequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({ error: 'Invalid request', details: parseResult.error.errors });
        }

        const { messages, systemPrompt } = parseResult.data;

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
        const parsedJson = extractJson(text);

        if (parsedJson) {
            // Validate output against schema
            const responseValidation = TutorResponseSchema.safeParse(parsedJson);
            if (responseValidation.success) {
                return res.status(200).json(responseValidation.data);
            } else {
                 // If structure matches but maybe extra fields or slight type mismatch, try to salvage
                 // For now, if it has message and mood, we accept it
                 if (parsedJson.message && parsedJson.mood) {
                     return res.status(200).json(parsedJson);
                 }
            }
        }

        // If not valid JSON or validation failed, wrap the text in a TutorResponse structure
        // But if text contains invalid JSON chars, we might want to be careful.
        // Assuming 'text' is the raw string.
        return res.status(200).json({
            message: text,
            mood: 'encouraging'
        });

    } catch (error: any) {
        // Structured logging
        console.error(JSON.stringify({
            level: 'error',
            message: 'AI Tutor API Error',
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }));

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
