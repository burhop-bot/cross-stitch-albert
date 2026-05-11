import dmcData from '../assets/dmc-colors.json'

// Build lookup table for O(1) access
const byNumber: Record<number, { number: number; name: string; hex: string }> = {}
dmcData.colors.forEach((color) => {
  byNumber[color.number] = color
})

export interface DMCColor {
  number: number
  name: string
  hex: string
}

/**
 * Get a DMC color by its number
 */
export function getDMCColor(number: number): DMCColor | undefined {
  return byNumber[number]
}

/**
 * Get all DMC colors
 */
export function getAllDMCColors(): DMCColor[] {
  return dmcData.colors
}

/**
 * Get the hex value for a DMC color number
 */
export function getDMCHex(number: number): string {
  return byNumber[number]?.hex || '#CCCCCC'
}

/**
 * Get the name for a DMC color number
 */
export function getDMCName(number: number): string {
  return byNumber[number]?.name || `DMC ${number}`
}

/**
 * Find the closest DMC color to an RGB value
 */
export function findClosestDMCColor(r: number, g: number, b: number): DMCColor {
  let closest = dmcData.colors[0]
  let minDistance = Infinity

  for (const color of dmcData.colors) {
    const hex = color.hex
    const dr = r - parseInt(hex.slice(1, 3), 16)
    const dg = g - parseInt(hex.slice(3, 5), 16)
    const db = b - parseInt(hex.slice(5, 7), 16)
    const distance = dr * dr + dg * dg + db * db

    if (distance < minDistance) {
      minDistance = distance
      closest = color
    }
  }

  return closest
}

/**
 * Quantize an image's colors to the closest DMC palette colors
 */
export function quantizeToDMC(
  pixels: Uint8ClampedArray,
  maxColors: number = 16
): Map<number, number> {
  // Count unique RGB values
  const rgbCount = new Map<string, number>()
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    
    // Skip transparent pixels
    if (a < 128) continue
    
    const key = `${r},${g},${b}`
    rgbCount.set(key, (rgbCount.get(key) || 0) + 1)
  }

  // Sort by frequency and take top colors
  const sortedColors = Array.from(rgbCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)

  // Map each RGB to closest DMC
  const dmcUsage = new Map<number, number>()
  
  for (const [rgbKey, count] of sortedColors) {
    const [r, g, b] = rgbKey.split(',').map(Number)
    const dmcColor = findClosestDMCColor(r, g, b)
    dmcUsage.set(dmcColor.number, (dmcUsage.get(dmcColor.number) || 0) + count)
  }

  return dmcUsage
}
