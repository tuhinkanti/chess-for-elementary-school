import { describe, it, expect } from 'vitest';
import { extractJson, validateTutorRequest } from './aiUtils';

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
    // Zod error for null input is specific
    const result = validateTutorRequest(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Expected object, received null');

    const result2 = validateTutorRequest(undefined);
    expect(result2.valid).toBe(false);
    // undefined might result in "Required" at root or similar
    expect(result2.error).toBeTruthy();
  });

  it('fails if messages is missing', () => {
    const result = validateTutorRequest({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain('messages: Required');
  });

  it('fails if messages is not an array', () => {
    const result = validateTutorRequest({ messages: 'not-array' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('messages: Expected array');
  });

  it('fails if messages array is empty', () => {
    const result = validateTutorRequest({ messages: [] });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Messages cannot be empty');
  });
});
