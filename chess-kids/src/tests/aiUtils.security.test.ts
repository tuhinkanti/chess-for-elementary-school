import { describe, it, expect } from 'vitest';
import { validateTutorRequest } from '../utils/aiUtils';

describe('validateTutorRequest Security Constraints', () => {
    it('should reject requests with more than 50 messages', () => {
        const messages = Array(51).fill({ role: 'user', content: 'test message' });
        const request = { messages };

        const result = validateTutorRequest(request);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Too many messages');
    });

    it('should reject messages with an invalid role', () => {
        const request = {
            messages: [{ role: 'admin', content: 'hello' }]
        };

        const result = validateTutorRequest(request);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid message role');
    });

    it('should reject messages where role is not a string', () => {
        const request = {
            messages: [{ role: 123, content: 'hello' }]
        };

        const result = validateTutorRequest(request);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid message role');
    });

    it('should reject messages where content is not a string', () => {
        const request = {
            messages: [{ role: 'user', content: { text: 'hello' } }]
        };

        const result = validateTutorRequest(request);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Message content must be a string');
    });

    it('should reject messages with content longer than 1000 characters', () => {
        const request = {
            messages: [{ role: 'user', content: 'A'.repeat(1001) }]
        };

        const result = validateTutorRequest(request);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Message content exceeds maximum length');
    });

    it('should accept valid requests', () => {
        const request = {
            messages: [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi there' }
            ]
        };

        const result = validateTutorRequest(request);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
    });
});
