
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './tutor';

// Mock AI SDK modules
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: '{"message": "Test response", "mood": "encouraging"}' }),
}));

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    chat: vi.fn(),
  })),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(),
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(),
}));

describe('API Tutor Handler', () => {
  let req: Partial<VercelRequest>;
  let res: Partial<VercelResponse>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));

    req = {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: 'Hello' }],
      },
    };

    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should process valid request successfully', async () => {
    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Test response',
      mood: 'encouraging',
    }));
  });

  it('should reject request without messages', async () => {
    req.body = {};
    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Messages are required',
    }));
  });

  it('should reject request with too many messages (Limit: 50)', async () => {
    const manyMessages = Array(51).fill({ role: 'user', content: 'hi' });
    req.body = { messages: manyMessages };

    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Too many messages (max 50)',
    }));
  });

  it('should reject request with extremely long message content (Limit: 1000)', async () => {
    const longContent = 'a'.repeat(1001);
    req.body = { messages: [{ role: 'user', content: longContent }] };

    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Message content too long (max 1000 chars)',
    }));
  });

  it('should reject request with extremely long system prompt (Limit: 2000)', async () => {
    const longPrompt = 'a'.repeat(2001);
    req.body = {
      messages: [{ role: 'user', content: 'hi' }],
      systemPrompt: longPrompt
    };

    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'System prompt too long (max 2000 chars)',
    }));
  });

  it('should reject request with invalid message structure', async () => {
    req.body = {
      messages: [{ invalid: 'structure' }]
    };

    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid message format',
    }));
  });

  it('should reject non-POST requests', async () => {
    req.method = 'GET';
    await handler(req as VercelRequest, res as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(405);
  });
});
