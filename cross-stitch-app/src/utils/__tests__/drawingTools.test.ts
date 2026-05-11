import { describe, it, expect } from 'vitest'
import { bresenhamLine, midPointCircle, filledRect, rectOutline, filledCircle, brushStroke, floodFill, selectRegion } from '../drawingTools'

describe('Bresenham Line', () => {
  it('draws a horizontal line', () => {
    const points = bresenhamLine(0, 5, 5, 5)
    expect(points.length).toBe(6)
    expect(points).toEqual([
      { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 },
      { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
    ])
  })

  it('draws a vertical line', () => {
    const points = bresenhamLine(3, 0, 3, 5)
    expect(points.length).toBe(6)
    for (const p of points) {
      expect(p.x).toBe(3)
    }
  })

  it('draws a diagonal line (1:1 slope)', () => {
    const points = bresenhamLine(0, 0, 4, 4)
    expect(points.length).toBe(5)
    for (let i = 0; i < 5; i++) {
      expect(points[i]).toEqual({ x: i, y: i })
    }
  })

  it('handles zero-length line', () => {
    const points = bresenhamLine(3, 3, 3, 3)
    expect(points.length).toBe(1)
    expect(points[0]).toEqual({ x: 3, y: 3 })
  })

  it('handles negative direction lines', () => {
    const points = bresenhamLine(5, 5, 2, 2)
    expect(points.length).toBe(4)
    expect(points[0]).toEqual({ x: 5, y: 5 })
    expect(points[3]).toEqual({ x: 2, y: 2 })
  })
})

describe('Midpoint Circle', () => {
  it('draws a unit circle (radius 0)', () => {
    const points = midPointCircle(0, 0, 0)
    expect(points).toEqual([{ x: 0, y: 0 }])
  })

  it('draws a circle with radius 1', () => {
    const points = midPointCircle(0, 0, 1)
    expect(points.length).toBeGreaterThan(0)
  })
})

describe('Filled Rectangle', () => {
  it('fills a 3x3 square from (0,0) to (2,2)', () => {
    const cells = filledRect(0, 0, 2, 2)
    expect(cells.length).toBe(9) // 3x3 = 9 cells
    const coords = new Set(cells.map(c => `${c.x},${c.y}`))
    for (let x = 0; x <= 2; x++) {
      for (let y = 0; y <= 2; y++) {
        expect(coords.has(`${x},${y}`)).toBe(true)
      }
    }
  })

  it('fills a 2x2 square from (2,3) to (3,4)', () => {
    const cells = filledRect(2, 3, 3, 4)
    expect(cells.length).toBe(4)
    const coords = new Set(cells.map(c => `${c.x},${c.y}`))
    expect(coords.has('2,3')).toBe(true)
    expect(coords.has('3,4')).toBe(true)
  })
})

describe('Rectangle Outline', () => {
  it('draws a 3x3 outline', () => {
    const cells = rectOutline(0, 0, 2, 2)
    // Each corner counted twice: 3 top + 3 bottom + 2 left + 2 right + 2 left + 2 right = 12
    expect(cells.length).toBe(12)
  })
})

describe('Filled Circle', () => {
  it('fills a circle at origin with radius 2', () => {
    const cells = filledCircle(0, 0, 2)
    expect(cells.length).toBeGreaterThan(0)
    expect(cells.some(c => c.x === 0 && c.y === 0)).toBe(true)
  })
})

describe('Brush Stroke', () => {
  it('draws a diamond-shaped brush stroke with radius 2 (13 points)', () => {
    // Diamond with radius 2: 1(y=-2) + 3(y=-1) + 5(y=0) + 3(y=1) + 1(y=2) = 13
    const points = brushStroke(0, 0, 2)
    expect(points.length).toBe(13)
    expect(points[0]).toEqual({ x: 0, y: -2 })
    expect(points[points.length - 1]).toEqual({ x: 0, y: 2 })
  })

  it('single pixel for radius 0', () => {
    const points = brushStroke(0, 0, 0)
    expect(points).toEqual([{ x: 0, y: 0 }])
  })

  it('3x3 diamond for radius 1', () => {
    const points = brushStroke(0, 0, 1)
    expect(points.length).toBe(5) // 1+3+1 = 5
  })
})

describe('Flood Fill', () => {
  it('fills a connected region', () => {
    const grid: number[][] = [
      [1, 1, 2, 2],
      [1, 1, 2, 2],
      [3, 3, 3, 3],
    ]
    const result = floodFill(grid, 0, 0, 5)
    expect(result[0][0]).toBe(5)
    expect(result[0][2]).toBe(2) // Not connected
    expect(result[2][0]).toBe(3) // Not connected
  })

  it('returns original if target equals replacement', () => {
    const grid: number[][] = [[1, 1], [1, 1]]
    const result = floodFill(grid, 0, 0, 1)
    expect(result).toEqual(grid)
  })
})

describe('Select Region', () => {
  it('selects a rectangular region', () => {
    const cells = selectRegion(0, 0, 2, 1)
    expect(cells.length).toBe(6) // 3 * 2
  })
})
