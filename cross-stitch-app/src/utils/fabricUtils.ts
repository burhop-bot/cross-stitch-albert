/**
 * Fabric type utilities — calculate physical stitch dimensions from fabric count
 */

export type FabricCount =
  | '11-count Aida'
  | '14-count Aida'
  | '16-count Aida'
  | '18-count Aida'
  | '14-count Evenweave'
  | '16-count Evenweave'
  | '18-count Evenweave'
  | '20-count Aida'
  | '22-count Aida'
  | '28-count Linen'
  | '32-count Linen'
  | '36-count Linen'

/**
 * Stitch count (stitches per inch) for each fabric type
 * Derived from standard cross-stitch fabric specifications
 */
const FABRIC_COUNTS: Record<FabricCount, number> = {
  '11-count Aida': 11,
  '14-count Aida': 14,
  '16-count Aida': 16,
  '18-count Aida': 18,
  '20-count Aida': 20,
  '22-count Aida': 22,
  '14-count Evenweave': 14,
  '16-count Evenweave': 16,
  '18-count Evenweave': 18,
  '28-count Linen': 28,
  '32-count Linen': 32,
  '36-count Linen': 36,
}

/**
 * Get the stitch count (stitches per inch) for a fabric type
 */
export function getFabricCount(fabric: string): number {
  // Handle both the enum type and string
  const known = fabric as FabricCount
  return FABRIC_COUNTS[known] || 14 // default to 14-count Aida
}

/**
 * Calculate the physical size of one stitch in inches
 */
export function stitchSizeInches(fabric: string): number {
  return 1 / getFabricCount(fabric)
}

/**
 * Calculate the physical size of one stitch in mm
 */
export function stitchSizeMM(fabric: string): number {
  return stitchSizeInches(fabric) * 25.4
}

/**
 * Calculate the physical dimensions of a design given fabric type and stitch count
 * Returns { widthInches, heightInches, widthMM, heightMM }
 */
export function calculatePhysicalSize(
  fabric: string,
  widthStitches: number,
  heightStitches: number
): {
  widthInches: number
  heightInches: number
  widthMM: number
  heightMM: number
} {
  const stitchInches = stitchSizeInches(fabric)
  const stitchMM = stitchSizeMM(fabric)
  return {
    widthInches: Math.round(widthStitches * stitchInches * 100) / 100,
    heightInches: Math.round(heightStitches * stitchInches * 100) / 100,
    widthMM: Math.round(widthStitches * stitchMM * 10) / 10,
    heightMM: Math.round(heightStitches * stitchMM * 10) / 10,
  }
}

/**
 * Calculate how many stitches fit in a given physical width (inches)
 */
export function stitchesForWidth(
  fabric: string,
  widthInches: number
): number {
  return Math.round(widthInches * getFabricCount(fabric))
}

/**
 * Calculate how many stitches fit in a given physical height (inches)
 */
export function stitchesForHeight(
  fabric: string,
  heightInches: number
): number {
  return Math.round(heightInches * getFabricCount(fabric))
}

/**
 * Estimate skein count needed for a given number of stitches
 * Assumes 0.75m usable per skein strand, 2 strands typical
 */
export function estimateSkeinsUsed(stitches: number, strands: number = 2): number {
  // Average stitch length: ~3mm per stitch per strand
  const totalLengthMM = stitches * 3 * strands
  const skeinLengthMM = 750 // 0.75m per skein
  return Math.ceil(totalLengthMM / skeinLengthMM)
}
