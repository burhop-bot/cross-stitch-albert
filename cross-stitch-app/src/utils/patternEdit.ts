/**
 * Pattern editing utilities
 * 
 * Crop blank borders, batch recolor, and color swap across brands
 */

// ============================================================
// Crop Blank Borders
// ============================================================

/**
 * Remove blank (all-white/null) borders from a grid.
 * Returns a new grid with the smallest bounding box that contains
 * at least one non-blank stitch.
 * 
 * @param grid - 2D array of color indices
 * @param blankIndices - Set of indices considered "blank" (default: [-1, 0] if 0 maps to white)
 * @returns The cropped grid, or the original if no content found
 */
export function cropBlankBorders(
  grid: number[][],
  blankIndices: Set<number> = new Set([-1, 0])
): number[][] {
  if (grid.length === 0) return []
  const height = grid.length
  const width = grid[0].length

  let top = height, bottom = -1, left = width, right = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!blankIndices.has(grid[y][x])) {
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
    }
  }

  // No content found
  if (bottom === -1 || right === -1) return grid

  const cropped = []
  for (let y = top; y <= bottom; y++) {
    const row: number[] = []
    for (let x = left; x <= right; x++) {
      row.push(grid[y][x])
    }
    cropped.push(row)
  }

  return cropped
}

/**
 * Calculate how many stitches were cropped from each side
 */
export function getCropInfo(
  grid: number[][],
  blankIndices: Set<number> = new Set([-1, 0])
): { top: number; bottom: number; left: number; right: number; cropped: number[][] } {
  if (grid.length === 0) {
    return { top: 0, bottom: 0, left: 0, right: 0, cropped: [] }
  }

  const height = grid.length
  const width = grid[0].length
  let top = height, bottom = -1, left = width, right = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!blankIndices.has(grid[y][x])) {
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
        left = Math.min(left, x)
        right = Math.max(right, x)
      }
    }
  }

  if (bottom === -1 || right === -1) {
    return { top: 0, bottom: 0, left: 0, right: 0, cropped: grid }
  }

  const cropped = []
  for (let y = top; y <= bottom; y++) {
    const row: number[] = []
    for (let x = left; x <= right; x++) {
      row.push(grid[y][x])
    }
    cropped.push(row)
  }

  return {
    top,
    bottom: height - 1 - bottom,
    left,
    right: width - 1 - right,
    cropped,
  }
}

// ============================================================
// Batch Recolor
// ============================================================

/**
 * Replace all occurrences of one color with another in the grid.
 * Returns a new grid (non-mutating).
 * 
 * @param grid - 2D array of color indices
 * @param fromIndex - Current color index to replace
 * @param toIndex - New color index to use
 * @returns { grid, count } where count is the number of replacements
 */
export function batchRecolor(
  grid: number[][],
  fromIndex: number,
  toIndex: number
): { grid: number[][]; count: number } {
  let count = 0
  const newGrid = grid.map((row) =>
    row.map((cell) => {
      if (cell === fromIndex) {
        count++
        return toIndex
      }
      return cell
    })
  )

  return { grid: newGrid, count }
}

/**
 * Replace all occurrences of multiple color mappings in the grid.
 * Returns a new grid.
 * 
 * @param grid - 2D array of color indices
 * @param replacements - Map of oldColor -> newColor
 * @returns { grid, count } where count is total replacements across all mappings
 */
export function batchRecolorMultiple(
  grid: number[][],
  replacements: Map<number, number>
): { grid: number[][]; count: number } {
  let count = 0
  const newGrid = grid.map((row) =>
    row.map((cell) => {
      if (replacements.has(cell)) {
        count++
        return replacements.get(cell)!
      }
      return cell
    })
  )

  return { grid: newGrid, count }
}

// ============================================================
// Color Swap (brand-agnostic)
// ============================================================

/**
 * Swap two color indices throughout the grid AND update the palette.
 * Returns a new grid AND a new palette (non-mutating).
 * 
 * @param grid - 2D array of color indices
 * @param palette - Array of color objects (r,g,b,number,name,hex)
 * @param idxA - First color index
 * @param idxB - Second color index
 * @returns { grid, palette } with colors swapped
 */
export function swapColors(
  grid: number[][],
  palette: { r: number; g: number; b: number; number: string; name: string; hex: string }[],
  idxA: number,
  idxB: number
): { grid: number[][]; palette: typeof palette } {
  if (idxA === idxB) return { grid: grid.map((r) => [...r]), palette }
  if (idxA < 0 || idxA >= palette.length || idxB < 0 || idxB >= palette.length) {
    return { grid: grid.map((r) => [...r]), palette }
  }

  // Swap palette entries
  const newPalette = [...palette]
  const temp = newPalette[idxA]
  newPalette[idxA] = newPalette[idxB]
  newPalette[idxB] = temp

  // Swap grid entries
  const newGrid = grid.map((row) =>
    row.map((cell) => {
      if (cell === idxA) return idxB
      if (cell === idxB) return idxA
      return cell
    })
  )

  return { grid: newGrid, palette: newPalette }
}

/**
 * Get the count of each color in a grid.
 * Useful for batch recolor UI to show how many stitches would be affected.
 */
export function countColorsInGrid(grid: number[][]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const row of grid) {
    for (const cell of row) {
      if (cell >= 0) {
        counts.set(cell, (counts.get(cell) || 0) + 1)
      }
    }
  }
  return counts
}
