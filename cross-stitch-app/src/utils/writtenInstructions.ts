/**
 * Written Chart Instructions Generator
 * 
 * Produces row-by-row text descriptions of cross-stitch patterns,
 * which stitchers use as a text guide while stitching.
 * 
 * Format: "Row 1: 3×BL, 5×RD, 2×BL, 8×WH"
 * 
 * Supports:
 * - Left-to-right and right-to-left reading
 * - Customizable color abbreviation dictionary
 * - Consecutive same-color stitch grouping
 * - Multiple output formats (plain text, markdown, PDF-ready)
 */

import { GridData, SymbolDefinition } from '../store/projectStore'
import { getDMCName } from './dmcColors'
import { getCrossReferences } from './flossBrands'

// ============================================================
// Types
// ============================================================

export type ReadingDirection = 'left-to-right' | 'right-to-left'

export interface ColorAbbreviation {
  dmcNumber: string
  abbreviation: string
}

export interface InstructionOptions {
  readingDirection?: ReadingDirection
  useAbbreviations?: boolean
  abbreviationDictionary?: ColorAbbreviation[]
  separator?: string  // default: ', '
  includeRowNumbers?: boolean
  format?: 'plain' | 'markdown' | 'pdf'
}

export interface RowInstruction {
  rowNumber: number
  description: string
  stitchCount: number
  colorBreakdown: ColorSegment[]
}

export interface ColorSegment {
  dmcNumber: string
  dmcName: string
  abbreviation: string
  consecutiveCount: number
  hex: string
}

// ============================================================
// Default abbreviation dictionary
// Uses first letters of color names, conflicts resolved
// ============================================================

const DEFAULT_ABBREVIATIONS: ColorAbbreviation[] = [
  // Common colors get intuitive abbreviations
  { dmcNumber: '410', abbreviation: 'BLK' },    // Black
  { dmcNumber: 'blanc', abbreviation: 'WHT' },  // Blanc (white)
  { dmcNumber: '310', abbreviation: 'OFL' },    // Off-white
  { dmcNumber: '3349', abbreviation: 'RD' },    // Red
  { dmcNumber: '3367', abbreviation: 'RDK' },   // Dark red
  { dmcNumber: '3329', abbreviation: 'BL' },    // Blue
  { dmcNumber: '825', abbreviation: 'GRN' },    // Green
  { dmcNumber: '720', abbreviation: 'ORG' },    // Orange
  { dmcNumber: '723', abbreviation: 'YLW' },    // Yellow
  { dmcNumber: '391', abbreviation: 'MRN' },    // Maroon
  { dmcNumber: '414', abbreviation: 'BRN' },    // Brown
  { dmcNumber: '910', abbreviation: 'GRY' },    // Gray
  { dmcNumber: '707', abbreviation: 'PNK' },    // Pink
  { dmcNumber: '900', abbreviation: 'PL' },     // Purple
  { dmcNumber: '3327', abbreviation: 'NVY' },   // Navy
  { dmcNumber: '3355', abbreviation: 'GR' },    // Dark green
  { dmcNumber: '824', abbreviation: 'DG' },     // Dark green
  { dmcNumber: '3346', abbreviation: 'DKG' },   // Dark gray
]

// ============================================================
// Core logic
// ============================================================

/**
 * Group consecutive same-color stitches into segments
 */
function groupConsecutiveStitches(gridRow: number[]): ColorSegment[] {
  if (gridRow.length === 0) return []

  const segments: ColorSegment[] = []
  let currentDmc = gridRow[0]
  let count = 0

  for (const dmc of gridRow) {
    if (dmc === currentDmc) {
      count++
    } else {
      segments.push({
        dmcNumber: currentDmc.toString(),
        dmcName: getDMCName(currentDmc) || 'Unknown',
        abbreviation: '', // filled in by applyAbbreviations
        consecutiveCount: count,
        hex: '', // filled by caller
      })
      currentDmc = dmc
      count = 1
    }
  }

  // Push last group
  segments.push({
    dmcNumber: currentDmc.toString(),
    dmcName: getDMCName(currentDmc) || 'Unknown',
    abbreviation: '',
    consecutiveCount: count,
    hex: '',
  })

  return segments
}

/**
 * Apply abbreviation mapping to segments
 */
function applyAbbreviations(
  segments: ColorSegment[],
  dictionary: ColorAbbreviation[]
): void {
  const lookup: Record<string, string> = {}
  for (const entry of dictionary) {
    lookup[entry.dmcNumber] = entry.abbreviation
  }

  for (const seg of segments) {
    seg.abbreviation = lookup[seg.dmcNumber] || generateFallbackAbbreviation(seg)
  }
}

/**
 * Generate a fallback abbreviation when the dictionary doesn't cover a color
 * Uses first 2-3 letters of color name, avoids conflicts
 */
