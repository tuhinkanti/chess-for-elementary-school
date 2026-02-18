import { useState, useMemo, useEffect } from 'react';
import { Chessboard, type SquareHandlerArgs, type PieceDropHandlerArgs } from 'react-chessboard';
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
const EMPTY_ARROWS: [string, string, string?][] = [];

export function ChessBoard({
  fen,
  onMove,
  highlightSquares = EMPTY_HIGHLIGHTS,
  customArrows = EMPTY_ARROWS,
  interactive = true,
  boardSize = 400,
  forceWhiteTurn = false,
}: ChessBoardProps) {
  const [game, setGame] = useState(() => new Chess(fen));

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveSquares, setMoveSquares] = useState<Record<string, React.CSSProperties>>({});

  // Sync game state when fen prop changes
  useEffect(() => {
    if (fen) {
      const newGame = new Chess(fen);
      setGame(newGame);
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

      // Attempt move
      const move = game.move({ from, to, promotion: 'q' });
      const isCapture = !!move?.captured;

      if (move) {
        // Handle forced turn (e.g., for puzzles where only one side plays)
        // We use regex to swap the active color in FEN if strictly required.
        const nextFen = forceWhiteTurn
          ? game.fen().replace(/ [bw] /, ' w ')
          : game.fen();

        // Update local state if we modified the FEN (otherwise standard move updated it)
        if (forceWhiteTurn) {
             setGame(new Chess(nextFen));
        } else {
             // For standard play, we just need to trigger a re-render or let the prop update do it if lifted.
             // But since we have local state 'game', we need to update it.
             // game.move() mutates, so we need to clone or force update.
             // efficient way: new Chess(game.fen())
             setGame(new Chess(game.fen()));
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

  const mappedArrows = useMemo(() => {
    return customArrows.map(arrow => [
      arrow[0],
      arrow[1],
      arrow[2] || 'orange'
    ] as [string, string, string]);
  }, [customArrows]);

  return (
    <div className="chess-board-container" style={{ width: boardSize, height: boardSize }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={handleSquareClick}
        customSquareStyles={customSquareStyles}
        customArrows={mappedArrows}
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
