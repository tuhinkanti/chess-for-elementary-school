import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tutorService, type GameContext, type ChatMessage } from './tutorService';

describe('TutorService', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('constructs a prompt correctly with student context (verified via API call)', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'test', mood: 'encouraging' }),
        });

        await tutorService.getAdvice(context);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const callArgs = fetchMock.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        const prompt = body.systemPrompt;

        expect(prompt).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        expect(prompt).toContain('Learn to move pawns');
        expect(prompt).toContain('Student likes to play fast.');
        expect(prompt).toContain('Grandmaster Gloop');
    });

    it('returns advice from AI correctly', async () => {
        const mockAdvice = {
            message: 'Great job! Try moving your e-pawn forward.',
            mood: 'encouraging' as const,
        };

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockAdvice,
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice).toEqual(mockAdvice);
        expect(fetchMock).toHaveBeenCalledWith('/api/tutor', expect.anything());
    });

    it('handles AI errors gracefully with a fallback', async () => {
        fetchMock.mockRejectedValue(new Error('API Failure'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('handles invalid JSON from AI gracefully', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => { throw new Error('Invalid JSON'); },
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('truncates messages that exceed MAX_MESSAGE_LENGTH', async () => {
        const longMessage = 'a'.repeat(600);
        const messages: ChatMessage[] = [{ role: 'user', content: longMessage }];

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'response', mood: 'thinking' }),
        });

        await tutorService.chat(messages);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const callArgs = fetchMock.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        const sentContent = body.messages[0].content;

        expect(sentContent.length).toBe(500);
        expect(sentContent).toBe('a'.repeat(500));
    });
});
