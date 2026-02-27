import { createOpenAI } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { LanguageModel } from 'ai';

export type AIProvider = 'local' | 'claude' | 'gemini';

export const AI_CONFIG = {
  // Default to 'local' if not specified
  provider: (process.env.AI_PROVIDER || 'local') as AIProvider,

  // API Endpoint for frontend
  apiEndpoint: '/api/tutor',

  // Model configurations
  models: {
    local: {
      baseURL: 'http://localhost:1234/v1',
      apiKey: 'lm-studio',
      modelId: 'qwen3-30b-a3b-2507',
    },
    claude: {
      modelId: 'claude-sonnet-4-20250514',
    },
    gemini: {
      modelId: 'gemini-2.0-flash',
    },
  },
};

export function getModel(provider: AIProvider = AI_CONFIG.provider): LanguageModel {
  switch (provider) {
    case 'local': {
      const lmStudio = createOpenAI({
        baseURL: AI_CONFIG.models.local.baseURL,
        apiKey: AI_CONFIG.models.local.apiKey,
      });
      return lmStudio.chat(AI_CONFIG.models.local.modelId);
    }
    case 'claude':
      return anthropic(AI_CONFIG.models.claude.modelId);
    case 'gemini':
    default:
      return google(AI_CONFIG.models.gemini.modelId);
  }
}
