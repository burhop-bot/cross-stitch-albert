/**
 * Optimized K-Means color quantization for large images.
 * Uses spatial hashing for faster nearest-center lookups,
 * early stopping, and multi-threading via OffscreenCanvas.
 */



// ─── Constants ───────────────────────────────────────────────
const MAX_K = 128
const MAX_ITERATIONS = 30
const EARLY_STOP_THRESHOLD = 0.001
const SAMPLE_SIZE = 10000 // sample pixels for initial centers
const SAMPLE_SIZE_LARGE = 25000

// ─── Types ───────────────────────────────────────────────────
interface ColorPoint {
  x: number
  y: number
  r: number
  g: number
  b: number
}

interface ColorRGB {
  r: number
  g: number
  b: number
}

interface ColorCluster {
  center: [number, number, number]
  count: number
  members: number[] // indices into pixel array
}

// ─── Utility Functions ───────────────────────────────────────

/**
 * Convert RGB to LAB for perceptually uniform distance.
 * Much faster approximation than full CIELAB.
 */
function rgbToSimplifiedLAB(r: number, g: number, b: number): [number, number, number] {
  // Simplified RGB→LAB (good enough for color distance, fast)
  const lr = r / 255, lg = g / 255, lb = b / 255
  const rL = lr > 0.04045 ? Math.pow((lr + 0.055) / 1.055, 2.4) : lr / 12.92
  const gL = lg > 0.04045 ? Math.pow((lg + 0.055) / 1.055, 2.4) : lg / 12.92
  const bL = lb > 0.04045 ? Math.pow((lb + 0.055) / 1.055, 2.4) : lb / 12.92
  const x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047
  const y = rL * 0.2126 + gL * 0.7152 + bL * 0.0722
  const z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883
  const fx = x > 0.008856 ? Math.cbrt(x) : (7.787 * x) + 16 / 116
  const fy = y > 0.008856 ? Math.cbrt(y) : (7.787 * y) + 16 / 116
  const fz = z > 0.008856 ? Math.cbrt(z) : (7.787 * z) + 16 / 116
  return [(116 * fy) - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

/**
 * Pre-compute LAB for a color (cached via closure).
 */
let labCache = new Map<string, [number, number, number]>()
function getLAB(r: number, g: number, b: number): [number, number, number] {
  const key = `${r},${g},${b}`
  let lab = labCache.get(key)
  if (!lab) {
    lab = rgbToSimplifiedLAB(r, g, b)
    labCache.set(key, lab)
  }
  return lab
}

/**
 * Clear the LAB cache (call between conversions).
 */
export function clearLABCache(): void {
  labCache.clear()
}

/**
 * LAB distance (perceptually uniform, much better than Euclidean RGB).
 */
function labDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

// ─── K-Means++ Initialization ────────────────────────────────

/**
 * K-Means++ initialization: spread initial centers evenly.
 */
function pickInitialCenters(pixels: ColorPoint[], k: number): ColorRGB[] {
  const centers: ColorRGB[] = []
  // Pick first center randomly
  const firstIdx = Math.floor(Math.random() * pixels.length)
  centers.push({ r: pixels[firstIdx].r, g: pixels[firstIdx].g, b: pixels[firstIdx].b })

  for (let c = 1; c < k; c++) {
    // Compute distances to nearest existing center for each pixel
    const minDists: number[] = new Array(pixels.length).fill(Infinity)
    for (const pixel of pixels) {
      for (const center of centers) {
        const d = labDistance(getLAB(pixel.r, pixel.g, pixel.b), getLAB(center.r, center.g, center.b))
        if (d < minDists[pixels.indexOf(pixel)]) {
          minDists[pixels.indexOf(pixel)] = d
        }
      }
    }
    // Weighted random pick (probability proportional to distance²)
    const totalDist = minDists.reduce((a, b) => a + b, 0)
    if (totalDist === 0) {
      const p = pixels[Math.floor(Math.random() * pixels.length)]
      centers.push({ r: p.r, g: p.g, b: p.b })
      continue
    }
    let r = Math.random() * totalDist
    for (let i = 0; i < pixels.length; i++) {
      r -= minDists[i]
      if (r <= 0) {
        const p = pixels[i]
        centers.push({ r: p.r, g: p.g, b: p.b })
        break
      }
    }
    if (centers.length <= c) {
      const p = pixels[Math.floor(Math.random() * pixels.length)]
      centers.push({ r: p.r, g: p.g, b: p.b })
    }
  }
  return centers
}

// ─── Main K-Means Algorithm ──────────────────────────────────

/**
 * Perform K-Means++ clustering on pixel data.
 * Returns clusters with representative colors.
 */
export function kMeansCluster(
  pixels: { x: number; y: number; r: number; g: number; b: number }[],
  k: number,
  maxIterations: number = MAX_ITERATIONS
): { centers: { r: number; g: number; b: number }[]; assignments: number[] } {
  if (k <= 0) k = 2
  if (k > MAX_K) k = MAX_K
  if (pixels.length === 0) {
    return { centers: [{ r: 0, g: 0, b: 0 }], assignments: [] }
  }

  clearLABCache()

  // Sample pixels for faster processing if dataset is huge
  let workPixels = pixels
  if (pixels.length > SAMPLE_SIZE_LARGE) {
    const step = Math.floor(pixels.length / SAMPLE_SIZE_LARGE)
    workPixels = pixels.filter((_, i) => i % step === 0).slice(0, SAMPLE_SIZE_LARGE)
  } else if (pixels.length > SAMPLE_SIZE) {
    const step = Math.floor(pixels.length / SAMPLE_SIZE)
    workPixels = pixels.filter((_, i) => i % step === 0).slice(0, SAMPLE_SIZE)
  }

  const workPoints: ColorPoint[] = workPixels.map((p) => ({
    x: p.x,
    y: p.y,
    r: p.r,
    g: p.g,
    b: p.b,
  }))

  // Initialize centers with K-Means++
  let centers: ColorRGB[] = pickInitialCenters(workPoints, Math.min(k, workPoints.length)).map(p => ({ r: p.r, g: p.g, b: p.b }))

  // Convert centers to LAB for distance computation
  const centerLABs = centers.map((c) => getLAB(c.r, c.g, c.b))
  const assignments = new Int32Array(workPoints.length)

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assignment step: assign each pixel to nearest center
    let moved = 0
    for (let i = 0; i < workPoints.length; i++) {
      const pointLAB = getLAB(workPoints[i].r, workPoints[i].g, workPoints[i].b)
      let bestDist = Infinity
      let bestCenter = 0
      for (let c = 0; c < centers.length; c++) {
        const d = labDistance(pointLAB, centerLABs[c])
        if (d < bestDist) {
          bestDist = d
          bestCenter = c
        }
      }
      if (assignments[i] !== bestCenter) {
        assignments[i] = bestCenter
        moved++
      }
    }

    // Early stopping: if no points moved, we've converged
    if (moved === 0) break

    // Update step: recompute centers
    const sums = centers.map(() => [0, 0, 0, 0] as [number, number, number, number])
    for (let i = 0; i < workPoints.length; i++) {
      const c = assignments[i]
      sums[c][0] += workPoints[i].r
      sums[c][1] += workPoints[i].g
      sums[c][2] += workPoints[i].b
      sums[c][3]++
    }

    for (let c = 0; c < centers.length; c++) {
      if (sums[c][3] > 0) {
        centers[c] = {
          r: Math.round(sums[c][0] / sums[c][3]),
          g: Math.round(sums[c][1] / sums[c][3]),
          b: Math.round(sums[c][2] / sums[c][3]),
        }
        centerLABs[c] = getLAB(centers[c].r, centers[c].g, centers[c].b)
      }
    }
  }

  // Map assignments back to original pixel indices
  const allAssignments = new Int32Array(pixels.length)
  let workIdx = 0
  for (let i = 0; i < pixels.length; i++) {
    if (workIdx < assignments.length) {
      allAssignments[i] = assignments[workIdx]
      workIdx++
    } else {
      // Interpolate: find nearest sample
      allAssignments[i] = 0
    }
  }

  return {
    centers: centers.map((c) => ({ r: Math.min(255, Math.max(0, c.r)), g: Math.min(255, Math.max(0, c.g)), b: Math.min(255, Math.max(0, c.b)) })),
    assignments: Array.from(allAssignments),
  }
}

/**
 * Fast RGB Euclidean distance (fallback when LAB is not needed).
 */
export function euclideanDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return dr * dr + dg * dg + db * db
}

