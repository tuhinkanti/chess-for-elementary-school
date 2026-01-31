import { useState, useMemo } from 'react';
import { Chessboard, type SquareHandlerArgs, type PieceDropHandlerArgs } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';

interface ChessBoardProps {
  fen?: string;
  onMove?: (from: string, to: string, piece: string, isCapture: boolean) => boolean;
  highlightSquares?: string[];
  interactive?: boolean;
  boardSize?: number;
}

const EMPTY_HIGHLIGHTS: string[] = [];

export function ChessBoard({
  fen,
  onMove,
  highlightSquares = EMPTY_HIGHLIGHTS,
  interactive = true,
  boardSize = 400,
}: ChessBoardProps) {
  const [game, setGame] = useState(() => new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [moveSquares, setMoveSquares] = useState<Record<string, React.CSSProperties>>({});

  // Derived state to handle fen prop changes
  const [prevFen, setPrevFen] = useState(fen);
  if (fen !== prevFen) {
    setPrevFen(fen);
    setGame(new Chess(fen));
    setSelectedSquare(null);
    setMoveSquares({});
  }

  const getMoveOptions = (square: Square) => {
    const moves = game.moves({ square, verbose: true });
    const highlights: Record<string, React.CSSProperties> = {};

    moves.forEach((move) => {
      highlights[move.to] = {
        background: game.get(move.to as Square)
          ? 'radial-gradient(circle, rgba(255,0,0,0.4) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(0,200,0,0.4) 25%, transparent 25%)',
        borderRadius: '50%',
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
      const targetPiece = game.get(to as Square);
      const isCapture = targetPiece !== null;

      const move = game.move({ from, to, promotion: 'q' });
      if (move) {
        const whiteTurnFen = game.fen().replace(/ [bw] /, ' w ');
        setGame(new Chess(whiteTurnFen));
        if (onMove) {
          return onMove(from, to, piece, isCapture);
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
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      };
    }

    highlightSquares.forEach((sq) => {
      styles[sq] = {
        ...styles[sq],
        boxShadow: 'inset 0 0 0 4px rgba(255, 200, 0, 0.8)',
      };
    });

    return styles;
  }, [moveSquares, selectedSquare, highlightSquares]);

  return (
    <div className="chess-board-container" style={{ width: boardSize, height: boardSize }}>
      <Chessboard
        options={{
          position: game.fen(),
          onPieceDrop: onDrop,
          onSquareClick: handleSquareClick,
          squareStyles: customSquareStyles,
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          },
          darkSquareStyle: { backgroundColor: '#779952' },
          lightSquareStyle: { backgroundColor: '#edeed1' },
        }}
      />
    </div>
  );
}
