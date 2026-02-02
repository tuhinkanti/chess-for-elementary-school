import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService, GameContext } from './tutorService';

describe('TutorService', () => {
    // Mock global fetch
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockReset();
    });

    it('constructs a prompt correctly with student context', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        // Access private method for testing purpose
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prompt = (tutorService as any).constructSystemPrompt(context);

        expect(prompt).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
        expect(prompt).toContain('Learn to move pawns');
        expect(prompt).toContain('Student likes to play fast.');
        expect(prompt).toContain('Grandmaster Gloop');
    });

    it('returns advice from AI correctly', async () => {
        const mockAdvice = {
            message: 'Great job! Try moving your e-pawn forward.',
            mood: 'encouraging',
            highlightSquare: 'e4',
            drawArrow: 'e2-e4',
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
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('systemPrompt')
        }));
    });

    it('truncates long messages', async () => {
        const longMessage = 'a'.repeat(600);

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'ok', mood: 'encouraging' }),
        });

        await tutorService.chat([{ role: 'user', content: longMessage }]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const call = fetchMock.mock.calls[0];
        const body = JSON.parse(call[1].body);

        expect(body.messages[0].content.length).toBe(500);
        expect(body.messages[0].content).toBe('a'.repeat(500));
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
});
