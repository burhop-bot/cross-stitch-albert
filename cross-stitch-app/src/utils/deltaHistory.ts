/**
 * Chunked (delta-based) history for undo/redo.
 * Instead of storing full grid snapshots, stores incremental changes
 * with timestamps, dramatically reducing memory for large patterns.
 */

import { emptyDesign } from '../store/projectStore'

export interface DeltaOp {
  type: 'stitch' | 'erase' | 'fill' | 'line' | 'rect' | 'circle' | 'brush' | 'pasted' | 'mirrored'
  timestamp: number
  // For single-cell ops
  row?: number
  col?: number
  // For fill/line/rect/circle/brush — list of affected cells
  cells?: Array<{ row: number; col: number }>
  // Color info
  fromColor?: number
  toColor?: number
  // For mirroring
  axis?: 'h' | 'v'
  // For paste
  pasteX?: number
  pasteY?: number
}

export interface DeltaSnapshot {
  history: DeltaOp[]
  currentIndex: number
  canUndo: boolean
  canRedo: boolean
}

export const DEFAULT_HISTORY_DEPTH = 50
export const DEFAULT_MAX_DELTA_AGE_MS = 1000 * 60 * 30 // 30 minutes

/**
 * Create a new delta history with initial state.
 */
export function createDeltaHistory(width: number, height: number): DeltaSnapshot {
  return {
    history: [
      {
        type: 'line', // marks initial state
        timestamp: Date.now(),
        cells: [],
      },
    ],
    currentIndex: 0,
    canUndo: false,
    canRedo: true,
  }
}

/**
 * Apply a delta operation to a grid and record it.
 */
export function applyDelta(
  grid: number[][],
  op: Omit<DeltaOp, 'timestamp'>
): { newGrid: number[][]; snapshot: DeltaSnapshot } {
  const newGrid = grid.map((row) => [...row])

  // Apply the operation
  if (op.cells && op.toColor !== undefined) {
    for (const cell of op.cells) {
      if (cell.row >= 0 && cell.row < newGrid.length && cell.col >= 0 && cell.col < newGrid[0]?.length) {
        newGrid[cell.row][cell.col] = op.toColor
      }
    }
  } else if (op.row !== undefined && op.col !== undefined && op.toColor !== undefined) {
    if (op.row >= 0 && op.row < newGrid.length && op.col >= 0 && op.col < newGrid[0]?.length) {
      newGrid[op.row][op.col] = op.toColor
    }
  } else if (op.type === 'mirrored' && op.axis) {
    // Mirror the entire grid
    if (op.axis === 'h') {
      for (let r = 0; r < newGrid.length; r++) {
        newGrid[r].reverse()
      }
    } else if (op.axis === 'v') {
      newGrid.reverse()
    }
  } else if (op.type === 'pasted' && op.pasteX !== undefined && op.pasteY !== undefined) {
    // Paste would need clipboard data — handled at store level
  }

  // Create new snapshot
  const timestamp = Date.now()
  const deltaOp: DeltaOp = { ...op, timestamp }

  const newHistory = (op.type === 'pasted' || op.type === 'mirrored'
    ? // Large operations: record as snapshot, prune before
      [deltaOp]
    : // Small ops: record delta, but keep history bounded
      [deltaOp]
  )

  const snapshot: DeltaSnapshot = {
    history: newHistory,
    currentIndex: 0,
    canUndo: false,
    canRedo: true,
  }

  return { newGrid, snapshot }
}

/**
 * Generate a compact delta from two grid states.
 * Only records cells that changed — this is the core memory savings.
 */
export function computeDelta(before: number[][], after: number[][]): DeltaOp[] {
  const ops: DeltaOp[] = []
  const rows = Math.max(before.length, after.length)

  for (let r = 0; r < rows; r++) {
    const beforeRow = before[r] ?? []
    const afterRow = after[r] ?? []
    const cols = Math.max(beforeRow.length, afterRow.length)

    for (let c = 0; c < cols; c++) {
      const beforeVal = beforeRow[c] ?? 0
      const afterVal = afterRow[c] ?? 0
      if (beforeVal !== afterVal) {
        ops.push({
          type: afterVal === 0 ? 'erase' : 'stitch',
          timestamp: Date.now(),
          row: r,
          col: c,
          fromColor: beforeVal,
          toColor: afterVal,
        })
      }
    }
  }

  return ops
}

/**
 * Merge small operations into batched operations to reduce history size.
 * Groups nearby stitch/erase ops by color.
 */
export function batchDeltaOps(ops: DeltaOp[]): DeltaOp[] {
  const batches: DeltaOp[] = []
  const batchByColor = new Map<number, { type: string; cells: Array<{ row: number; col: number }> }>()

  for (const op of ops) {
    if (op.type === 'fill' || op.type === 'line' || op.type === 'rect' || op.type === 'circle' || op.type === 'brush') {
      batches.push(op)
    } else if (op.cells) {
      batches.push(op)
    } else if (op.row !== undefined && op.col !== undefined && op.toColor !== undefined) {
      // Check if we can merge with existing batch of same color
      const colorKey = op.toColor
      const existing = batchByColor.get(colorKey)
      if (existing && (op.type === 'stitch' || op.type === 'erase')) {
        existing.cells.push({ row: op.row, col: op.col })
      } else {
        batchByColor.set(colorKey, {
          type: op.type || 'stitch',
          cells: [{ row: op.row, col: op.col }],
        })
      }
    }
  }

  // Convert merged batches
  for (const [, batch] of batchByColor) {
    if (batch.cells.length > 0) {
      batches.push({
        type: batch.type as DeltaOp['type'],
        timestamp: Date.now(),
        cells: batch.cells,
      })
    }
  }

  return batches
}

/**
 * Compress delta history by pruning old entries and merging adjacent operations.
 * Keeps only the last N entries and batches small ops.
 */
export function compressHistory(snapshot: DeltaSnapshot, maxEntries: number = DEFAULT_HISTORY_DEPTH): DeltaSnapshot {
  const history = snapshot.history
  const currentIndex = snapshot.currentIndex

  // If history is within bounds, return as-is
  if (history.length <= maxEntries) {
    return snapshot
  }

  // Keep last maxEntries entries, preserving the boundary between undo/redo
  const startIdx = Math.max(0, history.length - maxEntries)
  const adjustedIndex = currentIndex >= startIdx
    ? currentIndex - startIdx
    : 0

  return {
    history: history.slice(startIdx),
    currentIndex: adjustedIndex,
    canUndo: adjustedIndex > 0,
    canRedo: adjustedIndex < (history.length - startIdx),
  }
}

/**
 * Calculate approximate memory usage of a delta history.
 * Useful for monitoring and adaptive history depth.
 */
export function estimateHistorySize(snapshot: DeltaSnapshot): number {
  // Rough estimate: each DeltaOp is ~128 bytes
  return snapshot.history.length * 128
}

/**
 * Check if history is getting too large and needs compression.
 */
export function needsCompression(snapshot: DeltaSnapshot, thresholdBytes: number = 1024 * 1024): boolean {
  return estimateHistorySize(snapshot) > thresholdBytes
}
