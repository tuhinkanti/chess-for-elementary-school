import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { useState } from 'react';

interface CelebrationProps {
  show: boolean;
  starsEarned: number;
  message: string;
  onComplete: () => void;
}

interface ConfettiParticle {
  id: number;
  left: number;
  color: string;
  x: number;
  rotate: number;
  duration: number;
  delay: number;
}

function generateConfettiParticles(): ConfettiParticle[] {
  return [...Array(20)].map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'][i % 5],
    x: (Math.random() - 0.5) * 200,
    rotate: Math.random() * 720,
    duration: 2 + Math.random(),
    delay: Math.random() * 0.5,
  }));
}

export function Celebration({ show, starsEarned, message, onComplete }: CelebrationProps) {
  const [confettiParticles] = useState(generateConfettiParticles);

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
              transition={{ delay: 0.3 }}
            >
              {[...Array(starsEarned)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
                >
                  <Star size={48} fill="gold" color="gold" />
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
                left: `${particle.left}%`,
                backgroundColor: particle.color,
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{
                y: '100vh',
                x: particle.x,
                rotate: particle.rotate,
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
