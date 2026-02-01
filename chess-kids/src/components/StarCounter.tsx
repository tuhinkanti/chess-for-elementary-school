import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

export function StarCounter() {
  const { currentProgress } = useProfile();

  return (
    <motion.div
      className="star-counter"
      key={currentProgress.stars}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 0.3 }}
    >
      <Star size={28} fill="gold" color="gold" />
      <span className="star-count">{currentProgress.stars}</span>
    </motion.div>
  );
}
