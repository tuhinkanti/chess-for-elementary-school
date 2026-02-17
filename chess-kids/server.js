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

function getModel() {
    switch (provider) {
        case 'local':
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

app.post('/api/tutor', async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;

        // Security: Input Validation
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages must be a non-empty array' });
        }

        // Validate message content to prevent abuse
        if (messages.length > 50) {
            return res.status(400).json({ error: 'Too many messages in history' });
        }

        for (const msg of messages) {
            if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
                return res.status(400).json({ error: 'Invalid message role' });
            }
            if (!msg.content || typeof msg.content !== 'string') {
                return res.status(400).json({ error: 'Message content must be a string' });
            }
            if (msg.content.length > 1000) {
                return res.status(400).json({ error: 'Message content too long (max 1000 chars)' });
            }
        }

        if (systemPrompt && (typeof systemPrompt !== 'string' || systemPrompt.length > 2000)) {
            return res.status(400).json({ error: 'Invalid system prompt' });
        }

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

        try {
            const parsed = JSON.parse(text);
            return res.json(parsed);
        } catch {
            return res.json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error) {
        console.error('AI Tutor API Error:', error);
        return res.json({
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
