/**
 * Pentagon Geometry Utilities for Quaker Ball Panels
 * 
 * A regular pentagon has 5 equal sides and 5 equal interior angles (108 degrees each).
 * For a Quaker Ball, we need to map a 2D grid to a pentagonal shape.
 */

export interface PentagonPoint {
  x: number
  y: number
}

/**
 * Generate the 5 vertices of a regular pentagon centered at (0, 0)
 * @param radius - Distance from center to vertices
 * @returns Array of 5 points in clockwise order, starting from top
 */
export function getPentagonVertices(radius: number): PentagonPoint[] {
  const vertices: PentagonPoint[] = []
  // Start from top ( -PI/2 ) and go clockwise
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    vertices.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    })
  }
  return vertices
}

/**
 * Check if a point is inside a pentagon using ray casting algorithm
 */
export function isPointInPentagon(
  px: number,
  py: number,
  center: PentagonPoint,
  radius: number
): boolean {
  const vertices = getPentagonVertices(radius)
  
  // Translate vertices to center
  const translatedVertices = vertices.map(v => ({
    x: v.x + center.x,
    y: v.y + center.y,
  }))

  // Ray casting algorithm
  let inside = false
  const n = translatedVertices.length
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = translatedVertices[i].x, yi = translatedVertices[i].y
    const xj = translatedVertices[j].x, yj = translatedVertices[j].y
    
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi)
    
    if (intersect) inside = !inside
  }
  
  return inside
}

/**
 * Create a pentagon mask for a grid
 * @param gridSize - Size of the square grid (e.g., 20 for 20x20)
 * @returns 2D boolean array where true = inside pentagon, false = outside
 */
export function createPentagonMask(gridSize: number): boolean[][] {
  const mask: boolean[][] = []
  const center: PentagonPoint = { x: gridSize / 2 - 0.5, y: gridSize / 2 - 0.5 }
  
  // Radius that fits nicely in the grid (slightly smaller than half the grid)
  const radius = (gridSize / 2) * 0.85
  
  for (let row = 0; row < gridSize; row++) {
    const rowMask: boolean[] = []
    for (let col = 0; col < gridSize; col++) {
      rowMask.push(isPointInPentagon(col, row, center, radius))
    }
    mask.push(rowMask)
  }
  
  return mask
}

/**
 * Get the bounding box of the pentagon mask
 */
export function getPentagonBoundingBox(mask: boolean[][]): {
  minRow: number
  maxRow: number
  minCol: number
  maxCol: number
} {
  let minRow = mask.length, maxRow = 0
  let minCol = mask[0]?.length || 0, maxCol = 0
  
  for (let row = 0; row < mask.length; row++) {
    for (let col = 0; col < mask[row].length; col++) {
      if (mask[row][col]) {
        minRow = Math.min(minRow, row)
        maxRow = Math.max(maxRow, row)
        minCol = Math.min(minCol, col)
        maxCol = Math.max(maxCol, col)
      }
    }
  }
  
  return { minRow, maxRow, minCol, maxCol }
}

/**
 * Convert panel design to pentagon-shaped array (remove outside cells)
 */
export function trimToPentagon(design: number[][], mask: boolean[][]): number[][] {
  const boundingBox = getPentagonBoundingBox(mask)
  
  const trimmed: number[][] = []
  for (let row = boundingBox.minRow; row <= boundingBox.maxRow; row++) {
    const trimmedRow: number[] = []
    for (let col = boundingBox.minCol; col <= boundingBox.maxCol; col++) {
      if (mask[row]?.[col]) {
        trimmedRow.push(design[row]?.[col] || 0)
      }
    }
    if (trimmedRow.length > 0) {
      trimmed.push(trimmedRow)
    }
  }
  
  return trimmed
}

/**
 * SVG path data for a pentagon (for rendering)
 */
export function getPentagonSVGPath(
  centerX: number,
  centerY: number,
  radius: number
): string {
  const vertices = getPentagonVertices(radius)
  const points = vertices.map(v => 
    `${centerX + v.x},${centerY + v.y}`
  ).join(' ')
  
  return `M ${points} Z`
}
