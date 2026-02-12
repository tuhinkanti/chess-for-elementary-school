import { useState, useMemo, useEffect } from 'react';
import { Chessboard, type SquareHandlerArgs, type PieceDropHandlerArgs } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';

interface ChessBoardProps {
  fen?: string;
  onMove?: (from: string, to: string, piece: string, isCapture: boolean, newFen: string) => boolean;
  highlightSquares?: string[];
  customArrows?: [string, string][]; // Format: [['e2', 'e4']]
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
  const [game, setGame] = useState(() => new Chess(fen));

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveSquares, setMoveSquares] = useState<Record<string, React.CSSProperties>>({});

  // Use useEffect to handle fen prop changes (fixing derived state anti-pattern)
  useEffect(() => {
    if (fen) {
        try {
            const newGame = new Chess(fen);
            setGame(newGame);
            setSelectedSquare(null);
            setMoveSquares({});
        } catch (e) {
            console.error("Invalid FEN provided:", fen, e);
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

    if (selectedSquare) {
      const moveResult = handleMove(selectedSquare, sq);
      if (!moveResult) {
        setSelectedSquare(sq);
        setMoveSquares(getMoveOptions(sq));
      } else {
        setSelectedSquare(null);
        setMoveSquares({});
      }
    } else {
      setSelectedSquare(sq);
      setMoveSquares(getMoveOptions(sq));
    }
  };

  const handleMove = (from: string, to: string) => {
    try {
      const piece = game.get(from as Square)?.type || '';

      // Clone game to validate move
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({ from, to, promotion: 'q' });

      const isCapture = !!move?.captured;

      if (move) {
        // Update state with the new game state (including turn change)
        setGame(gameCopy);

        if (onMove) {
          // Pass the new FEN to the parent
          return onMove(from, to, piece, isCapture, gameCopy.fen());
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
      styles[sq] = {
        ...styles[sq],
        boxShadow: 'inset 0 0 15px rgba(255, 217, 61, 0.8), 0 0 10px rgba(255, 217, 61, 0.4)',
        border: '3px solid var(--secondary)',
        zIndex: 2,
      };
    });

    return styles;
  }, [moveSquares, selectedSquare, highlightSquares]);

  // Map [string, string][] to Arrow[] for react-chessboard
  const arrows = useMemo(() => {
    return customArrows.map(([start, end]) => ({
      startSquare: start,
      endSquare: end,
      color: 'rgb(255, 170, 0)', // Default orange color for arrows
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
            arrows: arrows,
            boardStyle: {
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                width: boardSize, // Pass width here if needed, or via wrapper style
            },
            darkSquareStyle: { backgroundColor: '#779952' },
            lightSquareStyle: { backgroundColor: '#edeed1' },
            // Ensure width is handled if library supports it via options or props?
            // Library types say boardStyle is CSSProperties.
            // But boardWidth prop is not in types.
            // Wait, if I use options, I can't pass boardWidth as prop.
            // But usually CSS width on container handles it if board is 100%.
        }}
      />
    </div>
  );
}
