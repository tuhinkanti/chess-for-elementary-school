import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ChessBoard } from './ChessBoard';
import { Chessboard } from 'react-chessboard';

// Mock react-chessboard
vi.mock('react-chessboard', () => ({
  Chessboard: vi.fn(() => null),
}));

// Helper to access mock
const mockChessboard = Chessboard as unknown as import('vitest').Mock;

describe('ChessBoard Performance', () => {
  it('memoizes customSquareStyles when dependencies are stable', () => {
    // Even without passing explicit props (using defaults),
    // the styles should be stable across renders if internal state doesn't change.
    const { rerender } = render(<ChessBoard />);

    const initialCall = mockChessboard.mock.lastCall![0];
    const initialStyles = initialCall.customSquareStyles;

    // Rerender with same props
    rerender(<ChessBoard />);

    const secondCall = mockChessboard.mock.lastCall![0];
    const secondStyles = secondCall.customSquareStyles;

    // OPTIMIZED: They should be the same reference now
    expect(initialStyles).toBe(secondStyles);
  });

  it('updates customSquareStyles when highlightSquares prop changes', () => {
    const { rerender } = render(<ChessBoard highlightSquares={['e4']} />);

    const initialCall = mockChessboard.mock.lastCall![0];
    const initialStyles = initialCall.customSquareStyles;

    // Rerender with different highlightSquares
    rerender(<ChessBoard highlightSquares={['d4']} />);

    const secondCall = mockChessboard.mock.lastCall![0];
    const secondStyles = secondCall.customSquareStyles;

    // Functionality: They should be different
    expect(initialStyles).not.toBe(secondStyles);
    expect(initialStyles['e4']).toBeDefined();
    expect(secondStyles['d4']).toBeDefined();
  });
});
