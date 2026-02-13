import { render } from '@testing-library/react';
import { ExploreBoard } from './ExploreBoard';
import { describe, it, expect, vi } from 'vitest';
import { BOARD_COLORS } from '../constants/colors';

const hexToRgb = (hex: string) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

describe('ExploreBoard', () => {
  it('renders correctly with correct square colors', () => {
    const props = {
      tappedSquares: new Set<string>(),
      tappedCorners: new Set<string>(),
      onSquareTap: vi.fn(),
    };

    const { container } = render(<ExploreBoard {...props} />);

    // Check a few squares
    // We can find squares by their key or just by traversing.
    // The squares don't have unique text content that identifies them easily (except maybe corner stars).
    // However, the component maps RANKS then FILES.
    // So the order in DOM should be:
    // Rank 8: a8, b8, ..., h8
    // Rank 7: a7, ...

    const squares = container.getElementsByClassName('explore-square');
    expect(squares.length).toBe(64);

    // Helper to get color of square at specific rank/file
    // DOM order is Rank 8 first (index 0..7), then Rank 7 (8..15), etc.
    const getSquareColor = (fileIndex: number, rankValue: number) => {
      // rankValue 8 is the first row. 8 - rankValue is the row index (0-based)
      const rowIndex = 8 - rankValue;
      const index = rowIndex * 8 + fileIndex;
      return (squares[index] as HTMLElement).style.background;
    };

    // a8: fileIndex 0, rank 8.
    // isLight = (0 + 8) % 2 === 1 -> False.
    // Color: BOARD_COLORS.dark
    const colorA8 = getSquareColor(0, 8);
    expect(colorA8).toBe(hexToRgb(BOARD_COLORS.dark));

    // a1: fileIndex 0, rank 1.
    // isLight = (0 + 1) % 2 === 1 -> True.
    // Color: BOARD_COLORS.light
    const colorA1 = getSquareColor(0, 1);
    expect(colorA1).toBe(hexToRgb(BOARD_COLORS.light));

    // b8: fileIndex 1, rank 8.
    // isLight = (1 + 8) % 2 === 1 -> True.
    const colorB8 = getSquareColor(1, 8);
    expect(colorB8).toBe(hexToRgb(BOARD_COLORS.light));
  });
});
