import { describe, it, expect } from 'vitest';
import { expandBits, calculateMortonCode } from '../src/core/morton';

describe('Morton Code Helpers', () => {
  it('correctly expands 10-bit integer by inserting zeros', () => {
    // 1 (0b001) -> 0b001 = 1
    expect(expandBits(1)).toBe(1);
    // 2 (0b010) -> 0b010000 = 8
    expect(expandBits(2)).toBe(8);
    // 3 (0b011) -> 0b001001 = 9
    expect(expandBits(3)).toBe(9);
    // 1023 (0x3FF, all 10 bits 1) -> 0x09249249
    expect(expandBits(1023)).toBe(0x09249249);
  });

  it('calculates Morton code for minimum bounds point', () => {
    const min: [number, number, number] = [-10, -10, -10];
    const max: [number, number, number] = [10, 10, 10];
    const code = calculateMortonCode([-10, -10, -10], min, max);
    expect(code).toBe(0);
  });

  it('calculates Morton code for maximum bounds point', () => {
    const min: [number, number, number] = [0, 0, 0];
    const max: [number, number, number] = [1, 1, 1];
    const code = calculateMortonCode([1, 1, 1], min, max);
    // All 30 bits set: (0x09249249 << 2) | (0x09249249 << 1) | 0x09249249 = 0x3FFFFFFF
    expect(code).toBe(0x3fffffff);
  });

  it('clamps coordinates outside the bounding box safely', () => {
    const min: [number, number, number] = [0, 0, 0];
    const max: [number, number, number] = [10, 10, 10];
    const codeBelow = calculateMortonCode([-100, -100, -100], min, max);
    expect(codeBelow).toBe(0);
    const codeAbove = calculateMortonCode([100, 100, 100], min, max);
    expect(codeAbove).toBe(0x3fffffff);
  });

  it('handles degenerate zero-extent bounds gracefully without division by zero', () => {
    const min: [number, number, number] = [0, 0, 0];
    const max: [number, number, number] = [0, 0, 0];
    const code = calculateMortonCode([0, 0, 0], min, max);
    expect(code).toBeGreaterThanOrEqual(0);
  });
});
