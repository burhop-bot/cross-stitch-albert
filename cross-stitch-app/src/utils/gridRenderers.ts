/**
 * Canvas-based grid rendering engine for large patterns.
 * Draws the entire stitch grid directly onto an HTML5 Canvas
 * instead of using DOM cells, providing orders-of-magnitude
 * better performance for grids 200×200+.
 */

import { GridLineConfig, LabelConfig, getGridLineWeight, getLabelStyle } from '../types/gridLines'
import { getDMCHex } from '../utils/dmcColors'
import type { FlossColor } from '../utils/flossBrands'
import type { SemiCrossType, Note } from '../store/projectStore'

// ─── Types ───────────────────────────────────────────────────

export interface GridRenderOptions {
  grid: number[][]
  palette: number[]
  width: number
  height: number
  cellSize: number
  zoom: number
  showGridLines: boolean
  gridLineConfig: GridLineConfig
  labelConfig: LabelConfig
  showAlternatingColors: boolean
  showSymbols: boolean
  symbolDefinitions: Map<number, { character: string; style: string; size: string }>
  completedStitches: Set<string>
  backstitchLines?: Array<{ x1: number; y1: number; x2: number; y2: number; color: string; lineWidth: number }>
  semiCrosses?: Map<string, SemiCrossType>
  notes?: Note[]
  selectedPanelId?: number | null
  backstitchEnabled?: boolean
  showNotes?: boolean
  currentRow?: number | null
  currentCol?: number | null
}

export interface RenderResult {
  canvasWidth: number
  canvasHeight: number
  labelOffsetX: number
  labelOffsetY: number
}

// ─── Drawing Constants ───────────────────────────────────────

const LABEL_WIDTH = 28
const LABEL_HEIGHT = 24
const NOTE_MARKER_SIZE = 6

// ─── Main Render Function ────────────────────────────────────

/**
 * Render the entire grid onto a canvas element.
 * This is the core function for task 109.
 */
