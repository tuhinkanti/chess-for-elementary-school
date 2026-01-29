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
    it('increments move count', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, false);
      expect(newState.moveCount).toBe(1);
    });

    it('increments capture count when capture is true', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, true);
      expect(newState.captureCount).toBe(1);
      expect(newState.moveCount).toBe(1);
    });

    it('does not increment capture count for non-capture', () => {
      const state = createInitialLessonState();
      const newState = handleMove(state, false);
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

      it('is not complete with 4 taps', () => {
        let state = createInitialLessonState();
        ['a1', 'b2', 'c3', 'd4'].forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete with 5 taps', () => {
        let state = createInitialLessonState();
        ['a1', 'b2', 'c3', 'd4', 'e5'].forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('counts unique squares only', () => {
        let state = createInitialLessonState();
        ['a1', 'a1', 'a1', 'b2', 'c3'].forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(state.tappedSquares.size).toBe(3);
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
    });

    describe('Objective 2: Find all 4 corners', () => {
      const objective = lesson1.objectives[1];

      it('is not complete with 0 corners', () => {
        const state = createInitialLessonState();
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is not complete with 3 corners', () => {
        let state = createInitialLessonState();
        ['a1', 'a8', 'h1'].forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete with all 4 corners', () => {
        let state = createInitialLessonState();
        CORNER_SQUARES.forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('works regardless of order', () => {
        let state = createInitialLessonState();
        ['h8', 'a1', 'h1', 'a8'].forEach(sq => {
          state = handleSquareTap(sq, state);
        });
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });

    describe('Objective 3: Count confirmation', () => {
      const objective = lesson1.objectives[2];

      it('is not complete initially', () => {
        const state = createInitialLessonState();
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete after correct answer', () => {
        let state = createInitialLessonState();
        state = handleAnswer(state, true);
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });

      it('is not complete after wrong answer', () => {
        let state = createInitialLessonState();
        state = handleAnswer(state, false);
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });
    });
  });

  describe('Lesson 2: Pawn Movement', () => {
    const lesson2 = lessonConfigs[2];

    describe('Move piece objectives', () => {
      const objective = lesson2.objectives[0];

      it('is not complete with 0 moves', () => {
        const state = createInitialLessonState();
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete after 1 move', () => {
        let state = createInitialLessonState();
        state = handleMove(state, false);
        expect(checkObjectiveComplete(objective, state)).toBe(true);
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

      it('is not complete with non-capture move', () => {
        let state = createInitialLessonState();
        state = handleMove(state, false);
        expect(checkObjectiveComplete(objective, state)).toBe(false);
      });

      it('is complete after capture', () => {
        let state = createInitialLessonState();
        state = handleMove(state, true);
        expect(checkObjectiveComplete(objective, state)).toBe(true);
      });
    });
  });

  describe('any-moves validator', () => {
    it('requires specified number of moves', () => {
      const objective = lessonConfigs[8].objectives[1];
      let state = createInitialLessonState();
      
      state = handleMove(state, false);
      expect(checkObjectiveComplete(objective, state)).toBe(false);
      
      state = handleMove(state, false);
      expect(checkObjectiveComplete(objective, state)).toBe(true);
    });
  });

  describe('lessonConfigs', () => {
    it('has config for lessons 1-10', () => {
      for (let i = 1; i <= 10; i++) {
        expect(lessonConfigs[i]).toBeDefined();
        expect(lessonConfigs[i].id).toBe(i);
        expect(lessonConfigs[i].objectives.length).toBeGreaterThan(0);
      }
    });

    it('lesson 1 has explore-board type', () => {
      expect(lessonConfigs[1].type).toBe('explore-board');
      expect(lessonConfigs[1].allowAllSquares).toBe(true);
    });

    it('lesson 1 has null fen (empty board for exploration)', () => {
      expect(lessonConfigs[1].fen).toBeNull();
    });
  });
});
