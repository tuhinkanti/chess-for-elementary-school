// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

const provider = process.env.AI_PROVIDER || 'local';

const MODELS = {
    local: process.env.LOCAL_MODEL_ID || 'qwen3-30b-a3b-2507',
    claude: process.env.CLAUDE_MODEL_ID || 'claude-sonnet-4-20250514',
    gemini: process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash',
};

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
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

function extractJson(text: string): any {
    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch {
        // 2. Try to find JSON block in markdown
        const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        if (match) {
            try {
                return JSON.parse(match[1]);
            } catch {
                // Continue to next strategy
            }
        }

        // 3. Try to find first { and last } (fallback for messy output)
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                return JSON.parse(text.substring(firstBrace, lastBrace + 1));
            } catch {
                // Continue
            }
        }

        throw new Error('No valid JSON found');
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Basic validation
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { messages, systemPrompt } = req.body as {
            messages?: ChatMessage[];
            systemPrompt?: string;
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required and must be an array' });
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
            return res.status(200).json(parsed);
        } catch {
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
            return res.status(429).json({
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
