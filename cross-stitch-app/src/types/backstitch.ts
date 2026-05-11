/**
 * Backstitch layer types and utilities
 * Supports continuous lines drawn between grid points
 */

export interface BackstitchLine {
  id: string
  x1: number  // start column
  y1: number  // start row
  x2: number  // end column
  y2: number  // end row
  color: string  // hex color
  lineWidth: number  // 1, 1.5, 2, or 3 stitch widths
}

export interface BackstitchStroke {
  id: string
  points: { x: number; y: number }[]  // polyline points
  color: string
  lineWidth: number
}

export type BackstitchTool = 'line' | 'brush' | 'pencil'

export interface BackstitchConfig {
  enabled: boolean
  tool: BackstitchTool
  color: string
  lineWidth: number
  opacity: number
}

export const DEFAULT_BACKSTITCH_CONFIG: BackstitchConfig = {
  enabled: false,
  tool: 'line',
  color: '#1C1C1C',  // near-black
  lineWidth: 1,
  opacity: 1,
}

/**
 * Bresenham line algorithm — returns all grid points along a line
 */
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

/**
 * Convert line segment to a segment for rendering
 */
export function toRenderLineSegment(line: BackstitchLine): {
  x1: number; y1: number; x2: number; y2: number;
  color: string; width: number;
} {
  return {
    x1: line.x1,
    y1: line.y1,
    x2: line.x2,
    y2: line.y2,
    color: line.color,
    width: line.lineWidth,
  }
}

/**
 * Generate a unique ID for a backstitch line
 */
export function generateBackstitchId(): string {
  return `bs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Convert backstitch lines to SVG path data
 */
export function linesToSvgPath(lines: BackstitchLine[]): string {
  return lines
    .map((line) => `M${line.x1},${line.y1}L${line.x2},${line.y2}`)
    .join(' ')
}

/**
 * Convert a stroke's polyline points to SVG path data
 */
export function strokeToSvgPath(stroke: BackstitchStroke): string {
  if (stroke.points.length === 0) return ''
  return stroke.points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
    .join(' ')
}
