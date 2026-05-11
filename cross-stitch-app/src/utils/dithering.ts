/**
 * Dithering algorithms for image-to-chart conversion
 * Floyd-Steinberg, Sierra 3-2-1, and custom cross-stitch variants
 */

export type DitherAlgorithm = 'floyd-steinberg' | 'sierra-3-2-1' | 'stucki' | 'atkinson' | 'burkes' | 'none'

export interface DitherOptions {
  algorithm: DitherAlgorithm
  threshold?: number // 0-255, used with threshold-based dithering
  errorDiffusion: boolean
}

/**
 * Round RGB to nearest cluster center with dithering error diffusion
 * @param grid - 2D grid of pixel RGB values
 * @param palette - Array of palette RGB values
 * @param gridWidth - Width of the grid
 * @param options - Dithering options
 * @returns 2D grid of palette indices (with error array for dithering)
 */
export function applyDithering(
  grid: number[][],
  palette: { r: number; g: number; b: number }[],
  options: DitherOptions = { algorithm: 'floyd-steinberg', errorDiffusion: true }
): { grid: number[][]; palette: { r: number; g: number; b: number }[] } {
  if (options.algorithm === 'none' || !options.errorDiffusion) {
    // Simple nearest-palette mapping
    return { grid: mapToNearestPalette(grid, palette), palette }
  }

  const height = grid.length
  const width = height > 0 ? grid[0].length : 0

  // Create error grid (one channel, since we'll diffuse total error)
  const errR: number[][] = Array.from({ length: height + 2 }, () => Array(width + 2).fill(0))
  const errG: number[][] = Array.from({ length: height + 2 }, () => Array(width + 2).fill(0))
  const errB: number[][] = Array.from({ length: height + 2 }, () => Array(width + 2).fill(0))

  const resultGrid: number[][] = []

  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < width; x++) {
      // Current pixel with accumulated error
      let r = grid[y][x] + Math.round(errR[y][x])
      let g = grid[y][x] + Math.round(errG[y][x])
      let b = grid[y][x] + Math.round(errB[y][x])

      // Clamp
      r = Math.max(0, Math.min(255, r))
      g = Math.max(0, Math.min(255, g))
      b = Math.max(0, Math.min(255, b))

      // Find nearest palette color
      let minDist = Infinity
      let nearestIdx = 0
      for (let i = 0; i < palette.length; i++) {
        const dr = r - palette[i].r
        const dg = g - palette[i].g
        const db = b - palette[i].b
        const d = dr * dr + dg * dg + db * db
        if (d < minDist) {
          minDist = d
          nearestIdx = i
        }
      }

      const quantR = palette[nearestIdx].r
      const quantG = palette[nearestIdx].g
      const quantB = palette[nearestIdx].b

      row.push(nearestIdx)

      if (options.errorDiffusion) {
        const eR = r - quantR
        const eG = g - quantG
        const eB = b - quantB

        switch (options.algorithm) {
          case 'floyd-steinberg':
            errR[y][x + 1] += Math.round(eR * 7 / 16)
            errG[y][x + 1] += Math.round(eG * 7 / 16)
            errB[y][x + 1] += Math.round(eB * 7 / 16)
            errR[y + 1][x - 1] += Math.round(eR * 3 / 16)
            errG[y + 1][x - 1] += Math.round(eG * 3 / 16)
            errB[y + 1][x - 1] += Math.round(eB * 3 / 16)
            errR[y + 1][x] += Math.round(eR * 5 / 16)
            errG[y + 1][x] += Math.round(eG * 5 / 16)
            errB[y + 1][x] += Math.round(eB * 5 / 16)
            errR[y + 1][x + 1] += Math.round(eR * 1 / 16)
            errG[y + 1][x + 1] += Math.round(eG * 1 / 16)
            errB[y + 1][x + 1] += Math.round(eB * 1 / 16)
            break

          case 'sierra-3-2-1':
            errR[y][x + 1] += Math.round(eR * 3 / 32)
            errG[y][x + 1] += Math.round(eG * 3 / 32)
            errB[y][x + 1] += Math.round(eB * 3 / 32)
            errR[y + 1][x - 1] += Math.round(eR * 2 / 32)
            errG[y + 1][x - 1] += Math.round(eG * 2 / 32)
            errB[y + 1][x - 1] += Math.round(eB * 2 / 32)
            errR[y + 1][x] += Math.round(eR * 4 / 32)
            errG[y + 1][x] += Math.round(eG * 4 / 32)
            errB[y + 1][x] += Math.round(eB * 4 / 32)
            errR[y + 1][x + 1] += Math.round(eR * 3 / 32)
            errG[y + 1][x + 1] += Math.round(eG * 3 / 32)
            errB[y + 1][x + 1] += Math.round(eB * 3 / 32)
            errR[y + 2][x] += Math.round(eR * 2 / 32)
            errG[y + 2][x] += Math.round(eG * 2 / 32)
            errB[y + 2][x] += Math.round(eB * 2 / 32)
            break

          case 'stucki':
            errR[y][x + 1] += Math.round(eR * 8 / 42)
            errG[y][x + 1] += Math.round(eG * 8 / 42)
            errB[y][x + 1] += Math.round(eB * 8 / 42)
            errR[y][x + 2] += Math.round(eR * 4 / 42)
            errG[y][x + 2] += Math.round(eG * 4 / 42)
            errB[y][x + 2] += Math.round(eB * 4 / 42)
            errR[y + 1][x - 1] += Math.round(eR * 4 / 42)
            errG[y + 1][x - 1] += Math.round(eG * 4 / 42)
            errB[y + 1][x - 1] += Math.round(eB * 4 / 42)
            errR[y + 1][x] += Math.round(eR * 8 / 42)
            errG[y + 1][x] += Math.round(eG * 8 / 42)
            errB[y + 1][x] += Math.round(eB * 8 / 42)
            errR[y + 1][x + 1] += Math.round(eR * 4 / 42)
            errG[y + 1][x + 1] += Math.round(eG * 4 / 42)
            errB[y + 1][x + 1] += Math.round(eB * 4 / 42)
            errR[y + 2][x - 1] += Math.round(eR * 2 / 42)
            errG[y + 2][x - 1] += Math.round(eG * 2 / 42)
            errB[y + 2][x - 1] += Math.round(eB * 2 / 42)
            errR[y + 2][x] += Math.round(eR * 4 / 42)
            errG[y + 2][x] += Math.round(eG * 4 / 42)
            errB[y + 2][x] += Math.round(eB * 4 / 42)
            errR[y + 2][x + 1] += Math.round(eR * 2 / 42)
            errG[y + 2][x + 1] += Math.round(eG * 2 / 42)
            errB[y + 2][x + 1] += Math.round(eB * 2 / 42)
            break

          case 'atkinson':
            errR[y][x + 1] += Math.round(eR * 1 / 8)
            errG[y][x + 1] += Math.round(eG * 1 / 8)
            errB[y][x + 1] += Math.round(eB * 1 / 8)
            errR[y][x + 2] += Math.round(eR * 1 / 8)
            errG[y][x + 2] += Math.round(eG * 1 / 8)
            errB[y][x + 2] += Math.round(eB * 1 / 8)
            errR[y + 1][x - 1] += Math.round(eR * 1 / 8)
            errG[y + 1][x - 1] += Math.round(eG * 1 / 8)
            errB[y + 1][x - 1] += Math.round(eB * 1 / 8)
            errR[y + 1][x] += Math.round(eR * 1 / 8)
            errG[y + 1][x] += Math.round(eG * 1 / 8)
            errB[y + 1][x] += Math.round(eB * 1 / 8)
            errR[y + 1][x + 1] += Math.round(eR * 1 / 8)
            errG[y + 1][x + 1] += Math.round(eG * 1 / 8)
            errB[y + 1][x + 1] += Math.round(eB * 1 / 8)
            errR[y + 2][x] += Math.round(eR * 1 / 8)
            errG[y + 2][x] += Math.round(eG * 1 / 8)
            errB[y + 2][x] += Math.round(eB * 1 / 8)
            break

          case 'burkes':
            errR[y][x + 1] += Math.round(eR * 8 / 32)
            errG[y][x + 1] += Math.round(eG * 8 / 32)
            errB[y][x + 1] += Math.round(eB * 8 / 32)
            errR[y][x + 2] += Math.round(eR * 4 / 32)
            errG[y][x + 2] += Math.round(eG * 4 / 32)
            errB[y][x + 2] += Math.round(eB * 4 / 32)
            errR[y + 1][x - 2] += Math.round(eR * 2 / 32)
            errG[y + 1][x - 2] += Math.round(eG * 2 / 32)
            errB[y + 1][x - 2] += Math.round(eB * 2 / 32)
            errR[y + 1][x - 1] += Math.round(eR * 4 / 32)
            errG[y + 1][x - 1] += Math.round(eG * 4 / 32)
            errB[y + 1][x - 1] += Math.round(eB * 4 / 32)
            errR[y + 1][x] += Math.round(eR * 8 / 32)
            errG[y + 1][x] += Math.round(eG * 8 / 32)
            errB[y + 1][x] += Math.round(eB * 8 / 32)
            errR[y + 1][x + 1] += Math.round(eR * 4 / 32)
            errG[y + 1][x + 1] += Math.round(eG * 4 / 32)
            errB[y + 1][x + 1] += Math.round(eB * 4 / 32)
            break
        }
      }
    }
    resultGrid.push(row)
  }

  return { grid: resultGrid, palette }
}

