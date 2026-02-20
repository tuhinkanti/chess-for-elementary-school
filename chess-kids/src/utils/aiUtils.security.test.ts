import { describe, it, expect } from 'vitest';
import { validateTutorRequest } from './aiUtils';

describe('validateTutorRequest Security', () => {
    it('fails if messages length exceeds limit', () => {
        const messages = Array(51).fill({ role: 'user', content: 'hi' });
        expect(validateTutorRequest({ messages })).toEqual({ valid: false, error: 'Too many messages (max 50)' });
    });

    it('fails if systemPrompt is too long', () => {
        const longPrompt = 'a'.repeat(5001);
        expect(validateTutorRequest({ messages: [{ role: 'user', content: 'hi' }], systemPrompt: longPrompt })).toEqual({ valid: false, error: 'System prompt too long (max 5000 chars)' });
    });

    it('fails if message content is too long', () => {
        const longContent = 'a'.repeat(1001);
        expect(validateTutorRequest({ messages: [{ role: 'user', content: longContent }] })).toEqual({ valid: false, error: 'Message content too long (max 1000 chars)' });
    });

    it('fails if message role is invalid', () => {
        expect(validateTutorRequest({ messages: [{ role: 'hacker', content: 'hi' }] })).toEqual({ valid: false, error: 'Invalid role (must be user or assistant)' });
    });

    it('fails if message is missing content', () => {
        expect(validateTutorRequest({ messages: [{ role: 'user' }] })).toEqual({ valid: false, error: 'Messages must have role and content' });
    });
});
