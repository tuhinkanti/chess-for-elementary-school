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
  type: 'tap-squares' | 'tap-corners' | 'count-confirm' | 'move-piece' | 'capture' | 'any-moves';
  requiredSquares?: string[];
  requiredCount?: number;
  pieceType?: string;
  correctAnswer?: number;
}

export interface LessonConfig {
  id: number;
  type: LessonType;
  fen: string | null;
  objectives: LessonObjective[];
  allowAllSquares?: boolean;
}

export const CORNER_SQUARES = ['a1', 'a8', 'h1', 'h8'];
export const ALL_SQUARES = Array.from({ length: 8 }, (_, r) =>
  Array.from({ length: 8 }, (_, c) => 
    `${String.fromCharCode(97 + c)}${r + 1}`
  )
).flat();

export const lessonConfigs: Record<number, LessonConfig> = {
  1: {
    id: 1,
    type: 'explore-board',
    fen: null,
    allowAllSquares: true,
    objectives: [
      {
        id: 'tap-squares',
        description: 'Tap on 5 different squares',
        validator: { type: 'tap-squares', requiredCount: 5 },
      },
      {
        id: 'find-corners',
        description: 'Tap all 4 corners of the board',
        validator: { type: 'tap-corners', requiredSquares: CORNER_SQUARES },
      },
      {
        id: 'count-row',
        description: 'How many squares in one row?',
        validator: { type: 'count-confirm', correctAnswer: 8 },
      },
    ],
  },
  2: {
    id: 2,
    type: 'piece-movement',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    objectives: [
      {
        id: 'move-pawn-1',
        description: 'Move any pawn forward',
        validator: { type: 'move-piece', pieceType: 'p' },
      },
      {
        id: 'move-pawn-2',
        description: 'Move another piece',
        validator: { type: 'move-piece', pieceType: 'p' },
      },
      {
        id: 'move-pawn-3',
        description: 'Great! Make one more move',
        validator: { type: 'move-piece', pieceType: 'p' },
      },
    ],
  },
  3: {
    id: 3,
    type: 'piece-movement',
    fen: '8/8/8/4N3/8/8/8/8 w - - 0 1',
    objectives: [
      {
        id: 'knight-1',
        description: 'Move the knight in an L-shape',
        validator: { type: 'move-piece', pieceType: 'n' },
      },
      {
        id: 'knight-2',
        description: 'Jump again! Knights love to hop',
        validator: { type: 'move-piece', pieceType: 'n' },
      },
      {
        id: 'knight-3',
        description: 'One more jump!',
        validator: { type: 'move-piece', pieceType: 'n' },
      },
    ],
  },
  4: {
    id: 4,
    type: 'piece-movement',
    fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
    objectives: [
      {
        id: 'rook-1',
        description: 'Move the rook in a straight line',
        validator: { type: 'move-piece', pieceType: 'r' },
      },
      {
        id: 'rook-2',
        description: 'Now move it the other direction',
        validator: { type: 'move-piece', pieceType: 'r' },
      },
      {
        id: 'rook-3',
        description: 'Great! Move it across the board',
        validator: { type: 'move-piece', pieceType: 'r' },
      },
    ],
  },
  5: {
    id: 5,
    type: 'piece-movement',
    fen: '8/8/8/8/3B4/8/8/8 w - - 0 1',
    objectives: [
      {
        id: 'bishop-1',
        description: 'Move the bishop diagonally',
        validator: { type: 'move-piece', pieceType: 'b' },
      },
      {
        id: 'bishop-2',
        description: 'Slide diagonally again',
        validator: { type: 'move-piece', pieceType: 'b' },
      },
      {
        id: 'bishop-3',
        description: 'Notice it stays on the same color!',
        validator: { type: 'move-piece', pieceType: 'b' },
      },
    ],
  },
  6: {
    id: 6,
    type: 'piece-movement',
    fen: '8/8/8/8/3Q4/8/8/8 w - - 0 1',
    objectives: [
      {
        id: 'queen-1',
        description: 'Move the queen in any direction',
        validator: { type: 'move-piece', pieceType: 'q' },
      },
      {
        id: 'queen-2',
        description: 'Try a diagonal move',
        validator: { type: 'move-piece', pieceType: 'q' },
      },
      {
        id: 'queen-3',
        description: 'The queen is powerful! Move again',
        validator: { type: 'move-piece', pieceType: 'q' },
      },
    ],
  },
  7: {
    id: 7,
    type: 'piece-movement',
    fen: '8/8/8/8/3K4/8/8/8 w - - 0 1',
    objectives: [
      {
        id: 'king-1',
        description: 'Move the king one square',
        validator: { type: 'move-piece', pieceType: 'k' },
      },
      {
        id: 'king-2',
        description: 'The king moves slowly - one step only',
        validator: { type: 'move-piece', pieceType: 'k' },
      },
      {
        id: 'king-3',
        description: 'Keep the king safe! Move again',
        validator: { type: 'move-piece', pieceType: 'k' },
      },
    ],
  },
  8: {
    id: 8,
    type: 'capture',
    fen: '8/8/3p4/8/3R4/8/8/8 w - - 0 1',
    objectives: [
      {
        id: 'capture-1',
        description: 'Capture the black pawn with your rook!',
        validator: { type: 'capture' },
      },
      {
        id: 'capture-2',
        description: 'Great! Make 2 more moves',
        validator: { type: 'any-moves', requiredCount: 2 },
      },
    ],
  },
  9: {
    id: 9,
    type: 'checkmate',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    objectives: [
      {
        id: 'checkmate-1',
        description: 'Move the rook to checkmate the king!',
        validator: { type: 'move-piece', pieceType: 'r' },
      },
    ],
  },
  10: {
    id: 10,
    type: 'free-play',
    fen: null,
    objectives: [
      {
        id: 'play-1',
        description: 'Play some moves!',
        validator: { type: 'any-moves', requiredCount: 5 },
      },
    ],
  },
};

export interface LessonState {
  tappedSquares: Set<string>;
  tappedCorners: Set<string>;
  moveCount: number;
  captureCount: number;
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
      return state.tappedSquares.size >= (validator.requiredCount || 5);

    case 'tap-corners':
      return (validator.requiredSquares || CORNER_SQUARES).every(sq =>
        state.tappedCorners.has(sq)
      );

    case 'count-confirm':
      return state.answeredCorrectly;

    case 'move-piece':
      return state.moveCount >= 1;

    case 'capture':
      return state.captureCount >= 1;

    case 'any-moves':
      return state.moveCount >= (validator.requiredCount || 1);

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

export function handleMove(state: LessonState, isCapture: boolean): LessonState {
  return {
    ...state,
    moveCount: state.moveCount + 1,
    captureCount: state.captureCount + (isCapture ? 1 : 0),
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
  };
}
