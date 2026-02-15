import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService, type GameContext } from './tutorService';

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch
        global.fetch = vi.fn();
    });

    it('returns advice from AI correctly and sends context', async () => {
        const mockAdvice = {
            message: 'Great job! Try moving your e-pawn forward.',
            mood: 'encouraging' as const,
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockAdvice,
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice).toEqual(mockAdvice);

        // Verify that context is sent instead of systemPrompt
        expect(global.fetch).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"context":'),
        }));

        // Verify specific context fields are in the body
        const callArgs = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        expect(body.context).toEqual(context);
        expect(body.systemPrompt).toBeUndefined();
    });

    it('handles AI errors gracefully with a fallback', async () => {
        (global.fetch as any).mockRejectedValue(new Error('API Failure'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('handles invalid JSON from AI gracefully', async () => {
        (global.fetch as any).mockResolvedValue({
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
