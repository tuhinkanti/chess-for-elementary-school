import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tutor';
import { generateText } from 'ai';

// Mock the ai package
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: '{"message": "Hello", "mood": "encouraging"}' }),
}));

vi.mock('@ai-sdk/openai', () => ({ createOpenAI: vi.fn(() => ({ chat: vi.fn() })) }));
vi.mock('@ai-sdk/google', () => ({ google: vi.fn() }));
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: vi.fn() }));

describe('Tutor API Handler', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        req = {
            method: 'POST',
            body: {}
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        vi.clearAllMocks();
    });

    it('should return 400 if messages are missing', async () => {
        req.body = {};
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Messages are required') }));
    });

    it('should return 400 if messages is not an array', async () => {
        req.body = { messages: 'not an array' };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('must be an array') }));
    });

    it('should return 400 if too many messages', async () => {
        req.body = { messages: Array(51).fill({ role: 'user', content: 'hi' }) };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Too many messages') }));
    });

    it('should return 400 if message content is too long', async () => {
        req.body = { messages: [{ role: 'user', content: 'a'.repeat(1001) }] };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Message content too long') }));
    });

    it('should return 400 if message role is invalid', async () => {
        req.body = { messages: [{ role: 'bad-role', content: 'hi' }] };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid message role') }));
    });

    it('should return 400 if system prompt is too long', async () => {
        req.body = {
            messages: [{ role: 'user', content: 'hi' }],
            systemPrompt: 'a'.repeat(2001)
        };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('System prompt invalid or too long') }));
    });

    it('should proceed and call generateText if request is valid', async () => {
        req.body = { messages: [{ role: 'user', content: 'hi' }] };
        await handler(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(generateText).toHaveBeenCalled();
    });
});
