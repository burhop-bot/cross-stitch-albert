/**
 * Drawing tool utilities — Bresenham line, circle rasterization, flood fill, selection
 */

// ── Bresenham Line (already in backstitch.ts, re-export for convenience) ──
export function bresenhamLine(
  x1: number, y1: number, x2: number, y2: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const dx = Math.abs(x2 - x1)
  const dy = Math.abs(y2 - y1)
  const sx = x1 < x2 ? 1 : -1
  const sy = y1 < y2 ? 1 : -1
  let err = dx - dy

  while (true) {
    points.push({ x: x1, y: y1 })
    if (x1 === x2 && y1 === y2) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x1 += sx }
    if (e2 < dx) { err += dx; y1 += sy }
  }
  return points
}

// ── Circle rasterization (Midpoint algorithm) ──
export function midPointCircle(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  let x = radius
  let y = 0
  let radiusError = 1 - x

  if (radius <= 0) return [{ x: cx, y: cy }]

  while (x >= y) {
    // 8-way symmetry
    points.push({ x: cx + x, y: cy + y })
    points.push({ x: cx + y, y: cy + x })
    points.push({ x: cx - y, y: cy + x })
    points.push({ x: cx - x, y: cy + y })
    points.push({ x: cx - x, y: cy - y })
    points.push({ x: cx - y, y: cy - x })
    points.push({ x: cx + y, y: cy - x })
    points.push({ x: cx + x, y: cy - y })

    y++
    if (radiusError < 0) {
      radiusError += 2 * y + 1
    } else {
      x--
      radiusError += 2 * (y - x + 1)
    }
  }
  return points
}

// ── Filled circle (scanline fill) ──
export function filledCircle(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  for (let y = cy - radius; y <= cy + radius; y++) {
    const dy = Math.abs(y - cy)
    if (dy > radius) continue
    const dx = Math.floor(Math.sqrt(radius * radius - dy * dy))
    for (let x = cx - dx; x <= cx + dx; x++) {
      points.push({ x, y })
    }
  }
  return points
}

// ── Rectangle scanline fill ──
export function rectScanline(
  x1: number, y1: number, x2: number, y2: number
): { x: number; y: number }[] {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  const points: { x: number; y: number }[] = []
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      points.push({ x, y })
    }
  }
  return points
}

// ── Rectangle outline only ──
export function rectOutline(
  x1: number, y1: number, x2: number, y2: number
): { x: number; y: number }[] {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  const points: { x: number; y: number }[] = []
  for (let x = left; x <= right; x++) {
    points.push({ x, y: top })
    points.push({ x, y: bottom })
  }
  for (let y = top; y <= bottom; y++) {
    points.push({ x: left, y })
    points.push({ x: right, y })
  }
  return points
}

// ── Filled rectangle (convenience) ──
export function filledRect(
  x1: number, y1: number, x2: number, y2: number
): { x: number; y: number }[] {
  return rectScanline(x1, y1, x2, y2)
}

// ── Flood fill (4-connectivity) ──
export function floodFill(
  grid: number[][],
  startRow: number,
  startCol: number,
  replacement: number
): number[][] {
  const rows = grid.length
  if (rows === 0) return grid
  const cols = grid[0].length
  if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) return grid

  const target = grid[startRow][startCol]
  if (target === replacement) return grid

  const result = grid.map((r) => [...r])
  const stack: [number, number][] = [[startRow, startCol]]

  while (stack.length > 0) {
    const [r, c] = stack.pop()!
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue
    if (result[r][c] !== target) continue
    result[r][c] = replacement
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1])
  }
  return result
}

// ── Brush stroke (diamond-shaped for natural cross-stitch look) ──
export function brushStroke(
  cx: number, cy: number, radius: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  for (let dy = -radius; dy <= radius; dy++) {
    const maxDx = radius - Math.abs(dy)
    for (let dx = -maxDx; dx <= maxDx; dx++) {
      points.push({ x: cx + dx, y: cy + dy })
    }
  }
  return points
}

// ── Select region (filled rectangle) ──
export function selectRegion(
  x1: number, y1: number, x2: number, y2: number
): { x: number; y: number }[] {
  return rectScanline(x1, y1, x2, y2)
}

// ── Extract selection from grid ──
export function extractSelection(
  grid: number[][],
  x1: number, y1: number, x2: number, y2: number
): number[][] {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  return grid.slice(top, bottom + 1).map((row) => row.slice(left, right + 1))
}

// ── Paste selection into grid ──
export function pasteSelection(
  grid: number[][],
  clipboard: number[][],
  pasteX: number,
  pasteY: number
): number[][] {
  const result = grid.map((row) => [...row])
  for (let dy = 0; dy < clipboard.length; dy++) {
    for (let dx = 0; dx < clipboard[dy].length; dx++) {
      const gy = pasteY + dy
      const gx = pasteX + dx
      if (gy >= 0 && gy < result.length && gx >= 0 && gx < (result[gy]?.length ?? 0)) {
        result[gy][gx] = clipboard[dy][dx]
      }
    }
  }
  return result
}

// ── Mirror selection horizontally ──
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

// ── Mirror selection vertically ──
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

// ── Mirror whole grid ──
export function mirrorGridH(grid: number[][]): number[][] {
  return grid.map((row) => [...row].reverse())
}

export function mirrorGridV(grid: number[][]): number[][] {
  return [...grid].reverse()
}
