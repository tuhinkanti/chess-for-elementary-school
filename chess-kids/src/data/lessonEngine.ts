import { Chess } from 'chess.js';

export type LessonType =
  | 'explore-board'
  | 'piece-movement'
  | 'capture'
  | 'checkmate'
  | 'free-play';

export interface LessonObjective {
  id: string;
  description: string;
  validator: ObjectiveValidator;
}

export interface ObjectiveValidator {
  type: 'tap-squares' | 'tap-corners' | 'count-confirm' | 'move-piece' | 'capture' | 'any-moves' | 'castling' | 'en-passant' | 'promotion' | 'checkmate';
  requiredSquares?: string[];
  requiredCount?: number;
  pieceType?: string;
  requiredDistance?: number;
  correctAnswer?: number;
  capturedPiece?: string;
  expectedMove?: { from: string; to: string }; // Strict move matching
}

export interface LessonConfig {
  id: number;
  type: LessonType;
  fen: string | null;
  objectives: LessonObjective[];
  allowAllSquares?: boolean;
  allowBlackMoves?: boolean;
}

export const CORNER_SQUARES = ['a1', 'a8', 'h1', 'h8'];
export const ALL_SQUARES = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) =>
    `${String.fromCharCode(97 + c)}${r + 1}`
  )
).flat();

