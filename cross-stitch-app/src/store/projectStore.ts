import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getAllDMCColors } from '../utils/dmcColors'
import { GridLineConfig, LabelConfig, DEFAULT_GRID_LINE_CONFIG, DEFAULT_LABEL_CONFIG } from '../types/gridLines'
import type { BackstitchLine, BackstitchConfig } from '../types/backstitch'
import { DEFAULT_BACKSTITCH_CONFIG } from '../types/backstitch'
import type { PatternItem } from '../types/patternLibrary'
export type { BackstitchLine } from '../types/backstitch'

// ─── Undo/Redo snapshot tracking ──
// Module-level snapshot ref: set before mutations, pushed by subscription callback.
let _prevSnapshot: ReturnType<typeof useProjectStore> | null = null
let _inUndoRedo = false
let _undoBeforeChange = false
/**
 * Call BEFORE a mutation to capture the pre-mutation state snapshot.
 * The subscription will push this snapshot to the undo stack.
 */
/**
 * Capture a snapshot of the current state for undo.
 * Must be called IMMEDIATELY before a mutation that calls set().
 * The subscription will push this snapshot to the undo stack AFTER the mutation.
 */
export function captureBeforeMutation(): void {
  // Capture the pre-mutation state NOW, before set() is called
  const current = useProjectStore.getState() as any
  _pendingSnapshot = current
  _undoBeforeChange = true
}

let _pendingSnapshot: any = null

let _beforeChange = false

// ─── History types ───────────────────────────────────────────────

/** Full application state snapshot — used by undo/redo */
export type AppStateSnapshot = {
  settings: ProjectState['settings']
  panels: ProjectState['panels']
  selectedPanelId: ProjectState['selectedPanelId']
  selectedColor: ProjectState['selectedColor']
  tools: ProjectState['tools']
  dmcPalette: ProjectState['dmcPalette']
  dmcUsage: ProjectState['dmcUsage']
  completedStitches: ProjectState['completedStitches']
  semiCrosses: ProjectState['semiCrosses']
  symbolDefinitions: ProjectState['symbolDefinitions']
  backstitchConfig: ProjectState['backstitchConfig']
  gridLineConfig: ProjectState['gridLineConfig']
  labelConfig: ProjectState['labelConfig']
  inventory: ProjectState['inventory']
  activeRightPanel: ProjectState['activeRightPanel']
  showInventory: ProjectState['showInventory']
  flossBrand: ProjectState['flossBrand']
  show3D: ProjectState['show3D']
  showSymbols: ProjectState['showSymbols']
  showAlternatingColors: ProjectState['showAlternatingColors']
  zoom: ProjectState['zoom']
  brushSize: ProjectState['brushSize']
  brushPreview: ProjectState['brushPreview']
  drawPreview: ProjectState['drawPreview']
  shapePreview: ProjectState['shapePreview']
  circlePreview: ProjectState['circlePreview']
  selection: ProjectState['selection']
  selectionStart: ProjectState['selectionStart']
  selectionEnd: ProjectState['selectionEnd']
  selectionClipboard: ProjectState['selectionClipboard']
  showPatternRepeat: ProjectState['showPatternRepeat']
  semiCrossCycleIndex: ProjectState['semiCrossCycleIndex']
  showNotesPanel: ProjectState['showNotesPanel']
  notes: ProjectState['notes']
  patternLibrary: ProjectState['patternLibrary']
  historyDepth: ProjectState['historyDepth']
  useIndexedDB: ProjectState['useIndexedDB']
  gridRenderingMode: ProjectState['gridRenderingMode']
  undoStack: ProjectState['undoStack']
  redoStack: ProjectState['redoStack']
  historyMaxEntries: ProjectState['historyMaxEntries']
  lastSaved: ProjectState['lastSaved']
  autoSaveEnabled: ProjectState['autoSaveEnabled']
  autoSaveInterval: ProjectState['autoSaveInterval']
  currentImage: ProjectState['currentImage']
  currentGrid: ProjectState['currentGrid']
  onboardingCompleted: ProjectState['onboardingCompleted']
  colorHistory: ProjectState['colorHistory']
  gridSnapEnabled: ProjectState['gridSnapEnabled']
  showRuler: ProjectState['showRuler']
  contextMenu: ProjectState['contextMenu']
  showThumbnailGallery: ProjectState['showThumbnailGallery']
  shareUrl: ProjectState['shareUrl']
  exportPngInProgress: ProjectState['exportPngInProgress']
  showClearPatternDialog: ProjectState['showClearPatternDialog']
}

// ─── Snapshot ref (module-level, set before mutations, read by subscribe) ──
let _snapshotRef: AppStateSnapshot | null = null

/**
 * Called BEFORE any mutation to capture the pre-mutation state snapshot.
 * Must be called from outside the store, before calling a mutation action.
 */
export function snapshotBeforeMutation() {
  _snapshotRef = useProjectStore.getState()
}

export type PanelStatus = 'not-started' | 'in-progress' | 'finished'
export type PanelShape = 'rectangle' | 'pentagon' | 'hexagon'
export type FabricType = '11-count Aida' | '14-count Aida' | '18-count Aida' | '16-count Evenweave' | '14-count Evenweave'
export type FlossBrand = 'dmc' | 'anchor' | 'madeira' | 'generic'

// Semi-cross types: quarter-stitches (diagonal half-crosses)
export type SemiCrossType =
  | 'none'
  | 'tl-br'  // top-left to bottom-right diagonal (/)
  | 'tr-bl'  // top-right to bottom-left diagonal (\)
  | 'top'    // top half of cell
  | 'bottom' // bottom half of cell
  | 'left'   // left half of cell
  | 'right'; // right half of cell

// Notes & Annotations
export interface Note {
  id: string
  text: string
  row: number
  col: number
  color?: string
}

export interface Panel {
  id: number
  name: string
  shape: PanelShape
  design: number[][] // 2D grid of color indices
  status: PanelStatus
  backstitch: BackstitchLine[]
  notes: Note[]
}

export interface Skein {
  id: string
  dmcNumber: number
  quantity: number
  usedStitches: number
}

export interface ProjectSettings {
  width: number // stitches wide
  height: number // stitches tall
  fabric: FabricType
  title: string
  author: string
}

export interface UploadedImage {
  dataUrl: string
  fileName: string
  width: number
  height: number
}

export interface SymbolDefinition {
  character: string
  style: 'circle' | 'square' | 'triangle' | 'diamond' | 'star' | 'heart' | 'cross' | 'dot' | 'none'
  size: 'sm' | 'md' | 'lg'
  fill?: string
  stroke?: string
}
// FlossBrand type is defined above; no re-export needed

export type GridData = number[][]

/**
 * Composite Project type for serialization / import-export
 */
export interface Project {
  title: string
  author: string
  fabric: FabricType
  width: number
  height: number
  panels: Panel[]
  flossBrand: FlossBrand
}

