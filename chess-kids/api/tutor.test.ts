import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './tutor';
import { generateText } from 'ai';

// Mock the ai module
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

// Mock Vercel Request and Response
const mockRequest = (body: any, method = 'POST') => ({
  body,
  method,
} as any);

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Tutor API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 405 if method is not POST', async () => {
    const req = mockRequest({}, 'GET');
    const res = mockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 if messages are missing', async () => {
    const req = mockRequest({}); // No messages
    const res = mockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    // Expect error details from Zod
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid request',
    }));
  });

  it('should return parsed JSON response from AI', async () => {
    const mockAiResponse = {
      message: 'Hello!',
      mood: 'encouraging',
    };
    (generateText as any).mockResolvedValue({
      text: JSON.stringify(mockAiResponse),
    });

    const req = mockRequest({
      messages: [{ role: 'user', content: 'Hi' }],
    });
    const res = mockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAiResponse);
  });

  it('should handle malformed JSON from AI gracefully', async () => {
    const rawText = 'This is not JSON';
    (generateText as any).mockResolvedValue({
      text: rawText,
    });

    const req = mockRequest({
      messages: [{ role: 'user', content: 'Hi' }],
    });
    const res = mockResponse();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: rawText,
      mood: 'encouraging',
    });
  });

  it('should handle errors from AI provider', async () => {
    (generateText as any).mockRejectedValue(new Error('AI Error'));

    const req = mockRequest({
      messages: [{ role: 'user', content: 'Hi' }],
    });
    const res = mockResponse();

    await handler(req, res);

    // Expect 500 for generic errors
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal Server Error',
    }));
  });
});
