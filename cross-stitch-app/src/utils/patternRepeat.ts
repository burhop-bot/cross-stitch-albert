/**
 * Pattern Repeat — tile a grid selection into repeating blocks.
 * Useful for traditional cross-stitch motifs (flower gardens, quilt patterns, etc.)
 */

/**
 * Tile a grid region horizontally by repeating it `count` times.
 */
export function repeatGridHorizontal(
  grid: number[][],
  repeatX: number,
  repeatY: number
): number[][] {
  const rows = grid.length
  if (rows === 0) return grid
  const cols = grid[0].length

  const resultRows = rows * repeatY
  const resultCols = cols * repeatX
  const result: number[][] = []

  for (let y = 0; y < resultRows; y++) {
    const srcY = y % rows
    const row: number[] = []
    for (let x = 0; x < resultCols; x++) {
      const srcX = x % cols
      row.push(grid[srcY][srcX])
    }
    result.push(row)
  }

  return result
}

/**
 * Repeat the grid both horizontally and vertically by the given counts.
 */
export function repeatGrid(
  grid: number[][],
  repeatX: number,
  repeatY: number
): number[][] {
  if (repeatX <= 0 || repeatY <= 0) return grid
  return repeatGridHorizontal(grid, repeatX, repeatY)
}

/**
 * Mirror the grid horizontally (original + flip = mirrored pair).
 */
export function repeatWithMirrorH(
  grid: number[][],
  repeatX: number,
  repeatY: number
): number[][] {
  if (repeatX <= 0 || repeatY <= 0) return grid

  // Create a horizontally mirrored pair (original + flip)
  const mirrored: number[][] = []
  for (let y = 0; y < grid.length; y++) {
    mirrored.push([...grid[y], ...grid[y]].reverse())
  }
  return mirrored
}

/**
 * Mirror the grid vertically (original + flip = mirrored pair).
 */
export function repeatWithMirrorV(
  grid: number[][],
  repeatX: number,
  repeatY: number
): number[][] {
  if (repeatX <= 0 || repeatY <= 0) return grid

  // Create a vertically mirrored pair (original + flip)
  const mirrored = [...grid, ...grid.slice().reverse()]
  return mirrored
}

/**
 * Mirror both axes (4-way symmetry).
 */
export function repeatWithMirrorBoth(
  grid: number[][],
  repeatX: number,
  repeatY: number
): number[][] {
  if (repeatX <= 0 || repeatY <= 0) return grid

  // Create a 4-way mirrored version (quarter-turn symmetry)
  const mirrored: number[][] = []

  // Top-left (original)
  for (let y = 0; y < grid.length; y++) {
    mirrored.push([...grid[y]])
  }
  // Top-right (horizontal mirror of original)
  for (let y = 0; y < grid.length; y++) {
    mirrored.push([...grid[y]].reverse())
  }

  // Bottom-left (vertical mirror of original)
  for (let y = grid.length - 1; y >= 0; y--) {
    mirrored.push([...grid[y]])
  }
  // Bottom-right (both mirrors)
  for (let y = grid.length - 1; y >= 0; y--) {
    mirrored.push([...grid[y]].reverse())
  }

  return mirrored
}

/**
 * Mirror a selection region horizontally within a grid.
 */
export function mirrorSelectionH(
  grid: number[][],
  sel: { x1: number; y1: number; x2: number; y2: number }
): number[][] {
  const left = Math.min(sel.x1, sel.x2)
  const right = Math.max(sel.x1, sel.x2)
  const top = Math.min(sel.y1, sel.y2)
  const bottom = Math.max(sel.y1, sel.y2)
  const result = grid.map((row) => [...row])

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const mirroredX = left + (right - x)
      result[y][x] = grid[y][mirroredX]
    }
  }
  return result
}

/**
 * Mirror a selection region vertically within a grid.
 */
export function mirrorSelectionV(
  grid: number[][],
  sel: { x1: number; y1: number; x2: number; y2: number }
): number[][] {
  const top = Math.min(sel.y1, sel.y2)
  const bottom = Math.max(sel.y1, sel.y2)
  const left = Math.min(sel.x1, sel.x2)
  const right = Math.max(sel.x1, sel.x2)
  const result = grid.map((row) => [...row])

  for (let y = top; y <= bottom; y++) {
    const mirroredY = top + (bottom - y)
    for (let x = left; x <= right; x++) {
      result[y][x] = grid[mirroredY][x]
    }
  }
  return result
}

/**
 * Mirror the entire grid horizontally.
 */
export function mirrorGridH(grid: number[][]): number[][] {
  return grid.map((row) => [...row].reverse())
}

/**
 * Mirror the entire grid vertically.
 */
export function mirrorGridV(grid: number[][]): number[][] {
  return [...grid].reverse()
}

/**
 * Mirror grid with offset — shifts the mirrored copy by a number of stitches.
 * Useful for quilt blocks, overlapping motifs.
 */
export function mirrorGridWithOffset(
  grid: number[][],
  axis: 'h' | 'v',
  offsetStitches: number
): number[][] {
  const result = grid.map((row) => [...row])

  if (axis === 'h') {
    // Mirror horizontally with offset
    const newWidth = grid[0].length + offsetStitches
    const newHeight = grid.length

    // Create a new wider grid
    const newGrid: number[][] = Array.from({ length: newHeight }, () =>
      Array(newWidth).fill(0)
    )

    // Copy original to left side
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        newGrid[y][x] = grid[y][x]
      }
    }

    // Mirror and offset to the right
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const newX = grid[0].length + offsetStitches - 1 - x
        if (newX < newWidth) {
          newGrid[y][newX] = grid[y][x]
        }
      }
    }

    return newGrid
  } else {
    // Mirror vertically with offset
    const newHeight = grid.length + offsetStitches
    const newWidth = grid[0].length

    const newGrid: number[][] = Array.from({ length: newHeight }, () =>
      Array(newWidth).fill(0)
    )

    // Copy original to top
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        newGrid[y][x] = grid[y][x]
      }
    }

    // Mirror and offset below
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[0].length; x++) {
        const newY = grid.length + offsetStitches - 1 - y
        if (newY < newHeight) {
          newGrid[newY][x] = grid[y][x]
        }
      }
    }

    return newGrid
  }
}

/**
 * Mirror selection with offset — mirrors selected region and shifts it.
 */
export function mirrorSelectionWithOffset(
  grid: number[][],
  sel: { x1: number; y1: number; x2: number; y2: number },
  offset: number
): number[][] {
  const result = grid.map((row) => [...row])
  const left = Math.min(sel.x1, sel.x2)
  const right = Math.max(sel.x1, sel.x2)
  const top = Math.min(sel.y1, sel.y2)
  const bottom = Math.max(sel.y1, sel.y2)
  const selW = right - left + 1
  const selH = bottom - top + 1

  // Copy selection to offset position
  for (let sy = 0; sy < selH; sy++) {
    for (let sx = 0; sx < selW; sx++) {
      const ny = bottom + offset + 1 + sy
      const nx = left + (selW - 1 - sx) // mirrored
      if (ny < result.length && nx >= 0 && nx < result[0].length) {
        result[ny][nx] = grid[top + sy][left + sx]
      }
    }
  }

  return result
}
