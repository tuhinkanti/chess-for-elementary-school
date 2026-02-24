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
    const res1 = validateTutorRequest(null);
    expect(res1.valid).toBe(false);
    expect(res1.error).toBeDefined();

    const res2 = validateTutorRequest(undefined);
    expect(res2.valid).toBe(false);
    expect(res2.error).toBeDefined();
  });

  it('fails if messages is missing', () => {
    const res = validateTutorRequest({});
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Required|expected array/i);
  });

  it('fails if messages is not an array', () => {
    const res = validateTutorRequest({ messages: 'not-array' });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/expected array/i);
  });

  it('fails if messages array is empty', () => {
    const res = validateTutorRequest({ messages: [] });
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Messages cannot be empty');
  });
});
