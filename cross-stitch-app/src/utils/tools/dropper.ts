/**
 * Dropper/Eyedropper tool for picking colors from the canvas
 */
import { getDMCHex } from '../../utils/dmcColors'

export interface PickedColor {
  hex: string
  dmcNumber: number
  name: string
  row: number
  col: number
}

/**
 * Pick a color from a grid cell
 * Returns the DMC color at the given position
 */
export function pickColorFromGrid(
  grid: number[][],
  row: number,
  col: number
): PickedColor | null {
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
    return null
  }
  
  const colorIndex = grid[row][col]
  if (colorIndex <= 0) return null
  
  const hex = getDMCHex(colorIndex)
  if (!hex || hex === '#000000') return null
  
  return {
    hex,
    dmcNumber: colorIndex,
    name: colorIndex.toString(), // Will be resolved by caller
    row,
    col,
  }
}
