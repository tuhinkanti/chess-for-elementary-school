import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TutorResponse } from '../services/ai/tutorService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  mood?: TutorResponse['mood'];
}

interface TutorMascotProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClose: () => void;
  latestMood?: TutorResponse['mood'];
  inline?: boolean; // New: inline mode for positioning next to board
  currentHint?: string; // New: default hint to show when no messages
}

export function TutorMascot({ messages, isLoading, onSendMessage, onClose, latestMood, inline = false, currentHint }: TutorMascotProps) {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-expand when there are messages
  useEffect(() => {
    if (messages.length > 0) {
      setIsExpanded(true);
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const mood = latestMood || 'encouraging';
  const hasMessages = messages.length > 0;

  // In inline mode, always show. In fixed mode, only show when loading or has messages
  const shouldShow = inline || isLoading || hasMessages;

  // Default message when no messages exist (inline mode only)
  const displayMessages = messages.length > 0 ? messages : (
    inline && currentHint ? [{ role: 'assistant' as const, content: currentHint, mood: 'encouraging' as const }] : []
  );

  return (
    <div className={inline ? "tutor-container-inline" : "tutor-container"}>
      <AnimatePresence>
        {shouldShow && (
          <motion.div
            className={`tutor-mascot-wrapper ${isExpanded ? 'expanded' : ''}`}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
          >
            {/* Chat Panel */}
            <div className="chat-panel">
              <div className="chat-header">
                <span>💬 Chat with Gloop</span>
                <button className="close-chat" onClick={onClose}>×</button>
              </div>

              <div className="chat-messages" ref={chatContainerRef}>
                {displayMessages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <span className="message-avatar">🧙‍♂️</span>
                    )}
                    <div className="message-bubble">
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-message assistant">
                    <span className="message-avatar">🧙‍♂️</span>
                    <div className="message-bubble typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Gloop a question..."
                  disabled={isLoading}
                  className="chat-input"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="send-button"
                >
                  ➤
                </button>
              </form>
            </div>

            {/* Mascot */}
            <motion.div
              className="mascot-avatar"
              animate={mood === 'celebrating' ? {
                y: [0, -20, 0],
                rotate: [0, 5, -5, 5, 0]
              } : mood === 'thinking' ? {
                rotate: [0, -5, 5, 0],
                scale: [1, 1.05, 1]
              } : {
                y: [0, -5, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: mood === 'celebrating' ? 0.6 : 3,
                ease: "easeInOut"
              }}
            >
              <img src="/images/gloop.png" alt="GM Gloop" className="mascot-img" />
              <div className="mascot-name">GM Gloop</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
                .tutor-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    pointer-events: none;
                }

                .tutor-container-inline {
                    position: relative;
                    pointer-events: auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    max-width: 320px;
                }

                .tutor-mascot-wrapper {
                    display: flex;
                    flex-direction: row;
                    align-items: flex-end;
                    gap: 12px;
                    pointer-events: auto;
                }

                .chat-panel {
                    background: rgba(255, 255, 255, 0.98);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                    width: 300px;
                    max-height: 400px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 2px solid var(--primary);
                }

                .chat-header {
                    background: var(--primary);
                    color: white;
                    padding: 10px 16px;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .close-chat {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                }

                .close-chat:hover {
                    opacity: 0.8;
                }

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    min-height: 150px;
                    max-height: 250px;
                }

                .chat-message {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .chat-message.user {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    font-size: 24px;
                    line-height: 1;
                }

                .message-bubble {
                    background: #f0f0f0;
                    padding: 10px 14px;
                    border-radius: 16px;
                    max-width: 200px;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    color: #1a1a1a;
                }

                .chat-message.user .message-bubble {
                    background: var(--secondary);
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .chat-message.assistant .message-bubble {
                    border-bottom-left-radius: 4px;
                }

                .message-bubble.typing {
                    display: flex;
                    gap: 4px;
                    padding: 14px;
                }

                .message-bubble.typing span {
                    width: 8px;
                    height: 8px;
                    background: #ccc;
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }

                .message-bubble.typing span:nth-child(1) { animation-delay: -0.32s; }
                .message-bubble.typing span:nth-child(2) { animation-delay: -0.16s; }

                .chat-input-form {
                    display: flex;
                    gap: 8px;
                    padding: 12px;
                    border-top: 1px solid #eee;
                    background: #fafafa;
                }

                .chat-input {
                    flex: 1;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    padding: 8px 16px;
                    font-size: 0.9rem;
                    outline: none;
                }

                .chat-input:focus {
                    border-color: var(--primary);
                }

                .send-button {
                    background: var(--secondary);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    transition: transform 0.2s;
                }

                .send-button:hover:not(:disabled) {
                    transform: scale(1.1);
                }

                .send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .mascot-avatar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .mascot-img {
                    width: 80px;
                    height: 80px;
                    object-fit: contain;
                    filter: drop-shadow(0 8px 16px rgba(0,0,0,0.2));
                }

                .mascot-name {
                    background: var(--primary);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 10px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    margin-top: -12px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                }

                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1.0); }
                }
            `}</style>
    </div>
  );
}
