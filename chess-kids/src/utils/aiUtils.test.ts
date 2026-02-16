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

  it('validates correct systemPrompt', () => {
    const body = { systemPrompt: 'Be a wizard', messages: [{ role: 'user', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: true });
  });

  it('fails if body is missing', () => {
    expect(validateTutorRequest(null)).toEqual({ valid: false, error: 'Invalid request body' });
    expect(validateTutorRequest(undefined)).toEqual({ valid: false, error: 'Invalid request body' });
  });

  it('fails if systemPrompt is not a string', () => {
    const body = { systemPrompt: 123, messages: [{ role: 'user', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'systemPrompt must be a string' });
  });

  it('fails if systemPrompt is too long', () => {
    const longPrompt = 'a'.repeat(5001);
    const body = { systemPrompt: longPrompt, messages: [{ role: 'user', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'systemPrompt is too long (max 5000 chars)' });
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

  it('fails if too many messages', () => {
    const messages = Array(11).fill({ role: 'user', content: 'hi' });
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Too many messages (max 10)' });
  });

  it('fails if message is not an object', () => {
    expect(validateTutorRequest({ messages: ['string'] })).toEqual({ valid: false, error: 'Each message must be an object' });
  });

  it('fails if message role is missing', () => {
    expect(validateTutorRequest({ messages: [{ content: 'hi' }] })).toEqual({ valid: false, error: 'Message role is required and must be a string' });
  });

  it('fails if message role is invalid', () => {
    expect(validateTutorRequest({ messages: [{ role: 'bad', content: 'hi' }] })).toEqual({ valid: false, error: "Invalid role: bad. Must be 'user' or 'assistant'" });
  });

  it('fails if message role is system (client should not send system)', () => {
      // In the new validation logic, we explicitly allow only 'user' and 'assistant'
    expect(validateTutorRequest({ messages: [{ role: 'system', content: 'hi' }] })).toEqual({ valid: false, error: "Invalid role: system. Must be 'user' or 'assistant'" });
  });

  it('fails if message content is missing', () => {
    expect(validateTutorRequest({ messages: [{ role: 'user' }] })).toEqual({ valid: false, error: 'Message content is required and must be a string' });
  });

  it('fails if message content is not a string', () => {
    expect(validateTutorRequest({ messages: [{ role: 'user', content: 123 }] })).toEqual({ valid: false, error: 'Message content is required and must be a string' });
  });

  it('fails if message content is too long', () => {
    const longContent = 'a'.repeat(1001);
    expect(validateTutorRequest({ messages: [{ role: 'user', content: longContent }] })).toEqual({ valid: false, error: 'Message content is too long (max 1000 chars)' });
  });
});
