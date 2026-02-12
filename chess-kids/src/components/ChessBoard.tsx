import { useState, useMemo, useEffect } from 'react';
import { Chessboard, type SquareHandlerArgs, type PieceDropHandlerArgs, type Arrow } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';

interface ChessBoardProps {
  fen?: string;
  onMove?: (from: string, to: string, piece: string, isCapture: boolean, newFen: string) => boolean;
  highlightSquares?: string[];
  customArrows?: [string, string][]; // Tuple for strict type safety
  interactive?: boolean;
  boardSize?: number;
}

const EMPTY_HIGHLIGHTS: string[] = [];
const EMPTY_ARROWS: [string, string][] = [];

export function ChessBoard({
  fen,
  onMove,
  highlightSquares = EMPTY_HIGHLIGHTS,
  customArrows = EMPTY_ARROWS,
  interactive = true,
  boardSize = 400,
}: ChessBoardProps) {
  // Initialize game state safely
  const [game, setGame] = useState(() => new Chess(fen));

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveSquares, setMoveSquares] = useState<Record<string, React.CSSProperties>>({});

  // Effect to sync internal game state when fen prop changes
  useEffect(() => {
    if (fen) {
      try {
        const newGame = new Chess(fen);
        setGame(newGame);
        setSelectedSquare(null);
        setMoveSquares({});
      } catch (e) {
        console.error("Invalid FEN passed to ChessBoard:", fen);
      }
    }
  }, [fen]);

  const getMoveOptions = (square: Square) => {
    const moves = game.moves({ square, verbose: true });
    const highlights: Record<string, React.CSSProperties> = {};

    moves.forEach((move) => {
      highlights[move.to] = {
        background: game.get(move.to as Square)
          ? 'radial-gradient(circle, rgba(255, 107, 107, 0.5) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(107, 203, 119, 0.4) 25%, transparent 25%)',
        borderRadius: '50%',
        boxShadow: game.get(move.to as Square) ? '0 0 10px rgba(255, 107, 107, 0.3)' : 'none',
      };
    });

    return highlights;
  };

  const handleSquareClick = ({ square }: SquareHandlerArgs) => {
    if (!interactive) return;
    const sq = square as Square;

    // Toggle selection if clicking same square
    if (sq === selectedSquare) {
      setSelectedSquare(null);
      setMoveSquares({});
      return;
    }

    if (selectedSquare) {
      const moveResult = handleMove(selectedSquare, sq);
      if (!moveResult) {
        // If move invalid, check if we clicked another own piece to select it
        const piece = game.get(sq);
        if (piece && piece.color === game.turn()) {
           setSelectedSquare(sq);
           setMoveSquares(getMoveOptions(sq));
        } else {
           setSelectedSquare(null);
           setMoveSquares({});
        }
      } else {
        // Move successful
        setSelectedSquare(null);
        setMoveSquares({});
      }
    } else {
      // Select piece if it's ours
      const piece = game.get(sq);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(sq);
        setMoveSquares(getMoveOptions(sq));
      }
    }
  };

  const handleMove = (from: string, to: string) => {
    try {
      const piece = game.get(from as Square)?.type || '';

      // Attempt move
      const move = game.move({ from, to, promotion: 'q' });

      if (move) {
        const isCapture = !!move.captured;
        const newFen = game.fen();

        // Update local state by creating new instance to trigger re-render
        setGame(new Chess(newFen));

        if (onMove) {
          return onMove(from, to, piece, isCapture, newFen);
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const onDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!interactive || !targetSquare) return false;
    return handleMove(sourceSquare, targetSquare);
  };

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {
      ...moveSquares,
    };

    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(255, 217, 61, 0.4)',
        boxShadow: 'inset 0 0 20px rgba(255, 217, 61, 0.6)',
      };
    }

    highlightSquares.forEach((sq) => {
      if (!sq) return;
      styles[sq] = {
        ...styles[sq],
        boxShadow: 'inset 0 0 15px rgba(255, 217, 61, 0.8), 0 0 10px rgba(255, 217, 61, 0.4)',
        border: '3px solid var(--secondary)',
        zIndex: 2,
      };
    });

    return styles;
  }, [moveSquares, selectedSquare, highlightSquares]);

  const boardArrows: Arrow[] = useMemo(() => {
    return customArrows.map(([start, end]) => ({
      startSquare: start,
      endSquare: end,
      color: 'orange', // Default arrow color
    }));
  }, [customArrows]);

  return (
    <div className="chess-board-container" style={{ width: boardSize, height: boardSize }}>
      <Chessboard
        options={{
          position: game.fen(),
          onPieceDrop: onDrop,
          onSquareClick: handleSquareClick,
          squareStyles: customSquareStyles,
          arrows: boardArrows,
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          },
          darkSquareStyle: { backgroundColor: '#779952' },
          lightSquareStyle: { backgroundColor: '#edeed1' },
          allowDrawingArrows: true,
        }}
      />
    </div>
  );
}
