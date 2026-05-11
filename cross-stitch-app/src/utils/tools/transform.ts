/**
 * Transform utilities: mirror, flip, copy, paste, brush stroke
 */

export interface Selection {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Mirror a row's design horizontally (left-to-right flip)
 */
export function mirrorHorizontally(design: number[][]): number[][] {
  return design.map((row) => [...row].reverse())
}

/**
 * Mirror the entire design vertically (top-to-bottom flip)
 */
export function mirrorVertically(design: number[][]): number[][] {
  return [...design].reverse()
}

/**
 * Mirror just a selection area horizontally
 */
export function mirrorSelection(
  design: number[][],
  sel: Selection
): number[][] {
  const newDesign = design.map((row) => [...row])
  const minY = Math.min(sel.y1, sel.y2)
  const maxY = Math.max(sel.y1, sel.y2)
  const minX = Math.min(sel.x1, sel.x2)
  const maxX = Math.max(sel.x1, sel.x2)
  
  for (let y = minY; y <= maxY; y++) {
    const rowWidth = maxX - minX + 1
    const row = newDesign[y]
    for (let i = 0; i < rowWidth; i++) {
      const left = minX + i
      const right = maxX - i
      if (left < right) {
        const temp = row[left]
        row[left] = row[right]
        row[right] = temp
      }
    }
  }
  
  return newDesign
}

/**
 * Mirror just a selection area vertically
 */
export function mirrorSelectionVertically(
  design: number[][],
  sel: Selection
): number[][] {
  const newDesign = design.map((row) => [...row])
  const minY = Math.min(sel.y1, sel.y2)
  const maxY = Math.max(sel.y1, sel.y2)
  const minX = Math.min(sel.x1, sel.x2)
  const maxX = Math.max(sel.x1, sel.x2)
  
  for (let y = minY; y <= maxY; y++) {
    const srcRow = minY + (maxY - y)
    const rowWidth = maxX - minX + 1
    for (let x = 0; x < rowWidth; x++) {
      newDesign[y][minX + x] = newDesign[srcRow][minX + x]
    }
  }
  
  return newDesign
}

/**
 * Extract a selection from the design
 */
export function extractSelection(
  design: number[][],
  sel: Selection
): number[][] {
  const minX = Math.min(sel.x1, sel.x2)
  const maxX = Math.max(sel.x1, sel.x2)
  const minY = Math.min(sel.y1, sel.y2)
  const maxY = Math.max(sel.y1, sel.y2)
  
  const width = maxX - minX + 1
  const height = maxY - minY + 1
  const selection: number[][] = []
  
  for (let y = minY; y <= maxY; y++) {
    const row: number[] = []
    for (let x = minX; x <= maxX; x++) {
      row.push(design[y]?.[x] ?? 0)
    }
    selection.push(row)
  }
  
  return selection
}

/**
 * Paste a selection onto the design at the given offset
 */
export function pasteSelection(
  design: number[][],
  selection: number[][],
  pasteX: number,
  pasteY: number
): number[][] {
  const newDesign = design.map((row) => [...row])
  const height = selection.length
  const width = selection[0]?.length ?? 0
  
  for (let dy = 0; dy < height; dy++) {
    const destY = pasteY + dy
    if (destY < 0 || destY >= newDesign.length) continue
    
    for (let dx = 0; dx < width; dx++) {
      const destX = pasteX + dx
      if (destX < 0 || destX >= newDesign[destY].length) continue
      newDesign[destY][destX] = selection[dy][dx]
    }
  }
  
  return newDesign
}

/**
 * Brush tool: fill a rectangular area or a stroke along a line
 */
export function brushRect(
  design: number[][],
  x1: number, y1: number,
  x2: number, y2: number,
  color: number,
  filled: boolean
): number[][] {
  const newDesign = design.map((row) => [...row])
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  
  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        newDesign[y][x] = color
      }
    }
  } else {
    // Outline only
    for (let x = minX; x <= maxX; x++) {
      newDesign[minY][x] = color
      newDesign[maxY][x] = color
    }
    for (let y = minY; y <= maxY; y++) {
      newDesign[y][minX] = color
      newDesign[y][maxX] = color
    }
  }
  
  return newDesign
}
