import { useState, useMemo, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';

interface ChessBoardProps {
  fen?: string;
  onMove?: (from: string, to: string, piece: string, isCapture: boolean, newFen: string) => boolean;
  highlightSquares?: string[];
  customArrows?: [string, string, string?][]; // Format: [['e2', 'e4', 'red']]
  interactive?: boolean;
  boardSize?: number;
  forceWhiteTurn?: boolean;
}

const EMPTY_HIGHLIGHTS: string[] = [];

export function ChessBoard({
  fen,
  onMove,
  highlightSquares = EMPTY_HIGHLIGHTS,
  customArrows = [],
  interactive = true,
  boardSize = 400,
  forceWhiteTurn = false,
}: ChessBoardProps) {
  const [game, setGame] = useState(() => new Chess(fen));

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveSquares, setMoveSquares] = useState<Record<string, React.CSSProperties>>({});

  // Sync game state with fen prop
  useEffect(() => {
    if (fen) {
      setGame((prevGame) => {
        // Only update if FEN is different to avoid infinite loops or unnecessary resets
        if (prevGame.fen() !== fen) {
            try {
                return new Chess(fen);
            } catch (e) {
                console.error("Invalid FEN:", fen, e);
                return prevGame;
            }
        }
        return prevGame;
      });
      // Reset selection when FEN changes externally
      setSelectedSquare(null);
      setMoveSquares({});
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

  const handleSquareClick = (square: string) => {
    if (!interactive) return;
    const sq = square as Square;

    if (selectedSquare) {
      const moveResult = handleMove(selectedSquare, sq);
      if (!moveResult) {
        // If move invalid, select the new square if it has pieces
        const piece = game.get(sq);
        if (piece && piece.color === game.turn()) {
            setSelectedSquare(sq);
            setMoveSquares(getMoveOptions(sq));
        } else {
            setSelectedSquare(null);
            setMoveSquares({});
        }
      } else {
        setSelectedSquare(null);
        setMoveSquares({});
      }
    } else {
      // Only select if it's the player's turn (or if we allow exploring)
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

      // We need to clone to check valid move or just use .move() which modifies in place?
      // chess.js .move() modifies the instance.
      // But we should use a copy to avoid mutating state directly before setGame?
      // Actually `game` is a reference. `const move = game.move(...)` modifies it.
      // We should clone it first.
      const gameCopy = new Chess(game.fen());

      const move = gameCopy.move({ from, to, promotion: 'q' });
      const isCapture = !!move?.captured;

      if (move) {
        // Strict requirement: For some lessons, we force it to be White's turn again
        // so the student can keep practicing moves without waiting for Black.
        const nextFen = forceWhiteTurn
          ? gameCopy.fen().replace(/ [bw] /, ' w ')
          : gameCopy.fen();

        setGame(new Chess(nextFen));
        if (onMove) {
          // Note: we pass nextFen. If onMove updates the `fen` prop, useEffect will handle it.
          return onMove(from, to, piece, isCapture, nextFen);
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    if (!interactive) return false;
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

  return (
    <div className="chess-board-container" style={{ width: boardSize, height: boardSize }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={handleSquareClick}
        customSquareStyles={customSquareStyles}
        customArrows={customArrows}
        boardWidth={boardSize}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        boardContainerStyle={{
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden' // Ensure border radius is respected
        }}
      />
    </div>
  );
}
