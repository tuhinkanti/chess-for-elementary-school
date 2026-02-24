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

  it('validates request with context', () => {
    const body = {
        messages: [{ role: 'user', content: 'hi' }],
        context: { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }
    };
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
});

describe('constructSystemPrompt', () => {
    it('generates prompt with default objective when context is undefined', () => {
        const prompt = constructSystemPrompt();
        expect(prompt).toContain('You are Grandmaster Gloop');
        expect(prompt).toContain('Objective: Play a good move');
        expect(prompt).not.toContain('Current Board (FEN)');
        expect(prompt).not.toContain('## What You Know About This Student');
    });

    it('includes board info when context has FEN', () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
            lastMove: 'e2-e4'
        };
        const prompt = constructSystemPrompt(context);
        expect(prompt).toContain('Current Board (FEN): rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
        expect(prompt).toContain('Last Move: e2-e4');
    });

    it('includes student context when provided', () => {
        const context: GameContext = {
            fen: 'start',
            studentContext: 'Student struggles with knights.'
        };
        const prompt = constructSystemPrompt(context);
        expect(prompt).toContain('## What You Know About This Student');
        expect(prompt).toContain('Student struggles with knights.');
    });

    it('includes lesson objective when provided', () => {
        const context: GameContext = {
            fen: 'start',
            lessonObjective: 'Capture the pawn'
        };
        const prompt = constructSystemPrompt(context);
        expect(prompt).toContain('Objective: Capture the pawn');
    });
});
