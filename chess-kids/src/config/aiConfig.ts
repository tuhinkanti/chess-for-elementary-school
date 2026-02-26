export const AI_MODELS = {
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
} as const;

export const DEFAULT_PROVIDER = 'gemini'; // Default fallback
