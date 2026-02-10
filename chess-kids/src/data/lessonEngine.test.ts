import { describe, it, expect } from 'vitest';
import {
  createInitialLessonState,
  checkObjectiveComplete,
  handleSquareTap,
  handleMove,
  handleAnswer,
  lessonConfigs,
  CORNER_SQUARES,
} from './lessonEngine';

describe('lessonEngine', () => {
  describe('createInitialLessonState', () => {
    it('creates empty initial state', () => {
      const state = createInitialLessonState();
      expect(state.tappedSquares.size).toBe(0);
      expect(state.tappedCorners.size).toBe(0);
      expect(state.moveCount).toBe(0);
      expect(state.captureCount).toBe(0);
      expect(state.currentObjectiveIndex).toBe(0);
      expect(state.completedObjectives).toEqual([]);
    });
  });

  describe('handleSquareTap', () => {
    it('adds tapped square to set', () => {
      const state = createInitialLessonState();
      const newState = handleSquareTap('e4', state);
      expect(newState.tappedSquares.has('e4')).toBe(true);
    });

    it('tracks corner squares separately', () => {
      const state = createInitialLessonState();
      const newState = handleSquareTap('a1', state);
      expect(newState.tappedCorners.has('a1')).toBe(true);
    });

    it('does not add non-corner to corners set', () => {
      const state = createInitialLessonState();
      const newState = handleSquareTap('e4', state);
      expect(newState.tappedCorners.has('e4')).toBe(false);
    });

    it('accumulates multiple taps', () => {
      let state = createInitialLessonState();
      state = handleSquareTap('a1', state);
      state = handleSquareTap('e4', state);
      state = handleSquareTap('h8', state);
      expect(state.tappedSquares.size).toBe(3);
      expect(state.tappedCorners.size).toBe(2);
    });
  });

  describe('handleMove', () => {
    const dummyFen = '8/8/8/8/8/8/8/8 w - - 0 1';

    it('increments move count and calculates distance', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, { piece: 'p', from: 'e2', to: 'e4', isCapture: false, newFen: dummyFen });
      expect(newState.moveCount).toBe(1);
      expect(newState.lastMove?.distance).toBe(2);
      expect(newState.lastMove?.piece).toBe('p');
    });

    it('increments capture count when capture is true', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: true, newFen: dummyFen });
      expect(newState.captureCount).toBe(1);
      expect(newState.moveCount).toBe(1);
    });

    it('does not increment capture count for non-capture', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: false, newFen: dummyFen });
      expect(newState.captureCount).toBe(0);
    });

    it('detects promotion flag', () => {
        const state = createInitialLessonState();
        const newState = handleMove(state, { piece: 'p', from: 'a7', to: 'a8', isCapture: false, newFen: dummyFen });
        expect(newState.lastMove?.flags).toContain('p');
    });
  });

  describe('Lesson 7: Setup (Explore Board)', () => {
    const lesson7 = lessonConfigs[7];

    describe('Objective 1: Tap corners', () => {
      const objective = lesson7.objectives[0];

      it('is complete with all 4 corners', () => {
        let state = createInitialLessonState();
        CORNER_SQUARES.forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });

    describe('Objective 2: Queen Home', () => {
        const objective = lesson7.objectives[1];

        it('is complete when d1 is tapped', () => {
            let state = createInitialLessonState();
            state = handleSquareTap('d1', state);
            expect(checkObjectiveComplete(objective, state)).toBe(true);
        });
    });
  });

  describe('Lesson 1: King (Piece Movement)', () => {
    const lesson1 = lessonConfigs[1];
    const dummyFen = '8/8/8/8/8/8/8/8 w - - 0 1';

    describe('Move King 1 square', () => {
      const objective = lesson1.objectives[0];

      it('is complete after moving king 1 square', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'k', from: 'e4', to: 'e5', isCapture: false, newFen: dummyFen });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('is NOT complete after moving king 2 squares (if possible in UI, though illegal)', () => {
        let state = createInitialLessonState();
        // Force state to reflect a 2 square move
        state = handleMove(state, { piece: 'k', from: 'e4', to: 'e6', isCapture: false, newFen: dummyFen });
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
    });
  });

  describe('Lesson 6: Pawns (Strict Moves)', () => {
      const lesson6 = lessonConfigs[6];
      const dummyFen = '8/8/8/8/8/8/8/8 w - - 0 1';

      describe('Objective 1: Move a2-a3', () => {
          const objective = lesson6.objectives[0];

          it('completes with exact move a2-a3', () => {
              let state = createInitialLessonState();
              state = handleMove(state, { piece: 'p', from: 'a2', to: 'a3', isCapture: false, newFen: dummyFen });
              expect(checkObjectiveComplete(objective, state)).toBe(true);
          });

          it('fails with wrong move e2-e3', () => {
              let state = createInitialLessonState();
              state = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: false, newFen: dummyFen });
              expect(checkObjectiveComplete(objective, state)).toBe(false);
          });
      });
  });

  describe('Castling Validator', () => {
      const dummyFen = '8/8/8/8/8/8/8/8 w - - 0 1';
      // Mock objective
      const objective = {
          id: 'castle',
          description: 'Castle',
          validator: { type: 'castling' }
      } as any;

      it('detects castling based on king move distance', () => {
          let state = createInitialLessonState();
          state = handleMove(state, { piece: 'k', from: 'e1', to: 'g1', isCapture: false, newFen: dummyFen }); // Kingside
          expect(checkObjectiveComplete(objective, state)).toBe(true);

          state = createInitialLessonState();
          state = handleMove(state, { piece: 'k', from: 'e1', to: 'c1', isCapture: false, newFen: dummyFen }); // Queenside
          expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('rejects normal king move', () => {
          let state = createInitialLessonState();
          state = handleMove(state, { piece: 'k', from: 'e1', to: 'e2', isCapture: false, newFen: dummyFen });
          expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
  });

  describe('Capture with FEN check (Lesson 13)', () => {
      // White captures Black Queen ('q')
      const objective = {
          id: 'cap-q',
          description: 'Cap Q',
          validator: { type: 'capture', capturedPiece: 'q', requiredCount: 1 }
      } as any;

      it('completes if black queen is missing in new FEN', () => {
          let state = createInitialLessonState();
          // Old FEN (implied): has q. New FEN: q is gone.
          const newFen = '8/8/8/8/8/8/8/8 w - - 0 1'; // No pieces
          state = handleMove(state, { piece: 'r', from: 'a1', to: 'a8', isCapture: true, newFen });
          expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('fails if black queen still exists', () => {
          let state = createInitialLessonState();
          const newFen = 'q7/8/8/8/8/8/8/8 w - - 0 1'; // q exists
          state = handleMove(state, { piece: 'r', from: 'a1', to: 'a7', isCapture: true, newFen });
          expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
  });

});
