import { describe, it, expect } from 'vitest';
import { extractJson, validateTutorRequest, constructSystemPrompt, GameContext } from './aiUtils';

describe('extractJson', () => {
  it('parses valid JSON string', () => {
    const input = '{"message": "hello"}';
    expect(extractJson(input)).toEqual({ message: 'hello' });
  });

  it('parses JSON inside markdown code block', () => {
    const input = 'Here is the JSON:\n```json\n{"message": "hello"}\n```';
    expect(extractJson(input)).toEqual({ message: 'hello' });
  });

  it('parses JSON inside plain code block', () => {
    const input = 'Here is the JSON:\n```\n{"message": "hello"}\n```';
    expect(extractJson(input)).toEqual({ message: 'hello' });
  });

  it('parses JSON embedded in text without code blocks', () => {
    const input = 'Sure, here is the response: {"message": "hello"} hope that helps!';
    expect(extractJson(input)).toEqual({ message: 'hello' });
  });

  it('returns null for invalid JSON', () => {
    const input = 'This is not JSON';
    expect(extractJson(input)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractJson('')).toBeNull();
  });

  it('handles nested JSON correctly', () => {
    const input = '{"outer": {"inner": "value"}}';
    expect(extractJson(input)).toEqual({ outer: { inner: 'value' } });
  });
});

describe('validateTutorRequest', () => {
  it('validates correct request body with content', () => {
    const body = { messages: [{ role: 'user', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: true });
  });

  it('fails if body is missing', () => {
    expect(validateTutorRequest(null)).toEqual({ valid: false, error: 'Invalid request body' });
    expect(validateTutorRequest(undefined)).toEqual({ valid: false, error: 'Invalid request body' });
  });

  it('fails if messages is missing', () => {
    expect(validateTutorRequest({})).toEqual({ valid: false, error: 'Messages are required' });
  });

  it('fails if messages is not an array', () => {
    expect(validateTutorRequest({ messages: 'not-array' })).toEqual({ valid: false, error: 'Messages must be an array' });
  });

  it('fails if messages array is empty', () => {
    expect(validateTutorRequest({ messages: [] })).toEqual({ valid: false, error: 'Messages cannot be empty' });
  });

  it('validates request with valid context', () => {
    const body = {
        messages: [{ role: 'user', content: 'hi' }],
        context: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR' }
    };
    expect(validateTutorRequest(body)).toEqual({ valid: true });
  });

  it('fails if context is not an object', () => {
    const body = {
        messages: [{ role: 'user', content: 'hi' }],
        context: 'invalid-string-context'
    };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Context must be an object' });
  });
});

describe('constructSystemPrompt', () => {
  it('generates prompt with default objective when no context is provided', () => {
    const prompt = constructSystemPrompt();
    expect(prompt).toContain('Objective: Play a good move');
    expect(prompt).not.toContain('Current Board (FEN)');
    expect(prompt).not.toContain('What You Know About This Student');
  });

  it('includes student context when provided', () => {
    const context: GameContext = {
      fen: '8/8/8/8/8/8/8/8',
      studentContext: 'Loves knights'
    };
    const prompt = constructSystemPrompt(context);
    expect(prompt).toContain('## What You Know About This Student');
    expect(prompt).toContain('Loves knights');
  });

  it('includes board info when provided', () => {
      const context: GameContext = {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
          lastMove: 'e2e4'
      };
      const prompt = constructSystemPrompt(context);
      expect(prompt).toContain('Current Board (FEN): rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
      expect(prompt).toContain('Last Move: e2e4');
  });

  it('includes specific lesson objective when provided', () => {
      const context: GameContext = {
          fen: '8/8/8/8/8/8/8/8',
          lessonObjective: 'Capture the queen'
      };
      const prompt = constructSystemPrompt(context);
      expect(prompt).toContain('Objective: Capture the queen');
  });
});