interface ProjectState {
  // Project metadata
  settings: ProjectSettings
  panels: Panel[]
  dmcPalette: number[]
  flossBrand: FlossBrand

  // Current editing state
  selectedPanelId: number | null
  selectedColor: number
  show3D: boolean
  showSymbols: boolean
  showAlternatingColors: boolean
  
  // Grid line configuration (new!)
  gridLineConfig: GridLineConfig
  labelConfig: LabelConfig
  
  // Backstitch layer (v2)
  backstitchConfig: BackstitchConfig
  
  // Symbol definitions (v2)
  symbolDefinitions: Map<number, SymbolDefinition>
  
  // Progress tracking (v2)
  completedStitches: Set<string> // "panelId:row:col"
  manualStitchCount: number // manual counter for current panel
  lastEditedRow: number | null // for position indicator
  lastEditedCol: number | null // for position indicator

  // Auto-save state (v2)
  lastSaved: Date | null
  autoSaveEnabled: boolean
  autoSaveInterval: number // seconds

  // Image import state
  currentImage: UploadedImage | null

  // Pattern from image conversion
  currentGrid: GridData | null
  dmcUsage: Map<number, number>

  // Inventory
  inventory: Skein[]
  showInventory: boolean

  // Right panel tab
  activeRightPanel: 'settings' | 'import' | 'conversion' | 'conversion-v2' | 'inventory' | 'progress' | 'instructions' | 'symbols' | 'notes' | 'library' | null

  // Tools
  tools: {
    pencil: boolean
    eraser: boolean
    fill: boolean
    line: boolean
    eraseline: boolean
    rectangle: boolean
    circle: boolean
    dropper: boolean
    brush: boolean
    select: boolean
    semicross: boolean
    mirrorH: boolean
    mirrorV: boolean
  }
  zoom: number
  
  // Brush settings
  brushSize: number // stroke width in stitches (1-10)
  
  // Selection/copy-paste
  selection: { x1: number; y1: number; x2: number; y2: number } | null
  selectionClipboard: number[][] | null
  selectionStart: { x: number; y: number } | null // for drag-to-select
  selectionEnd: { x: number; y: number } | null // for drag-to-select
  
  // Drawing preview state
  drawPreview: { fromX: number; fromY: number; toX: number; toY: number } | null
  shapePreview: { x1: number; y1: number; x2: number; y2: number } | null
  circlePreview: { cx: number; cy: number; radius: number } | null
  brushPreview: { cx: number; cy: number; radius: number } | null

  // Actions
  setProjectSettings: (settings: Partial<ProjectSettings>) => void
  setSelectedPanelId: (id: number | null) => void
  setSelectedColor: (color: number) => void

  // Color editing
  swapColors: (idxA: number, idxB: number) => void
  batchRecolor: (fromColor: number, toColor: number) => { replaced: number }
  countColorsInGrid: () => Map<number, number>
  cropBlankBorders: (blankIndices?: Set<number>) => void
  setShow3D: (show: boolean) => void
  setShowSymbols: (show: boolean) => void
  setShowAlternatingColors: (show: boolean) => void
  
  // Grid line actions
  setGridLineConfig: (config: Partial<GridLineConfig>) => void
  setLabelConfig: (config: Partial<LabelConfig>) => void
  setShowGridLines: (show: boolean) => void
  setTool: (tool: keyof ProjectState['tools'], active: boolean) => void
  setZoom: (zoom: number) => void
  setImage: (dataUrl: string, fileName: string, width: number, height: number) => void
  clearImage: () => void
  setGrid: (grid: GridData) => void
  addDMCColors: (colors: { number: number; name: string; hex: string }[]) => void
  setDMCUsage: (usage: Map<number, number>) => void
  updatePanel: (panelId: number, updates: Partial<Panel>) => void
  togglePanelStatus: (panelId: number) => void

  // Backstitch actions
  setBackstitchConfig: (config: Partial<BackstitchConfig>) => void
  addBackstitchLine: (panelId: number, line: BackstitchLine) => void
  removeBackstitchLine: (panelId: number, lineId: string) => void
  clearBackstitchLayer: (panelId: number) => void
  toggleBackstitchEnabled: () => void

  // Symbol actions
  setSymbolDefinition: (colorIndex: number, def: SymbolDefinition) => void
  clearSymbolDefinition: (colorIndex: number) => void

  // Progress tracking actions
  toggleCompletedStitch: (panelId: number, row: number, col: number) => void
  isStitchCompleted: (panelId: number, row: number, col: number) => boolean
  getProgressPercent: (panelId: number) => number
  getOverallProgressPercent: () => number
  setManualStitchCount: (count: number) => void
  incrementManualStitchCount: () => void
  decrementManualStitchCount: () => void
  resetManualStitchCount: () => void
  setLastEditedPosition: (row: number | null, col: number | null) => void
  getLastEditedPosition: () => { row: number | null; col: number | null }
  
  // Auto-save actions
  setAutoSaveEnabled: (enabled: boolean) => void
  setAutoSaveInterval: (interval: number) => void
  triggerAutoSave: () => void
  getLastSaved: () => Date | null

  // Performance state (Phase 17)
  historyDepth: number
  useIndexedDB: boolean
  gridRenderingMode: 'dom' | 'canvas' | 'virtual'

  // ─── Undo / Redo (Phase 22) ───────────────────────────────────
  /** Snapshot stack — previous states for undo. Most recent at top (index -1). */
  undoStack: AppStateSnapshot[]
  /** Snapshot stack — undone states for redo. Most recent at top (index -1). */
  redoStack: AppStateSnapshot[]
  /** Max entries kept in each history stack */
  historyMaxEntries: number
  /**
   * Perform an undoable action: capture a snapshot, run fn(set), trim stack.
   * Only use with synchronous set(fn) callbacks.
   */
  _undoSnapshot: ProjectState | null
  /** Pop one level from undo stack, push current state to redo */
  undo: () => void
  /** Pop one level from redo stack, push current state to undo */
  redo: () => void
  /** Clear the entire history (pattern clear, new project) */
  resetHistory: () => void

  // Inventory actions
  addToInventory: (dmcNumber: number, quantity: number) => void
  removeFromInventory: (skeinId: string) => void
  updateInventoryQuantity: (skeinId: string, quantity: number) => void
  updateStitchUsage: (dmcNumber: number, delta: number) => void

  // UI actions
  setShowInventory: (show: boolean) => void
  setActiveRightPanel: (tab: 'settings' | 'import' | 'conversion' | 'conversion-v2' | 'inventory' | 'progress' | 'instructions' | 'symbols' | 'notes' | 'library' | null) => void
  setFlossBrand: (brand: FlossBrand) => void

  // Grid dimensions
  setGridDimensions: (width: number, height: number) => void
  createDefaultPanels: (width: number, height: number, shape?: PanelShape) => void

