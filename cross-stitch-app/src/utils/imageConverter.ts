/**
 * Image-to-Chart conversion utilities
 * Handles image resizing, pixelation, and color quantization
 */

export interface PixelData {
  r: number
  g: number
  b: number
  a: number
}

export interface ConvertedPattern {
  grid: number[][] // 2D array of color indices
  width: number
  height: number
  colors: PixelData[]
}

/**
 * Resize an image to a target stitch count
 * @param dataUrl - Base64 image data
 * @param targetWidth - Target width in stitches
 * @param targetHeight - Target height in stitches (optional, maintains aspect ratio if not provided)
 * @returns Promise resolving to 2D array of RGB values
 */
export async function resizeImageToGrid(
  dataUrl: string,
  targetWidth: number,
  targetHeight?: number
): Promise<PixelData[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate aspect ratio
      const aspectRatio = img.height / img.width
      const finalHeight = targetHeight ?? Math.round(targetWidth * aspectRatio)

      // Create offscreen canvas for resizing
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = finalHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Use nearest neighbor for crisp pixelation effect
      ctx.imageSmoothingEnabled = false

      // Draw resized image
      ctx.drawImage(img, 0, 0, targetWidth, finalHeight)

      // Extract pixel data
      const imageData = ctx.getImageData(0, 0, targetWidth, finalHeight)
      const grid: PixelData[][] = []

      for (let y = 0; y < finalHeight; y++) {
        const row: PixelData[] = []
        for (let x = 0; x < targetWidth; x++) {
          const idx = (y * targetWidth + x) * 4
          row.push({
            r: imageData.data[idx],
            g: imageData.data[idx + 1],
            b: imageData.data[idx + 2],
            a: imageData.data[idx + 3],
          })
        }
        grid.push(row)
      }

      resolve(grid)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Convert RGB to hex string for comparison
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Calculate color distance (Euclidean in RGB space)
 */
export function colorDistance(c1: PixelData, c2: PixelData): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
      Math.pow(c1.g - c2.g, 2) +
      Math.pow(c1.b - c2.b, 2)
  )
}

/**
 * Simple color quantization using median cut algorithm
 * @param grid - 2D array of pixel data
 * @param maxColors - Maximum number of colors to reduce to
 * @returns Array of unique colors (sorted by frequency)
 */
export function quantizeColors(grid: PixelData[][], maxColors: number): PixelData[] {
  // Count color frequencies (with simple rounding to reduce unique colors)
  const colorMap = new Map<string, { count: number; color: PixelData }>()

  for (const row of grid) {
    for (const pixel of row) {
      // Skip transparent pixels
      if (pixel.a < 128) continue

      // Round to reduce color variations (quantize to 16 levels per channel)
      const qr = Math.round(pixel.r / 16) * 16
      const qg = Math.round(pixel.g / 16) * 16
      const qb = Math.round(pixel.b / 16) * 16

      const key = `${qr},${qg},${qb}`
      const existing = colorMap.get(key)

      if (existing) {
        existing.count++
      } else {
        colorMap.set(key, { count: 1, color: { r: qr, g: qg, b: qb, a: 255 } })
      }
    }
  }

  // Sort by frequency and take top N
  const sorted = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxColors)

  return sorted.map((item) => item.color)
}

/**
 * Convert a grid to use indexed colors from a palette
 * @param grid - Original pixel grid
 * @param palette - Array of colors to use
 * @returns 2D array of palette indices
 */
export function mapGridToPalette(
  grid: PixelData[][],
  palette: PixelData[]
): number[][] {
  return grid.map((row) =>
    row.map((pixel) => {
      if (pixel.a < 128) return -1 // Transparent

      // Find nearest color in palette
      let minDistance = Infinity
      let nearestIndex = 0

      for (let i = 0; i < palette.length; i++) {
        const distance = colorDistance(pixel, palette[i])
        if (distance < minDistance) {
          minDistance = distance
          nearestIndex = i
        }
      }

      return nearestIndex
    })
  )
}

/**
 * Full image-to-pattern conversion pipeline
 */
export async function convertImageToPattern(
  dataUrl: string,
  stitchWidth: number,
  maxColors: number = 16
): Promise<ConvertedPattern> {
  // Step 1: Resize image to target stitch count
  const pixelGrid = await resizeImageToGrid(dataUrl, stitchWidth)

  // Step 2: Quantize colors
  const palette = quantizeColors(pixelGrid, maxColors)

  // Step 3: Map grid to palette indices
  const indexedGrid = mapGridToPalette(pixelGrid, palette)

  return {
    grid: indexedGrid,
    width: pixelGrid[0]?.length ?? stitchWidth,
    height: pixelGrid.length,
    colors: palette,
  }
}
