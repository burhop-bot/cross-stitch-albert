/**
 * DMC Color Mapping Utilities
 * Maps RGB colors to the official DMC thread palette
 */

import { getAllDMCColors, findClosestDMCColor, DMCColor } from './dmcColors'
import { PixelData } from './imageConverter'

// Build RGB lookup for fast DMC color access
const DMC_COLORS = getAllDMCColors()
const dmcByHex: Record<string, DMCColor> = {}
DMC_COLORS.forEach((color) => {
  dmcByHex[color.hex] = color
})

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

/**
 * Convert PixelData to hex
 */
export function pixelToHex(pixel: PixelData): string {
  return `#${[pixel.r, pixel.g, pixel.b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Find the closest DMC color to a PixelData
 */
export function findClosestDMCFromPixel(pixel: PixelData): DMCColor {
  return findClosestDMCColor(pixel.r, pixel.g, pixel.b)
}

/**
 * Map a grid of pixels to DMC color numbers
 * Returns a 2D array where each cell contains the DMC color number (or -1 for transparent)
 */
export function mapPixelGridToDMC(
  pixelGrid: PixelData[][]
): {
  grid: number[][]
  dmcPalette: DMCColor[]
  dmcUsage: Map<number, number>
} {
  const dmcUsage = new Map<number, number>()
  const dmcSet = new Set<number>()
  const grid: number[][] = []

  for (const row of pixelGrid) {
    const gridRow: number[] = []
    for (const pixel of row) {
      // Skip transparent pixels
      if (pixel.a < 128) {
        gridRow.push(-1)
        continue
      }

      const dmcColor = findClosestDMCFromPixel(pixel)
      gridRow.push(dmcColor.number)
      dmcSet.add(dmcColor.number)
      dmcUsage.set(dmcColor.number, (dmcUsage.get(dmcColor.number) || 0) + 1)
    }
    grid.push(gridRow)
  }

  // Build palette from used colors, sorted by usage
  const dmcPalette = Array.from(dmcSet)
    .sort((a, b) => (dmcUsage.get(b) || 0) - (dmcUsage.get(a) || 0))
    .map((num) => {
      const color = dmcByHex[findClosestDMCColor(
        parseInt(num.toString().slice(0, 2) || '0', 16),
        parseInt(num.toString().slice(2, 4) || '0', 16),
        parseInt(num.toString().slice(4, 6) || '0', 16)
      ).hex]
      return color
    })

  return { grid, dmcPalette, dmcUsage }
}

/**
 * Limit the number of DMC colors used in a pattern
 * Uses a greedy approach: keep the most frequently used colors
 */
export function limitDMCColors(
  grid: number[][],
  dmcUsage: Map<number, number>,
  maxColors: number
): {
  grid: number[][]
  dmcPalette: DMCColor[]
  dmcUsage: Map<number, number>
} {
  // Sort colors by usage
  const sortedColors = Array.from(dmcUsage.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)

  const keptColors = new Set(sortedColors.map(([num]) => num))

  // Create mapping from old to new color indices
  const colorMapping = new Map<number, number>()
  sortedColors.forEach(([num], idx) => {
    colorMapping.set(num, idx)
  })

  // Helper to get RGB from DMC number
  const getDMCRGB = (num: number): { r: number; g: number; b: number } => {
    const hex = getDMCColorHex(num)
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    }
  }

  // Remap grid
  const newGrid = grid.map((row) =>
    row.map((colorNum) => {
      if (colorNum === -1) return -1 // Transparent
      if (!keptColors.has(colorNum)) {
        // Find closest kept color
        let closest = sortedColors[0][0]
        let minDist = Infinity
        const originalRGB = getDMCRGB(colorNum)
        for (const [keptNum] of sortedColors) {
          const keptRGB = getDMCRGB(keptNum)
          const dist = Math.sqrt(
            Math.pow(originalRGB.r - keptRGB.r, 2) +
              Math.pow(originalRGB.g - keptRGB.g, 2) +
              Math.pow(originalRGB.b - keptRGB.b, 2)
          )
          if (dist < minDist) {
            minDist = dist
            closest = keptNum
          }
        }
        return colorMapping.get(closest) ?? 0
      }
      return colorMapping.get(colorNum) ?? 0
    })
  )

  // Build new palette
  const dmcPalette = sortedColors.map(([num]) => {
    const hex = getDMCColorHex(num)
    return { number: num, name: getDMCColorName(num), hex }
  })

  // Recalculate usage
  const newUsage = new Map<number, number>()
  for (const row of newGrid) {
    for (const idx of row) {
      if (idx >= 0 && idx < dmcPalette.length) {
        newUsage.set(dmcPalette[idx].number, (newUsage.get(dmcPalette[idx].number) || 0) + 1)
      }
    }
  }

  return { grid: newGrid, dmcPalette, dmcUsage: newUsage }
}

/**
 * Helper to get DMC color hex by number
 */
function getDMCColorHex(number: number): string {
  const color = getAllDMCColors().find((c) => c.number === number)
  return color?.hex || '#000000'
}

/**
 * Helper to get DMC color name by number
 */
function getDMCColorName(number: number): string {
  const color = getAllDMCColors().find((c) => c.number === number)
  return color?.name || `DMC ${number}`
}

/**
 * Calculate estimated skein count for each color
 * Assumes one skein covers approximately 1000 stitches
 */
export function calculateSkeinCount(stitchCount: number): number {
  return Math.ceil(stitchCount / 1000)
}

/**
 * Generate a shopping list from DMC usage
 */
export function generateShoppingList(
  dmcUsage: Map<number, number>
): { dmcNumber: number; name: string; hex: string; stitches: number; skeins: number }[] {
  const list: { dmcNumber: number; name: string; hex: string; stitches: number; skeins: number }[] = []

  for (const [number, stitches] of dmcUsage) {
    const color = getAllDMCColors().find((c) => c.number === number)
    if (color) {
      list.push({
        dmcNumber: number,
        name: color.name,
        hex: color.hex,
        stitches,
        skeins: calculateSkeinCount(stitches),
      })
    }
  }

  return list.sort((a, b) => b.stitches - a.stitches)
}
