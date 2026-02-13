import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tutor';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({ text: '{"message": "hello", "mood": "encouraging"}' })
}));

// Mock process.env
vi.stubGlobal('process', {
    ...process,
    env: { ...process.env, AI_PROVIDER: 'local' }
});


describe('API Handler', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let req: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let res: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      method: 'POST',
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  it('should reject non-POST requests', async () => {
    req.method = 'GET';
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('should require messages', async () => {
    req.body = {};
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Messages are required' });
  });

  it('should use context to construct system prompt', async () => {
    req.body = {
      messages: [{ role: 'user', content: 'Hi' }],
      context: {
        fen: 'start',
        studentContext: 'Student context here',
        lessonObjective: 'Learn basic moves'
      }
    };

    // We can spy on generateText to verify the system message
    const { generateText } = await import('ai');

    await handler(req, res);

    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('Student context here')
        }),
        expect.objectContaining({
          role: 'system',
          content: expect.stringContaining('Learn basic moves')
        })
      ])
    }));
  });
});
