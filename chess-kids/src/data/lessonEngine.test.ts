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
    it('increments move count and calculates distance', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, { piece: 'p', from: 'e2', to: 'e4', isCapture: false });
      expect(newState.moveCount).toBe(1);
      expect(newState.lastMove?.distance).toBe(2);
      expect(newState.lastMove?.piece).toBe('p');
    });

    it('increments capture count when capture is true', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: true });
      expect(newState.captureCount).toBe(1);
      expect(newState.moveCount).toBe(1);
    });

    it('does not increment capture count for non-capture', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: false });
      expect(newState.captureCount).toBe(0);
    });
  });

  describe('Lesson 1: Meet the Board', () => {
    const lesson1 = lessonConfigs[1];

    describe('Objective 1: Tap 5 different squares', () => {
      const objective = lesson1.objectives[0];

      it('is not complete with 0 taps', () => {
        const state = createInitialLessonState();
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete with 5 taps', () => {
        let state = createInitialLessonState();
        ['a1', 'b2', 'c3', 'd4', 'e5'].forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });

    describe('Objective 2: Find all 4 corners', () => {
      const objective = lesson1.objectives[1];

      it('is complete with all 4 corners', () => {
        let state = createInitialLessonState();
        CORNER_SQUARES.forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });

    describe('Objective 3: Count confirmation', () => {
      const objective = lesson1.objectives[2];

      it('is complete after correct answer', () => {
        let state = createInitialLessonState();
        state = handleAnswer(state, true);
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });
  });

  describe('Lesson 2: Pawn Movement', () => {
    const lesson2 = lessonConfigs[2];

    describe('Move pawn 1 square', () => {
      const objective = lesson2.objectives[0];

      it('is complete after moving pawn 1 square', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: false });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('is NOT complete after moving pawn 2 squares', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'p', from: 'e2', to: 'e4', isCapture: false });
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is NOT complete after moving a different piece (if forced)', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'n', from: 'b1', to: 'c3', isCapture: false });
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
    });

    describe('Move pawn 2 squares (Big Step)', () => {
      const objective = lesson2.objectives[1];

      it('is complete after moving pawn 2 squares', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'p', from: 'e2', to: 'e4', isCapture: false });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('is NOT complete after moving pawn 1 square', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: false });
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
    });
  });

  describe('Lesson 8: Capture', () => {
    const lesson8 = lessonConfigs[8];

    describe('Capture objective', () => {
      const objective = lesson8.objectives[0];

      it('is not complete with 0 captures', () => {
        const state = createInitialLessonState();
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete after capture', () => {
        let state = createInitialLessonState();
        state = handleMove(state, { piece: 'r', from: 'd4', to: 'd6', isCapture: true });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });
  });

  describe('any-moves validator', () => {
    it('requires specified number of moves', () => {
      const objective = lessonConfigs[8].objectives[1];
      let state = createInitialLessonState();

      state = handleMove(state, { piece: 'p', from: 'e2', to: 'e3', isCapture: false });
      expect(checkObjectiveComplete(objective, state)).toBe(false);

      state = handleMove(state, { piece: 'p', from: 'e3', to: 'e4', isCapture: false });
      expect(checkObjectiveComplete(objective, state)).toBe(true);
    });
  });
});
