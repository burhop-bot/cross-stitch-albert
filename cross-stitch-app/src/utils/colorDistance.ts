/**
 * Advanced color matching utilities
 * 
 * Provides multiple distance metrics for matching arbitrary RGB colors
 * to the DMC/Anchor/Madeira floss palette:
 * 
 * - Euclidean (RGB) — simple baseline
 * - Euclidean (LAB) — perceptually aware
 * - Mahalanobis — accounts for color covariance in the DMC palette
 *   (the gold standard for thread color matching)
 */

// ============================================================
// Type helpers
// ============================================================

export interface RGBColor {
  r: number
  g: number
  b: number
}

export interface ColorMatchResult {
  color: RGBColor
  dmcNumber: string
  dmcName: string
  hex: string
  distance: number
}

// ============================================================
// RGB ↔ XYZ (D65 illuminant)
// ============================================================

function sRGBToLinear(c: number): number {
  // Normalize 0-255 → 0-1, then apply sRGB companding curve
  const c1 = c / 255
  return c1 > 0.04045 ? Math.pow((c1 + 0.055) / 1.055, 2.4) : c1 / 12.92
}

export function rgbToXYZ(r: number, g: number, b: number): [number, number, number] {
  const rl = sRGBToLinear(r)
  const gl = sRGBToLinear(g)
  const bl = sRGBToLinear(b)

  // sRGB → XYZ matrix (D65)
  const x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) * 100
  const y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) * 100
  const z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) * 100

  return [x, y, z]
}

// ============================================================
// XYZ → LAB (D65 reference white)
// ============================================================

const XN = 95.047
const YN = 100.0
const ZN = 108.883

function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const fx = x / XN
  const fy = y / YN
  const fz = z / ZN

  const delta = 6 / 29

  function f(t: number): number {
    return t > delta ** 3 ? Math.cbrt(t) : (t / (3 * delta * delta)) + 4 / 29
  }

  const L = 116 * f(fy) - 16
  const a = 500 * (f(fx) - f(fy))
  const b = 200 * (f(fy) - f(fz))

  return [L, a, b]
}

export function rgbToLAB(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXYZ(r, g, b)
  return xyzToLab(x, y, z)
}

// ============================================================
// Delta-E (CIE76) — simple LAB distance
// ============================================================

export function deltaE76(lab1: [number, number, number], lab2: [number, number, number]): number {
  const dl = lab1[0] - lab2[0]
  const da = lab1[1] - lab2[1]
  const db = lab1[2] - lab2[2]
  return Math.sqrt(dl * dl + da * da + db * db)
}

// ============================================================
// Mahalanobis distance
// 
// The DMC palette is not uniformly distributed in LAB space.
// Some regions (greens, browns) are dense, others (blues) are sparse.
// Mahalanobis distance accounts for this by normalizing with the
// color covariance matrix, giving perceptually accurate matching.
//
// We use a pre-computed approximate inverse covariance matrix
// based on the DMC palette distribution.
// ============================================================

/**
 * Approximate inverse covariance matrix for DMC palette in LAB space.
 * 
 * The DMC palette has:
 * - Tight clustering in greens/browns (small variance → higher weight)
 * - Sparser blues/purples (larger variance → lower weight)
 * 
 * This is a rough approximation. For production, compute from a
 * full 500+ color sample using scipy/numpy.
 */
const MAHAL_COV_INV: number[][] = [
  //      L       a       b
  [0.0036,  0.0018,  0.0009],  // L channel — lightness is most important
  [0.0018,  0.0064,  0.0024],  // a channel (green-red)
  [0.0009,  0.0024,  0.0081],  // b channel (blue-yellow)
]

export function mahalanobisDistance(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const d: [number, number, number] = [
    lab1[0] - lab2[0],
    lab1[1] - lab2[1],
    lab1[2] - lab2[2],
  ]

  // d^T × Σ^-1 × d
  let result = 0
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      result += d[i] * MAHAL_COV_INV[i][j] * d[j]
    }
  }

  return Math.sqrt(Math.max(0, result))
}

