import type { PatternExportData, PatternMetadata } from '../types/patternLibrary'
import { generateThumbnail } from './patternLibrary'

/**
 * Export the current editor project as a pattern JSON with metadata.
 */
export function exportCurrentProjectAsPattern(
  title: string,
  author: string,
  fabric: string,
  grid: number[][],
  palette: number[],
  options?: Partial<Omit<PatternMetadata, 'title' | 'author' | 'fabric' | 'stitchCount' | 'colorCount'>>
): PatternExportData {
  const colorCount = new Set(grid.flat()).size

  return {
    metadata: {
      title: title || 'Untitled',
      author: author || 'Anonymous',
      designer: author || 'Anonymous',
      description: options?.description || '',
      tags: options?.tags || [],
      category: options?.category || 'Other',
      difficulty: options?.difficulty || 'intermediate',
      stitchCount: { width: grid[0]?.length ?? 0, height: grid.length },
      fabric: fabric || '14-count Aida',
      flossBrand: 'dmc',
      colorCount,
      estimatedHours: options?.estimatedHours ?? 0,
      version: '1.0.0',
    },
    grid,
    palette,
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Generate and download the export JSON for the current project.
 */
export async function downloadExportJSON(
  title: string,
  author: string,
  fabric: string,
  grid: number[][],
  palette: number[],
  options?: Partial<Omit<PatternMetadata, 'title' | 'author' | 'fabric' | 'stitchCount' | 'colorCount'>>
): Promise<void> {
  const exportData = exportCurrentProjectAsPattern(title, author, fabric, grid, palette, options)

  // Generate thumbnail asynchronously
  const thumbnailUrl = generateThumbnail(grid, palette, 120)

  // Add thumbnail to export metadata
  if (thumbnailUrl) {
    (exportData as any).thumbnailUrl = thumbnailUrl
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\s+/g, '_')}_pattern.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