export const lessonConfigs: Record<number, LessonConfig> = {
  // CHAPTER 1: Meet Your Army
  1: { // King
    id: 1,
    type: 'piece-movement',
    fen: '8/8/8/8/4K3/8/8/7k w - - 0 1', // Added Black King at h8
    objectives: [
      {
        id: 'king-1',
        description: 'Move the King one step in any direction',
        validator: { type: 'move-piece', pieceType: 'k', requiredDistance: 1 }
      },
      {
        id: 'king-2',
        description: 'Move the King again (only 1 step!)',
        validator: { type: 'move-piece', pieceType: 'k', requiredDistance: 1 }
      },
      {
        id: 'king-3',
        description: 'Keep the King safe!',
        validator: { type: 'any-moves', requiredCount: 1 }
      }
    ]
  },
  2: { // Queen
    id: 2,
    type: 'piece-movement',
    fen: '8/8/8/8/3Q4/8/8/4K2k w - - 0 1', // Added Kings
    objectives: [
      {
        id: 'queen-1',
        description: 'Move straight like a Rook',
        validator: { type: 'move-piece', pieceType: 'q' }
      },
      {
        id: 'queen-2',
        description: 'Move diagonally like a Bishop',
        validator: { type: 'move-piece', pieceType: 'q' }
      },
      {
        id: 'queen-3',
        description: 'The Queen is powerful! Move anywhere',
        validator: { type: 'any-moves', requiredCount: 1 }
      }
    ]
  },
  3: { // Rooks
    id: 3,
    type: 'piece-movement',
    fen: '8/8/8/8/3R4/8/8/4K2k w - - 0 1', // Added Kings
    objectives: [
      {
        id: 'rook-1',
        description: 'Move the Rook in a straight line',
        validator: { type: 'move-piece', pieceType: 'r' }
      },
      {
        id: 'rook-2',
        description: 'Slide it all the way across the board',
        validator: { type: 'move-piece', pieceType: 'r' }
      },
      {
        id: 'rook-3',
        description: 'Move one more time',
        validator: { type: 'any-moves', requiredCount: 1 }
      }
    ]
  },
  4: { // Bishops
    id: 4,
    type: 'piece-movement',
    fen: '8/8/8/8/3B4/8/8/4K2k w - - 0 1', // Added Kings
    objectives: [
      {
        id: 'bishop-1',
        description: 'Move the Bishop diagonally',
        validator: { type: 'move-piece', pieceType: 'b' }
      },
      {
        id: 'bishop-2',
        description: 'Zoom to another square!',
        validator: { type: 'move-piece', pieceType: 'b' }
      },
      {
        id: 'bishop-3',
        description: 'Notice it stays on the same color!',
        validator: { type: 'any-moves', requiredCount: 1 }
      }
    ]
  },
  5: { // Knights
    id: 5,
    type: 'piece-movement',
    fen: '8/8/8/4N3/8/8/4K2k w - - 0 1', // Added Kings
    objectives: [
      {
        id: 'knight-1',
        description: 'Jump in an L-shape!',
        validator: { type: 'move-piece', pieceType: 'n' }
      },
      {
        id: 'knight-2',
        description: 'Jump again!',
        validator: { type: 'move-piece', pieceType: 'n' }
      },
      {
        id: 'knight-3',
        description: 'Hop one more time',
        validator: { type: 'any-moves', requiredCount: 1 }
      }
    ]
  },
  6: { // Pawns
    id: 6,
    type: 'piece-movement',
    fen: '8/8/8/3p4/4P3/8/P3K2k/8 w - - 0 1', // Added Kings
    objectives: [
      {
        id: 'pawn-1',
        description: 'Move the "a" pawn forward 1 square',
        validator: { type: 'move-piece', pieceType: 'p', expectedMove: { from: 'a2', to: 'a3' } }
      },
      {
        id: 'pawn-2',
        description: 'Now move the "a" pawn 1 more square',
        validator: { type: 'move-piece', pieceType: 'p', expectedMove: { from: 'a3', to: 'a4' } }
      },
      {
        id: 'pawn-3',
        description: 'Capture the black pawn!',
        validator: { type: 'capture' }
      }
    ]
  },

  // CHAPTER 2: Setup
  7: {
    id: 7,
    type: 'explore-board',
    fen: null,
    allowAllSquares: true,
    objectives: [
      {
        id: 'corners',
        description: 'Tap all 4 corner squares (where Rooks live!)',
        validator: { type: 'tap-corners' }
      },
      {
        id: 'queen-home',
        description: 'Tap the White Queen\'s home (d1)',
        validator: { type: 'tap-squares', requiredSquares: ['d1'], requiredCount: 1 }
      },
      {
        id: 'light-is-right',
        description: 'Tap the bottom-right square (h1). Is it light?',
        validator: { type: 'tap-squares', requiredSquares: ['h1'], requiredCount: 1 }
      }
    ]
  },

  // CHAPTER 3: Checkmate
  8: {
    id: 8,
    type: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1', // Valid FEN
    objectives: [
      {
        id: 'mate-1',
        description: 'Move the Rook to Checkmate the King!',
        validator: { type: 'checkmate' }
      }
    ]
  },

  // CHAPTER 4: Special Moves
  9: { // Castling
    id: 9,
    type: 'piece-movement',
    fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', // Valid
    objectives: [
      {
        id: 'castle-kingside',
        description: 'Castle Kingside (Move King 2 steps right)',
        validator: { type: 'castling' }
      }
    ]
  },
  10: { // En Passant
    id: 10,
    type: 'piece-movement',
    fen: '8/8/8/3pP3/8/8/4K2k/8 w - d6 0 1', // Added Kings
    objectives: [
      {
        id: 'ep-1',
        description: 'Capture the black pawn "En Passant" (Move to d6)',
        validator: { type: 'en-passant', expectedMove: { from: 'e5', to: 'd6' } }
      }
    ]
  },

  // CHAPTER 5: Games
  11: { // Pawn Wars
    id: 11,
    type: 'free-play',
    fen: '4k3/pppppppp/8/8/8/8/PPPPPPPP/4K3 w - - 0 1', // Added Kings
    allowBlackMoves: true,
    objectives: [
      {
        id: 'promote',
        description: 'Get a pawn to the other side to promote!',
        validator: { type: 'promotion' }
      }
    ]
  },
  12: { // Knight's Adventure
    id: 12,
    type: 'capture',
    fen: '4k3/pppppppp/8/8/8/4N3/8/4K3 w - - 0 1', // Added Kings
    allowBlackMoves: false, // Puzzle mode
    objectives: [
      {
        id: 'capture-all',
        description: 'Capture all 8 pawns!',
        validator: { type: 'capture', requiredCount: 8 }
      }
    ]
  },
  13: { // Capture the Flag
    id: 13,
    type: 'free-play',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Valid
    allowBlackMoves: true,
    objectives: [
      {
        id: 'capture-queen',
        description: 'Capture the enemy Queen!',
        validator: { type: 'capture', capturedPiece: 'q' }
      }
    ]
  }
};

export interface LessonState {
  tappedSquares: Set<string>;
  tappedCorners: Set<string>;
  moveCount: number;
  captureCount: number;
  lastMove?: {
    piece: string;
    from: string;
    to: string;
    distance: number;
    isCapture: boolean;
    flags: string;
    fen: string;
  };
  currentObjectiveIndex: number;
  completedObjectives: string[];
  answeredCorrectly: boolean;
}

export function createInitialLessonState(): LessonState {
  return {
    tappedSquares: new Set(),
    tappedCorners: new Set(),
    moveCount: 0,
    captureCount: 0,
    currentObjectiveIndex: 0,
    completedObjectives: [],
    answeredCorrectly: false,
  };
}