  // Drawing tool actions
  setBrushPreview: (preview: { cx: number; cy: number; radius: number } | null) => void
  setBrushSize: (size: number) => void
  setDrawPreview: (preview: { fromX: number; fromY: number; toX: number; toY: number } | null) => void
  setSelection: (sel: { x1: number; y1: number; x2: number; y2: number } | null) => void
  setSelectionStart: (start: { x: number; y: number } | null) => void
  setSelectionEnd: (end: { x: number; y: number } | null) => void
  setSelectionClipboard: (clip: number[][] | null) => void
  setShapePreview: (preview: { x1: number; y1: number; x2: number; y2: number } | null) => void
  setCirclePreview: (preview: { cx: number; cy: number; radius: number } | null) => void
  copySelection: () => void
  pasteSelection: (pasteX: number, pasteY: number) => void
  mirrorSelectionH: () => void
  mirrorSelectionV: () => void
  mirrorGridH: () => void
  mirrorGridV: () => void
  clearSelection: () => void
  eraseLine: (x1: number, y1: number, x2: number, y2: number) => void
  // Semi-cross stitches
  semiCrosses: Map<string, SemiCrossType> // key: "panelId-row-col"
  setSemiCross: (panelId: number, row: number, col: number, type: SemiCrossType) => void
  clearSemiCrosses: () => void
  // Pattern repeat
  repeatGrid: (repeatX: number, repeatY: number) => void
  repeatGridWithMirrorH: (repeatX: number, repeatY: number) => void
  repeatGridWithMirrorV: (repeatX: number, repeatY: number) => void
  repeatGridWithMirrorBoth: (repeatX: number, repeatY: number) => void
  // Mirror with offset
  mirrorGridWithOffset: (axis: 'h' | 'v', offset: number) => void
  mirrorSelectionWithOffset: (offset: number) => void
  showPatternRepeat: boolean
  setShowPatternRepeat: (show: boolean) => void
  // Semi-cross tool state
  semiCrossCycleIndex: number
  setSemiCrossCycleIndex: (idx: number) => void
  // Notes & annotations
  notes: Note[]
  showNotesPanel: boolean
  setShowNotesPanel: (show: boolean) => void
  addNote: (panelId: number, row: number, col: number, text: string, color?: string) => void
  updateNote: (noteId: string, text: string, color?: string) => void
  deleteNote: (noteId: string) => void

  // Pattern Library (Phase 18)
  patternLibrary: PatternItem[] | null
  setPatterns: (patterns: PatternItem[]) => void
  loadPatternLibrary: (patterns: PatternItem[]) => void
  deletePattern: (patternId: string) => void
  updatePatternDownloads: (patternId: string, delta: number) => void

  // Phase 20: Polish & UX
  // Onboarding tour
  onboardingCompleted: boolean
  setOnboardingCompleted: (completed: boolean) => void

  // Color history (recently used)
  colorHistory: number[] // most recently used color indices, LRU order, max 20
  addToColorHistory: (colorIndex: number) => void

  // Grid snap toggle
  gridSnapEnabled: boolean
  setGridSnapEnabled: (enabled: boolean) => void

  // Ruler overlay
  showRuler: boolean
  setShowRuler: (show: boolean) => void

  // Context menu
  contextMenu: { x: number; y: number; visible: boolean } | null
  setContextMenu: (menu: { x: number; y: number; visible: boolean } | null) => void

  // Thumbnail gallery
  showThumbnailGallery: boolean
  setShowThumbnailGallery: (show: boolean) => void

  // Share link
  shareUrl: string | null
  generateShareUrl: () => string | null

  // Export PNG
  exportPngInProgress: boolean
  setExportPngInProgress: (inProgress: boolean) => void

  // Clear pattern
  showClearPatternDialog: boolean
  setShowClearPatternDialog: (show: boolean) => void
  clearCurrentPanel: (panelId: number) => void
}

