import { useState, useMemo, useEffect } from 'react';
import { Chessboard, type SquareHandlerArgs, type PieceDropHandlerArgs } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';

interface ChessBoardProps {
  fen?: string;
  onMove?: (from: string, to: string, piece: string, isCapture: boolean, newFen: string) => boolean;
  highlightSquares?: string[];
  customArrows?: [string, string][]; // Fixed type
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

  // Use useEffect to sync internal game state when fen prop changes
  useEffect(() => {
    if (fen) {
        try {
            const newGame = new Chess(fen);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGame(newGame);
            setSelectedSquare(null);
            setMoveSquares({});
        } catch (e) {
            console.error('Invalid FEN:', fen, e);
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

      const move = game.move({ from, to, promotion: 'q' });
      const isCapture = !!move?.captured; // Check capture flag from move result
      if (move) {
        const nextFen = forceWhiteTurn
          ? game.fen().replace(/ [bw] /, ' w ')
          : game.fen();

        // If we force turn, we need to update the game instance to reflect it immediately
        if (forceWhiteTurn) {
             const forcedGame = new Chess(nextFen);
             setGame(forcedGame);
        } else {
             // For normal moves, React state update will happen via onMove callback -> parent updates fen prop -> useEffect
             // But for immediate feedback, we update local state too.
             // Actually, if parent updates `fen`, useEffect triggers re-render.
             // If we update here too, it might be redundant but safe.
             setGame(new Chess(nextFen));
        }

        if (onMove) {
          return onMove(from, to, piece, isCapture, nextFen);
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

  // Convert customArrows to the format react-chessboard expects if necessary
  // react-chessboard v5+ expects [start, end, color?]
  // Our prop is [string, string][]
  const arrows = useMemo(() => {
    return customArrows.map(arrow => [
      arrow[0],
      arrow[1],
      'orange' // Default color since our prop is just pairs
    ] as [string, string, string]);
  }, [customArrows]);

  return (
    <div className="chess-board-container" style={{ width: boardSize, height: boardSize }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={handleSquareClick}
        customSquareStyles={customSquareStyles}
        customArrows={arrows}
        boardWidth={boardSize}
        customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
      />
    </div>
  );
}
