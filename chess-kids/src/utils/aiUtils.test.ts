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

  it('fails if messages exceed maximum length of 50', () => {
    const messages = Array(51).fill({ role: 'user', content: 'test' });
    expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Too many messages (max 50)' });
  });

  it('fails on invalid message format', () => {
    expect(validateTutorRequest({ messages: ['string'] })).toEqual({ valid: false, error: 'Invalid message format' });
    expect(validateTutorRequest({ messages: [null] })).toEqual({ valid: false, error: 'Invalid message format' });
  });

  it('fails on invalid message role', () => {
    expect(validateTutorRequest({ messages: [{ role: 'admin', content: 'test' }] })).toEqual({ valid: false, error: 'Invalid message role' });
    expect(validateTutorRequest({ messages: [{ role: 123, content: 'test' }] })).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('fails if message content is not a string', () => {
    expect(validateTutorRequest({ messages: [{ role: 'user', content: 123 }] })).toEqual({ valid: false, error: 'Message content must be a string' });
    expect(validateTutorRequest({ messages: [{ role: 'user', content: {} }] })).toEqual({ valid: false, error: 'Message content must be a string' });
  });

  it('fails if message content exceeds 1000 characters', () => {
    const longContent = 'a'.repeat(1001);
    expect(validateTutorRequest({ messages: [{ role: 'user', content: longContent }] })).toEqual({ valid: false, error: 'Message content exceeds maximum length of 1000 characters' });
  });
});
