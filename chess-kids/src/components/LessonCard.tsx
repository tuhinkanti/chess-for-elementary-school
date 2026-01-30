import { motion } from 'framer-motion';
import { Lock, Star } from 'lucide-react';
import type { Lesson } from '../data/lessons';
import { useProfile } from '../context/ProfileContext';

interface LessonCardProps {
  lesson: Lesson;
  onClick: () => void;
}

export function LessonCard({ lesson, onClick }: LessonCardProps) {
  const { currentProgress } = useProfile();
  const isUnlocked = currentProgress.stars >= lesson.unlockStars;
  const isCompleted = currentProgress.completedLessons.includes(lesson.id);

  return (
    <motion.div
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      className={`lesson-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
      onClick={isUnlocked ? onClick : undefined}
    >
      <div className="lesson-icon">
        {isUnlocked ? (
          <span className="icon-emoji">{lesson.icon}</span>
        ) : (
          <Lock size={32} />
        )}
      </div>
      <div className="lesson-info">
        <h3>{lesson.title}</h3>
        <p>{lesson.description}</p>
        {!isUnlocked && (
          <div className="unlock-requirement">
            <Star size={14} fill="#FFD700" color="#FFD700" />
            <span>{lesson.unlockStars} stars to unlock</span>
          </div>
        )}
        {isCompleted && (
          <div className="completed-badge">
            <Star size={14} fill="#FFD700" color="#FFD700" />
            <Star size={14} fill="#FFD700" color="#FFD700" />
            <Star size={14} fill="#FFD700" color="#FFD700" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
