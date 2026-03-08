import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService } from './tutorService';
import type { GameContext } from '../../utils/aiUtils';

// Mock fetch
global.fetch = vi.fn();

describe('ChessTutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should format requests correctly', async () => {
        const mockResponse = {
            message: "Great move!",
            mood: "celebrating",
            highlightSquare: "e4"
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
            lastMove: 'e4',
            lessonObjective: 'Control the center'
        };

        const advice = await tutorService.getAdvice(context);

        expect(global.fetch).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Help me with this chess position!' }],
                context
            })
        }));

        expect(advice).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

        const context: GameContext = { fen: 'start' };
        const advice = await tutorService.getAdvice(context);

        expect(advice.mood).toBe('thinking');
        expect(advice.message).toContain('trouble thinking');
    });

    it('should handle non-ok HTTP responses', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        const context: GameContext = { fen: 'start' };
        const advice = await tutorService.getAdvice(context);

        expect(advice.mood).toBe('thinking');
        expect(advice.message).toContain('trouble thinking');
    });
});
