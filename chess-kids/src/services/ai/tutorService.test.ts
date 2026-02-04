import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tutorService, GameContext, ChatMessage } from './tutorService';

// Mock global fetch
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('TutorService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('constructs a prompt correctly and calls API', async () => {
        const context: GameContext = {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            lessonObjective: 'Learn to move pawns',
            studentContext: 'Student likes to play fast.',
        };

        const mockResponse = {
            message: 'Great job!',
            mood: 'encouraging',
        };

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const advice = await tutorService.getAdvice(context);

        expect(advice).toEqual(mockResponse);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/api/tutor', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Student likes to play fast.'),
        }));
    });

    it('truncates long messages to 500 characters', async () => {
        const longMessage = 'a'.repeat(600);
        const messages: ChatMessage[] = [{ role: 'user', content: longMessage }];

        const mockResponse = {
            message: 'I see.',
            mood: 'thinking',
        };

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        await tutorService.chat(messages);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const callArgs = fetchMock.mock.calls[0];
        const requestBody = JSON.parse(callArgs[1].body);

        expect(requestBody.messages[0].content.length).toBe(500);
        expect(requestBody.messages[0].content).toBe('a'.repeat(500));
    });

    it('handles API errors gracefully', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
        });

        const advice = await tutorService.chat([]);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });

    it('handles fetch exceptions gracefully', async () => {
        fetchMock.mockRejectedValue(new Error('Network error'));

        const advice = await tutorService.chat([]);

        expect(advice.message).toContain("I'm having a little trouble thinking");
        expect(advice.mood).toBe('thinking');
    });
});
