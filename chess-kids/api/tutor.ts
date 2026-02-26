// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { extractJson, validateTutorRequest, constructSystemPrompt } from '../src/utils/aiUtils.js';
import { AI_MODELS } from '../src/config/aiConfig.js';

const provider = process.env.AI_PROVIDER || 'local';

function getModel() {
    switch (provider) {
        case 'local': {
            const config = AI_MODELS.local;
            const lmStudio = createOpenAI({
                baseURL: config.baseURL,
                apiKey: config.apiKey
            });
            return lmStudio.chat(config.model);
        }
        case 'claude':
            return anthropic(AI_MODELS.claude.model);
        case 'gemini':
        default:
            return google(AI_MODELS.gemini.model);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const validation = validateTutorRequest(req.body);
        if (!validation.valid || !validation.data) {
            return res.status(400).json({ error: validation.error || 'Invalid request' });
        }

        const { messages, context } = validation.data;

        // Security: Construct system prompt on server to prevent injection
        const systemMessage = constructSystemPrompt(context);

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('AI Tutor API Error:', error);

        // Improved error handling
        const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');

        if (isRateLimit) {
             return res.status(429).json({
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking',
                error: 'Rate limit exceeded'
            });
        }

        return res.status(500).json({
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking',
            error: 'Internal server error'
        });
    }
}
