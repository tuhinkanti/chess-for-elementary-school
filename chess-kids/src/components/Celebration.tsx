<<<<<<< HEAD
/* eslint-disable react-hooks/purity */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
=======
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { useState } from 'react';
>>>>>>> origin/main

interface CelebrationProps {
  show: boolean;
  starsEarned: number;
  message: string;
  onComplete: () => void;
}

<<<<<<< HEAD
export function Celebration({ show, starsEarned, message, onComplete }: CelebrationProps) {
  const confettiParticles = useMemo(() => [...Array(20)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    backgroundColor: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'][i % 5],
    x: (Math.random() - 0.5) * 200,
    rotate: Math.random() * 720,
    duration: 2 + Math.random(),
    delay: Math.random() * 0.5
  })), []);
=======
interface ConfettiParticle {
  id: number;
  left: number;
  color: string;
  x: number;
  rotate: number;
  duration: number;
  delay: number;
  width: number;
  height: number;
  borderRadius: string;
}

function generateConfettiParticles(): ConfettiParticle[] {
  return [...Array(50)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#a29bfe', '#fab1a0'][i % 7],
    x: (Math.random() - 0.5) * 400,
    rotate: Math.random() * 1080,
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 1,
    width: Math.random() * 12 + 6,
    height: Math.random() * 12 + 6,
    borderRadius: i % 2 === 0 ? '50%' : '2px',
  }));
}

export function Celebration({ show, starsEarned, message, onComplete }: CelebrationProps) {
  const [confettiParticles, setConfettiParticles] = useState(generateConfettiParticles);
  const [prevShow, setPrevShow] = useState(show);

  if (show !== prevShow) {
    setPrevShow(show);
    if (show) {
      setConfettiParticles(generateConfettiParticles());
    }
  }
>>>>>>> origin/main

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
<<<<<<< HEAD
              transition={{ delay: 0.3 }}
=======
              transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
>>>>>>> origin/main
            >
              {[...Array(starsEarned)].map((_, i) => (
                <motion.div
                  key={i}
<<<<<<< HEAD
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
                >
                  <Star size={48} fill="gold" color="gold" />
=======
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
>>>>>>> origin/main
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
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="confetti"
              style={{
<<<<<<< HEAD
                left: particle.left,
                backgroundColor: particle.backgroundColor,
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: '100vh',
=======
                left: `${particle.left}%`,
                backgroundColor: particle.color,
                width: particle.width,
                height: particle.height,
                borderRadius: particle.borderRadius,
              }}
              initial={{ y: -50, opacity: 1, rotate: 0 }}
              animate={{
                y: '110vh',
>>>>>>> origin/main
                x: particle.x,
                rotate: particle.rotate,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
<<<<<<< HEAD
                ease: 'easeOut',
=======
                ease: [0.23, 1, 0.32, 1],
>>>>>>> origin/main
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
