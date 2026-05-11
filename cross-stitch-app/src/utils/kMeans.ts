/**
 * K-Means++ color quantization for image-to-chart conversion
 * Much better than nearest-pixel for reducing image colors
 */

export interface ColorPoint {
  r: number
  g: number
  b: number
  x?: number
  y?: number
}

export interface ColorCluster {
  center: [number, number, number] // RGB centroid
  members: ColorPoint[]
  count: number
}

/**
 * Initialize K-Means++ centroids
 * Picks the first centroid randomly, then picks subsequent ones
 * with probability proportional to distance from existing centroids
 */
export function kMeansPlusPlusInit(
  points: ColorPoint[],
  k: number,
  rng: () => number = Math.random
): ColorPoint[] {
  if (k >= points.length) return points.slice(0, k)
  if (points.length === 0) return []

  const centroids: ColorPoint[] = [points[Math.floor(rng() * points.length)]]

  for (let c = 1; c < k; c++) {
    // Compute distance from each point to nearest existing centroid
    const distances = points.map((p) => {
      let minDist = Infinity
      for (const centroid of centroids) {
        const dr = p.r - centroid.r
        const dg = p.g - centroid.g
        const db = p.b - centroid.b
        const d = dr * dr + dg * dg + db * db
        if (d < minDist) minDist = d
      }
      return minDist
    })

    // Weighted random selection
    const totalDist = distances.reduce((sum, d) => sum + d, 0)
    if (totalDist === 0) {
      // All points are identical, just pick the next one
      centroids.push(points[c % points.length])
      continue
    }

    let r = rng() * totalDist
    let idx = 0
    for (idx = 0; idx < distances.length; idx++) {
      r -= distances[idx]
      if (r <= 0) break
    }
    centroids.push(points[idx])
  }

  return centroids
}

/**
 * Assign each point to its nearest centroid
 */
function assignClusters(
  points: ColorPoint[],
  centroids: [number, number, number][]
): number[] {
  return points.map((p) => {
    let minDist = Infinity
    let bestIdx = 0
    for (let i = 0; i < centroids.length; i++) {
      const [cr, cg, cb] = centroids[i]
      const dr = p.r - cr
      const dg = p.g - cg
      const db = p.b - cb
      const d = dr * dr + dg * dg + db * db
      if (d < minDist) {
        minDist = d
        bestIdx = i
      }
    }
    return bestIdx
  })
}

/**
 * Compute new centroids based on cluster assignments
 */
function computeCentroids(
  points: ColorPoint[],
  assignments: number[],
  k: number
): [number, number, number][] {
  const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, count: 0 }))

  for (let i = 0; i < points.length; i++) {
    const cluster = assignments[i]
    sums[cluster].r += points[i].r
    sums[cluster].g += points[i].g
    sums[cluster].b += points[i].b
    sums[cluster].count++
  }

  return sums.map((s) => ({
    r: s.count > 0 ? Math.round(s.r / s.count) : 0,
    g: s.count > 0 ? Math.round(s.g / s.count) : 0,
    b: s.count > 0 ? Math.round(s.b / s.count) : 0,
  })).map((s) => [s.r, s.g, s.b] as [number, number, number])
}

/**
 * K-Means clustering algorithm
 * @param points - Array of RGB color points
 * @param k - Number of clusters (target colors)
 * @param maxIterations - Max iterations (default 20)
 * @param rng - Random number generator (for reproducibility)
 * @returns Array of clusters with their centroids
 */
