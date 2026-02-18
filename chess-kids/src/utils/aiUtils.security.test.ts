import { describe, it, expect } from 'vitest';
import { validateTutorRequest } from './aiUtils';

describe('validateTutorRequest Security', () => {
    it('fails when messages array is too long', () => {
        const messages = Array(51).fill({ role: 'user', content: 'hello' });
        const result = validateTutorRequest({ messages });
        expect(result).toEqual({ valid: false, error: 'Too many messages (max 50)' });
    });

    it('fails when message content is too long', () => {
        const longContent = 'a'.repeat(1001);
        const messages = [{ role: 'user', content: longContent }];
        const result = validateTutorRequest({ messages });
        expect(result).toEqual({ valid: false, error: 'Message content too long (max 1000 chars)' });
    });

    it('fails when message has invalid role', () => {
        const messages = [{ role: 'admin', content: 'hello' }];
        const result = validateTutorRequest({ messages });
        expect(result).toEqual({ valid: false, error: 'Invalid message role' });
    });

    it('fails when systemPrompt is too long', () => {
        const systemPrompt = 'a'.repeat(5001);
        const messages = [{ role: 'user', content: 'hello' }];
        const result = validateTutorRequest({ messages, systemPrompt });
        expect(result).toEqual({ valid: false, error: 'System prompt too long (max 5000 chars)' });
    });

    it('fails when messages is not an array', () => {
        const result = validateTutorRequest({ messages: 'not-an-array' });
        expect(result).toEqual({ valid: false, error: 'Messages must be an array' });
    });

    it('fails when message is not an object', () => {
        const messages = ['string-msg'];
        const result = validateTutorRequest({ messages });
        expect(result).toEqual({ valid: false, error: 'Invalid message format' });
    });

    it('fails when message is null', () => {
        const messages = [null];
        const result = validateTutorRequest({ messages });
        expect(result).toEqual({ valid: false, error: 'Invalid message format' });
    });

    it('passes with valid input', () => {
        const messages = [{ role: 'user', content: 'hello' }];
        const result = validateTutorRequest({ messages });
        expect(result).toEqual({ valid: true });
    });
});
