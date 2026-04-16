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

  it('fails if messages array has more than 50 items', () => {
    const body = {
      messages: Array.from({ length: 51 }, () => ({ role: 'user', content: 'test' }))
    };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Too many messages (maximum 50)' });
  });

  it('fails if systemPrompt is not a string', () => {
    const body = { messages: [{ role: 'user', content: 'hi' }], systemPrompt: 123 };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'systemPrompt must be a string' });
  });

  it('fails if systemPrompt is longer than 2000 characters', () => {
    const body = {
      messages: [{ role: 'user', content: 'hi' }],
      systemPrompt: 'a'.repeat(2001)
    };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'systemPrompt exceeds maximum length (2000)' });
  });

  it('fails if a message is missing role', () => {
    const body = { messages: [{ content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid role at message index 0' });
  });

  it('fails if a message has an invalid role', () => {
    const body = { messages: [{ role: 'invalid_role', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid role at message index 0' });
  });

  it('fails if a message is missing content', () => {
    const body = { messages: [{ role: 'user' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid content at message index 0' });
  });

  it('fails if message content is longer than 1000 characters', () => {
    const body = {
      messages: [{ role: 'user', content: 'a'.repeat(1001) }]
    };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Message content exceeds maximum length (1000) at index 0' });
  });
});