const generateSkeinId = () => `skein-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper: create a default empty design grid
export function emptyDesign(width: number, height: number): number[][] {
  return Array(height).fill(null).map(() => Array(width).fill(0))
}

/** Restore Sets/Maps from serialized arrays in undo/redo snapshots */
function _restoreSetTypes(snapshot: any): any {
  if (!snapshot || typeof snapshot !== 'object') return snapshot
  const restored = { ...snapshot }
  // Always restore completedStitches to Set
  if (!(restored.completedStitches instanceof Set)) {
    const arr = Array.isArray(restored.completedStitches)
      ? restored.completedStitches
      : Array.from(Object.keys(restored.completedStitches || {}).map(k => restored.completedStitches[k]))
    restored.completedStitches = new Set(arr)
  }
  // Always restore symbolDefinitions to Map
  if (!(restored.symbolDefinitions instanceof Map)) {
    restored.symbolDefinitions = new Map(
      Array.isArray(restored.symbolDefinitions)
        ? restored.symbolDefinitions
        : Object.entries(restored.symbolDefinitions || {})
    )
  }
  // Always restore semiCrosses to Map
  if (!(restored.semiCrosses instanceof Map)) {
    restored.semiCrosses = new Map(
      Array.isArray(restored.semiCrosses)
        ? restored.semiCrosses
        : Object.entries(restored.semiCrosses || {})
    )
  }
  // Always restore dmcUsage to Map
  if (!(restored.dmcUsage instanceof Map)) {
    restored.dmcUsage = new Map(
      Array.isArray(restored.dmcUsage)
        ? restored.dmcUsage
        : Object.entries(restored.dmcUsage || {})
    )
  }
  return restored
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      settings: {
        width: 40,
        height: 40,
        fabric: '14-count Aida' as FabricType,
        title: 'New Pattern',
        author: '',
      },
      panels: [
        {
          id: 0,
          name: 'Panel 1',
          shape: 'rectangle',
          design: emptyDesign(40, 40),
          status: 'not-started',
          backstitch: [],
          notes: [],
        },
      ],
      dmcPalette: getAllDMCColors().slice(0, 30).map(c => c.number),
      flossBrand: 'dmc',
      selectedPanelId: 0,
      selectedColor: 1,
      show3D: false,
      showSymbols: false,
      showAlternatingColors: true,
      
      // Grid line configuration
      gridLineConfig: DEFAULT_GRID_LINE_CONFIG,
      labelConfig: DEFAULT_LABEL_CONFIG,
      
      // Backstitch layer
      backstitchConfig: DEFAULT_BACKSTITCH_CONFIG,
      
      // Symbol definitions
      symbolDefinitions: new Map(),
      
      // Progress tracking
      completedStitches: new Set(),
      manualStitchCount: 0,
      lastEditedRow: null,
      lastEditedCol: null,
      
      // Auto-save state
      lastSaved: null,
      // Performance state (Phase 17)
      historyDepth: 50,
      useIndexedDB: false,
      gridRenderingMode: 'dom',
      autoSaveEnabled: false,

      // Undo / Redo (Phase 22)
      undoStack: [],
      redoStack: [],
      historyMaxEntries: 50,
      _undoSnapshot: null,
      autoSaveInterval: 30, // 30 seconds
      
      currentImage: null,
      currentGrid: null,
      dmcUsage: new Map<number, number>(),
      inventory: [],
      showInventory: false,
      activeRightPanel: null,
      tools: {
        pencil: true,
        eraser: false,
        fill: false,
        line: false,
        eraseline: false,
        rectangle: false,
        circle: false,
        dropper: false,
        brush: false,
        select: false,
        semicross: false,
        mirrorH: false,
        mirrorV: false,
      },
      zoom: 1,
      brushSize: 1,
      selection: null,
      selectionClipboard: null,
      selectionStart: null,
      selectionEnd: null,
      brushPreview: null,
      drawPreview: null,
      shapePreview: null,
      circlePreview: null,
      showPatternRepeat: false,

      // Semi-cross tool state
      semiCrossCycleIndex: 0,

      // Notes & annotations
      notes: [] as Note[],
      showNotesPanel: false,

      // Pattern Library (Phase 18)
      patternLibrary: null as PatternItem[] | null,

      // Semi-cross stitches: Map<"panelId-row-col", SemiCrossType>
      semiCrosses: new Map<string, SemiCrossType>(),

      // Phase 20 defaults
      onboardingCompleted: false,
      colorHistory: [],
      gridSnapEnabled: true,
      showRuler: false,
      contextMenu: null,
      showThumbnailGallery: false,
      shareUrl: null,
      exportPngInProgress: false,

      setProjectSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      setSelectedPanelId: (id) => set({ selectedPanelId: id }),

      setSelectedColor: (color) => set((state) => {
        const idx = state.dmcPalette.indexOf(color)
        const updates: Partial<ProjectState> = { selectedColor: color }
        if (idx >= 0) {
          const newHistory = state.colorHistory.filter((i) => i !== idx)
          updates.colorHistory = [idx, ...newHistory].slice(0, 20)
        }
        return updates
      }),

      // Color swap: swap two palette entries and update all grid references
      swapColors: (idxA: number, idxB: number) => {
        captureBeforeMutation()
        return set((state) => {
          // Swap palette entries
          const newPalette = [...state.dmcPalette]
          const temp = newPalette[idxA]
          newPalette[idxA] = newPalette[idxB]
          newPalette[idxB] = temp

          // Swap in all panels
          const newPanels = state.panels.map((panel) => ({
            ...panel,
            design: panel.design.map((row) =>
              row.map((cell) => {
                if (cell === idxA) return idxB
                if (cell === idxB) return idxA
                return cell
              })
            ),
          }))

          return { dmcPalette: newPalette, panels: newPanels }
        })
      },

      // Batch recolor: replace all occurrences of one color with another
      batchRecolor: (
        fromColor: number,
        toColor: number
      ): { replaced: number } => {
        captureBeforeMutation()
        let totalReplaced = 0
        set((state) => {
          const newPanels = state.panels.map((panel) => {
            const newDesign = panel.design.map((row) =>
              row.map((cell) => {
                if (cell === fromColor) {
                  totalReplaced++
                  return toColor
                }
                return cell
              })
            )
            return { ...panel, design: newDesign }
          })
          return { panels: newPanels }
        })
        return { replaced: totalReplaced }
      },

      // Count occurrences of each color
      countColorsInGrid: () => {
        const counts = new Map<number, number>()
        set((state) => {
          for (const panel of state.panels) {
            for (const row of panel.design) {
              for (const cell of row) {
                if (cell >= 0) {
                  counts.set(cell, (counts.get(cell) || 0) + 1)
                }
              }
            }
          }
          return {} // no state change
        })
        return counts
      },

      // Crop blank borders from the current panel
      cropBlankBorders: (blankIndices: Set<number> = new Set([-1, 0])) =>
        set((state) => {
          const panelIdx = state.panels.findIndex(
            (p) => p.id === state.selectedPanelId
          )
          if (panelIdx === -1) return state

          const panel = state.panels[panelIdx]
          let top = panel.design.length, bottom = -1, left = panel.design[0]?.length ?? 0, right = -1

          for (let y = 0; y < panel.design.length; y++) {
            for (let x = 0; x < panel.design[y].length; x++) {
              if (!blankIndices.has(panel.design[y][x])) {
                top = Math.min(top, y)
                bottom = Math.max(bottom, y)
                left = Math.min(left, x)
                right = Math.max(right, x)
              }
            }
          }

          if (bottom === -1 || right === -1) return state

          const cropped = panel.design.slice(top, bottom + 1).map((row) =>
            row.slice(left, right + 1)
          )

          const newPanels = [...state.panels]
          newPanels[panelIdx] = { ...panel, design: cropped }
          return { panels: newPanels }
        }),

      setShow3D: (show) => set({ show3D: show }),

      setShowSymbols: (show) => set({ showSymbols: show }),

      setShowAlternatingColors: (show) => set({ showAlternatingColors: show }),
      
      // Grid line config actions
      setGridLineConfig: (updates) => set((state) => ({
        gridLineConfig: { ...state.gridLineConfig, ...updates },
      })),
      
      setLabelConfig: (updates) => set((state) => ({
        labelConfig: { ...state.labelConfig, ...updates },
      })),
      
      setShowGridLines: (show) => set((state) => ({
        gridLineConfig: { ...state.gridLineConfig, showLines: show },
      })),

      // Backstitch actions
      setBackstitchConfig: (updates) => set((state) => ({
        backstitchConfig: { ...state.backstitchConfig, ...updates },
      })),
      addBackstitchLine: (panelId, line) => set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId ? { ...p, backstitch: [...p.backstitch, line] } : p
        ),
      })),
      removeBackstitchLine: (panelId, lineId) => set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId
            ? { ...p, backstitch: p.backstitch.filter((l) => l.id !== lineId) }
            : p
        ),
      })),
      clearBackstitchLayer: (panelId) => set((state) => ({
        panels: state.panels.map((p) =>
          p.id === panelId ? { ...p, backstitch: [] } : p
        ),
      })),
      toggleBackstitchEnabled: () => set((state) => ({
        backstitchConfig: { ...state.backstitchConfig, enabled: !state.backstitchConfig.enabled },
      })),

      // Symbol actions
      setSymbolDefinition: (colorIndex, def) => set((state) => {
        const newDefs = new Map(state.symbolDefinitions)
        newDefs.set(colorIndex, def)
        return { symbolDefinitions: newDefs }
      }),
      clearSymbolDefinition: (colorIndex) => set((state) => {
        const newDefs = new Map(state.symbolDefinitions)
        newDefs.delete(colorIndex)
        return { symbolDefinitions: newDefs }
      }),

      // Progress tracking actions
      toggleCompletedStitch: (panelId, row, col) => {
        captureBeforeMutation()
        set((state) => {
          const key = `${panelId}:${row}:${col}`
          const newCompleted = new Set(state.completedStitches)
          if (newCompleted.has(key)) {
            newCompleted.delete(key)
          } else {
            newCompleted.add(key)
          }
          return { completedStitches: newCompleted }
        })
      },
      isStitchCompleted: (panelId, row, col) => {
        const state = get()
        return state.completedStitches.has(`${panelId}:${row}:${col}`)
      },
      getProgressPercent: (panelId) => {
        const state = get()
        const panel = state.panels.find((p) => p.id === panelId)
        if (!panel) return 0
        const total = panel.design.length * (panel.design[0]?.length || 0)
        if (total === 0) return 0
        let completed = 0
        for (let r = 0; r < panel.design.length; r++) {
          for (let c = 0; c < panel.design[r].length; c++) {
            if (state.completedStitches.has(`${panelId}:${r}:${c}`)) {
              completed++
            }
          }
        }
        return Math.round((completed / total) * 100)
      },
      getOverallProgressPercent: () => {
        const state = get()
        let total = 0
        let completed = 0
        for (const panel of state.panels) {
          const panelTotal = panel.design.length * (panel.design[0]?.length || 0)
          total += panelTotal
          for (let r = 0; r < panel.design.length; r++) {
            for (let c = 0; c < panel.design[r].length; c++) {
              if (state.completedStitches.has(`${panel.id}:${r}:${c}`)) {
                completed++
              }
            }
          }
        }
        return total > 0 ? Math.round((completed / total) * 100) : 0
      },

      // Manual stitch counter
      setManualStitchCount: (count) => set({ manualStitchCount: count }),
      incrementManualStitchCount: () => set((state) => ({
        manualStitchCount: state.manualStitchCount + 1,
      })),
      decrementManualStitchCount: () => set((state) => ({
        manualStitchCount: Math.max(0, state.manualStitchCount - 1),
      })),
      resetManualStitchCount: () => set({ manualStitchCount: 0 }),

      // Last edited position tracking
      setLastEditedPosition: (row, col) => set({ lastEditedRow: row, lastEditedCol: col }),
      getLastEditedPosition: () => {
        const state = get()
        return { row: state.lastEditedRow, col: state.lastEditedCol }
      },

      // Auto-save
      setAutoSaveEnabled: (enabled) => set({ autoSaveEnabled: enabled }),
      setAutoSaveInterval: (interval) => set({ autoSaveInterval: interval }),
      triggerAutoSave: () => {
        set({ lastSaved: new Date() })
      },
      getLastSaved: () => get().lastSaved,

    // Performance actions (Phase 17)
    setHistoryDepth: (depth: number) => set({ historyDepth: Math.max(10, Math.min(200, depth)) }),
    setUseIndexedDB: (useIDB: boolean) => set({ useIndexedDB: useIDB }),
    setGridRenderingMode: (mode: 'dom' | 'canvas' | 'virtual') => set({ gridRenderingMode: mode }),

    // Undo / Redo (Phase 22) — subscribe-based snapshot capture
    // Each mutation triggers a subscription that pushes a snapshot to undoStack.
    // undo() pops from undoStack, pushes current to redoStack.
    // redo() pops from redoStack, pushes current to undoStack.

    /** Undo: restore previous snapshot from stack */
    undo: () => {
      const state = get()
      if (state.undoStack.length === 0) return
      const undoStack = [...state.undoStack]
      let prev: any = undoStack[undoStack.length - 1]
      undoStack.pop()
      // Ensure persisted Sets/Maps are restored from array form
      prev = _restoreSetTypes(prev)
      _inUndoRedo = true
      set(prev as unknown as ProjectState)
      // Push the PRE-undo state (after undo, before next undo) to redoStack
      set({ undoStack, redoStack: [...state.redoStack, state].slice(-state.historyMaxEntries) })
      _inUndoRedo = false
      },

    /** Redo: restore next snapshot from stack */
    redo: () => {
      const state = get()
      if (state.redoStack.length === 0) return
      const redoStack = [...state.redoStack]
      let next: any = redoStack[redoStack.length - 1]
      redoStack.pop()
      // Ensure persisted Sets/Maps are restored from array form
      next = _restoreSetTypes(next)
      _inUndoRedo = true
      set(next as unknown as ProjectState)
      // Push the PRE-redo state to undoStack
      set({ undoStack: [...state.undoStack, state].slice(-state.historyMaxEntries), redoStack })
      _inUndoRedo = false
      },

    /** Reset: clear all history */
    resetHistory: () => set({ undoStack: [], redoStack: [] }),

    /**
     * Hook into the mutation flow to capture snapshots.
     * Must be called once when the store is created (side effect).
     */
    _initUndo: () => {
      const unsub = (get() as any).__subscribe?.((s: any) => {
        if (_inUndoRedo) return
        const snapshot = s as unknown as AppStateSnapshot
        const newStack = [...snapshot.undoStack, snapshot].slice(-snapshot.historyMaxEntries)
        set({ undoStack: newStack, redoStack: [] })
      })
      return unsub
      },


      setTool: (
        tool: keyof ProjectState['tools'],
        active: boolean
      ) =>
        set((state) => {
          // If activating a new tool, deactivate all others (exclusive tool mode)
          const newTools: ProjectState['tools'] = {
            pencil: false,
            eraser: false,
            fill: false,
            line: false,
            eraseline: false,
            rectangle: false,
            circle: false,
            dropper: false,
            brush: false,
            select: false,
            semicross: false,
            mirrorH: false,
            mirrorV: false,
            [tool]: active,
          }
          return {
            tools: newTools,
            // When selecting/dropping/brush, reset selection preview
            selectionStart:
              active &&
              (tool === 'select' ||
                tool === 'line' ||
                tool === 'eraseline' ||
                tool === 'rectangle' ||
                tool === 'circle')
                ? null
                : state.selectionStart,
            shapePreview: null,
            circlePreview: null,
            drawPreview: null,
          }
        }),

      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(8, zoom)) }),

      setShowPatternRepeat: (show) => set({ showPatternRepeat: show }),

      setSemiCrossCycleIndex: (idx) => set({ semiCrossCycleIndex: idx }),

      setShowNotesPanel: (show) => set({ showNotesPanel: show }),

      addNote: (panelId, row, col, text, color) => set((state) => {
        const panel = state.panels.find((p) => p.id === panelId)
        if (!panel) return state
        const note: Note = {
          id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text,
          row,
          col,
          color: color || '#6366f1',
        }
        return {
          panels: state.panels.map((p) => p.id === panelId ? { ...p, notes: [...p.notes, note] } : p),
        }
      }),

      updateNote: (noteId, text, color) => set((state) => {
        let updated = false
        const newPanels = state.panels.map((panel) => {
          const newNotes = panel.notes.map((n) => {
            if (n.id === noteId) {
              updated = true
              return { ...n, text, color: color || n.color }
            }
            return n
          })
          return updated ? { ...panel, notes: newNotes } : panel
        })
        return updated ? { panels: newPanels } : state
      }),

      deleteNote: (noteId) => set((state) => {
        const newPanels = state.panels.map((panel) => ({
          ...panel,
          notes: panel.notes.filter((n) => n.id !== noteId),
        }))
        return { panels: newPanels }
      }),

      // Brush settings
      setBrushSize: (
        size: number
      ) => set({ brushSize: Math.max(1, Math.min(10, size)) }),

      // Selection actions
      setSelection: (
        sel: ProjectState['selection']
      ) => set({ selection: sel }),
      setSelectionClipboard: (
        clipboard: number[][] | null
      ) => set({ selectionClipboard: clipboard }),
      setSelectionStart: (
        start: ProjectState['selectionStart']
      ) => set({ selectionStart: start }),
      setDrawPreview: (
        preview: ProjectState['drawPreview']
      ) => set({ drawPreview: preview }),
      setShapePreview: (
        preview: ProjectState['shapePreview']
      ) => set({ shapePreview: preview }),
      setCirclePreview: (
        preview: ProjectState['circlePreview']
      ) => set({ circlePreview: preview }),
      setBrushPreview: (
        preview: ProjectState['brushPreview']
      ) => set({ brushPreview: preview }),
      setSelectionEnd: (
        end: ProjectState['selectionEnd']
      ) => set({ selectionEnd: end }),

      // Copy selected region
      copySelection: () => set((state) => {
        if (!state.selection) return state
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const sel = state.selection
        const left = Math.min(sel.x1, sel.x2)
        const top = Math.min(sel.y1, sel.y2)
        const width = Math.abs(sel.x2 - sel.x1) + 1
        const height = Math.abs(sel.y2 - sel.y1) + 1
        const clip = panel.design.slice(top, top + height).map(row => row.slice(left, left + width))
        return { selectionClipboard: clip }
      }),

      // Paste clipboard at grid position
      pasteSelection: (pasteX, pasteY) => set((state) => {
        if (!state.selectionClipboard) return state
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const result = panel.design.map((row) => [...row])
        for (let dy = 0; dy < state.selectionClipboard.length; dy++) {
          for (let dx = 0; dx < state.selectionClipboard[dy].length; dx++) {
            const gy = pasteY + dy
            const gx = pasteX + dx
            if (gy >= 0 && gy < result.length && gx >= 0 && gx < (result[gy]?.length ?? 0)) {
              result[gy][gx] = state.selectionClipboard[dy][dx]
            }
          }
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      // Mirror selection horizontally
      mirrorSelectionH: () => set((state) => {
        if (!state.selection) return state
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const sel = state.selection
        const left = Math.min(sel.x1, sel.x2)
        const right = Math.max(sel.x1, sel.x2)
        const top = Math.min(sel.y1, sel.y2)
        const bottom = Math.max(sel.y1, sel.y2)
        const result = panel.design.map((row) => [...row])
        for (let y = top; y <= bottom; y++) {
          for (let x = left; x <= right; x++) {
            const mirroredX = left + (right - x)
            result[y][x] = panel.design[y][mirroredX]
          }
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      // Mirror selection vertically
      mirrorSelectionV: () => set((state) => {
        if (!state.selection) return state
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const sel = state.selection
        const left = Math.min(sel.x1, sel.x2)
        const right = Math.max(sel.x1, sel.x2)
        const top = Math.min(sel.y1, sel.y2)
        const bottom = Math.max(sel.y1, sel.y2)
        const result = panel.design.map((row) => [...row])
        for (let y = top; y <= bottom; y++) {
          const mirroredY = top + (bottom - y)
          for (let x = left; x <= right; x++) {
            result[y][x] = panel.design[mirroredY][x]
          }
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      // Mirror whole grid horizontally
      mirrorGridH: () => set((state) => ({
        panels: state.panels.map((p) => ({ ...p, design: p.design.map((row) => [...row].reverse()) })),
      })),

      // Mirror whole grid vertically
      mirrorGridV: () => set((state) => ({
        panels: state.panels.map((p) => ({ ...p, design: [...p.design].reverse() })),
      })),

      // Clear selection
      clearSelection: () => set({ selection: null, selectionStart: null, selectionEnd: null }),

      // Erase a line of stitches (Bresenham)
      eraseLine: (x1, y1, x2, y2) => set((state) => {
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const result = panel.design.map((row) => [...row])
        const dx = Math.abs(x2 - x1)
        const dy = Math.abs(y2 - y1)
        const sx = x1 < x2 ? 1 : -1
        const sy = y1 < y2 ? 1 : -1
        let err = dx - dy
        let x = x1, y = y1
        while (true) {
          if (x >= 0 && x < result[0]?.length && y >= 0 && y < result.length) {
            result[y][x] = 0
          }
          if (x === x2 && y === y2) break
          const e2 = 2 * err
          if (e2 > -dy) { err -= dy; x += sx }
          if (e2 < dx) { err += dx; y += sy }
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      // Mirror operations
      mirrorHorizontally: () => set((state) => ({
        panels: state.panels.map((panel) => ({
          ...panel,
          design: panel.design.map((row) => [...row].reverse()),
        })),
      })),
      mirrorVertically: () => set((state) => ({
        panels: state.panels.map((panel) => ({
          ...panel,
          design: [...panel.design].reverse(),
        })),
      })),

      // ── Pattern Repeat (Phase 14) ──
      repeatGrid: (repeatX, repeatY) => set((state) => {
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const rows = panel.design.length
        if (rows === 0) return state
        const cols = panel.design[0].length
        const resultRows = rows * repeatY
        const resultCols = cols * repeatX
        const result: number[][] = []
        for (let y = 0; y < resultRows; y++) {
          const srcY = y % rows
          const row: number[] = []
          for (let x = 0; x < resultCols; x++) {
            const srcX = x % cols
            row.push(panel.design[srcY][srcX])
          }
          result.push(row)
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      repeatGridWithMirrorH: (repeatX, repeatY) => set((state) => {
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        // Create horizontally mirrored pair (original + flip)
        const mirrored: number[][] = []
        for (let y = 0; y < panel.design.length; y++) {
          mirrored.push([...panel.design[y], ...panel.design[y].reverse()])
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: mirrored } : p),
        }
      }),

      repeatGridWithMirrorV: (repeatX, repeatY) => set((state) => {
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        // Create vertically mirrored version (original + flip)
        const mirrored = [...panel.design, ...panel.design.slice().reverse()]
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: mirrored } : p),
        }
      }),

      repeatGridWithMirrorBoth: (repeatX, repeatY) => set((state) => {
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        // Create horizontally mirrored rows first (each row: original + flip)
        const hMirrored: number[][] = []
        for (let y = 0; y < panel.design.length; y++) {
          hMirrored.push([...panel.design[y], ...panel.design[y].reverse()])
        }
        // Then mirror vertically (original + flip)
        const mirrored = [...hMirrored, ...hMirrored.slice().reverse()]
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: mirrored } : p),
        }
      }),

      mirrorGridWithOffset: (axis, offset) => set((state) => {
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const origRows = panel.design.length
        const origCols = panel.design[0]?.length ?? 0
        let result: number[][]
        if (axis === 'h') {
          const newWidth = origCols + offset
          const newGrid: number[][] = Array.from({ length: origRows }, () => Array(newWidth).fill(0))
          for (let y = 0; y < origRows; y++) {
            for (let x = 0; x < origCols; x++) newGrid[y][x] = panel.design[y][x]
          }
          for (let y = 0; y < origRows; y++) {
            for (let x = 0; x < origCols; x++) {
              const newX = origCols + offset - 1 - x
              if (newX >= 0 && newX < newWidth) newGrid[y][newX] = panel.design[y][x]
            }
          }
          result = newGrid
        } else {
          const newHeight = origRows + offset
          const newGrid: number[][] = Array.from({ length: newHeight }, () => Array(origCols).fill(0))
          for (let y = 0; y < origRows; y++) {
            for (let x = 0; x < origCols; x++) newGrid[y][x] = panel.design[y][x]
          }
          for (let y = 0; y < origRows; y++) {
            for (let x = 0; x < origCols; x++) {
              const newY = origRows + offset - 1 - y
              if (newY >= 0 && newY < newHeight) newGrid[newY][x] = panel.design[y][x]
            }
          }
          result = newGrid
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      mirrorSelectionWithOffset: (offset) => set((state) => {
        if (!state.selection) return state
        const panel = state.panels.find((p) => p.id === state.selectedPanelId)
        if (!panel) return state
        const sel = state.selection
        const left = Math.min(sel.x1, sel.x2)
        const right = Math.max(sel.x1, sel.x2)
        const top = Math.min(sel.y1, sel.y2)
        const bottom = Math.max(sel.y1, sel.y2)
        const selW = right - left + 1
        const selH = bottom - top + 1
        const result = panel.design.map((row) => [...row])
        for (let sy = 0; sy < selH; sy++) {
          for (let sx = 0; sx < selW; sx++) {
            const ny = bottom + offset + 1 + sy
            const nx = left + (selW - 1 - sx)
            if (ny >= 0 && ny < result.length && nx >= 0 && nx < result[0].length) {
              result[ny][nx] = panel.design[top + sy][left + sx]
            }
          }
        }
        return {
          panels: state.panels.map(p => p.id === state.selectedPanelId ? { ...p, design: result } : p),
        }
      }),

      // ── Semi-cross stitches ──
      setSemiCross: (panelId, row, col, type) => set((state) => {
        const key = `${panelId}-${row}-${col}`
        const newMap = new Map(state.semiCrosses)
        if (type === 'none') {
          newMap.delete(key)
        } else {
          newMap.set(key, type)
        }
        return { semiCrosses: newMap }
      }),

      clearSemiCrosses: () => set({ semiCrosses: new Map<string, SemiCrossType>() }),

      setImage: (dataUrl, fileName, width, height) => {
        set({
          currentImage: { dataUrl, fileName, width, height },
          activeRightPanel: 'conversion',
        })
      },

      clearImage: () => set({ currentImage: null, currentGrid: null, activeRightPanel: null }),

      setGrid: (grid) => {
        captureBeforeMutation()
        set({ currentGrid: grid })
      },

      addDMCColors: (colors) => set((state) => {
        const newPalette = new Set(state.dmcPalette)
        colors.forEach(c => newPalette.add(c.number))
        return { dmcPalette: Array.from(newPalette).sort((a, b) => a - b) }
      }),

      setDMCUsage: (usage) => set({ dmcUsage: usage }),
      setFlossBrand: (brand) => set({ flossBrand: brand }),

      updatePanel: (panelId, updates) => {
        captureBeforeMutation()
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === panelId ? { ...p, ...updates } : p
          ),
        }))
      },

      togglePanelStatus: (panelId) =>
        set((state) => {
          const panel = state.panels.find((p) => p.id === panelId)
          if (!panel) return state
          const statuses: PanelStatus[] = ['not-started', 'in-progress', 'finished']
          const currentIndex = statuses.indexOf(panel.status)
          return {
            panels: state.panels.map((p) =>
              p.id === panelId
                ? { ...p, status: statuses[(currentIndex + 1) % 3] as PanelStatus }
                : p
            ),
          }
        }),

      addToInventory: (dmcNumber, quantity) => set((state) => ({
        inventory: [
          ...state.inventory,
          { id: generateSkeinId(), dmcNumber, quantity, usedStitches: 0 },
        ],
      })),

      removeFromInventory: (skeinId) => set((state) => ({
        inventory: state.inventory.filter((s) => s.id !== skeinId),
      })),

      updateInventoryQuantity: (skeinId, quantity) => set((state) => ({
        inventory: state.inventory.map((s) =>
          s.id === skeinId ? { ...s, quantity } : s
        ),
      })),

      updateStitchUsage: (dmcNumber, delta) => set((state) => ({
        inventory: state.inventory.map((s) =>
          s.dmcNumber === dmcNumber
            ? { ...s, usedStitches: Math.max(0, s.usedStitches + delta) }
            : s
        ),
      })),

      setShowInventory: (show) => set({ showInventory: show, activeRightPanel: show ? 'inventory' : null }),

      setActiveRightPanel: (tab) => set({ activeRightPanel: tab, showInventory: tab === 'inventory' }),

      setGridDimensions: (width, height) => set((state) => {
        const newPanels = state.panels.map(panel => ({
          ...panel,
          design: emptyDesign(width, height),
          backstitch: [],
          notes: [],
        }))
        return {
          settings: { ...state.settings, width, height },
          panels: newPanels,
        }
      }),

      createDefaultPanels: (width, height, shape = 'rectangle') => {
        captureBeforeMutation()
        set(() => ({
          panels: [
            {
              id: 0,
              name: shape === 'rectangle' ? 'Main Design' : 'Panel 1',
              shape,
              design: emptyDesign(width, height),
              status: 'not-started',
              backstitch: [],
              notes: [],
            },
          ],
          settings: { ...useProjectStore.getState().settings, width, height },
        }))
      },

      // ── Pattern Library actions (Phase 18) ──
      setPatterns: (patterns) => set({ patternLibrary: patterns }),
      loadPatternLibrary: (patterns) => set({ patternLibrary: patterns }),
      deletePattern: (patternId) => set((state) => ({
        patternLibrary: state.patternLibrary?.filter((p) => p.id !== patternId) ?? null,
      })),
      updatePatternDownloads: (patternId, delta) => set((state) => ({
        patternLibrary: state.patternLibrary?.map((p) =>
          p.id === patternId ? { ...p, downloadCount: p.downloadCount + delta } : p
        ) ?? null,
      })),

      // ── Phase 20 actions ──
      setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

      addToColorHistory: (colorIndex) => set((state) => {
        const newHistory = state.colorHistory.filter((idx) => idx !== colorIndex)
        return { colorHistory: [colorIndex, ...newHistory].slice(0, 20) }
      }),

      setGridSnapEnabled: (enabled) => set({ gridSnapEnabled: enabled }),

      setShowRuler: (show) => set({ showRuler: show }),

      setContextMenu: (menu) => set({ contextMenu: menu }),

      setShowThumbnailGallery: (show) => set({ showThumbnailGallery: show }),

      generateShareUrl: () => {
        const state = get()
        // Generate a hash-based URL using btoa for the project
        const project = {
          title: state.settings.title,
          author: state.settings.author,
          fabric: state.settings.fabric,
          width: state.settings.width,
          height: state.settings.height,
          panels: state.panels,
          dmcPalette: state.dmcPalette,
          flossBrand: state.flossBrand,
        }
        try {
          const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(project))))
          const url = `${window.location.origin}${window.location.pathname}#pattern/${encoded}`
          set({ shareUrl: url })
          return url
        } catch {
          return null
        }
      },

      setExportPngInProgress: (inProgress) => set({ exportPngInProgress: inProgress }),

      // Phase 21: Clear pattern dialog
      showClearPatternDialog: false,
      setShowClearPatternDialog: (show) => set({ showClearPatternDialog: show }),
      clearCurrentPanel: (panelId) => set((state) => {
        const panel = state.panels.find((p) => p.id === panelId)
        if (!panel) return state
        const empty = Array(panel.design.length)
          .fill(null)
          .map(() => Array(panel.design[0]?.length ?? state.settings.width).fill(0))
        return {
          panels: state.panels.map((p) =>
            p.id === panelId ? { ...p, design: empty, backstitch: [], notes: [] } : p
          ),
          completedStitches: new Set(
            [...state.completedStitches].filter((key) => !key.startsWith(`${panelId}:`))
          ),
          semiCrosses: new Map(
            [...state.semiCrosses].filter(([key]) => !key.startsWith(`${panelId}-`))
          ),
          showClearPatternDialog: false,
        }
      }),
    }),
    {
        name: 'cross-stitch-studio',
        version: 2,
        migrate: (persistedState: any, version: number) => {
          // Ensure Sets/Maps are properly restored regardless of how data was serialized
          const state: any = { ...(persistedState as object) }
          if (!Array.isArray(state.completedStitches)) {
            state.completedStitches = []
          }
          if (!Array.isArray(state.symbolDefinitions)) {
            state.symbolDefinitions = []
          }
          if (!Array.isArray(state.semiCrosses)) {
            state.semiCrosses = []
          }
          if (!Array.isArray(state.dmcUsage)) {
            state.dmcUsage = []
          }
          return state
        },
        serialize: (state: any) => {
          // Convert Maps and Sets to serializable formats
          const serialized = {
            ...state,
            symbolDefinitions: Array.from(state.symbolDefinitions?.entries() || []),
            semiCrosses: Array.from(state.semiCrosses?.entries() || []),
            completedStitches: Array.from(state.completedStitches || []),
            dmcUsage: Array.from((state.dmcUsage || new Map()).entries()),
            inventory: state.inventory?.map((i: any) => ({...i})) || [],
            panels: state.panels?.map((p: any) => ({
              ...p,
              backstitch: Array.isArray(p.backstitch) ? p.backstitch : [],
              notes: Array.isArray(p.notes) ? p.notes : [],
            })) || [],
          }
          return JSON.stringify(serialized)
        },
        deserialize: (json: string) => {
          try {
            const parsed = JSON.parse(json)
            return {
              ...parsed,
              symbolDefinitions: new Map(parsed.symbolDefinitions || []),
              semiCrosses: new Map(parsed.semiCrosses || []),
              completedStitches: new Set(parsed.completedStitches || []),
              dmcUsage: new Map(parsed.dmcUsage || []),
              panels: (parsed.panels || []).map((p: any) => ({
                ...p,
                backstitch: Array.isArray(p.backstitch) ? p.backstitch : [],
                notes: Array.isArray(p.notes) ? p.notes : [],
              })),
            }
          } catch (e) {
            console.error('Failed to deserialize store:', e)
            return undefined
          }
        },
        onRehydrateStorage: (state) => {
          // After rehydration, ensure Maps/Sets are restored correctly
          return (s) => {
            if (s) {
              if (typeof s.completedStitches?.has !== 'function') {
                s.completedStitches = new Set(Array.from(s.completedStitches || []))
              }
              if (typeof s.semiCrosses?.get !== 'function') {
                s.semiCrosses = new Map(Array.from(Object.entries(s.semiCrosses || {})))
              }
              if (typeof s.symbolDefinitions?.get !== 'function') {
                s.symbolDefinitions = new Map(Array.from(Object.entries(s.symbolDefinitions || {})))
              }
              if (typeof s.dmcUsage?.get !== 'function') {
                s.dmcUsage = new Map(Array.from(Object.entries(s.dmcUsage || {})))
              }
            }
          }
        },
      })
    )

