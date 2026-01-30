import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface CelebrationProps {
  show: boolean;
  starsEarned: number;
  message: string;
  onComplete: () => void;
}

export function Celebration({ show, starsEarned, message, onComplete }: CelebrationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onComplete}
        >
          <motion.div
            className="celebration-content"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <motion.div
              className="celebration-stars"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
            >
              {[...Array(starsEarned)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -20, y: 20 }}
                  animate={{ scale: 1, rotate: 0, y: 0 }}
                  transition={{
                    delay: 0.5 + i * 0.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 10
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
                  }}
                >
                  <Star size={64} fill="#FFD700" color="#FFD700" />
                </motion.div>
              ))}
            </motion.div>
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {message}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="tap-continue"
            >
              Tap to continue
            </motion.p>
          </motion.div>

          {/* Confetti particles */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#a29bfe', '#fab1a0'][i % 7],
                width: Math.random() * 12 + 6,
                height: Math.random() * 12 + 6,
                borderRadius: i % 2 === 0 ? '50%' : '2px',
              }}
              initial={{ y: -50, opacity: 1, rotate: 0 }}
              animate={{
                y: '110vh',
                x: (Math.random() - 0.5) * 400,
                rotate: Math.random() * 1080,
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 1,
                ease: [0.23, 1, 0.32, 1],
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
