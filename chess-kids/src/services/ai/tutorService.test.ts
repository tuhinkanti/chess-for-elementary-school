import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateContentMock } = vi.hoisted(() => ({
    generateContentMock: vi.fn(),
}));

// Mock the Google Generative AI library
vi.mock('@google/generative-ai', () => {
    const getGenerativeModelMock = vi.fn(() => ({
        generateContent: generateContentMock,
    }));

    return {
        GoogleGenerativeAI: vi.fn(() => ({
            getGenerativeModel: getGenerativeModelMock,
        })),
    };
});

// Import after mocking
import { tutorService, GameContext } from './tutorService';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        // Access private method for testing purpose or trigger via public method
        const prompt = (tutorService as any).constructPrompt(context);

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

        (generateContentMock as any).mockResolvedValue({
            response: {
                text: () => JSON.stringify(mockAdvice),
            },
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice).toEqual(mockAdvice);
        expect(generateContentMock).toHaveBeenCalledTimes(1);
    });

    it('handles AI errors gracefully with a fallback', async () => {
        (generateContentMock as any).mockRejectedValue(new Error('API Failure'));

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('handles invalid JSON from AI gracefully', async () => {
        (generateContentMock as any).mockResolvedValue({
            response: {
                text: () => 'Invalid JSON string',
            },
        });

        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        };

        const advice = await tutorService.getAdvice(context);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });
});