export function renderGridToCanvas(
  ctx: CanvasRenderingContext2D,
  options: GridRenderOptions
): RenderResult {
  const {
    grid,
    palette,
    width,
    height,
    cellSize,
    zoom,
    showGridLines,
    gridLineConfig,
    labelConfig,
    showAlternatingColors,
    showSymbols,
    symbolDefinitions,
    completedStitches,
    backstitchLines = [],
    semiCrosses = new Map(),
    notes = [],
    backstitchEnabled = false,
    showNotes = false,
    currentRow = null,
    currentCol = null,
  } = options

  const effectiveCell = cellSize * zoom
  const hasLeftLabels = labelConfig.position !== 'right'
  const hasRightLabels = labelConfig.position !== 'left'
  const hasTopLabels = labelConfig.position !== 'left'

  // Calculate total canvas size
  const totalWidth = effectiveCell * width
    + (hasLeftLabels ? LABEL_WIDTH : 0)
    + (hasRightLabels ? LABEL_WIDTH : 0)
    + (hasTopLabels ? LABEL_HEIGHT : 0)
  const totalHeight = effectiveCell * height
    + (hasTopLabels ? LABEL_HEIGHT : 0)
    + (hasLeftLabels ? LABEL_HEIGHT : 0)

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  // Fill background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  // Save context and translate to grid origin
  ctx.save()
  const offsetX = hasLeftLabels ? LABEL_WIDTH : 0
  const offsetY = hasTopLabels ? LABEL_HEIGHT : 0
  ctx.translate(offsetX, offsetY)

  // ── Draw cells ──────────────────────────────────────────────
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const colorIndex = grid[row]?.[col] ?? 0
      const isAlt = showAlternatingColors && (row + col) % 2 === 1
      const bgColor = colorIndex > 0 ? getDMCHex(colorIndex) : (isAlt ? '#f8f9fa' : '#ffffff')

      ctx.fillStyle = bgColor
      ctx.fillRect(col * effectiveCell, row * effectiveCell, effectiveCell, effectiveCell)

      // ── Grid lines ──────────────────────────────────────────
      if (showGridLines) {
        drawCellBorders(ctx, col, row, effectiveCell, gridLineConfig, width, height)
      }

      // ── Completed stitch indicator ──────────────────────────
      const completedKey = `${options.selectedPanelId ?? 0}:${row}:${col}`
      if (completedStitches.has(completedKey)) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.45)'
        ctx.fillRect(col * effectiveCell, row * effectiveCell, effectiveCell, effectiveCell)
        // Green dot
        ctx.fillStyle = 'rgba(34, 197, 94, 0.6)'
        ctx.beginPath()
        ctx.arc(
          (col + 0.5) * effectiveCell,
          (row + 0.5) * effectiveCell,
          effectiveCell * 0.15,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }

      // ── Symbols ─────────────────────────────────────────────
      if (showSymbols && colorIndex > 0) {
        const sym = symbolDefinitions.get(colorIndex)
        if (sym?.character && sym.style !== 'none') {
          const fontSize = Math.max(6, effectiveCell * 0.35)
          ctx.font = `700 ${fontSize}px sans-serif`
          ctx.fillStyle = '#374151'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            sym.character,
            (col + 0.5) * effectiveCell,
            (row + 0.5) * effectiveCell
          )
        }
      }

      // ── Semi-cross stitches ─────────────────────────────────
      const scKey = `${options.selectedPanelId ?? 0}-${row}-${col}`
      const scType = semiCrosses.get(scKey)
      if (scType && scType !== 'none' && !completedStitches.has(completedKey)) {
        const semiColor = colorIndex > 0 ? getDMCHex(colorIndex) : '#374151'
        drawSemiCross(ctx, col, row, effectiveCell, semiColor, scType)
      }

      // ── Note marker ─────────────────────────────────────────
      if (showNotes) {
        const note = notes.find((n) => n.row === row && n.col === col)
        if (note) {
          ctx.fillStyle = note.color || '#6366f1'
          ctx.beginPath()
          ctx.arc(
            (col + 0.85) * effectiveCell,
            (row + 0.15) * effectiveCell,
            NOTE_MARKER_SIZE * zoom,
            0,
            Math.PI * 2
          )
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // ── Current row/col highlight ───────────────────────────
      if (currentRow === row || currentCol === col) {
        if (currentRow === row && currentCol === col) {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)'
          ctx.lineWidth = 2
          ctx.strokeRect(col * effectiveCell, row * effectiveCell, effectiveCell, effectiveCell)
        } else if (currentRow === row) {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.05)'
          ctx.fillRect(col * effectiveCell, row * effectiveCell, effectiveCell, effectiveCell)
        } else {
          ctx.fillStyle = 'rgba(99, 102, 241, 0.05)'
          ctx.fillRect(col * effectiveCell, row * effectiveCell, effectiveCell, effectiveCell)
        }
      }
    }
  }

  // ── Backstitch lines ────────────────────────────────────────
  if (backstitchEnabled && backstitchLines.length > 0) {
    for (const line of backstitchLines) {
      ctx.strokeStyle = line.color
      ctx.lineWidth = line.lineWidth * effectiveCell * 0.3
      ctx.lineCap = 'round'
      ctx.globalAlpha = 0.9
      ctx.beginPath()
      ctx.moveTo(
        (line.x1 + 0.5) * effectiveCell,
        (line.y1 + 0.5) * effectiveCell
      )
      ctx.lineTo(
        (line.x2 + 0.5) * effectiveCell,
        (line.y2 + 0.5) * effectiveCell
      )
      ctx.stroke()
      ctx.globalAlpha = 1.0
    }
  }

  ctx.restore()

  // ── Draw labels ─────────────────────────────────────────────
  drawLabels(ctx, width, height, effectiveCell, gridLineConfig, labelConfig, hasLeftLabels, hasRightLabels, hasTopLabels)

  // ── Return metadata ─────────────────────────────────────────
  return {
    canvasWidth: totalWidth,
    canvasHeight: totalHeight,
    labelOffsetX: hasLeftLabels ? LABEL_WIDTH : 0,
    labelOffsetY: hasTopLabels ? LABEL_HEIGHT : 0,
  }
}

