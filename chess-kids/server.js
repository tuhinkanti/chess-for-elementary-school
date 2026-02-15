// Local development server for AI tutor API
// Run with: node server.js (or npm run server)

import express from 'express';
import cors from 'cors';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const provider = process.env.AI_PROVIDER || 'local';

const MODELS = {
    local: process.env.LOCAL_MODEL_ID || 'qwen3-30b-a3b-2507',
    claude: process.env.CLAUDE_MODEL_ID || 'claude-sonnet-4-20250514',
    gemini: process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash',
};

function getModel() {
    switch (provider) {
        case 'local':
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio'
            });
            return lmStudio.chat(MODELS.local);
        case 'claude':
            return anthropic(MODELS.claude);
        case 'gemini':
        default:
            return google(MODELS.gemini);
    }
}

function extractJson(text) {
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
                // Continue
            }
        }

        // 3. Try to find first { and last }
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

app.post('/api/tutor', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({ error: 'Invalid request body' });
        }

        const { messages, systemPrompt } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required and must be an array' });
        }

        const systemMessage = systemPrompt || `You are Grandmaster Gloop, a friendly chess tutor for a 7-year-old.
Be encouraging, concise, and explain things simply.
Always respond with valid JSON: {"message": "your response", "mood": "encouraging"|"thinking"|"surprised"|"celebrating"}`;

        const fullMessages = [
            { role: 'system', content: systemMessage },
            ...messages
        ];

        console.log(`[AI Provider: ${provider}] Processing request...`);

        const { text } = await generateText({
            model: getModel(),
            messages: fullMessages,
        });

        try {
            const parsed = extractJson(text);
            return res.json(parsed);
        } catch {
            return res.json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error) {
        console.error('AI Tutor API Error:', error);

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
});

app.listen(PORT, () => {
    console.log(`🎓 Grandmaster Gloop API running on http://localhost:${PORT}`);
    console.log(`   AI Provider: ${provider}`);
    if (provider === 'local') {
        console.log(`   Make sure LM Studio is running on http://localhost:1234`);
    }
});
