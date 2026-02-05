import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService, type GameContext } from './tutorService';

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock global fetch
        global.fetch = vi.fn();
    });

    it('constructs a prompt correctly with student context', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        // Access private method for testing purpose
        const prompt = (tutorService as any).constructSystemPrompt(context);

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

        (global.fetch as any).mockResolvedValue({
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
