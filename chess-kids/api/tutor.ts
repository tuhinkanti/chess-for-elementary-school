// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

// Configuration
const provider = process.env.AI_PROVIDER || 'local';

const MODELS = {
    local: 'qwen3-30b-a3b-2507',
    claude: 'claude-sonnet-4-20250514',
    gemini: 'gemini-2.0-flash'
} as const;

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

/**
 * Robustly extracts JSON from a string, handling potential markdown blocks.
 */
function extractJson(text: string): any {
    try {
        // First try direct parse
        return JSON.parse(text);
    } catch {
        // If that fails, look for JSON-like structure (e.g. wrapped in markdown code blocks)
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                throw new Error('Failed to extract valid JSON');
            }
        }
        throw new Error('No JSON object found');
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Runtime validation for request body
        if (!req.body || typeof req.body !== 'object') {
             return res.status(400).json({ error: 'Invalid request body' });
        }

        const { messages, systemPrompt } = req.body as {
            messages?: ChatMessage[];
            systemPrompt?: string;
        };

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required and cannot be empty' });
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
        } catch (e) {
            console.warn('Failed to parse AI response as JSON:', text);
            // If not valid JSON, wrap the text in a TutorResponse structure
            return res.status(200).json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error: any) {
        console.error('AI Tutor API Error:', error instanceof Error ? error.message : error, error.stack);

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
