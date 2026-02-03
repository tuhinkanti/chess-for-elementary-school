import { render } from '@testing-library/react';
import { ExploreBoard } from './ExploreBoard';
import { describe, it, expect, vi } from 'vitest';

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
    // Color: #88a65e (Dark)
    const colorA8 = getSquareColor(0, 8);
    // console.log('a8 color:', colorA8);
    // Note: style.background usually returns RGB in jsdom? Or the string if set via style prop?
    // React style prop usually sets it as string.
    expect(colorA8).toBe('rgb(136, 166, 94)'); // #88a65e

    // a1: fileIndex 0, rank 1.
    // isLight = (0 + 1) % 2 === 1 -> True.
    // Color: #f0f1d8 (Light)
    const colorA1 = getSquareColor(0, 1);
    expect(colorA1).toBe('rgb(240, 241, 216)'); // #f0f1d8

    // b8: fileIndex 1, rank 8.
    // isLight = (1 + 8) % 2 === 1 -> True.
    const colorB8 = getSquareColor(1, 8);
    expect(colorB8).toBe('rgb(240, 241, 216)');
  });
});
