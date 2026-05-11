/**
 * Types for the advanced drawing tools
 */

export type DrawingTool = 
  | 'pencil' | 'eraser' | 'fill'
  | 'line' | 'rectangle' | 'circle'
  | 'dropper' | 'brush' | 'select'

export interface DrawingPreview {
  fromX: number
  fromY: number
  toX: number
  toY: number
}

export interface CirclePreview {
  cx: number
  cy: number
  radius: number
}

export interface SelectionInfo {
  x1: number
  y1: number
  x2: number
  y2: number
}
