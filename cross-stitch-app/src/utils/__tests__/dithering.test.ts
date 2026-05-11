import { describe, it, expect } from 'vitest'
import { medianFilter } from '../dithering'

describe('Median Filter', () => {
  it('smoothes a simple grid', () => {
    const grid: number[][] = [
      [128, 128, 128],
      [128, 128, 128],
    ]
    const result = medianFilter(grid, 1)
    expect(result.length).toBe(2)
  })

  it('handles single-row grid', () => {
    const grid: number[][] = [[100, 150, 100]]
    const result = medianFilter(grid, 1)
    expect(result.length).toBe(1)
  })
})
