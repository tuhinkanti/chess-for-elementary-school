import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tutor';

// Mock dependencies
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: JSON.stringify({ message: 'Hello', mood: 'encouraging' }) }),
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

describe('API Tutor Handler Rate Limiting', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        req = {
            method: 'POST',
            body: {
                messages: [{ role: 'user', content: 'Hi' }]
            },
            headers: {
                'x-forwarded-for': '127.0.0.1' // Default IP
            },
            socket: {}
        };

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
    });

    it('should allow requests under the limit', async () => {
        // Make fewer than 20 requests
        const ip = '10.0.0.1';
        req.headers['x-forwarded-for'] = ip;

        for (let i = 0; i < 5; i++) {
             await handler(req, res);
             expect(res.status).toHaveBeenCalledWith(200);
             vi.clearAllMocks(); // Clear for next iteration
        }
    });

    it('should block requests over the limit', async () => {
        const ip = '1.2.3.4';
        req.headers['x-forwarded-for'] = ip;

        // Exhaust limit (20)
        for (let i = 0; i < 20; i++) {
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            vi.clearAllMocks();
        }

        // Next one should fail
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Too many requests')
        }));
    });

    it('should handle different IPs separately', async () => {
        // IP 1 exhausts limit
        req.headers['x-forwarded-for'] = '5.5.5.5';
        for (let i = 0; i < 20; i++) {
            await handler(req, res);
        }
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(429);

        // IP 2 should still be allowed
        vi.clearAllMocks();
        req.headers['x-forwarded-for'] = '6.6.6.6';
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
