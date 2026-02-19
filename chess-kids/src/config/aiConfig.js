/**
 * AI Model Configuration
 *
 * Shared configuration for both Vercel API and local server.
 * Defines model identifiers for supported providers.
 */

export const AI_MODELS = {
    local: {
        modelId: 'qwen3-30b-a3b-2507',
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'lm-studio'
    },
    claude: {
        modelId: 'claude-sonnet-4-20250514'
    },
    gemini: {
        modelId: 'gemini-2.0-flash'
    }
};
