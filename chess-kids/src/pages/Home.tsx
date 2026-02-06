import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LessonCard } from '../components/LessonCard';
import { StarCounter } from '../components/StarCounter';
import { ProfileBadge } from '../components/ProfileBadge';
import { lessons } from '../data/lessons';
import { useProfile } from '../hooks/useProfile';

export function Home() {
  const navigate = useNavigate();
  const { currentProfile } = useProfile();

  useEffect(() => {
    if (!currentProfile) {
      navigate('/profiles');
    }
  }, [currentProfile, navigate]);

  const groupedLessons = useMemo(() => {
    return lessons.reduce((acc, lesson) => {
      const chapter = lesson.chapter || 'Extra Lessons';
      if (!acc[chapter]) {
        acc[chapter] = [];
      }
      acc[chapter].push(lesson);
      return acc;
    }, {} as Record<string, typeof lessons>);
  }, []);

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
        Welcome to Chess Adventure!
      </motion.p>

      <div className="lessons-container">
        {Object.entries(groupedLessons).map(([chapter, chapterLessons], chapterIndex) => (
          <div key={chapter} className="chapter-section">
            <motion.h2
              className="chapter-title"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * chapterIndex }}
            >
              {chapter}
            </motion.h2>
            <div className="lessons-grid">
              {chapterLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index + (0.2 * chapterIndex) }}
                >
                  <LessonCard
                    lesson={lesson}
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Completion Section */}
        <div className="chapter-section">
          <motion.h2
             className="chapter-title"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 1.5 }}
          >
             🎉 Completed the Adventure?
          </motion.h2>
          <motion.div
             className="completion-card-container"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1.6 }}
          >
             <button
               className="completion-button"
               onClick={() => navigate('/certificate')}
             >
               📜 Get Your Certificate & Worksheet
             </button>
          </motion.div>
        </div>
      </div>

      <style>{`
        .lessons-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding-bottom: 40px;
        }
        .chapter-section {
          margin-bottom: 2rem;
        }
        .chapter-title {
          font-size: 1.5rem;
          color: #2c3e50;
          margin-bottom: 1rem;
          border-bottom: 2px solid #ecf0f1;
          padding-bottom: 0.5rem;
        }
        .completion-button {
          background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(243, 156, 18, 0.4);
          transition: transform 0.2s;
          width: 100%;
        }
        .completion-button:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
