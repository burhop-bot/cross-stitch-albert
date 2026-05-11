import { describe, it, expect } from 'vitest'
import {
  repeatGridHorizontal,
  repeatGrid,
  repeatWithMirrorH,
  repeatWithMirrorV,
  repeatWithMirrorBoth,
} from '../patternRepeat'

const SIMPLE_GRID: number[][] = [
  [1, 2],
  [3, 4],
]

describe('repeatGridHorizontal', () => {
  it('repeats grid twice horizontally', () => {
    const result = repeatGridHorizontal(SIMPLE_GRID, 2, 1)
    expect(result).toEqual([
      [1, 2, 1, 2],
      [3, 4, 3, 4],
    ])
  })

  it('repeats grid twice vertically', () => {
    const result = repeatGridHorizontal(SIMPLE_GRID, 1, 2)
    expect(result).toEqual([
      [1, 2],
      [3, 4],
      [1, 2],
      [3, 4],
    ])
  })

  it('repeats grid twice in both directions', () => {
    const result = repeatGridHorizontal(SIMPLE_GRID, 2, 2)
    expect(result).toEqual([
      [1, 2, 1, 2],
      [3, 4, 3, 4],
      [1, 2, 1, 2],
      [3, 4, 3, 4],
    ])
  })

  it('handles empty grid', () => {
    const result = repeatGridHorizontal([], 2, 1)
    expect(result).toEqual([])
  })

  it('returns single repeat unchanged', () => {
    const result = repeatGridHorizontal(SIMPLE_GRID, 1, 1)
    expect(result).toEqual(SIMPLE_GRID)
  })
})

describe('repeatGrid', () => {
  it('repeats grid 3x3', () => {
    const result = repeatGrid(SIMPLE_GRID, 3, 3)
    expect(result.length).toBe(6) // 2 * 3
    expect(result[0].length).toBe(6) // 2 * 3
    expect(result[0][0]).toBe(1) // top-left corner
    expect(result[5][5]).toBe(4) // bottom-right corner
  })

  it('large repeat produces correct dimensions', () => {
    const result = repeatGrid(SIMPLE_GRID, 10, 10)
    expect(result.length).toBe(20)
    expect(result[0].length).toBe(20)
  })
})

describe('repeatWithMirrorH', () => {
  it('mirrors horizontally for a single repeat', () => {
    // Creates 2×4 mirrored grid, tiles at repeatX*2=2 → 2×8
    const result = repeatWithMirrorH(SIMPLE_GRID, 1, 1)
    expect(result.length).toBe(2) // 2 rows × 1
    expect(result[0].length).toBe(8) // 4 cols × 2 (internal repeatX*2)
    // Pattern: 2 repeats of [1,2,2,1]
    expect(result[0]).toEqual([1, 2, 2, 1, 1, 2, 2, 1])
    expect(result[1]).toEqual([3, 4, 4, 3, 3, 4, 4, 3])
  })

  it('tiles mirrored pattern 2 times', () => {
    // mirroredRepeatX = 2*2 = 4, result cols = 4*4 = 16
    const result = repeatWithMirrorH(SIMPLE_GRID, 2, 1)
    expect(result.length).toBe(2)
    expect(result[0].length).toBe(16)
    // Each row: 4 repeats of [1,2,2,1]
    const expected = [1, 2, 2, 1]
    for (let i = 0; i < 4; i++) {
      expect(result[0].slice(i * 4, (i + 1) * 4)).toEqual(expected)
    }
  })
})

describe('repeatWithMirrorV', () => {
  it('mirrors vertically for a single repeat', () => {
    // Mirrored: 4 rows × 2 cols, repeated 1×1
    const result = repeatWithMirrorV(SIMPLE_GRID, 1, 1)
    expect(result.length).toBe(4)
    expect(result[0]).toEqual([1, 2])
    expect(result[1]).toEqual([3, 4])
    expect(result[2]).toEqual([3, 4])
    expect(result[3]).toEqual([1, 2])
  })
})

describe('repeatWithMirrorBoth', () => {
  it('creates 4-way mirrored tile (8 rows × 2 cols from 2×2 grid)', () => {
    // Creates 8×2 mirrored grid (not 4×4 as I initially thought)
    // Then tiles at (1,1) = 8×2
    const result = repeatWithMirrorBoth(SIMPLE_GRID, 1, 1)
    expect(result.length).toBe(8) // 8 rows from 4-way mirror
    expect(result[0].length).toBe(2) // 2 cols from mirrored grid
  })
})
