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

  it('fails if systemPrompt is not a string', () => {
    const body = { systemPrompt: 123, messages: [{ role: 'user', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'System prompt must be a string' });
  });

  it('fails if systemPrompt exceeds 2000 characters', () => {
    const body = { systemPrompt: 'a'.repeat(2001), messages: [{ role: 'user', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'System prompt exceeds maximum length of 2000 characters' });
  });

  it('fails if messages length exceeds 50', () => {
    const messages = Array.from({ length: 51 }, () => ({ role: 'user', content: 'hi' }));
    const body = { messages };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Too many messages' });
  });

  it('fails if message is not an object', () => {
    const body = { messages: ['not-an-object'] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message format' });
  });

  it('fails if message role is missing', () => {
    const body = { messages: [{ content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if message role is not a string', () => {
    const body = { messages: [{ role: 123, content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if message role is invalid', () => {
    const body = { messages: [{ role: 'invalid-role', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if message content is missing', () => {
    const body = { messages: [{ role: 'user' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message content' });
  });

  it('fails if message content is not a string', () => {
    const body = { messages: [{ role: 'user', content: 123 }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message content' });
  });

  it('fails if message content exceeds 1000 characters', () => {
    const body = { messages: [{ role: 'user', content: 'a'.repeat(1001) }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Message content exceeds maximum length of 1000 characters' });
  });
});
