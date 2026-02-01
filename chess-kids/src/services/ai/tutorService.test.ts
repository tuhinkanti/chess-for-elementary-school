import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tutorService, GameContext } from './tutorService';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                message: 'Hello!',
                mood: 'encouraging'
            }),
        });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('constructs a prompt correctly and calls API', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        await tutorService.chat([], context);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }));

        // Verify body content
        const callArgs = fetchMock.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        expect(body.messages).toEqual([{ role: 'user', content: 'Help me with this chess position!' }]);
        expect(body.systemPrompt).toContain('Grandmaster Gloop');
        expect(body.systemPrompt).toContain('Learn to move pawns');
        expect(body.systemPrompt).toContain('Student likes to play fast.');
        expect(body.systemPrompt).toContain('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
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
    });

    it('handles API errors gracefully with a fallback', async () => {
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
        fetchMock.mockRejectedValueOnce(new Error('Network failure'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });
});
