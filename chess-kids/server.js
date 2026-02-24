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

// Duplicated from src/config/aiConfig.ts
const AI_MODELS = {
    LOCAL: 'qwen3-30b-a3b-2507',
    CLAUDE: 'claude-sonnet-4-20250514',
    GEMINI: 'gemini-2.0-flash',
};

const AI_CONFIG = {
    LOCAL_BASE_URL: 'http://localhost:1234/v1',
    LOCAL_API_KEY: 'lm-studio',
};

// Duplicated from src/utils/aiUtils.ts
function extractJson(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }

    // 1. Try finding the first '{' and last '}'
    const firstOpen = text.indexOf('{');
    const lastClose = text.lastIndexOf('}');

    if (firstOpen !== -1 && lastClose > firstOpen) {
        const potentialJson = text.substring(firstOpen, lastClose + 1);
        try {
            return JSON.parse(potentialJson);
        } catch {
            // Continue
        }
    }

    // 2. Try parsing a JSON code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
        try {
            return JSON.parse(codeBlockMatch[1]);
        } catch {
            // Continue
        }
    }

    // 3. Try direct parsing
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

function getModel() {
    switch (provider) {
        case 'local':
            const lmStudio = createOpenAI({
                baseURL: AI_CONFIG.LOCAL_BASE_URL,
                apiKey: AI_CONFIG.LOCAL_API_KEY
            });
            return lmStudio.chat(AI_MODELS.LOCAL);
        case 'claude':
            return anthropic(AI_MODELS.CLAUDE);
        case 'gemini':
        default:
            return google(AI_MODELS.GEMINI);
    }
}

app.post('/api/tutor', async (req, res) => {
    try {
        const { messages, systemPrompt } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required and must be an array' });
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

        const parsed = extractJson(text);
        if (parsed) {
            return res.json(parsed);
        }

        return res.json({
            message: text,
            mood: 'encouraging'
        });
    } catch (error) {
        console.error('AI Tutor API Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: error.message
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
