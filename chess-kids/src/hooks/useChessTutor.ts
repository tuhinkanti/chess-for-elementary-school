import { useState, useCallback } from 'react';
import { tutorService } from '../services/ai/tutorService';
import type { TutorResponse, GameContext } from '../services/ai/tutorService';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    mood?: TutorResponse['mood'];
}

interface UseChessTutorReturn {
    messages: ChatMessage[];
    sendMessage: (userMessage: string, context?: GameContext) => Promise<void>;
    startConversation: (context: GameContext) => Promise<void>;
    isLoading: boolean;
    clearChat: () => void;
    latestResponse: TutorResponse | null;
}

export const useChessTutor = (): UseChessTutorReturn => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [latestResponse, setLatestResponse] = useState<TutorResponse | null>(null);
    const [currentContext, setCurrentContext] = useState<GameContext | null>(null);

    // Start a new conversation with context (called on "Ask Gloop")
    const startConversation = useCallback(async (context: GameContext) => {
        setIsLoading(true);
        setCurrentContext(context);

        try {
            const response = await tutorService.chat([], context);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.message,
                mood: response.mood
            };

            setMessages([assistantMessage]);
            setLatestResponse(response);
        } catch (err) {
            console.error(err);
            setMessages([{
                role: 'assistant',
                content: "I'm having a little trouble thinking right now, but keep trying!",
                mood: 'thinking'
            }]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Send a follow-up message in the conversation
    const sendMessage = useCallback(async (userMessage: string, context?: GameContext) => {
        const ctx = context || currentContext;

        const newUserMessage: ChatMessage = {
            role: 'user',
            content: userMessage
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const response = await tutorService.chat(updatedMessages, ctx || undefined);

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.message,
                mood: response.mood
            };

            setMessages([...updatedMessages, assistantMessage]);
            setLatestResponse(response);
        } catch (err) {
            console.error(err);
            setMessages([...updatedMessages, {
                role: 'assistant',
                content: "Hmm, let me think about that again...",
                mood: 'thinking'
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, currentContext]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setLatestResponse(null);
        setCurrentContext(null);
    }, []);

    return {
        messages,
        sendMessage,
        startConversation,
        isLoading,
        clearChat,
        latestResponse
    };
};