// ─── Cell Border Drawing ─────────────────────────────────────

function drawCellBorders(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  effectiveCell: number,
  gridLineConfig: GridLineConfig,
  width: number,
  height: number
) {
  const bottomLine = getGridLineWeight(row, gridLineConfig, height)
  const rightLine = getGridLineWeight(col, gridLineConfig, width)

  if (!bottomLine.show && !rightLine.show) return

  // Light lines for every cell
  ctx.strokeStyle = gridLineConfig.lightLineColor
  ctx.lineWidth = gridLineConfig.lightLineWidth

  // Draw left border for first column or every cell (light)
  if (col === 0) {
    ctx.lineWidth = gridLineConfig.lightLineWidth
    ctx.strokeStyle = gridLineConfig.lightLineColor
    ctx.beginPath()
    ctx.moveTo(0, row * effectiveCell)
    ctx.lineTo(0, (row + 1) * effectiveCell)
    ctx.stroke()
  }

  // Draw top border for first row or every cell (light)
  if (row === 0) {
    ctx.lineWidth = gridLineConfig.lightLineWidth
    ctx.strokeStyle = gridLineConfig.lightLineColor
    ctx.beginPath()
    ctx.moveTo(col * effectiveCell, 0)
    ctx.lineTo((col + 1) * effectiveCell, 0)
    ctx.stroke()
  }

  // Right border
  if (rightLine.show) {
    ctx.lineWidth = rightLine.width
    ctx.strokeStyle = rightLine.color
    ctx.beginPath()
    ctx.moveTo((col + 1) * effectiveCell, row * effectiveCell)
    ctx.lineTo((col + 1) * effectiveCell, (row + 1) * effectiveCell)
    ctx.stroke()
  } else {
    ctx.lineWidth = gridLineConfig.lightLineWidth
    ctx.strokeStyle = gridLineConfig.lightLineColor
    ctx.beginPath()
    ctx.moveTo((col + 1) * effectiveCell, row * effectiveCell)
    ctx.lineTo((col + 1) * effectiveCell, (row + 1) * effectiveCell)
    ctx.stroke()
  }

  // Bottom border
  if (bottomLine.show) {
    ctx.lineWidth = bottomLine.width
    ctx.strokeStyle = bottomLine.color
    ctx.beginPath()
    ctx.moveTo(col * effectiveCell, (row + 1) * effectiveCell)
    ctx.lineTo((col + 1) * effectiveCell, (row + 1) * effectiveCell)
    ctx.stroke()
  } else {
    ctx.lineWidth = gridLineConfig.lightLineWidth
    ctx.strokeStyle = gridLineConfig.lightLineColor
    ctx.beginPath()
    ctx.moveTo(col * effectiveCell, (row + 1) * effectiveCell)
    ctx.lineTo((col + 1) * effectiveCell, (row + 1) * effectiveCell)
    ctx.stroke()
  }
}

// ─── Semi-Cross Drawing ──────────────────────────────────────

