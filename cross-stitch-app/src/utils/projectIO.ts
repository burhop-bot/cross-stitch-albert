/**
 * Project Save/Load Utilities
 * Handles JSON export/import of cross-stitch projects
 */

import { Project, GridData, ProjectSettings, Panel, FabricType, BackstitchLine, SymbolDefinition, FlossBrand } from '../store/projectStore'

export interface ProjectExport {
  version: string
  exportedAt: string
  project: Project
  grid: GridData | null
  dmcPalette: number[]
  dmcUsage: Record<number, number>
  inventory?: { dmcNumber: number; quantity: number; usedStitches: number }[]
  completedStitches?: string[] // serialized set
  backstitchLines?: Record<number, BackstitchLine[]> // panelId -> lines
  symbolDefinitions?: Record<number, Omit<SymbolDefinition, 'fill'> & { fill?: string }>
  flossBrand?: FlossBrand
}

export type { BackstitchLine } from '../types/backstitch'

/**
 * Export project to JSON format
 * Includes v2 fields: completedStitches, backstitch data, symbol defs
 */
export function exportProjectJSON(
  project: Project,
  grid: GridData | null,
  dmcPalette: number[],
  dmcUsage: Map<number, number>,
  options?: {
    completedStitches?: string[]
    backstitchLines?: Record<number, BackstitchLine[]>
    symbolDefinitions?: Record<number, Omit<SymbolDefinition, 'fill'> & { fill?: string }>
    flossBrand?: FlossBrand
    inventory?: { dmcNumber: number; quantity: number; usedStitches: number }[]
  }
): string {
  const exportData: ProjectExport = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    project,
    grid,
    dmcPalette,
    dmcUsage: Object.fromEntries(dmcUsage),
    inventory: options?.inventory,
    completedStitches: options?.completedStitches,
    backstitchLines: options?.backstitchLines,
    symbolDefinitions: options?.symbolDefinitions,
    flossBrand: options?.flossBrand,
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Download project as JSON file
 */
export function downloadProjectJSON(
  project: Project,
  grid: GridData | null,
  dmcPalette: number[],
  dmcUsage: Map<number, number>
): void {
  const json = exportProjectJSON(project, grid, dmcPalette, dmcUsage)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.title.replace(/\s+/g, '_')}_project.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import project from JSON file
 * Handles v1.0.0 and v2.0.0 formats with migration
 */
export function importProjectJSON(jsonString: string): ProjectExport | null {
  try {
    const data = JSON.parse(jsonString) as ProjectExport
    
    // Validate required fields
    if (!data.version || !data.project || !data.project.panels) {
      console.error('Invalid project format: missing required fields')
      return null
    }
    
    // Convert dmcUsage back to Map
    if (data.dmcUsage) {
      data.dmcUsage = Object.fromEntries(
        Object.entries(data.dmcUsage).map(([k, v]) => [parseInt(k), v])
      ) as any
    }
    
    // v1.0.0 migration: ensure backstitch arrays exist on panels
    if (data.version === '1.0.0' && data.project.panels) {
      for (const panel of data.project.panels) {
        if (!panel.backstitch) {
          panel.backstitch = []
        }
      }
    }
    
    // Convert completedStitches from array to Set if needed
    if (data.completedStitches && !Array.isArray(data.completedStitches)) {
      data.completedStitches = Array.from(data.completedStitches as any)
    }
    
    return data
  } catch (error) {
    console.error('Failed to parse project JSON:', error)
    return null
  }
}

/**
 * Read JSON file from file input
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Material inventory types
 */
export interface MaterialItem {
  id: string
  type: 'thread' | 'fabric' | 'hoop' | 'needle' | 'other'
  name: string
  brand?: string
  quantity: number
  unit: string // 'skeins', 'inches', 'yards', 'pieces'
  notes?: string
  used: boolean
}

export interface MaterialInventory {
  threads: MaterialItem[]
  fabrics: MaterialItem[]
  tools: MaterialItem[]
}

/**
 * Calculate material requirements from project
 */
export function calculateMaterialRequirements(
  project: Project,
  dmcUsage: Map<number, number>
): {
  threads: MaterialItem[]
  totalStitches: number
  estimatedArea: { width: number; height: number } // in inches
} {
  const threads: MaterialItem[] = []
  let totalStitches = 0
  
  // Assume 14-count Aida (14 stitches per inch)
  const stitchesPerInch = 14
  
  for (const [dmcNumber, stitchCount] of dmcUsage) {
    totalStitches += stitchCount
    
    // Calculate skeins needed (approx 3500 stitches per skein)
    const skeinsNeeded = Math.ceil(stitchCount / 3500)
    
    threads.push({
      id: `thread-${dmcNumber}`,
      type: 'thread',
      name: `DMC ${dmcNumber}`,
      brand: 'DMC',
      quantity: skeinsNeeded,
      unit: 'skeins',
      used: true,
    })
  }
  
  // Calculate fabric size (add 3 inch border on each side)
  const panel = project.panels[0]
  if (panel && panel.design.length > 0) {
    const gridHeight = panel.design.length
    const gridWidth = panel.design[0].length
    
    return {
      threads,
      totalStitches,
      estimatedArea: {
        width: (gridWidth / stitchesPerInch) + 6,
        height: (gridHeight / stitchesPerInch) + 6,
      },
    }
  }
  
  return {
    threads,
    totalStitches,
    estimatedArea: { width: 0, height: 0 },
  }
}