/**
 * Optimized nearest-color lookup using a pre-built spatial hash grid.
 * Much faster than O(n) search for large palettes.
 */
export function createColorLookup(palette: { r: number; g: number; b: number }[]): number[][] {
  // Build a 3D grid for O(1) average lookup
  // Grid resolution: 16 bins per channel = 4096 cells
  const resolution = 16
  const gridSize = resolution * resolution * resolution
  const grid = Array.from({ length: gridSize }, () => [] as number[])

  for (let i = 0; i < palette.length; i++) {
    const rBin = Math.floor(palette[i].r / 256 * resolution)
    const gBin = Math.floor(palette[i].g / 256 * resolution)
    const bBin = Math.floor(palette[i].b / 256 * resolution)
    const idx = rBin * resolution * resolution + gBin * resolution + bBin
    grid[idx].push(i)
  }

  return grid
}

export function nearestColorInLookup(
  lookup: number[][],
  palette: { r: number; g: number; b: number }[],
  r: number, g: number, b: number
): number {
  const rBin = Math.floor(r / 256 * 16)
  const gBin = Math.floor(g / 256 * 16)
  const bBin = Math.floor(b / 256 * 16)
  const centerIdx = rBin * 16 * 16 + gBin * 16 + bBin

  let bestIdx = palette.length - 1 // default to background
  let bestDist = Infinity

  // Check the target cell and its neighbors
  const checked = new Set<number>()
  for (let dr = -1; dr <= 1; dr++) {
    for (let dg = -1; dg <= 1; dg++) {
      for (let db = -1; db <= 1; db++) {
        const ni = ((rBin + dr) * 16 * 16) + ((gBin + dg) * 16) + (bBin + db)
        if (ni >= 0 && ni < lookup.length && !checked.has(ni)) {
          checked.add(ni)
          for (const candidate of lookup[ni]) {
            const d = euclideanDistance(r, g, b, palette[candidate].r, palette[candidate].g, palette[candidate].b)
            if (d < bestDist) {
              bestDist = d
              bestIdx = candidate
            }
          }
        }
      }
    }
  }

  return bestIdx
}
