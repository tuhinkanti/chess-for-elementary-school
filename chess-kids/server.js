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

// --- Shared Logic Duplication (from src/utils/aiUtils.ts) ---

const AI_MODELS = {
    LOCAL: 'qwen3-30b-a3b-2507',
    CLAUDE: 'claude-sonnet-4-20250514',
    GEMINI: 'gemini-2.0-flash',
};

// Simple in-memory rate limiter
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequests = new Map();

function rateLimit(ip) {
    const now = Date.now();
    const requests = ipRequests.get(ip) || [];

    // Filter out old requests
    const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);

    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    recentRequests.push(now);
    ipRequests.set(ip, recentRequests);

    // Lazy cleanup
    if (ipRequests.size > 1000) {
        ipRequests.clear();
    }

    return true;
}

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
                // Continue if code block parse fails
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

function validateTutorRequest(body) {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Invalid request body' };
    }

    const b = body;

    if (!('messages' in b)) {
        return { valid: false, error: 'Messages are required' };
    }

    if (!Array.isArray(b.messages)) {
         return { valid: false, error: 'Messages must be an array' };
    }

    if (b.messages.length === 0) {
        return { valid: false, error: 'Messages cannot be empty' };
    }

    if (b.messages.length > 10) {
        return { valid: false, error: 'Too many messages' };
    }

    for (const msg of b.messages) {
        if (!msg || typeof msg !== 'object') {
            return { valid: false, error: 'Invalid message format' };
        }
        if (!('role' in msg) || !['user', 'assistant', 'system'].includes(msg.role)) {
            return { valid: false, error: 'Invalid message role' };
        }
        if (!('content' in msg) || typeof msg.content !== 'string') {
            return { valid: false, error: 'Invalid message content' };
        }
        if (msg.content.length > 1000) {
            return { valid: false, error: 'Message too long (max 1000 chars)' };
        }
    }

    return { valid: true };
}

// --- End Shared Logic ---

const provider = process.env.AI_PROVIDER || 'local';

function getModel() {
    switch (provider) {
        case 'local':
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio'
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
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        if (!rateLimit(ip)) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }

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
        console.error('AI Tutor API Error:', error?.message || error, error?.stack);

        // Handle quota/rate limit errors from provider
        if (error?.message?.includes('429') || error?.message?.includes('quota')) {
             return res.status(200).json({
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
