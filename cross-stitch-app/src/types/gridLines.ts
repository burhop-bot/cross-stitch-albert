// Grid line configuration types
// Multi-weight grid lines are critical for stitch counting

export type LabelPosition = 'left' | 'right' | 'both' | 'none'

export interface GridLineConfig {
  // Light lines — every cell border
  lightLineWidth: number  // 0.5
  lightLineColor: string  // '#e5e7eb'
  
  // Medium lines — every N cells
  mediumInterval: number  // 5
  mediumLineWidth: number // 2
  mediumLineColor: string // '#9ca3af'
  
  // Heavy lines — every N cells
  heavyInterval: number   // 10
  heavyLineWidth: number  // 3
  heavyLineColor: string  // '#4b5563'
  
  // Toggle visibility
  showLines: boolean
}

export interface LabelConfig {
  // Where to show labels
  position: LabelPosition // 'left', 'right', 'both', 'none'
  
  // Numbering
  startNumber: number     // 0 or 1
  interval: number        // show label every N cells (1, 5, or 10)
  
  // Styling
  fontSize: 'sm' | 'md' | 'lg'
  fontColor: string
  boldAtHeavy: boolean
  boldAtMedium: boolean
  
  // Visibility based on zoom
  minZoomForSmallLabels: number // 0.5
  minZoomForMediumLabels: number // 1.0
  minZoomForLargeLabels: number // 2.0
}

// Default grid line config
export const DEFAULT_GRID_LINE_CONFIG: GridLineConfig = {
  lightLineWidth: 0.5,
  lightLineColor: '#e5e7eb',
  mediumInterval: 5,
  mediumLineWidth: 2,
  mediumLineColor: '#9ca3af',
  heavyInterval: 10,
  heavyLineWidth: 3,
  heavyLineColor: '#4b5563',
  showLines: true,
}

// Default label config
export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  position: 'both',
  startNumber: 1,
  interval: 1,
  fontSize: 'sm',
  fontColor: '#9ca3af',
  boldAtHeavy: true,
  boldAtMedium: true,
  minZoomForSmallLabels: 0.5,
  minZoomForMediumLabels: 1.0,
  minZoomForLargeLabels: 2.0,
}

// Helper: determine line weight for a given position
export function getGridLineWeight(
  pos: number,
  config: GridLineConfig,
  dimension: number
): { width: number; color: string; show: boolean } {
  if (!config.showLines) {
    return { width: 0, color: 'transparent', show: false }
  }
  
  const isHeavy = pos > 0 && pos % config.heavyInterval === 0 && pos <= dimension
  const isMedium = pos > 0 && pos % config.mediumInterval === 0 && pos <= dimension
  
  if (isHeavy) {
    return { width: config.heavyLineWidth, color: config.heavyLineColor, show: true }
  }
  if (isMedium) {
    return { width: config.mediumLineWidth, color: config.mediumLineColor, show: true }
  }
  
  return { width: config.lightLineWidth, color: config.lightLineColor, show: config.showLines }
}

// Helper: determine label style based on position
export function getLabelStyle(
  pos: number,
  config: LabelConfig
): { show: boolean; bold: boolean; fontSize: string; color: string } {
  const isHeavy = pos > 0 && pos % 10 === 0
  const isMedium = pos > 0 && pos % 5 === 0
  
  return {
    show: pos % config.interval === 0,
    bold: (isHeavy && config.boldAtHeavy) || (isMedium && config.boldAtMedium),
    fontSize: config.fontSize,
    color: config.fontColor,
  }
}
