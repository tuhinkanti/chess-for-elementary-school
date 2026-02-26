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

// Validation Schemas (Duplicated from src/utils/aiUtils.ts)
const GameContextSchema = z.object({
    fen: z.string(),
    lastMove: z.string().optional(),
    lessonObjective: z.string().optional(),
    studentContext: z.string().optional(),
});

const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
});

const TutorRequestSchema = z.object({
    messages: z.array(ChatMessageSchema).min(1),
    context: GameContextSchema.optional(),
});

// Utility Functions (Duplicated from src/utils/aiUtils.ts)
function truncateContext(context, maxLength = 2000) {
    if (context.length <= maxLength) return context;
    return context.substring(0, maxLength) + '... (truncated)';
}

function constructSystemPrompt(context) {
    const safeStudentContext = context?.studentContext
        ? truncateContext(context.studentContext)
        : '';

    const studentInfo = safeStudentContext
        ? `\n## What You Know About This Student\n${safeStudentContext}\n`
        : '';

    const boardInfo = context?.fen
        ? `\nCurrent Board (FEN): ${context.fen}\nLast Move: ${context.lastMove || "None"}`
        : '';

    return `
You are Grandmaster Gloop, a friendly, magical chess tutor for a 7-year-old.
${studentInfo}
Goal: Help the student with their current lesson in a fun, encouraging way.
Objective: ${context?.lessonObjective || "Play a good move"}
${boardInfo}

Instructions:
1. Be encouraging, concise, and use simple words.
2. If the user made a mistake, explain WHY plainly (no complex notation).
3. Reference what you know about the student's strengths and struggles if relevant.
4. Keep responses SHORT - 1-3 sentences max for young learners.
5. Identify NEW facts about the student based on this interaction (e.g., "Student struggles with knights", "Student likes visual hints") and include them in 'learnedFacts'.
6. Always respond with valid JSON.

Response format:
{
  "message": string (your friendly response),
  "mood": "encouraging" | "thinking" | "surprised" | "celebrating",
  "highlightSquare": string (optional),
  "drawArrow": string (optional "e2-e4"),
  "learnedFacts": string[] (optional list of new observations)
}
    `.trim();
}

function extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    try {
        return JSON.parse(text);
    } catch {
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            try { return JSON.parse(codeBlockMatch[1]); } catch {}
        }
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose > firstOpen) {
            try { return JSON.parse(text.substring(firstOpen, lastClose + 1)); } catch {}
        }
        return null;
    }
}

// AI Configuration (Duplicated/Inlined for server.js simplicity)
const AI_MODELS = {
    local: {
        model: 'qwen3-30b-a3b-2507',
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'lm-studio'
    },
    claude: {
        model: 'claude-sonnet-4-20250514'
    },
    gemini: {
        model: 'gemini-2.0-flash'
    }
};

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

app.post('/api/tutor', async (req, res) => {
    try {
        const result = TutorRequestSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.errors.map(e => e.message).join(', ') });
        }

        const { messages, context } = result.data;

        // Security: Construct system prompt on server
        const systemMessage = constructSystemPrompt(context);

        // Security: Filter out any client-supplied 'system' messages
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
});

app.listen(PORT, () => {
    console.log(`🎓 Grandmaster Gloop API running on http://localhost:${PORT}`);
    console.log(`   AI Provider: ${provider}`);
    if (provider === 'local') {
        console.log(`   Make sure LM Studio is running on http://localhost:1234`);
    }
});
