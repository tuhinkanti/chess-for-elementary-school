// Local development server for AI tutor API
// Run with: node server.js (or npm run server)

import express from 'express';
import cors from 'cors';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import dotenv from 'dotenv';
import { AI_MODELS } from './src/config/aiConfig.js';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const provider = process.env.AI_PROVIDER || 'local';

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute
const requestCounts = new Map();

function getModel() {
    switch (provider) {
        case 'local':
            const lmStudio = createOpenAI({
                baseURL: AI_MODELS.local.baseURL,
                apiKey: AI_MODELS.local.apiKey
            });
            return lmStudio.chat(AI_MODELS.local.modelId);
        case 'claude':
            return anthropic(AI_MODELS.claude.modelId);
        case 'gemini':
        default:
            return google(AI_MODELS.gemini.modelId);
    }
}

// Validation Utility (Duplicated from src/utils/aiUtils.ts)
function validateTutorRequest(body) {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Invalid request body' };
    }
    if (!('messages' in body)) {
        return { valid: false, error: 'Messages are required' };
    }
    if (!Array.isArray(body.messages)) {
         return { valid: false, error: 'Messages must be an array' };
    }
    if (body.messages.length === 0) {
        return { valid: false, error: 'Messages cannot be empty' };
    }
    return { valid: true };
}

// JSON Extraction Utility (Duplicated from src/utils/aiUtils.ts)
function extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    try {
        return JSON.parse(text);
    } catch {
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch {}
        }
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose > firstOpen) {
            try {
                return JSON.parse(text.substring(firstOpen, lastClose + 1));
            } catch {}
        }
        return null;
    }
}

app.post('/api/tutor', async (req, res) => {
    // Rate Limiting
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (Array.isArray(ip)) ip = ip[0];

    const now = Date.now();
    const limitData = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > limitData.resetTime) {
        limitData.count = 0;
        limitData.resetTime = now + RATE_LIMIT_WINDOW;
    }

    if (limitData.count >= MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    limitData.count++;
    requestCounts.set(ip, limitData);

    try {
        const validation = validateTutorRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { messages, systemPrompt } = req.body;

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
