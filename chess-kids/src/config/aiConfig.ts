import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { LanguageModel } from 'ai';

export const AI_PROVIDER = process.env.AI_PROVIDER || 'local';

export function getModel(provider: string = AI_PROVIDER): LanguageModel {
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
