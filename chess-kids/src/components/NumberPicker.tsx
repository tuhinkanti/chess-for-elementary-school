import { motion } from 'framer-motion';

interface NumberPickerProps {
  correctAnswer: number;
  onSelect: (isCorrect: boolean) => void;
  maxNumber?: number;
}

export function NumberPicker({ correctAnswer, onSelect, maxNumber = 8 }: NumberPickerProps) {
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);

  return (
    <div className="number-picker">
      <h3 className="picker-title">How many squares in one row?</h3>
      <div className="number-grid">
        {numbers.map((num) => (
          <motion.button
            key={num}
            className="number-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(num === correctAnswer)}
          >
            {num}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