// ============================================================
// Color matching API
// ============================================================

/**
 * Match a target RGB color to the closest color in a reference array
 * using the given distance metric.
 * 
 * @param target    Target RGB color to match
 * @param palette   Array of reference colors
 * @param method    Distance metric to use
 * @returns         Closest match with distance score
 */
export function matchToClosestColor(
  target: RGBColor,
  palette: { r: number; g: number; b: number; number: string; name: string; hex: string }[],
  method: 'euclidean_rgb' | 'euclidean_lab' | 'mahalanobis' = 'mahalanobis'
): ColorMatchResult {
  const targetLAB = rgbToLAB(target.r, target.g, target.b)

  let closest: ColorMatchResult = {
    color: palette[0],
    dmcNumber: palette[0].number,
    dmcName: palette[0].name,
    hex: palette[0].hex,
    distance: Infinity,
  }

  for (const ref of palette) {
    const refLAB = rgbToLAB(ref.r, ref.g, ref.b)

    let distance: number
    switch (method) {
      case 'euclidean_rgb':
        distance = Math.sqrt(
          (target.r - ref.r) ** 2 +
          (target.g - ref.g) ** 2 +
          (target.b - ref.b) ** 2
        )
        break
      case 'euclidean_lab':
        distance = deltaE76(targetLAB, refLAB)
        break
      case 'mahalanobis':
        distance = mahalanobisDistance(targetLAB, refLAB)
        break
    }

    if (distance < closest.distance) {
      closest = {
        color: ref,
        dmcNumber: ref.number,
        dmcName: ref.name,
        hex: ref.hex,
        distance,
      }
    }
  }

  return closest
}

/**
 * Find N closest colors to a target (for color grouping / reduction)
 */
export function matchToNClosestColors(
  target: RGBColor,
  palette: { r: number; g: number; b: number; number: string; name: string; hex: string }[],
  n: number,
  method: 'euclidean_rgb' | 'euclidean_lab' | 'mahalanobis' = 'mahalanobis'
): ColorMatchResult[] {
  const results = palette.map(ref => {
    const refLAB = rgbToLAB(ref.r, ref.g, ref.b)
    const targetLAB = rgbToLAB(target.r, target.g, target.b)

    let distance: number
    switch (method) {
      case 'euclidean_rgb':
        distance = Math.sqrt(
          (target.r - ref.r) ** 2 +
          (target.g - ref.g) ** 2 +
          (target.b - ref.b) ** 2
        )
        break
      case 'euclidean_lab':
        distance = deltaE76(targetLAB, refLAB)
        break
      case 'mahalanobis':
        distance = mahalanobisDistance(targetLAB, refLAB)
        break
    }

    return {
      color: ref,
      dmcNumber: ref.number,
      dmcName: ref.name,
      hex: ref.hex,
      distance,
    }
  })

  results.sort((a, b) => a.distance - b.distance)
  return results.slice(0, n)
}

/**
 * Threshold-based match: return true if the closest match is within Delta-E tolerance.
 * Delta-E < 2.3 is generally considered "imperceptible" by the human eye.
 */
export function isCloseMatch(
  target: RGBColor,
  palette: { r: number; g: number; b: number; number: string; name: string; hex: string }[],
  threshold: number = 10,
  method: 'euclidean_rgb' | 'euclidean_lab' | 'mahalanobis' = 'mahalanobis'
): { match: ColorMatchResult; close: boolean } {
  const match = matchToClosestColor(target, palette, method)

  // Convert distance to Delta-E-like scale
  let deltaE: number
  if (method === 'euclidean_lab') {
    deltaE = match.distance
  } else if (method === 'mahalanobis') {
    // Mahalanobis is in units of "standard deviations" in LAB space
    // Scale roughly: 1 Mahalanobis ≈ 3-5 Delta-E for DMC palette
    deltaE = match.distance * 4
  } else {
    deltaE = match.distance / Math.sqrt(3) // Normalize RGB to LAB-like scale
  }

  return { match, close: deltaE <= threshold }
}
