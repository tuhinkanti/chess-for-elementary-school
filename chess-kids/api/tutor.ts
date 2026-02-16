// API Route for AI Tutor - Vercel Serverless Function
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

const provider = process.env.AI_PROVIDER || 'local';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface GameContext {
    fen: string;
    lastMove?: string; // PGN notation or UCI
    lessonObjective?: string;
    studentContext?: string; // Memory-based context about the student
}

function getModel() {
    switch (provider) {
        case 'local': {
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio' // LM Studio doesn't require a real key
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat('qwen3-30b-a3b-2507');
        }
        case 'claude':
            return anthropic('claude-sonnet-4-20250514');
        case 'gemini':
        default:
            return google('gemini-2.0-flash');
    }
}

function constructSystemPrompt(context?: GameContext): string {
    const studentInfo = context?.studentContext
        ? `\n## What You Know About This Student\n${context.studentContext}\n`
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages, context } = req.body as {
            messages?: ChatMessage[];
            context?: GameContext;
        };

        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'Messages are required' });
        }

        // Build the full prompt with system context and conversation history
        const systemMessage = constructSystemPrompt(context);

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
            const parsed = JSON.parse(text);
            return res.status(200).json(parsed);
        } catch {
            // If not valid JSON, wrap the text in a TutorResponse structure
            return res.status(200).json({
                message: text,
                mood: 'encouraging'
            });
        }
    } catch (error: unknown) {
        console.error('AI Tutor API Error:', error);

        const errorMessage = error instanceof Error ? error.message : String(error);

        // Handle quota/rate limit errors
        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
            return res.status(200).json({
                message: "Wow, I've been thinking too much today! My magic brain needs a little rest. Try again in a minute!",
                mood: 'thinking'
            });
        }

        return res.status(200).json({
            message: "I'm having a little trouble thinking right now, but keep trying!",
            mood: 'thinking'
        });
    }
}
