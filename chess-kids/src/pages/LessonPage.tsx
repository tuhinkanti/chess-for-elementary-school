import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ChessBoard } from '../components/ChessBoard';
import { ExploreBoard } from '../components/ExploreBoard';
import { NumberPicker } from '../components/NumberPicker';
import { Celebration } from '../components/Celebration';
import { StarCounter } from '../components/StarCounter';
import { lessons } from '../data/lessons';
import {
  lessonConfigs,
  createInitialLessonState,
  checkObjectiveComplete,
  handleSquareTap,
  handleMove,
  handleAnswer,
  type LessonState,
} from '../data/lessonEngine';
import { useProfile } from '../hooks/useProfile';
import { useChessTutor } from '../hooks/useChessTutor';
import { useStudentMemory } from '../hooks/useStudentMemory';
import { TutorMascot } from '../components/TutorMascot';

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProfile, addStars, completeLesson } = useProfile();

  const lessonId = parseInt(id || '1');
  const lesson = lessons.find((l) => l.id === lessonId);
  const config = lessonConfigs[lessonId];

  const [lessonState, setLessonState] = useState<LessonState>(createInitialLessonState);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showStory, setShowStory] = useState(true);
  const [currentFen, setCurrentFen] = useState<string>(config?.fen || 'start');
  const [lastMove, setLastMove] = useState<string | undefined>(undefined);
  const [isShaking, setIsShaking] = useState(false);

  // Track previous move count to detect new moves
  const prevMoveCount = useRef(0);

  // Memory system
  const memory = useStudentMemory(currentProfile?.id);

  // AI Tutor
  const { messages, sendMessage, startConversation, encourageObjective, isLoading, clearChat, latestResponse } = useChessTutor();

  // Memoize visualization props to prevent unnecessary ChessBoard re-renders
  const highlightSquares = useMemo(() => {
    return latestResponse?.highlightSquare ? [latestResponse.highlightSquare] : [];
  }, [latestResponse?.highlightSquare]);

  const customArrows: [string, string][] = useMemo(() => {
    if (!latestResponse?.drawArrow) return [];

    // Validate format "e2-e4"
    const parts = latestResponse.drawArrow.split('-');
    if (parts.length === 2) {
      return [parts as [string, string]];
    }
    return [];
  }, [latestResponse?.drawArrow]);

  useEffect(() => {
    if (!currentProfile) {
      navigate('/profiles');
    }
  }, [currentProfile, navigate]);

  // Start session when lesson begins
  useEffect(() => {
    memory.startSession(lessonId);
    
    // End session when leaving
    return () => {
      memory.endSession();
    };
  }, [lessonId, memory]);

  // Learn from AI response
  useEffect(() => {
    if (latestResponse?.learnedFacts && latestResponse.learnedFacts.length > 0) {
      latestResponse.learnedFacts.forEach(fact => {
        // We categorize broadly as 'skill-gap' or 'preference' if possible, but 'general' fallback is okay.
        // Since the prompt asks for strengths/weaknesses, we'll try to guess or just use a default.
        // For now, let's assume if the AI noticed it, it's worth noting as a 'skill-gap' or 'strength'.
        // We'll use a generic 'preference' category or modify memory to accept 'observation'.
        // Using 'skill-gap' as a safe default for "struggles", but it might be a strength.
        // Let's use 'preference' for now as a catch-all for "observed traits".
        memory.addFact(fact, 'preference', 'tutor');
      });
    }
  }, [latestResponse, memory]);

  const currentObjective = config?.objectives[lessonState.currentObjectiveIndex];

  const handleMistake = useCallback((context: string) => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);

    // Record the mistake so the AI knows
    memory.recordTutorInteraction('message', `Mistake: ${context}`, 'system');
    
    // Also add a temporary fact about the struggle if it's specific
    // memory.addFact(`Struggled with ${context}`, 'skill-gap', 'system');
  }, [memory]);

  // Check for objective completion whenever lessonState changes
  useEffect(() => {
    if (!config || !currentObjective || showCelebration) return;

    const isComplete = checkObjectiveComplete(currentObjective, lessonState);
    const moveMade = lessonState.moveCount > prevMoveCount.current;
    
    if (moveMade) {
      prevMoveCount.current = lessonState.moveCount;
    }

    if (isComplete) {
      const nextIndex = lessonState.currentObjectiveIndex + 1;
      const newCompleted = [...lessonState.completedObjectives, currentObjective.id];

      // Record to memory
      memory.recordObjectiveCompleted(currentObjective.id);

      if (nextIndex >= config.objectives.length) {
        // All objectives done!
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowCelebration(true);
        addStars(3);
        completeLesson(lessonId);

        // Record milestone
        memory.addFact(
          `Completed lesson ${lessonId}: ${lesson?.title}`,
          'milestone',
          `lesson-${lessonId}`
        );

        // Gloop celebrates the lesson completion!
        encourageObjective(currentObjective.description, true);

        setLessonState(prev => ({
          ...prev,
          completedObjectives: newCompleted,
          currentObjectiveIndex: nextIndex,
        }));
      } else {
        // Gloop encourages for completing this objective!
        encourageObjective(currentObjective.description, false);

        // Advance to next objective
        setLessonState(prev => ({
          ...prev,
          completedObjectives: newCompleted,
          currentObjectiveIndex: nextIndex,
        }));
      }
    } else if (moveMade) {
      // Move made but objective NOT complete. Check if it was a "wrong" move.
      // For objectives that require a specific single move/capture, any other move is wrong.
      const isSingleAction = ['move-piece', 'capture'].includes(currentObjective.validator.type);
      
      if (isSingleAction) {
        handleMistake(currentObjective.description);
      }
    }
  }, [lessonState, config, currentObjective, lessonId, addStars, completeLesson, showCelebration, memory, lesson, encourageObjective, handleMistake]);

  const onSquareTap = useCallback((square: string) => {
    setLessonState((prev) => handleSquareTap(square, prev));
  }, []);

  const onChessMove = useCallback((from: string, to: string, piece: string, isCapture: boolean, newFen: string) => {
    setLessonState((prev) => handleMove(prev, { from, to, piece, isCapture }));
    setCurrentFen(newFen);
    setLastMove(`${from}-${to}`);
    return true;
  }, []);

  const onAnswerSelect = useCallback((isCorrect: boolean) => {
    if (!isCorrect) {
      handleMistake("Selected wrong answer");
      return;
    }
    setLessonState((prev) => handleAnswer(prev, isCorrect));
  }, [handleMistake]);


  const handleAskTutor = useCallback(() => {
    if (!config) return;

    // Get student context from memory
    const studentContext = memory.getContextForAI();

    startConversation({
      fen: currentFen,
      lastMove,
      lessonObjective: currentObjective?.description,
      studentContext,
    });

    // Record the interaction
    memory.recordTutorInteraction('message', currentObjective?.description || 'general', 'asked');
  }, [config, currentObjective, startConversation, memory, currentFen, lastMove]);

  const handleSendMessage = useCallback((userMessage: string) => {
    const studentContext = memory.getContextForAI();
    sendMessage(userMessage, {
      fen: currentFen,
      lastMove,
      lessonObjective: currentObjective?.description,
      studentContext,
    });
  }, [sendMessage, currentObjective, memory, currentFen, lastMove]);

  const handleCelebrationComplete = () => {
    clearChat();
    setShowCelebration(false);
    if (lessonId < lessons.length) {
      navigate(`/lesson/${lessonId + 1}`);
    } else {
      navigate('/');
    }
  };

  if (!lesson || !config || !currentProfile) {
    return <div>Lesson not found</div>;
  }

  const isExploreBoardLesson = config.type === 'explore-board';
  const shouldHighlightCorners = currentObjective?.validator.type === 'tap-corners';
  const showNumberPicker = currentObjective?.validator.type === 'count-confirm';

  return (
    <div className="lesson-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>
          {lesson.icon} {lesson.title}
        </h1>
        <StarCounter />
      </header>

      {showStory ? (
        <motion.div
          className="story-container"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="story-icon">{lesson.icon}</div>
          <p className="story-text">{lesson.storyIntro}</p>
          <motion.button
            className="start-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStory(false)}
          >
            Let's Practice!
          </motion.button>
        </motion.div>
      ) : (
        <div className="lesson-content">
          <div className={`board-section ${isShaking ? 'shake' : ''}`}>
            {showNumberPicker ? (
              <NumberPicker
                correctAnswer={currentObjective?.validator.correctAnswer || 8}
                onSelect={onAnswerSelect}
              />
            ) : isExploreBoardLesson ? (
              <ExploreBoard
                tappedSquares={lessonState.tappedSquares}
                tappedCorners={lessonState.tappedCorners}
                onSquareTap={onSquareTap}
                highlightCorners={shouldHighlightCorners}
                boardSize={Math.min(400, window.innerWidth - 40)}
              />
            ) : (
              <ChessBoard
                key={`lesson-${lessonId}`}
                fen={config.fen || undefined}
                onMove={(from, to, piece, isCapture, newFen) => onChessMove(from, to, piece, isCapture, newFen)}
                boardSize={Math.min(400, window.innerWidth - 40)}
                highlightSquares={highlightSquares}
                customArrows={customArrows}
              />
            )}
          </div>

          <div className="objectives-section">
            <div className="objectives-header">
              <h3>Goals:</h3>
              <button
                className="ask-tutor-button"
                onClick={handleAskTutor}
                disabled={isLoading}
              >
                {isLoading ? 'Thinking...' : '💡 Ask Gloop'}
              </button>
            </div>
            <ul className="objectives-list">
              {config.objectives.map((objective, index) => {
                const isCompleted = lessonState.completedObjectives.includes(objective.id);
                const isCurrent = index === lessonState.currentObjectiveIndex;

                return (
                  <motion.li
                    key={objective.id}
                    className={`objective ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    animate={isCompleted ? { scale: [1, 1.1, 1] } : {}}
                  >
                    {isCompleted && <CheckCircle size={20} className="check-icon" />}
                    {objective.description}
                    {isCurrent && objective.validator.type === 'tap-squares' && (
                      <span className="progress-hint">
                        {' '}({lessonState.tappedSquares.size}/{objective.validator.requiredCount || 5})
                      </span>
                    )}
                    {isCurrent && objective.validator.type === 'tap-corners' && (
                      <span className="progress-hint">
                        {' '}({lessonState.tappedCorners.size}/4)
                      </span>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <Celebration
        show={showCelebration}
        starsEarned={3}
        message="Amazing job! 🎉"
        onComplete={handleCelebrationComplete}
      />

      <TutorMascot
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onClose={clearChat}
        latestMood={latestResponse?.mood}
      />

      <style>{`
        .objectives-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .ask-tutor-button {
          background: var(--secondary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .ask-tutor-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .ask-tutor-button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}
