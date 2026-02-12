// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const provider = process.env.AI_PROVIDER || 'local';

// Validation Schemas
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const RequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1, "At least one message is required"),
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
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio' // LM Studio doesn't require a real key
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat('qwen3-30b-a3b-2507');
        case 'claude':
            return anthropic('claude-3-5-sonnet-20240620'); // Updated to latest stable model
        case 'gemini':
        default:
            return google('gemini-2.0-flash');
    }
}

function extractJson(text: string): any {
    try {
        // First try parsing the whole text
        return JSON.parse(text);
    } catch {
        // Try to extract from markdown code blocks or just find the JSON object
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(jsonCandidate);
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
        const parseResult = RequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: 'Invalid request',
                details: parseResult.error.format()
            });
        }

        const { messages, systemPrompt } = parseResult.data;

        // Build the full prompt with system context and conversation history
        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        // Ensure proper typing for AI SDK
        const fullMessages = [
            { role: 'system' as const, content: systemMessage },
            ...messages.map(m => ({ role: m.role as 'user'|'assistant'|'system', content: m.content }))
        ];

        const { text } = await generateText({
            model: getModel(),
            messages: fullMessages,
        });

        // Parse and validate response
        const extractedJson = extractJson(text);

        if (extractedJson) {
            const validation = TutorResponseSchema.safeParse(extractedJson);
            if (validation.success) {
                return res.status(200).json(validation.data);
            } else {
                 console.warn("AI returned invalid JSON structure:", validation.error);
                 // Fallback if structure is wrong but we have JSON
                 return res.status(200).json({
                     message: extractedJson.message || text,
                     mood: 'encouraging'
                 });
            }
        }

        // Fallback if no JSON found
        return res.status(200).json({
            message: text,
            mood: 'encouraging'
        });

    } catch (error: any) {
        console.error('AI Tutor API Error:', error);

        // Handle quota/rate limit errors
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
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
