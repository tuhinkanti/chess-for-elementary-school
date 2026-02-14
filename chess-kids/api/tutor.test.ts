import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tutor';
import { generateText } from 'ai';

// Mock dependencies
vi.mock('ai', () => ({
  generateText: vi.fn()
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({ chat: vi.fn() }))
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn()
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn()
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
            headers: {},
            socket: { remoteAddress: '127.0.0.1' }
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
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

    it('should handle successful AI response with valid JSON', async () => {
        const mockResponse = { message: 'Hello!', mood: 'encouraging' };
        vi.mocked(generateText).mockResolvedValue({ text: JSON.stringify(mockResponse) } as any);

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should extract JSON from markdown block', async () => {
        const mockResponse = { message: 'Hello!', mood: 'encouraging' };
        vi.mocked(generateText).mockResolvedValue({
            text: "Here is the JSON:\n```json\n" + JSON.stringify(mockResponse) + "\n```"
        } as any);

        await handler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle rate limiting', async () => {
        // Change IP to avoid conflict with previous tests (though beforeEach clears mocks, rateLimit map is global in module scope)
        // Rate limit map is module-level variable in tutor.ts. It persists across tests in the same worker unless reset.
        // We can't easily reset it without exporting a reset function or reloading module.
        // Easier hack: use a unique IP for this test.
        req.socket.remoteAddress = '192.168.1.100';

        // We need to trigger rate limit. Mock function allows MAX_REQUESTS = 10 per IP per minute.
        // We call it 11 times.
        vi.mocked(generateText).mockResolvedValue({ text: '{}' } as any);

        for (let i = 0; i < 11; i++) {
            await handler(req, res);
        }
        expect(res.status).toHaveBeenCalledWith(429);
    });
});