function generateFallbackAbbreviation(segment: ColorSegment): string {
  const name = segment.dmcName.toUpperCase()
  const nameNoSpace = name.replace(/[^A-Z]/g, '')

  if (nameNoSpace.length >= 3) {
    return nameNoSpace.slice(0, 3)
  }
  return nameNoSpace.slice(0, 2)
}

/**
 * Resolve abbreviations to avoid conflicts
 * (two colors can't share the same abbreviation)
 */
function resolveAbbreviationConflicts(segments: ColorSegment[]): void {
  const used: Record<string, number> = {}

  for (const seg of segments) {
    const abbr = seg.abbreviation
    used[abbr] = (used[abbr] || 0) + 1
  }

  // For conflicts, append the DMC number
  for (const seg of segments) {
    if (used[seg.abbreviation] > 1) {
      seg.abbreviation = `${seg.abbreviation}${seg.dmcNumber}`
    }
  }
}

/**
 * Generate formatted instruction string for a single row
 */
function formatRowInstruction(
  segments: ColorSegment[],
  rowNumber: number,
  options: InstructionOptions
): string {
  const { separator = ', ', includeRowNumbers = true } = options
  const parts = segments.map(s => `${s.consecutiveCount}×${s.abbreviation}`)
  const description = parts.join(separator)

  if (!includeRowNumbers) return description
  return `Row ${rowNumber}: ${description}`
}

/**
 * Generate written instructions for an entire grid
 */
export function generateInstructions(
  grid: GridData,
  options: InstructionOptions = {}
): RowInstruction[] {
  const {
    readingDirection = 'left-to-right',
    useAbbreviations = true,
    abbreviationDictionary = DEFAULT_ABBREVIATIONS,
    separator = ', ',
    includeRowNumbers = true,
    format = 'plain',
  } = options

  const results: RowInstruction[] = []

  for (let row = 0; row < grid.length; row++) {
    const gridRow = readingDirection === 'left-to-right'
      ? grid[row]
      : [...grid[row]].reverse()

    let segments = groupConsecutiveStitches(gridRow)

    if (useAbbreviations) {
      segments = segments.map(s => ({
        ...s,
        abbreviation: abbreviationDictionary.find(
          d => d.dmcNumber === s.dmcNumber
        )?.abbreviation || s.dmcName.slice(0, 3).toUpperCase(),
      }))
      resolveAbbreviationConflicts(segments)
    }

    const totalStitches = gridRow.length
    const description = segments.map(s => `${s.consecutiveCount}×${s.abbreviation}`).join(separator)

    results.push({
      rowNumber: row + 1,
      description: includeRowNumbers ? `Row ${row + 1}: ${description}` : description,
      stitchCount: totalStitches,
      colorBreakdown: segments,
    })
  }

  return results
}

/**
 * Export instructions as plain text
 */
export function instructionsToText(
  instructions: RowInstruction[],
  options: InstructionOptions = {}
): string {
  const { separator = ', ', includeRowNumbers = true } = options
  return instructions
    .map(row => includeRowNumbers ? row.description : row.description.replace(/^Row \d+:\s*/, ''))
    .join('\n')
}

/**
 * Export instructions as Markdown
 */
export function instructionsToMarkdown(
  instructions: RowInstruction[],
  title: string = 'Pattern Instructions'
): string {
  const lines = [
    `# ${title}`,
    '',
    `Total rows: ${instructions.length}`,
    `Total stitches: ${instructions.reduce((sum, r) => sum + r.stitchCount, 0)}`,
    '',
    '```',
  ]

  for (const row of instructions) {
    lines.push(row.description)
  }

  lines.push('```')
  return lines.join('\n')
}

/**
 * Export instructions as PDF-ready text (with page breaks)
 */
export function instructionsToPDF(
  instructions: RowInstruction[],
  options: InstructionOptions = {}
): string {
  const { includeRowNumbers = true } = options
  const maxRowsPerPage = 30
  const pages: string[] = []

  for (let i = 0; i < instructions.length; i += maxRowsPerPage) {
    const pageRows = instructions.slice(i, i + maxRowsPerPage)
    const pageNum = Math.floor(i / maxRowsPerPage) + 1
    const totalPages = Math.ceil(instructions.length / maxRowsPerPage)

    const pageLines = [
      `Page ${pageNum} of ${totalPages}`,
      ...pageRows.map(r => r.description),
    ]

    pages.push(pageLines.join('\n'))
  }

  return pages.join('\n\n--- PAGE BREAK ---\n\n')
}

/**
 * Count unique colors used
 */
export function countColors(instructions: RowInstruction[]): Map<string, number> {
  const colorCount = new Map<string, number>()

  for (const row of instructions) {
    for (const seg of row.colorBreakdown) {
      const existing = colorCount.get(seg.dmcNumber) || 0
      colorCount.set(seg.dmcNumber, existing + seg.consecutiveCount)
    }
  }

  return colorCount
}
