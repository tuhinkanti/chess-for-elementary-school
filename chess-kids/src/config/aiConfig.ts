
export const AI_MODELS = {
    LOCAL: 'qwen3-30b-a3b-2507',
    CLAUDE: 'claude-sonnet-4-20250514',
    GEMINI: 'gemini-2.0-flash',
};

export const AI_CONFIG = {
    LOCAL_BASE_URL: 'http://localhost:1234/v1',
    LOCAL_API_KEY: 'lm-studio',
};

export const API_ENDPOINT = import.meta.env?.VITE_API_ENDPOINT || '/api/tutor';