function drawSemiCross(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  cellSize: number,
  color: string,
  type: SemiCrossType
) {
  const cx = (col + 0.5) * cellSize
  const cy = (row + 0.5) * cellSize
  const s = cellSize * 0.425

  ctx.fillStyle = color
  ctx.globalAlpha = 0.7

  switch (type) {
    case 'tl-br':
      ctx.beginPath()
      ctx.moveTo(cx - s, cy)
      ctx.lineTo(cx, cy - s)
      ctx.lineTo(cx + s, cy)
      ctx.lineTo(cx, cy + s)
      ctx.closePath()
      ctx.fill()
      break
    case 'tr-bl':
      ctx.beginPath()
      ctx.moveTo(cx + s, cy)
      ctx.lineTo(cx, cy - s)
      ctx.lineTo(cx - s, cy)
      ctx.lineTo(cx, cy + s)
      ctx.closePath()
      ctx.fill()
      break
    case 'top':
      ctx.fillRect(cx - s, cy - s, s * 2, s)
      break
    case 'bottom':
      ctx.fillRect(cx - s, cy, s * 2, s)
      break
    case 'left':
      ctx.fillRect(cx - s, cy - s, s, s * 2)
      break
    case 'right':
      ctx.fillRect(cx, cy - s, s, s * 2)
      break
  }

  ctx.globalAlpha = 1.0
}

// ─── Label Drawing ───────────────────────────────────────────

function drawLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  effectiveCell: number,
  gridLineConfig: GridLineConfig,
  labelConfig: LabelConfig,
  hasLeftLabels: boolean,
  hasRightLabels: boolean,
  hasTopLabels: boolean
) {
  ctx.fillStyle = '#4b5563'

  // Left row labels
  if (hasLeftLabels) {
    for (let i = 0; i < height; i++) {
      const labelNum = labelConfig.startNumber + i
      const labelSt = getLabelStyle(i, labelConfig)
      if (!labelSt.show) continue

      ctx.font = `${labelSt.bold ? '600' : '400'} ${labelSt.bold ? '11px' : '9px'} sans-serif`
      ctx.fillStyle = labelSt.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        String(labelNum),
        LABEL_WIDTH / 2,
        i * effectiveCell + effectiveCell / 2
      )
    }
  }

  // Top column labels
  if (hasTopLabels) {
    for (let i = 0; i < width; i++) {
      const labelNum = labelConfig.startNumber + i
      const labelSt = getLabelStyle(i, labelConfig)
      if (!labelSt.show) continue

      ctx.font = `${labelSt.bold ? '600' : '400'} ${labelSt.bold ? '11px' : '9px'} sans-serif`
      ctx.fillStyle = labelSt.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        String(labelNum),
        i * effectiveCell + effectiveCell / 2,
        LABEL_HEIGHT / 2
      )
    }
  }

  // Right row labels
  if (hasRightLabels) {
    for (let i = 0; i < height; i++) {
      const labelNum = labelConfig.startNumber + i
      const labelSt = getLabelStyle(i, labelConfig)
      if (!labelSt.show) continue

      ctx.font = `${labelSt.bold ? '600' : '400'} ${labelSt.bold ? '11px' : '9px'} sans-serif`
      ctx.fillStyle = labelSt.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        String(labelNum),
        effectiveCell * width + LABEL_WIDTH / 2,
        i * effectiveCell + effectiveCell / 2
      )
    }
  }
}

// ─── Batch Render Optimization ───────────────────────────────

/**
 * Render a viewport subset of the grid for scrolling/panning.
 * Only renders visible cells for maximum performance.
 */
export function renderViewportSubset(
  ctx: CanvasRenderingContext2D,
  options: GridRenderOptions,
  viewportRow: number,
  viewportCol: number,
  visibleRows: number,
  visibleCols: number
): void {
  const { grid, width, height } = options

  const startRow = Math.max(0, viewportRow)
  const endRow = Math.min(height, viewportRow + visibleRows)
  const startCol = Math.max(0, viewportCol)
  const endCol = Math.min(width, viewportCol + visibleCols)

  // Only draw the visible subset (much faster than full render)
  renderGridToCanvas(ctx, {
    ...options,
    width: endCol - startCol,
    height: endRow - startRow,
    grid: grid.slice(startRow, endRow).map(row => row.slice(startCol, endCol)),
  })
}