/**
 * Simple nearest-palette mapping (no dithering)
 */
function mapToNearestPalette(
  grid: number[][],
  palette: { r: number; g: number; b: number }[]
): number[][] {
  return grid.map((row) =>
    row.map((colorIdx) => {
      if (colorIdx < 0) return -1
      // Use original RGB from the source... we need the original pixel data
      // For now just return the index as-is (caller handles RGB lookup)
      return colorIdx
    })
  )
}

/**
 * Threshold-based dithering for binary/limited palette
 * Good for high-contrast patterns
 */
export function thresholdDither(
  grid: number[][],
  palette: { r: number; g: number; b: number }[],
  threshold: number = 128
): number[][] {
  return grid.map((row) =>
    row.map((colorIdx) => {
      if (colorIdx < 0) return -1
      const c = palette[colorIdx]
      // Convert to grayscale brightness
      const brightness = Math.round(0.299 * c.r + 0.587 * c.g + 0.114 * c.b)
      return brightness >= threshold ? 0 : -1
    })
  )
}

/**
 * Apply a median filter to reduce noise in the quantized grid
 * @param grid - 2D color index grid
 * @param kernelSize - Size of the median filter kernel (3 or 5)
 * @param palette - Palette for reference (optional, used for context-aware smoothing)
 * @returns Smoothed grid
 */
