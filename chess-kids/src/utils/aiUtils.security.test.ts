import { describe, it, expect } from 'vitest';
import { validateTutorRequest } from './aiUtils';

describe('validateTutorRequest Security Tests', () => {
  it('should reject requests with too many messages (DoS prevention)', () => {
    const manyMessages = Array(100).fill({ role: 'user', content: 'hello' });
    const result = validateTutorRequest({ messages: manyMessages });
    // Currently this passes, but we want it to fail
    expect(result).toEqual({ valid: false, error: 'Too many messages' });
  });

  it('should reject messages with extremely long content (DoS prevention)', () => {
    const longContent = 'a'.repeat(5000);
    const result = validateTutorRequest({ messages: [{ role: 'user', content: longContent }] });
    // Currently this passes, but we want it to fail
    expect(result).toEqual({ valid: false, error: 'Message content too long' });
  });

  it('should reject messages with invalid roles', () => {
    const result = validateTutorRequest({ messages: [{ role: 'admin', content: 'hello' }] });
    // Currently this passes, but we want it to fail
    expect(result).toEqual({ valid: false, error: 'Invalid message role' });
  });

  it('should reject messages with non-string content', () => {
    const result = validateTutorRequest({ messages: [{ role: 'user', content: 123 }] });
    // Currently this passes, but we want it to fail
    expect(result).toEqual({ valid: false, error: 'Message content must be a string' });
  });

  it('should reject messages with missing content', () => {
      const result = validateTutorRequest({ messages: [{ role: 'user' }] });
      expect(result).toEqual({ valid: false, error: 'Message content is required' });
  });
});