export function checkObjectiveComplete(
  objective: LessonObjective,
  state: LessonState
): boolean {
  const { validator } = objective;

  switch (validator.type) {
    case 'tap-squares':
      // Support checking specific squares if provided, otherwise count
      if (validator.requiredSquares) {
        return validator.requiredSquares.every(sq => state.tappedSquares.has(sq));
      }
      return state.tappedSquares.size >= (validator.requiredCount || 5);

    case 'tap-corners':
      return (validator.requiredSquares || CORNER_SQUARES).every((sq: string) =>
        state.tappedCorners.has(sq)
      );

    case 'count-confirm':
      return state.answeredCorrectly;

    case 'move-piece': {
      if (!state.lastMove) return false;
      const pieceMatch = !validator.pieceType || state.lastMove.piece.toLowerCase() === validator.pieceType.toLowerCase();
      const distanceMatch = !validator.requiredDistance || state.lastMove.distance === validator.requiredDistance;

      let moveMatch = true;
      if (validator.expectedMove) {
        moveMatch = state.lastMove.from === validator.expectedMove.from &&
                    state.lastMove.to === validator.expectedMove.to;
      }

      return pieceMatch && distanceMatch && moveMatch;
    }

    case 'capture': {
       if (!state.captureCount) return false;

       // Check count
       if (state.captureCount < (validator.requiredCount || 1)) return false;

       // Check if specific piece was captured by checking if it's missing from FEN
       if (validator.capturedPiece && state.lastMove) {
          const pieceChar = validator.capturedPiece.toLowerCase(); // 'q'
          const fenBoard = state.lastMove.fen.split(' ')[0];
          if (fenBoard.includes(pieceChar)) {
             return false; // Piece still exists
          }
       }

       if (validator.expectedMove && state.lastMove?.isCapture) {
         return state.lastMove.from === validator.expectedMove.from &&
                state.lastMove.to === validator.expectedMove.to;
       }

       return true;
    }

    case 'any-moves':
      return state.moveCount >= (validator.requiredCount || 1);

    case 'castling': {
      if (!state.lastMove) return false;
      const isKing = state.lastMove.piece.toLowerCase() === 'k';
      const moveDistance = Math.abs(state.lastMove.from.charCodeAt(0) - state.lastMove.to.charCodeAt(0));
      return isKing && moveDistance === 2;
    }

    case 'en-passant': {
       if (!state.lastMove) return false;
       if (validator.expectedMove) {
         return state.lastMove.from === validator.expectedMove.from &&
                state.lastMove.to === validator.expectedMove.to;
       }
       return state.lastMove.flags.includes('e');
    }

    case 'promotion': {
       if (!state.lastMove) return false;
       return state.lastMove.flags.includes('p');
    }

    case 'checkmate': {
      if (!state.lastMove) return false;
      const chess = new Chess(state.lastMove.fen);
      return chess.isCheckmate();
    }

    default:
      return false;
  }
}

export function handleSquareTap(square: string, state: LessonState): LessonState {
  const newTapped = new Set(state.tappedSquares);
  newTapped.add(square);

  const newCorners = new Set(state.tappedCorners);
  if (CORNER_SQUARES.includes(square)) {
    newCorners.add(square);
  }

  return {
    ...state,
    tappedSquares: newTapped,
    tappedCorners: newCorners,
  };
}

export function handleMove(
  state: LessonState,
  moveInfo: { piece: string; from: string; to: string; isCapture: boolean; newFen: string }
): LessonState {
  const fromRank = parseInt(moveInfo.from[1]);
  const toRank = parseInt(moveInfo.to[1]);
  const distance = Math.abs(toRank - fromRank);

  let flags = '';
  const pieceType = moveInfo.piece.toLowerCase();

  if (pieceType === 'p' && (toRank === 1 || toRank === 8)) {
    flags += 'p';
  }

  return {
    ...state,
    moveCount: state.moveCount + 1,
    captureCount: state.captureCount + (moveInfo.isCapture ? 1 : 0),
    lastMove: {
      piece: moveInfo.piece,
      from: moveInfo.from,
      to: moveInfo.to,
      distance,
      isCapture: moveInfo.isCapture,
      flags,
      fen: moveInfo.newFen
    }
  };
}

export function handleAnswer(state: LessonState, isCorrect: boolean): LessonState {
  return {
    ...state,
    answeredCorrectly: isCorrect,
  };
}

export function resetObjectiveState(state: LessonState): LessonState {
  return {
    ...state,
    tappedSquares: new Set(),
    tappedCorners: new Set(),
    moveCount: 0,
    captureCount: 0,
    answeredCorrectly: false,
    lastMove: undefined,
  };
}
