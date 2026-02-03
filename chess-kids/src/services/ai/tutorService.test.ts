import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService, GameContext } from './tutorService';

// Mock global.fetch
global.fetch = vi.fn();

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
            mood: 'encouraging',
            highlightSquare: 'e4',
            drawArrow: 'e2-e4',
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
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
        }));
    });

    it('handles AI errors gracefully with a fallback', async () => {
        (global.fetch as any).mockResolvedValue({
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
        (global.fetch as any).mockRejectedValue(new Error('Network Error'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('truncates messages that are too long to prevent DoS', async () => {
        const longMessage = 'a'.repeat(1000);
        const expectedTruncated = 'a'.repeat(500);

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                message: 'Okay',
                mood: 'encouraging'
            }),
        });

        await tutorService.chat([{ role: 'user', content: longMessage }]);

        expect(global.fetch).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
        }));

        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.messages[0].content.length).toBe(500);
        expect(body.messages[0].content).toBe(expectedTruncated);
    });
});
