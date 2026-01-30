import { motion } from 'framer-motion';
import { CORNER_SQUARES } from '../data/lessonEngine';

interface ExploreBoardProps {
  tappedSquares: Set<string>;
  tappedCorners: Set<string>;
  onSquareTap: (square: string) => void;
  highlightCorners?: boolean;
  boardSize?: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export function ExploreBoard({
  tappedSquares,
  tappedCorners,
  onSquareTap,
  highlightCorners = false,
  boardSize = 400,
}: ExploreBoardProps) {
  const squareSize = boardSize / 8;

  const isLightSquare = (fileIndex: number, rank: number) => {
    return (fileIndex + rank) % 2 === 1;
  };

  const getSquareStyle = (square: string, isLight: boolean) => {
    const baseColor = isLight ? '#edeed1' : '#779952';
    const isTapped = tappedSquares.has(square);
    const isCorner = CORNER_SQUARES.includes(square);
    const cornerTapped = tappedCorners.has(square);

    let background = baseColor;
    let boxShadow = 'none';

    if (isTapped) {
      background = isLight ? '#f7f769' : '#bbcb44';
    }

    if (highlightCorners && isCorner) {
      if (cornerTapped) {
        boxShadow = 'inset 0 0 0 4px rgba(107, 203, 119, 0.9)';
      } else {
        boxShadow = 'inset 0 0 0 4px rgba(255, 200, 0, 0.8)';
      }
    }

    return { background, boxShadow };
  };

  return (
    <div
      className="explore-board"
      style={{
        width: boardSize,
        height: boardSize,
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${squareSize}px)`,
        gridTemplateRows: `repeat(8, ${squareSize}px)`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
      }}
    >
      {RANKS.map((rank) =>
        FILES.map((file, fileIndex) => {
          const square = `${file}${rank}`;
          const isLight = isLightSquare(fileIndex, rank);
          const styles = getSquareStyle(square, isLight);
          const isFirstFile = file === 'a';
          const isLastRank = rank === 1;

          return (
            <motion.button
              key={square}
              className="explore-square"
              style={{
                width: squareSize,
                height: squareSize,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative', // Added for absolute positioning of labels
                ...styles,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSquareTap(square)}
            >
              {/* Rank labels (numbers 1-8) on the first file (a) */}
              {isFirstFile && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    fontSize: squareSize * 0.15,
                    fontWeight: 'bold',
                    color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                  }}
                >
                  {rank}
                </span>
              )}

              {/* File labels (letters a-h) on the last rank (1) */}
              {isLastRank && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    fontSize: squareSize * 0.15,
                    fontWeight: 'bold',
                    color: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                  }}
                >
                  {file}
                </span>
              )}

              {CORNER_SQUARES.includes(square) && highlightCorners && (
                <span style={{ fontSize: squareSize * 0.5, zIndex: 1 }}>
                  {tappedCorners.has(square) ? '✓' : '★'}
                </span>
              )}
            </motion.button>
          );
        })
      )}
    </div>
  );
}
