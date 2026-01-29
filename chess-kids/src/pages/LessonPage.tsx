import { useState, useEffect, useCallback } from 'react';
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
  resetObjectiveState,
  type LessonState,
} from '../data/lessonEngine';
import { useProfile } from '../context/ProfileContext';

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

  useEffect(() => {
    if (!currentProfile) {
      navigate('/profiles');
    }
  }, [currentProfile, navigate]);

  useEffect(() => {
    setLessonState(createInitialLessonState());
    setShowStory(true);
    setShowCelebration(false);
  }, [lessonId]);

  const currentObjective = config?.objectives[lessonState.currentObjectiveIndex];

  const checkAndAdvance = useCallback((newState: LessonState) => {
    if (!config || !currentObjective) return newState;

    const isComplete = checkObjectiveComplete(currentObjective, newState);

    if (isComplete) {
      const newCompleted = [...newState.completedObjectives, currentObjective.id];
      const nextIndex = newState.currentObjectiveIndex + 1;

      if (nextIndex >= config.objectives.length) {
        setShowCelebration(true);
        addStars(3);
        completeLesson(lessonId);
        return {
          ...newState,
          completedObjectives: newCompleted,
          currentObjectiveIndex: nextIndex,
        };
      } else {
        return {
          ...resetObjectiveState(newState),
          completedObjectives: newCompleted,
          currentObjectiveIndex: nextIndex,
        };
      }
    }

    return newState;
  }, [config, currentObjective, lessonId, addStars, completeLesson]);

  const onSquareTap = useCallback((square: string) => {
    setLessonState((prev) => {
      const newState = handleSquareTap(square, prev);
      return checkAndAdvance(newState);
    });
  }, [checkAndAdvance]);

  const onChessMove = useCallback((isCapture: boolean) => {
    setLessonState((prev) => {
      const newState = handleMove(prev, isCapture);
      return checkAndAdvance(newState);
    });
    return true;
  }, [checkAndAdvance]);

  const onAnswerSelect = useCallback((isCorrect: boolean) => {
    if (!isCorrect) {
      return;
    }
    setLessonState((prev) => {
      const newState = handleAnswer(prev, isCorrect);
      return checkAndAdvance(newState);
    });
  }, [checkAndAdvance]);

  const handleCelebrationComplete = () => {
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
          <div className="board-section">
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
                fen={config.fen || undefined}
                onMove={(_from, _to, isCapture) => onChessMove(isCapture)}
                boardSize={Math.min(400, window.innerWidth - 40)}
              />
            )}
          </div>

          <div className="objectives-section">
            <h3>Goals:</h3>
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
    </div>
  );
}
