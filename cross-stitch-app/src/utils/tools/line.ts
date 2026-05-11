/**
 * Bresenham's line algorithm for cross-stitch grid drawing
 * Returns all grid positions along a line from (x1,y1) to (x2,y2)
 */

export interface GridPoint {
  x: number
  y: number
}

/**
 * Bresenham's line algorithm — classic implementation
 * Returns all integer grid points from start to end inclusive
 */
export function bresenhamLine(
  x1: number, y1: number,
  x2: number, y2: number
): GridPoint[] {
  const points: GridPoint[] = []
  
  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1
  const sy = y1 < y2 ? 1 : -1
  
  let err = dx - dy
  
  let x = x1
  let y = y1
  
  while (true) {
    points.push({ x, y })
    
    if (x === x2 && y === y2) break
    
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  
  return points
}

/**
 * Circle drawing using Midpoint circle algorithm
 * Returns all grid points on the circumference
 */
export function bresenhamCircle(
  cx: number, cy: number,
  radius: number
): GridPoint[] {
  const points: GridPoint[] = []
  let x = radius
  let y = 0
  let decision = 1 - radius // midpoint algorithm decision parameter
  
  const addOctant = (ox: number, oy: number) => {
    points.push({ x: cx + ox, y: cy + oy })
  }
  
  while (x >= y) {
    addOctant(x, y)
    addOctant(y, x)
    addOctant(-x, y)
    addOctant(-y, x)
    addOctant(-x, -y)
    addOctant(-y, -x)
    addOctant(x, -y)
    addOctant(y, -x)
    
    y++
    if (decision <= 0) {
      decision += 2 * y + 1
    } else {
      x--
      decision += 2 * (y - x) + 1
    }
  }
  
  return points
}

/**
 * Draw a filled circle using scanline fill
 * Returns all grid points inside the circle
 */
export function filledCircle(
  cx: number, cy: number,
  radius: number
): GridPoint[] {
  const points: GridPoint[] = []
  
  // Use the circumference points and fill inwards
  const circumference = bresenhamCircle(cx, cy, radius)
  const pointSet = new Set(circumference.map(p => `${p.x},${p.y}`))
  
  // For each row covered by the circle, fill from edge to edge
  for (let y = cy - radius; y <= cy + radius; y++) {
    // Find the x extent at this row using circle equation
    const dy = Math.abs(y - cy)
    const dx = Math.floor(Math.sqrt(Math.max(0, radius * radius - dy * dy)))
    
    for (let x = cx - dx; x <= cx + dx; x++) {
      points.push({ x, y })
    }
  }
  
  return points
}

/**
 * Rectangle outline drawing — four Bresenham lines
 */
export function rectangleOutline(
  x1: number, y1: number,
  x2: number, y2: number
): GridPoint[] {
  const points: GridPoint[] = []
  
  // Top edge
  points.push(...bresenhamLine(Math.min(x1, x2), y1, Math.max(x1, x2), y1))
  // Bottom edge
  points.push(...bresenhamLine(Math.min(x1, x2), y2, Math.max(x1, x2), y2))
  // Left edge (skip corners already drawn)
  for (let y = y1 + 1; y < y2; y++) {
    points.push({ x: Math.min(x1, x2), y })
  }
  // Right edge (skip corners already drawn)
  for (let y = y1 + 1; y < y2; y++) {
    points.push({ x: Math.max(x1, x2), y })
  }
  
  return points
}

/**
 * Filled rectangle — all points in the bounding box
 */
export function filledRectangle(
  x1: number, y1: number,
  x2: number, y2: number
): GridPoint[] {
  const points: GridPoint[] = []
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)
  
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y })
    }
  }
  
  return points
}

/**
 * Erase a line of points — inverse of drawing
 * Returns the set of points that would be erased
 */
export function eraseLine(
  x1: number, y1: number,
  x2: number, y2: number
): GridPoint[] {
  return bresenhamLine(x1, y1, x2, y2)
}
