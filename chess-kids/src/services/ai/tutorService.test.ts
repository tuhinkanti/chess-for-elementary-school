import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { tutorService, type GameContext } from './tutorService';

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch
        global.fetch = vi.fn();
    });

    it('sends context correctly to the API', async () => {
        const mockAdvice = {
            message: 'Great job!',
            mood: 'encouraging' as const,
        };

        (global.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockAdvice,
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        await tutorService.getAdvice(context);

        expect(global.fetch).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"fen":"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"'),
        }));

        const callArgs = (global.fetch as Mock).mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);

        expect(requestBody.context).toEqual(context);
        expect(requestBody.systemPrompt).toBeUndefined();
    });

    it('returns advice from AI correctly', async () => {
        const mockAdvice = {
            message: 'Great job! Try moving your e-pawn forward.',
            mood: 'encouraging' as const,
        };

        (global.fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => mockAdvice,
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice).toEqual(mockAdvice);
        expect(global.fetch).toHaveBeenCalledWith('/api/tutor', expect.anything());
    });

    it('handles AI errors gracefully with a fallback', async () => {
        (global.fetch as Mock).mockRejectedValue(new Error('API Failure'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('handles invalid JSON from AI gracefully', async () => {
        (global.fetch as Mock).mockResolvedValue({
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