export function kMeansCluster(
  points: ColorPoint[],
  k: number,
  maxIterations: number = 20,
  rng: () => number = Math.random
): ColorCluster[] {
  if (points.length === 0) return []
  if (k >= points.length) {
    return points.map((p) => ({
      center: [p.r, p.g, p.b] as [number, number, number],
      members: [p],
      count: 1,
    }))
  }

  // K-Means++ initialization
  const initCentroids = kMeansPlusPlusInit(points, k, rng)
  let centroids = initCentroids.map((p) => [p.r, p.g, p.b] as [number, number, number])

  let assignments: number[] = []

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign points to nearest centroid
    assignments = assignClusters(points, centroids)

    // Compute new centroids
    const newCentroids = computeCentroids(points, assignments, k)

    // Check convergence
    const converged = newCentroids.every((c, i) =>
      c[0] === centroids[i][0] && c[1] === centroids[i][1] && c[2] === centroids[i][2]
    )

    centroids = newCentroids

    if (converged) break
  }

  // Build cluster objects
  const clusters: ColorCluster[] = centroids.map((center, i) => ({
    center,
    members: points.filter((_, idx) => assignments[idx] === i),
    count: assignments.filter((a) => a === i).length,
  }))

  // Sort by member count (largest first)
  clusters.sort((a, b) => b.count - a.count)

  return clusters
}

/**
 * Map pixels to cluster indices using computed centroids
 */
export function mapToClusters(
  points: ColorPoint[],
  centroids: [number, number, number][]
): number[] {
  return assignClusters(points, centroids)
}

/**
 * Quantize an image pixel array to N colors using K-Means
 * @param pixels - RGBA pixel array (Uint8ClampedArray)
 * @param k - Number of output colors
 * @param skipTransparent - Skip fully transparent pixels
 * @returns { grid: number[][] (row-major color indices), palette: {r,g,b}[] }
 */
export function quantizeImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  k: number,
  skipTransparent: boolean = true,
  maxIterations: number = 20
): { grid: number[][]; palette: { r: number; g: number; b: number }[] } {
  // Collect non-transparent pixels
  const points: ColorPoint[] = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      const a = pixels[idx + 3]

      if (skipTransparent && a < 128) continue

      points.push({ r, g, b, x, y })
    }
  }

  // Run K-Means
  const clusters = kMeansCluster(points, k, maxIterations)

  // Build palette from cluster centroids
  const palette = clusters.map((c) => ({ r: c.center[0], g: c.center[1], b: c.center[2] }))

  // Build grid
  const grid: number[][] = []
  for (let y = 0; y < height; y++) {
    const row: number[] = []
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      const a = pixels[idx + 3]

      if (skipTransparent && a < 128) {
        row.push(-1) // transparent
      } else {
        // Find nearest cluster
        let minDist = Infinity
        let bestIdx = 0
        for (let ci = 0; ci < clusters.length; ci++) {
          const center = clusters[ci].center
          const dr = r - center[0]
          const dg = g - center[1]
          const db = b - center[2]
          const d = dr * dr + dg * dg + db * db
          if (d < minDist) {
            minDist = d
            bestIdx = ci
          }
        }
        row.push(bestIdx)
      }
    }
    grid.push(row)
  }

  return { grid, palette }
}

/**
 * Quantize a pixel grid (PixelData[][]) to K-Means clusters
 */
export function quantizePixelGrid(
  grid: { r: number; g: number; b: number }[][],
  k: number,
  maxIterations: number = 20
): { grid: number[][]; palette: { r: number; g: number; b: number }[] } {
  // Flatten to points
  const points: ColorPoint[] = []
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const px = grid[y][x]
      points.push({ r: px.r, g: px.g, b: px.b, x, y })
    }
  }

  // Run K-Means
  const clusters = kMeansCluster(points, k, maxIterations)

  // Build palette
  const palette = clusters.map((c) => ({ r: c.center[0], g: c.center[1], b: c.center[2] }))

  // Build index grid
  const indexGrid: number[][] = []
  for (let y = 0; y < grid.length; y++) {
    const row: number[] = []
    for (let x = 0; x < grid[y].length; x++) {
      const px = grid[y][x]
      let minDist = Infinity
      let bestIdx = 0
      for (let ci = 0; ci < clusters.length; ci++) {
        const center = clusters[ci].center
        const dr = px.r - center[0]
        const dg = px.g - center[1]
        const db = px.b - center[2]
        const d = dr * dr + dg * dg + db * db
        if (d < minDist) {
          minDist = d
          bestIdx = ci
        }
      }
      row.push(bestIdx)
    }
    indexGrid.push(row)
  }

  return { grid: indexGrid, palette }
}
