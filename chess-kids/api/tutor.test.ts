import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tutor';
import { generateText } from 'ai';

// Mock dependencies
vi.mock('ai', () => ({
    generateText: vi.fn(),
}));

vi.mock('@ai-sdk/openai', () => ({
    createOpenAI: vi.fn().mockReturnValue({ chat: vi.fn() }),
}));

vi.mock('@ai-sdk/google', () => ({
    google: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
    anthropic: vi.fn(),
}));

describe('Tutor API Handler', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        vi.clearAllMocks();

        req = {
            method: 'POST',
            body: {
                messages: [{ role: 'user', content: 'Hello' }]
            },
            headers: {
                'x-forwarded-for': '127.0.0.1'
            },
            socket: {
                remoteAddress: '127.0.0.1'
            }
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
    });

    it('should return 405 for non-POST requests', async () => {
        req.method = 'GET';
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(405);
    });

    it('should return 400 for invalid body', async () => {
        req.body = {}; // Missing messages
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should extract JSON from markdown code block', async () => {
        const mockResponse = {
            text: 'Here is the JSON:\n```json\n{"message": "Hello!", "mood": "encouraging"}\n```'
        };
        (generateText as any).mockResolvedValue(mockResponse);

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Hello!",
            mood: "encouraging"
        }));
    });

    it('should handle rate limiting', async () => {
        req.headers['x-forwarded-for'] = '10.0.0.1';

        // 10 allowed requests
        for (let i = 0; i < 10; i++) {
            await handler(req, res);
        }

        // 11th request should fail
        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(429);
    });
});
