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

  it('fails if a message has an invalid role', () => {
    const body = { messages: [{ role: 'hacker', content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if a message role is missing', () => {
    const body = { messages: [{ content: 'hi' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if a message content is not a string', () => {
    const body = { messages: [{ role: 'user', content: 123 }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Message content must be a string' });
  });

  it('fails if a message content is missing', () => {
    const body = { messages: [{ role: 'user' }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Message content must be a string' });
  });

  it('fails if a message content exceeds 1000 characters', () => {
    const longContent = 'a'.repeat(1001);
    const body = { messages: [{ role: 'user', content: longContent }] };
    expect(validateTutorRequest(body)).toEqual({ valid: false, error: 'Message content exceeds maximum length of 1000 characters' });
  });

  it('validates correct request body with system and assistant roles', () => {
    const body = { messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' }
    ] };
    expect(validateTutorRequest(body)).toEqual({ valid: true });
  });
});