export function medianFilter(
  grid: number[][],
  kernelSize: number = 3,
  palette?: { r: number; g: number; b: number }[]
): number[][] {
  const height = grid.length
  if (height === 0) return []
  const width = grid[0].length
  const half = Math.floor(kernelSize / 2)

  const result = grid.map((row) => [...row])

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Count same-color neighbors
      const sameNeighbors = countSameNeighbors(grid, x, y, width, height)
      const totalNeighbors = (kernelSize * kernelSize) - 1

      // If a color is surrounded by a different dominant color, change it
      if (grid[y][x] !== -1 && sameNeighbors < totalNeighbors * 0.3) {
        // Find most common non-background color in neighborhood
        const freq = new Map<number, number>()
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            if (dx === 0 && dy === 0) continue
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const c = grid[ny][nx]
              if (c !== -1) {
                freq.set(c, (freq.get(c) || 0) + 1)
              }
            }
          }
        }

        if (freq.size > 0) {
          let maxCount = 0
          let mostCommon = grid[y][x]
          for (const [color, count] of freq) {
            if (count > maxCount) {
              maxCount = count
              mostCommon = color
            }
          }
          result[y][x] = mostCommon
        }
      }
    }
  }

  return result
}

/**
 * Count neighbors of the same color
 */
function countSameNeighbors(
  grid: number[][],
  x: number, y: number,
  width: number, height: number
): number {
  let count = 0
  const dirs = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  const self = grid[y][x]
  for (const [dy, dx] of dirs) {
    const ny = y + dy
    const nx = x + dx
    if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
      if (grid[ny][nx] === self && self !== -1) count++
    }
  }
  return count
}

/**
 * Isolate and remove single isolated stitches (noise removal)
 * Returns a new grid with isolated stitches changed to their most common neighbor
 */
