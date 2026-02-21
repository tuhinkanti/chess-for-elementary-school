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

  // New Tests
  it('fails if messages exceed limit', () => {
    const messages = Array(51).fill({ role: 'user', content: 'hi' });
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Too many messages (max 50)' });
  });

  it('fails if message content is too long', () => {
    const longContent = 'a'.repeat(1001);
    const messages = [{ role: 'user', content: longContent }];
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Message too long (max 1000 chars)' });
  });

  it('fails if message role is invalid', () => {
    const messages = [{ role: 'admin', content: 'hi' }];
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if message is missing role', () => {
    const messages = [{ content: 'hi' }];
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if message is missing content', () => {
    const messages = [{ role: 'user' }];
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Invalid message content' });
  });

  it('fails if systemPrompt is too long', () => {
    const longPrompt = 'a'.repeat(5001);
    const messages = [{ role: 'user', content: 'hi' }];
    expect(validateTutorRequest({ messages, systemPrompt: longPrompt })).toEqual({ valid: false, error: 'System prompt too long (max 5000 chars)' });
  });

  it('fails if systemPrompt is not a string', () => {
    const messages = [{ role: 'user', content: 'hi' }];
    expect(validateTutorRequest({ messages, systemPrompt: 123 })).toEqual({ valid: false, error: 'Invalid systemPrompt format' });
  });
});
