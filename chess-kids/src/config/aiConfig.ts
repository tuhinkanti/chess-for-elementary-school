import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

// Centralized AI configuration
export const AI_MODELS = {
    LOCAL: 'local',
    CLAUDE: 'claude',
    GEMINI: 'gemini',
} as const;

export type AIProvider = typeof AI_MODELS[keyof typeof AI_MODELS];

export const MODEL_NAMES = {
    [AI_MODELS.LOCAL]: 'qwen3-30b-a3b-2507',
    [AI_MODELS.CLAUDE]: 'claude-sonnet-4-20250514',
    [AI_MODELS.GEMINI]: 'gemini-2.0-flash',
};

export function getModel(provider: string) {
    switch (provider) {
        case AI_MODELS.LOCAL: {
            // LM Studio runs on port 1234 by default with OpenAI-compatible API
            const lmStudio = createOpenAI({
                baseURL: 'http://localhost:1234/v1',
                apiKey: 'lm-studio' // LM Studio doesn't require a real key
            });
            // Use .chat() to ensure chat completions endpoint is used
            return lmStudio.chat(MODEL_NAMES[AI_MODELS.LOCAL]);
        }
        case AI_MODELS.CLAUDE:
            return anthropic(MODEL_NAMES[AI_MODELS.CLAUDE]);
        case AI_MODELS.GEMINI:
        default:
            return google(MODEL_NAMES[AI_MODELS.GEMINI]);
    }
}
