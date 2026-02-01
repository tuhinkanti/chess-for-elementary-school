import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tutorService, GameContext } from './tutorService';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockReset();
    });

    it('constructs a system prompt correctly with student context', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        // Access private method for testing purpose or trigger via public method
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

        fetchMock.mockResolvedValueOnce({
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
            body: expect.stringContaining('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'),
        }));
    });

    it('handles AI errors gracefully with a fallback', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('handles network errors gracefully', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network Error'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });
});