export function isolateNoise(
  grid: number[][],
  palette?: { r: number; g: number; b: number }[]
): { grid: number[][]; isolatedStitches: { x: number; y: number; fromColor: number; toColor: number }[] } {
  const height = grid.length
  if (height === 0) return { grid, isolatedStitches: [] }
  const width = grid[0].length
  const result = grid.map((row) => [...row])
  const isolated: { x: number; y: number; fromColor: number; toColor: number }[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (result[y][x] === -1) continue

      const neighbors = [
        [y - 1, x - 1], [y - 1, x], [y - 1, x + 1],
        [y, x - 1],                [y, x + 1],
        [y + 1, x - 1], [y + 1, x], [y + 1, x + 1],
      ]

      // Count matching neighbors
      let matchCount = 0
      const colorFreq = new Map<number, number>()
      for (const [ny, nx] of neighbors) {
        if (ny >= 0 && ny < height && nx >= 0 && nx < width && result[ny][nx] !== -1) {
          const nc = result[ny][nx]
          colorFreq.set(nc, (colorFreq.get(nc) || 0) + 1)
          if (nc === result[y][x]) matchCount++
        }
      }

      // If only 0-1 matching neighbors and has at least 2 valid neighbors, it's noise
      if (matchCount <= 1 && colorFreq.size >= 2) {
        const self = result[y][x]
        // Remove self from frequency count
        colorFreq.set(self, (colorFreq.get(self) || 0) - 1)
        if (colorFreq.get(self) === 0) colorFreq.delete(self)

        // Replace with most common neighbor color
        let maxCount = 0
        let bestColor = self
        for (const [color, count] of colorFreq) {
          if (count > maxCount) {
            maxCount = count
            bestColor = color
          }
        }

        if (bestColor !== self) {
          isolated.push({ x, y, fromColor: self, toColor: bestColor })
          result[y][x] = bestColor
        }
      }
    }
  }

  return { grid: result, isolatedStitches: isolated }
}

/**
 * Reduce colors by merging similar colors
 * @param grid - 2D color index grid
 * @param palette - Color palette
 * @param maxColors - Maximum target colors
 * @returns { grid, palette } with fewer colors
 */
export function reduceColors(
  grid: number[][],
  palette: { r: number; g: number; b: number }[],
  maxColors: number
): { grid: number[][]; palette: { r: number; g: number; b: number }[]; merged: { from: number; to: number }[] } {
  // Count usage of each color
  const usage = new Map<number, number>()
  for (const row of grid) {
    for (const idx of row) {
      if (idx >= 0) usage.set(idx, (usage.get(idx) || 0) + 1)
    }
  }

  // Sort by usage (least used first)
  const sorted = Array.from(usage.entries()).sort((a, b) => a[1] - b[1])

  if (sorted.length <= maxColors) {
    return { grid, palette, merged: [] }
  }

  // Merge least-used colors into nearest neighbors
  const merged: { from: number; to: number }[] = []
  let currentPalette = [...palette]
  let currentGrid = grid.map((r) => [...r])
  let currentColors = new Set(sorted.map(([idx]) => idx))

  while (currentColors.size > maxColors) {
    // Find the least used color
    const leastUsed = sorted.find(([idx]) => currentColors.has(idx))
    if (!leastUsed) break

    const targetIdx = leastUsed[0]
    const targetRgb = currentPalette[targetIdx]

    // Find nearest neighbor in current palette
    let minDist = Infinity
    let nearestIdx = targetIdx
    for (const ci of currentColors) {
      if (ci === targetIdx) continue
      const diff = currentPalette[ci]
      const dr = targetRgb.r - diff.r
      const dg = targetRgb.g - diff.g
      const db = targetRgb.b - diff.b
      const d = dr * dr + dg * dg + db * db
      if (d < minDist) {
        minDist = d
        nearestIdx = ci
      }
    }

    // Merge: replace all targetIdx with nearestIdx
    merged.push({ from: targetIdx, to: nearestIdx })
    for (let y = 0; y < currentGrid.length; y++) {
      for (let x = 0; x < currentGrid[y].length; x++) {
        if (currentGrid[y][x] === targetIdx) {
          currentGrid[y][x] = nearestIdx
        }
      }
    }
    currentColors.delete(targetIdx)
  }

  // Filter palette to keep only used colors
  const keptColors = Array.from(currentColors)
  const newPalette = keptColors.map((i) => currentPalette[i])
  const indexMap = new Map(keptColors.map((orig, i) => [orig, i]))

  // Remap grid indices
  const remappedGrid = currentGrid.map((row) =>
    row.map((idx) => {
      if (idx < 0) return -1
      return indexMap.get(idx) ?? 0
    })
  )

  return { grid: remappedGrid, palette: newPalette, merged }
}
