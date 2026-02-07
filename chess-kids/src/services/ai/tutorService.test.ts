import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tutorService, type GameContext } from './tutorService';

// Mock fetch globally
const fetchMock = vi.fn();

describe('TutorService', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', fetchMock);
        vi.clearAllMocks();
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('constructs a prompt correctly with student context', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        // Mock success response
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'ok', mood: 'encouraging' }),
        });

        // Use getAdvice to trigger the fetch call and prompt construction
        await tutorService.getAdvice(context);

        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Inspect the fetch arguments to verify the system prompt
        const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        const prompt = requestBody.systemPrompt;

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
});
