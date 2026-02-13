// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Constants for Models
const MODELS = {
    local: 'qwen3-30b-a3b-2507',
    claude: 'claude-sonnet-4-20250514',
    gemini: 'gemini-2.0-flash',
};

// Zod Schemas
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

// Simple In-Memory Rate Limiter (Note: This resets on cold starts in serverless)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
        return true;
    }

    if (now - record.lastReset > RATE_LIMIT_WINDOW) {
        record.count = 1;
        record.lastReset = now;
        return true;
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    record.count++;
    return true;
}

function getModel() {
    switch (provider) {
        case 'local':
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio' // LM Studio doesn't require a real key
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat(MODELS.local);
        case 'claude':
            return anthropic(MODELS.claude);
        case 'gemini':
        default:
            return google(MODELS.gemini);
    }
}

function extractJson(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate Limiting
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
         return res.status(429).json({
            message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
            mood: 'thinking'
        });
    }

    try {
        // Validate Request Body
        const validationResult = RequestSchema.safeParse(req.body);
        if (!validationResult.success) {
             console.error('Validation Error:', validationResult.error);
             return res.status(400).json({ error: 'Invalid request body', details: validationResult.error.errors });
        }

        const { messages, systemPrompt } = validationResult.data;

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

        // Parse JSON securely
        try {
            const cleanJson = extractJson(text);
            const parsed = JSON.parse(cleanJson);

            // Validate Response Structure
             const responseValidation = TutorResponseSchema.safeParse(parsed);

             if(responseValidation.success) {
                 return res.status(200).json(responseValidation.data);
             } else {
                 console.warn("AI returned invalid structure, using fallback parsing", responseValidation.error);
                 // Return what we parsed, ensuring at least basic fields exist
                 return res.status(200).json({
                     message: parsed.message || text,
                     mood: parsed.mood || 'encouraging',
                     ...parsed
                 });
             }

        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError, 'Raw Text:', text);
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

        return res.status(500).json({
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking'
        });
    }
}
