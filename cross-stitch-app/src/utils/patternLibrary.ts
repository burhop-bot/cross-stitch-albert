import type {
  PatternItem,
  PatternMetadata,
  PatternExportData,
  PatternReview,
} from '../types/patternLibrary'

/**
 * Generate a unique ID for a pattern item.
 */
export function generatePatternId(): string {
  return `pattern_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Generate a thumbnail data URL from a grid.
 * @param grid - 2D color index array
 * @param palette - color hex values
 * @param maxPixels - max width/height for thumbnail
 */
export function generateThumbnail(
  grid: number[][],
  palette: number[],
  maxPixels: number = 120
): string {
  const w = grid[0]?.length ?? 0
  const h = grid.length
  const scale = Math.min(maxPixels / w, maxPixels / h, 1)
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const gy = Math.min(Math.floor(y / scale), h - 1)
      const gx = Math.min(Math.floor(x / scale), w - 1)
      const colorIdx = grid[gy]?.[gx] ?? 0
      ctx.fillStyle = typeof palette[colorIdx] === 'string' ? palette[colorIdx] : '#000'
      ctx.fillRect(x, y, 1, 1)
    }
  }

  return canvas.toDataURL('image/jpeg', 0.7)
}

/**
 * Downsample a grid for embedding in a review thumbnail.
 */
export function downsampleGrid(
  grid: number[][],
  palette: number[],
  maxPixels: number = 30
): number[][] {
  const w = grid[0]?.length ?? 0
  const h = grid.length
  const scale = Math.max(w, h) / maxPixels
  const tw = Math.max(1, Math.round(w / scale))
  const th = Math.max(1, Math.round(h / scale))

  const result: number[][] = []
  for (let y = 0; y < th; y++) {
    const row: number[] = []
    for (let x = 0; x < tw; x++) {
      const gy = Math.min(Math.floor(y * scale), h - 1)
      const gx = Math.min(Math.floor(x * scale), w - 1)
      row.push(grid[gy]?.[gx] ?? 0)
    }
    result.push(row)
  }
  return result
}

/**
 * Search and filter pattern items.
 */
export function filterPatterns(
  patterns: PatternItem[],
  options: {
    search?: string
    category?: string
    difficulty?: string
    minColors?: number
    maxColors?: number
    sortBy?: 'title' | 'rating' | 'downloads' | 'newest'
  }
): PatternItem[] {
  let results = [...patterns]
  const { search, category, difficulty, minColors, maxColors, sortBy } = options

  // Text search (title, author, description, tags)
  if (search) {
    const q = search.toLowerCase()
    results = results.filter((p) => {
      const meta = p.metadata
      return (
        meta.title.toLowerCase().includes(q) ||
        meta.author.toLowerCase().includes(q) ||
        meta.designer.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q) ||
        meta.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }

  // Category filter
  if (category && category !== 'All') {
    results = results.filter((p) => p.metadata.category === category)
  }

  // Difficulty filter
  if (difficulty) {
    results = results.filter((p) => p.metadata.difficulty === difficulty)
  }

  // Color count range
  if (minColors !== undefined) {
    results = results.filter((p) => p.metadata.colorCount >= minColors)
  }
  if (maxColors !== undefined) {
    results = results.filter((p) => p.metadata.colorCount <= maxColors)
  }

  // Sort
  if (sortBy) {
    results.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.metadata.title.localeCompare(b.metadata.title)
        case 'rating':
          return b.rating.average - a.rating.average
        case 'downloads':
          return b.downloadCount - a.downloadCount
        case 'newest':
        default:
          return (
            new Date(b.metadata.modified || b.metadata.created || '').getTime() -
            new Date(a.metadata.modified || a.metadata.created || '').getTime()
          )
      }
    })
  }

  return results
}

/**
 * Export a pattern with full metadata as JSON.
 */
export function createPatternExport(
  metadata: PatternMetadata,
  grid: number[][],
  palette: number[]
): PatternExportData {
  return {
    metadata,
    grid,
    palette,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Download a pattern JSON file.
 */
export function downloadPatternJSON(data: PatternExportData, fileName: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName.replace(/\s+/g, '_')}_pattern.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate a shareable URL for a pattern (placeholder — no backend).
 * In a real app this would upload to a server.
 */
export function generateShareURL(pattern: PatternItem): string {
  // Placeholder: returns a URL that could be extended with a real backend
  const slug = pattern.metadata.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `cross-stitch-studio.io/p/${pattern.id}_${slug}`
}

/**
 * Create a new review for a pattern.
 */
export function createReview(
  pattern: PatternItem,
  review: Omit<PatternReview, 'id' | 'date' | 'helpful'>
): PatternReview {
  const newReview: PatternReview = {
    ...review,
    id: `review_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    helpful: 0,
  }

  // Update pattern rating
  const totalReviews = pattern.rating.totalReviews + 1
  const newAverage =
    (pattern.rating.average * pattern.rating.totalReviews + review.rating) /
    totalReviews

  return {
    ...newReview,
  }
}

/**
 * Parse a downloaded pattern JSON back into a PatternItem.
 */
export function parsePatternJSON(json: string): PatternExportData | null {
  try {
    const data = JSON.parse(json)
    if (!data.metadata || !data.grid || !data.palette) return null
    return data as PatternExportData
  } catch {
    return null
  }
}

/**
 * Tag extraction from a description or title.
 */
export function extractTags(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[\s,]+/)
    .filter((w) => w.length > 2 && /^[a-z]+$/.test(w))
  // Deduplicate
  return [...new Set(words)]
}
