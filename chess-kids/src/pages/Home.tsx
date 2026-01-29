import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LessonCard } from '../components/LessonCard';
import { StarCounter } from '../components/StarCounter';
import { ProfileBadge } from '../components/ProfileBadge';
import { lessons } from '../data/lessons';
import { useProfile } from '../context/ProfileContext';

export function Home() {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();

  useEffect(() => {
    if (!currentProfile) {
      navigate('/profiles');
    }
  }, [currentProfile, navigate]);

  if (!currentProfile) return null;

  return (
    <div className="home-page">
      <header className="home-header">
        <ProfileBadge />
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          ♟️ Chess Kids
        </motion.h1>
        <StarCounter />
      </header>

      <motion.p
        className="subtitle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Learn chess step by step!
      </motion.p>

      <div className="lessons-grid">
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <LessonCard
              lesson={lesson}
              onClick={() => navigate(`/lesson/${lesson.id}`)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
