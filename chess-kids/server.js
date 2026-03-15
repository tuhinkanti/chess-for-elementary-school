// Local development server for AI tutor API
// Run with: node server.js (or npm run server)

import express from 'express';
import cors from 'cors';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import dotenv from 'dotenv';
import { constructSystemPrompt, validateTutorRequest } from './src/utils/aiUtils.js';

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
        const validation = validateTutorRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { messages, context } = req.body;

        // Build the full prompt with system context and conversation history securely on the server
        const systemMessage = constructSystemPrompt(context);

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
