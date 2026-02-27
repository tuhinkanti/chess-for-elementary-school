// Local development server for AI tutor API
// Run with: node server.js (or npm run server)

import express from 'express';
import cors from 'cors';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const provider = process.env.AI_PROVIDER || 'local';

// Validation Schema (Mirrors api/tutor.ts)
const MessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(2000),
});

const RequestSchema = z.object({
    messages: z.array(MessageSchema).min(1).max(50),
    systemPrompt: z.string().optional(),
});


// Note: We duplicate logic here because server.js runs in Node.js directly
// and handling TS imports from src/config/aiConfig.ts requires extra setup (tsx or build step).
// For simplicity in this dev server, we keep it self-contained.

function getModel() {
    switch (provider) {
        case 'local':
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio'
            });
            return lmStudio.chat('qwen3-30b-a3b-2507');
        case 'claude':
            return anthropic('claude-sonnet-4-20250514');
        case 'gemini':
        default:
            return google('gemini-2.0-flash');
    }
}

// Robust JSON extraction (Mirrors src/utils/aiUtils.ts)
function extractJson(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }

    try {
        // 1. Try direct parsing
        return JSON.parse(text);
    } catch {
        // 2. Try parsing a JSON code block (```json ... ```)
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch {
                // Continue
            }
        }

        // 3. Try finding the first '{' and last '}'
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose > firstOpen) {
            const potentialJson = text.substring(firstOpen, lastClose + 1);
            try {
                return JSON.parse(potentialJson);
            } catch {
                return null;
            }
        }

        return null;
    }
}

app.post('/api/tutor', async (req, res) => {
    try {
        // Validation
        const parseResult = RequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                error: 'Invalid request',
                details: parseResult.error.format()
            });
        }

        const { messages, systemPrompt } = parseResult.data;

        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        // Security: Filter out any client-supplied 'system' messages to prevent prompt injection
        const safeMessages = messages.filter(m => m.role !== 'system');

        const fullMessages = [
            { role: 'system', content: systemMessage },
            ...safeMessages
        ];

        console.log(`[AI Provider: ${provider}] Processing request...`);

        const { text } = await generateText({
            model: getModel(),
            messages: fullMessages,
        });

        const parsed = extractJson(text);
        if (parsed !== null) {
            return res.json(parsed);
        }

        return res.json({
            message: text,
            mood: 'encouraging'
        });

    } catch (error) {
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
});

app.listen(PORT, () => {
    console.log(`🎓 Grandmaster Gloop API running on http://localhost:${PORT}`);
    console.log(`   AI Provider: ${provider}`);
    if (provider === 'local') {
        console.log(`   Make sure LM Studio is running on http://localhost:1234`);
    }
});