// ─── Undo/Redo Subscription ──────────────────────────────────────
// Placed AFTER the store definition so useProjectStore is available.
// The subscription fires after every state change. It checks _undoBeforeChange
// (set by GridCanvas BEFORE mutations), pushes the snapshot, clears the flag,
// then calls setState. That setState triggers the subscription again, but
// the flag is already false so it returns early — no infinite loop.

useProjectStore.subscribe((s: any) => {
  // Skip during undo/redo (restoring state from stacks)
  if (_inUndoRedo) return
  // Only push if a mutation was initiated (flag is true)
  if (!_undoBeforeChange) return

  // Clear flag BEFORE setState to prevent infinite loop
  _undoBeforeChange = false

  // Use the PRE-mutation snapshot if available (for proper undo behavior)
  const raw = _pendingSnapshot || (s as unknown as AppStateSnapshot)
  _pendingSnapshot = null // Clear pending snapshot

  // Don't push if undoStack is empty (initial state)
  if (!raw.undoStack) return

  // Strip undo/redo stacks from snapshot to avoid corrupting the undo chain
  // when set(prev) restores old stack data alongside new application state
  const { undoStack: _u, redoStack: _r, ...cleanSnapshot } = raw

  const newStack = [...raw.undoStack, cleanSnapshot as AppStateSnapshot].slice(-raw.historyMaxEntries)
  useProjectStore.setState({ undoStack: newStack, redoStack: [] })
})

    
