import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'
import { Pencil, Eraser, PaintBucket, Undo, Redo, PencilOff, Minus, Square, Circle, Eye, TextSelect, Move, Scissors, Copy, FlipHorizontal, FlipVertical, Layers, CornerDownRight, StickyNote, Settings2, Trash2 } from 'lucide-react'
import { getDMCHex } from '../utils/dmcColors'
import { getGridLineWeight, getLabelStyle, GridLineConfig, LabelConfig } from '../types/gridLines'
import { BackstitchLine, bresenhamLine, generateBackstitchId } from '../types/backstitch'
import type { FlossColor } from '../utils/flossBrands'
import { FLOSS_BRANDS } from '../utils/flossBrands'
import { getDMCName } from '../utils/dmcColors'
import { bresenhamLine as bresenhamLineUtil, filledCircle, rectOutline, filledRect, brushStroke, selectRegion, extractSelection, pasteSelection, mirrorGridH as mirrorGdH, mirrorGridV as mirrorGdV } from '../utils/drawingTools'
import { ContextMenu } from '../components/ContextMenu'
import { RulerOverlay } from '../components/RulerOverlay'
import { ColorHistoryPanel } from '../components/ColorHistoryPanel'
import { GridSnapToggle } from '../components/GridSnapToggle'
import { ClearPatternDialog } from '../components/ClearPatternDialog'

interface GridCanvasProps {
  panelId: number
}

export function GridCanvas({ panelId }: GridCanvasProps) {
  const {
    panels,
    selectedColor,
    setSelectedColor,
    setShowPatternRepeat,
    tools,
    semiCrosses,
    setSemiCross,
    semiCrossCycleIndex,
    setSemiCrossCycleIndex,
    setTool,
    zoom,
    setZoom,
    updatePanel,
    showSymbols,
    showAlternatingColors,
    gridLineConfig,
    labelConfig,
    setGridLineConfig,
    setLabelConfig,
    settings,
    backstitchConfig,
    setBackstitchConfig,
    backstitchConfig: bsc,
    completedStitches,
    toggleCompletedStitch,
    isStitchCompleted,
    getProgressPercent,
    flossBrand,
    symbolDefinitions,
    setLastEditedPosition,
    triggerAutoSave,
    brushSize,
    selection,
    setSelection,
    selectionStart,
    selectionEnd,
    setSelectionStart,
    setSelectionEnd,
    copySelection,
    pasteSelection: pasteClipboard,
    mirrorGridH,
    mirrorGridV,
    clearSelection,
    eraseLine,
    setBrushPreview,
    setCirclePreview,
    setShapePreview,
    setDrawPreview,
    setSelectionClipboard,
    setFlossBrand,
    dmcPalette,
    setSymbolDefinition,
    clearSymbolDefinition,
    addNote,
    selectedPanelId,
    showNotesPanel,
    setShowNotesPanel,
    showClearPatternDialog,
    setShowClearPatternDialog,
    clearCurrentPanel,
  } = useProjectStore()
  const contextMenu = useProjectStore((s) => s.contextMenu)
  const setContextMenu = useProjectStore((s) => s.setContextMenu)
  const showRuler = useProjectStore((s) => s.showRuler)
  const setShowRuler = useProjectStore((s) => s.setShowRuler)
  const gridSnapEnabled = useProjectStore((s) => s.gridSnapEnabled)
  const setGridSnapEnabled = useProjectStore((s) => s.setGridSnapEnabled)
  const addToColorHistory = useProjectStore((s) => s.addToColorHistory)
  const colorHistory = useProjectStore((s) => s.colorHistory)
  const [showColorHistory, setShowColorHistory] = useState(false)

  // Track color changes for color history (skip initial render to avoid
  // adding the default selectedColor to the history on mount)
  const isMounted = useRef(false)
  useEffect(() => {
    if (isMounted.current && selectedColor > 0) addToColorHistory(selectedColor)
    isMounted.current = true
  }, [selectedColor, addToColorHistory])

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, visible: true })
  }, [setContextMenu])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu?.visible) return
    const handler = () => setContextMenu(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [contextMenu?.visible, setContextMenu])

  // Note creation popover state
  const [noteCreateState, setNoteCreateState] = useState<{row: number; col: number} | null>(null)
  const [noteText, setNoteText] = useState('')
  const [noteColor, setNoteColor] = useState('#6366f1')

  const [history, setHistory] = useState<number[][][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isDrawing, setIsDrawing] = useState(false)
  const [backstitchStart, setBackstitchStart] = useState<{x: number; y: number} | null>(null)
  const [backstitchPreview, setBackstitchPreview] = useState<{x1: number; y1: number; x2: number; y2: number} | null>(null)
  const [dragStarted, setDragStarted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartCell, setDragStartCell] = useState<{x: number; y: number} | null>(null)
  const [dragEndCell, setDragEndCell] = useState<{x: number; y: number} | null>(null)
  const [toolPreview, setToolPreview] = useState<{x: number; y: number; type: string}[] | null>(null)
  // Semi-cross: cycle through types on click
  const semicrossTypes: Array<'tl-br' | 'tr-bl' | 'top' | 'bottom' | 'left' | 'right'> = ['tl-br', 'tr-bl', 'top', 'bottom', 'left', 'right']
  const canvasRef = useRef<HTMLDivElement>(null)

  // Auto-save on history change
  useEffect(() => {
    if (history.length > 0) {
      triggerAutoSave()
    }
  }, [history, historyIndex])

  const panel = panels.find((p) => p.id === panelId)
  
  const width = settings.width
  const height = settings.height

  // Undo/Redo
  const pushHistory = (newDesign: number[][]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newDesign.map(r => [...r]))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      updatePanel(panelId, { design: history[newIndex] })
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      updatePanel(panelId, { design: history[newIndex] })
    }
  }

  // Initialize history on mount
  if (history.length === 0 && panel?.design) {
    pushHistory(panel.design)
  }

  // ── Multi-cell tool utilities ──
  const applyToCells = useCallback((cells: {x: number; y: number}[], color: number) => {
    if (!panel) return
    const newDesign = panel.design.map(r => [...r])
    cells.forEach(pt => {
      if (pt.x >= 0 && pt.x < newDesign[0]?.length && pt.y >= 0 && pt.y < newDesign.length) {
        newDesign[pt.y][pt.x] = color
      }
    })
    updatePanel(panelId, { design: newDesign })
    pushHistory(newDesign)
  }, [panel, panelId, updatePanel, pushHistory])

  const doMirrorH = useCallback(() => {
    if (!panel) return
    const newDesign = mirrorGdH(panel.design)
    updatePanel(panelId, { design: newDesign })
    pushHistory(newDesign)
  }, [panel, panelId, updatePanel, pushHistory])

  const doMirrorV = useCallback(() => {
    if (!panel) return
    const newDesign = [...panel.design].reverse()
    updatePanel(panelId, { design: newDesign })
    pushHistory(newDesign)
  }, [panel, panelId, updatePanel, pushHistory])

  const doCopy = useCallback(() => {
    if (!panel || !selection) return
    const clip = panel.design.slice(selection.y1, selection.y2 + 1).map(r => r.slice(selection.x1, selection.x2 + 1))
    setSelectionClipboard(clip)
  }, [panel, selection, setSelectionClipboard])

  const doPaste = useCallback((gx: number, gy: number) => {
    if (!selection) return
    pasteClipboard(gx, gy)
  }, [selection, pasteClipboard])

  // Selection mirror (partial pattern) — pure functions, not store setters
  const doMirrorSelectionH = useCallback(() => {
    if (!panel || !selection) return
    const left = Math.min(selection.x1, selection.x2)
    const right = Math.max(selection.x1, selection.x2)
    const top = Math.min(selection.y1, selection.y2)
    const bottom = Math.max(selection.y1, selection.y2)
    const newDesign = panel.design.map((row) => [...row])
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const mirroredX = left + (right - x)
        newDesign[y][x] = panel.design[y][mirroredX]
      }
    }
    updatePanel(panelId, { design: newDesign })
    pushHistory(newDesign)
  }, [panel, selection, panelId, updatePanel, pushHistory])

  const doMirrorSelectionV = useCallback(() => {
    if (!panel || !selection) return
    const top = Math.min(selection.y1, selection.y2)
    const bottom = Math.max(selection.y1, selection.y2)
    const left = Math.min(selection.x1, selection.x2)
    const right = Math.max(selection.x1, selection.x2)
    const newDesign = panel.design.map((row) => [...row])
    for (let y = top; y <= bottom; y++) {
      const mirroredY = top + (bottom - y)
      for (let x = left; x <= right; x++) {
        newDesign[y][x] = panel.design[mirroredY][x]
      }
    }
    updatePanel(panelId, { design: newDesign })
    pushHistory(newDesign)
  }, [panel, selection, panelId, updatePanel, pushHistory])

  const applyLine = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    applyToCells(bresenhamLine(x1, y1, x2, y2), selectedColor)
  }, [applyToCells, selectedColor])

  const applyRectFill = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    applyToCells(filledRect(x1, y1, x2, y2), selectedColor)
  }, [applyToCells, selectedColor])

  const applyCircleFill = useCallback((cx: number, cy: number, radius: number) => {
    applyToCells(filledCircle(cx, cy, radius), selectedColor)
  }, [applyToCells, selectedColor])

  const applyBrush = useCallback((cx: number, cy: number) => {
    applyToCells(brushStroke(cx, cy, brushSize - 1), selectedColor)
  }, [applyToCells, selectedColor, brushSize])

  const handleMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      // Shift-click: toggle completed state
      if (e.shiftKey && !backstitchConfig.enabled) {
        toggleCompletedStitch(panelId, row, col)
        triggerAutoSave()
        return
      }

      // Backstitch line tool
      if (backstitchConfig.enabled) {
        if (!backstitchStart) {
          setBackstitchStart({ x: col, y: row })
        } else {
          const line: BackstitchLine = {
            id: generateBackstitchId(),
            x1: backstitchStart.x,
            y1: backstitchStart.y,
            x2: col,
            y2: row,
            color: backstitchConfig.color,
            lineWidth: backstitchConfig.lineWidth,
          }
          updatePanel(panelId, { backstitch: [...(panel?.backstitch || []), line] })
          setBackstitchStart(null)
        }
        return
      }

      // Dropper — pick color from clicked cell
      if (tools.dropper) {
        const idx = panel?.design[row]?.[col] || 0
        if (idx > 0) setSelectedColor(idx)
        setTool('pencil', true)
        return
      }

      // Line tool — first click = start, second = commit
      if (tools.line) {
        if (!isDragging) {
          setIsDragging(true)
          setDragStartCell({ x: col, y: row })
          setDragEndCell({ x: col, y: row })
          setToolPreview([{ x: col, y: row, type: 'line' }])
        } else {
          applyLine(dragStartCell!.x, dragStartCell!.y, col, row)
          setIsDragging(false)
          setDragStartCell(null)
          setDragEndCell(null)
          setToolPreview(null)
        }
        return
      }

      // Rectangle tool — click to fill
      if (tools.rectangle) {
        if (!isDragging) {
          setIsDragging(true)
          setDragStartCell({ x: col, y: row })
          setDragEndCell({ x: col, y: row })
        } else {
          applyRectFill(dragStartCell!.x, dragStartCell!.y, col, row)
          setIsDragging(false)
          setDragStartCell(null)
          setDragEndCell(null)
        }
        return
      }

      // Circle tool
      if (tools.circle) {
        if (!isDragging) {
          setIsDragging(true)
          setDragStartCell({ x: col, y: row })
          setDragEndCell({ x: col, y: row })
        } else {
          const dx = col - dragStartCell!.x
          const dy = row - dragStartCell!.y
          const radius = Math.round(Math.sqrt(dx*dx + dy*dy))
          applyCircleFill(dragStartCell!.x, dragStartCell!.y, radius)
          setIsDragging(false)
          setDragStartCell(null)
          setDragEndCell(null)
        }
        return
      }

      // Brush — paint continuously
      if (tools.brush) {
        if (!isDragging) setIsDragging(true)
        applyBrush(col, row)
        setDragEndCell({ x: col, y: row })
        return
      }

      // Select tool
      if (tools.select) {
        if (!isDragging) {
          setIsDragging(true)
          setDragStartCell({ x: col, y: row })
          setDragEndCell({ x: col, y: row })
        } else {
          const sel = { x1: Math.min(dragStartCell!.x, col), y1: Math.min(dragStartCell!.y, row), x2: Math.max(dragStartCell!.x, col), y2: Math.max(dragStartCell!.y, row) }
          setSelection(sel)
          setIsDragging(false)
          setDragStartCell(null)
          setDragEndCell(null)
        }
        return
      }

      // Semi-cross tool — click to set, cycle through types
      if (tools.semicross) {
        const currentKey = `${panelId}-${row}-${col}`
        const currentType = semiCrosses.get(currentKey) || 'none'
        const idx = semicrossTypes.indexOf(currentType as any)
        const nextType = semicrossTypes[(idx + 1) % semicrossTypes.length]
        setSemiCross(panelId, row, col, nextType)
        setSemiCrossCycleIndex((idx + 1) % semicrossTypes.length)
        return
      }

      // Line tool — first click = start, second = commit (draw line)
      if (tools.line) {
        if (!isDragging) {
          setIsDragging(true)
          setDragStartCell({ x: col, y: row })
          setDragEndCell({ x: col, y: row })
          setToolPreview([{ x: col, y: row, type: 'line' }])
        } else {
          applyLine(dragStartCell!.x, dragStartCell!.y, col, row)
          setIsDragging(false)
          setDragStartCell(null)
          setDragEndCell(null)
          setToolPreview(null)
        }
        return
      }

      // Erase Line tool — click start, click end, clears cells along line
      if (tools.eraseline) {
        if (!isDragging) {
          setIsDragging(true)
          setDragStartCell({ x: col, y: row })
          setDragEndCell({ x: col, y: row })
          setToolPreview([{ x: col, y: row, type: 'erase' }])
        } else {
          // Erase cells along the line
          eraseLine(dragStartCell!.x, dragStartCell!.y, col, row)
          setIsDragging(false)
          setDragStartCell(null)
          setDragEndCell(null)
          setToolPreview(null)
        }
        return
      }

      // Default: single-cell action
      setIsDrawing(true)
      stitchAt(row, col)
    },
    [panelId, selectedColor, tools, backstitchConfig, backstitchStart, toggleCompletedStitch, updatePanel, setSelectedColor, setTool, isDragging, dragStartCell, applyLine, applyRectFill, applyCircleFill, applyBrush, setSelection, eraseLine]
  )

  const handleMouseEnter = (row: number, col: number, e: React.MouseEvent) => {
    // Backstitch preview while drawing
    if (backstitchConfig.enabled && backstitchStart && !isDrawing) {
      setBackstitchPreview({
        x1: backstitchStart.x,
        y1: backstitchStart.y,
        x2: col,
        y2: row,
      })
    } else if (isDrawing) {
      stitchAt(row, col)
    }
    // Multi-cell tool preview during drag
    if (isDragging && dragStartCell && !isDrawing) {
      setDragEndCell({ x: col, y: row })
      // Update preview for live rendering
      if (tools.line) {
        setToolPreview(bresenhamLine(dragStartCell.x, dragStartCell.y, col, row).map(p => ({ ...p, type: 'line' })))
      } else if (tools.brush) {
        applyBrush(col, row)
      }
    }
  }

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false)
    setBackstitchPreview(null)
  }, [])

  const floodFill = (
    design: number[][],
    startRow: number,
    startCol: number,
    replacementColor: number
  ): number[][] => {
    const rows = design.length
    const cols = rows > 0 ? design[0].length : 0
    if (startRow < 0 || startRow >= rows || startCol < 0 || startCol >= cols) {
      return design
    }
    
    const targetColor = design[startRow][startCol]
    if (targetColor === replacementColor) return design

    const newDesign = design.map((r) => [...r])
    const stack: [number, number][] = [[startRow, startCol]]

    while (stack.length > 0) {
      const [row, col] = stack.pop()!
      if (row < 0 || row >= rows || col < 0 || col >= cols) continue
      if (newDesign[row][col] !== targetColor) continue

      newDesign[row][col] = replacementColor
      stack.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1])
    }

    return newDesign
  }

  const stitchAt = (row: number, col: number) => {
    if (!panel) return

    const newDesign = panel.design.map((r) => [...r])
    // Ensure dimensions
    while (newDesign.length <= row) newDesign.push(new Array(width).fill(0))
    for (let i = 0; i < newDesign.length; i++) {
      while (newDesign[i].length <= col) newDesign[i].push(0)
    }

    if (tools.eraser) {
      newDesign[row][col] = 0
    } else if (tools.fill) {
      const filledDesign = floodFill(newDesign, row, col, selectedColor)
      updatePanel(panelId, { design: filledDesign })
      pushHistory(filledDesign)
      setLastEditedPosition(row, col)
      return
    } else if (tools.pencil) {
      newDesign[row][col] = selectedColor
    }

    updatePanel(panelId, { design: newDesign })
    pushHistory(newDesign)
    setLastEditedPosition(row, col)
  }

  // Symbol mapping for used colors
  const symbolMapping = useMemo(() => {
    if (!showSymbols) return new Map<number, { char: string; style: string; size: string }>()
    
    const usedColors = new Set<number>()
    panel?.design.forEach((row) => {
      row.forEach((color) => { if (color > 0) usedColors.add(color) })
    })

    const symbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const sortedColors = Array.from(usedColors).sort((a, b) => a - b)
    const mapping = new Map<number, { char: string; style: string; size: string }>()
    
    sortedColors.forEach((color, index) => {
      // Check if user has a custom symbol definition
      const customDef = symbolDefinitions.get(color)
      if (customDef && customDef.character && customDef.style !== 'none') {
        mapping.set(color, {
          char: customDef.character,
          style: customDef.style,
          size: customDef.size,
        })
      } else {
        mapping.set(color, {
          char: symbols[index % symbols.length],
          style: 'circle',
          size: 'md',
        })
      }
    })
    
    return mapping
  }, [panel?.design, showSymbols, symbolDefinitions])

  // ── Test hook: expose design array for E2E data-level verification ──
  useEffect(() => {
    if (panel) {
      ;(window as any).__testGridDesign = panel.design.map((r) => [...r])
      ;(window as any).__testGridWidth = width
      ;(window as any).__testGridHeight = height
    }
  }, [panel, width, height])

  // Progress for current panel
  const panelProgress = panel ? getProgressPercent(panelId) : 0

  // Backstitch lines for current panel
  const panelBackstitch = panel?.backstitch || []

  // Cell size
  const CELL_BASE = 28
  const effectiveCell = CELL_BASE * zoom

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-11 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shrink-0">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTool('pencil', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.pencil ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Pencil"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.eraser ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('fill', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.fill ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Fill"
          >
            <PaintBucket className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300" />

        {/* Advanced Drawing Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTool('line', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.line ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Line (click start, click end)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraseline', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.eraseline ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Erase Line (click start, click end to clear cells along path)"
          >
            <Eraser className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rectangle', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.rectangle ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Rectangle (drag to fill)"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.circle ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Circle (drag to fill)"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('brush', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.brush ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Brush (drag to paint)"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('dropper', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.dropper ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Dropper (click cell to pick color)"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('select', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.select ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Select (drag to select)"
          >
            <TextSelect className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('semicross', true)}
            className={`p-1.5 rounded-md transition-colors ${
              tools.semicross ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Semi-Cross (click cell to set diagonal/half stitch)"
          >
            <CornerDownRight className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300" />

        {/* Edit Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => doMirrorH()}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            title="Mirror full pattern horizontally"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => doMirrorV()}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
            title="Mirror full pattern vertically"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => doMirrorSelectionH()}
            disabled={!selection}
            className={`p-1.5 rounded-md transition-colors ${
              !selection ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Mirror selected region horizontally"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => doMirrorSelectionV()}
            disabled={!selection}
            className={`p-1.5 rounded-md transition-colors ${
              !selection ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Mirror selected region vertically"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => doCopy()}
            disabled={!selection}
            className={`p-1.5 rounded-md transition-colors ${
              !selection ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Copy selection"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => doPaste(0, 0)}
            disabled={!selection}
            className={`p-1.5 rounded-md transition-colors ${
              !selection ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title="Paste from clipboard"
          >
            <Scissors className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-5 bg-gray-300" />

        {/* Notes */}
        <button
          onClick={() => setShowNotesPanel(true)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          title="Notes & Annotations"
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* Pattern Repeat */}
        <button
          onClick={() => setShowPatternRepeat(true)}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          title="Pattern Repeat — tile and mirror patterns"
        >
          <Layers className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-300" />

        {/* Backstitch toggle */}
        <button
          onClick={() => setBackstitchConfig({ ...backstitchConfig, enabled: !backstitchConfig.enabled })}
          className={`p-1.5 rounded-md transition-colors ${
            backstitchConfig.enabled ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'hover:bg-gray-100 text-gray-500'
          }`}
          title="Backstitch tool (click to set start, click again to end)"
        >
          <PencilOff className="w-4 h-4" />
        </button>
        {backstitchConfig.enabled && (
          <span className="text-xs text-amber-600 font-medium">BS</span>
        )}

        <div className="w-px h-5 bg-gray-300" />

        <div className="w-px h-5 bg-gray-300" />

        {/* Clear pattern */}
        <button
          onClick={() => setShowClearPatternDialog(true)}
          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
          title="Clear pattern"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Phase 20: Grid snap + ruler toggles */}
        <GridSnapToggle />

        <button
          onClick={() => setShowRuler(!showRuler)}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
            showRuler ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title={showRuler ? 'Hide ruler' : 'Show ruler (mm overlay)'}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Ruler</span>
        </button>

        {/* Color history toggle */}
        <button
          onClick={() => setShowColorHistory(!showColorHistory)}
          className={`rounded-md px-2 py-1 text-xs transition ${
            showColorHistory ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title="Recently used colors"
        >
          🎨 Recent
        </button>

        {/* Color history panel */}
        {showColorHistory && (
          <div className="absolute top-12 right-4 z-40">
            <ColorHistoryPanel onClose={() => setShowColorHistory(false)} />
          </div>
        )}

        <div className="w-px h-5 bg-gray-300" />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(zoom - 0.25)}
            className="px-1.5 py-0.5 rounded hover:bg-gray-100 text-sm text-gray-600"
          >
            −
          </button>
          <span className="text-xs text-gray-500 font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(zoom + 0.25)}
            className="px-1.5 py-0.5 rounded hover:bg-gray-100 text-sm text-gray-600"
          >
            +
          </button>
        </div>

        <div className="flex-1" />

        {/* Progress indicator */}
        {panelProgress > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${panelProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-mono">{panelProgress}%</span>
          </div>
        )}

        {/* Grid size label */}
        <span className="text-xs text-gray-400 font-mono">
          {width}×{height}
        </span>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-gray-200 p-8 relative"
        onContextMenu={handleContextMenu}>

        {/* Ruler overlay */}
        {showRuler && (
          <RulerOverlay
            cellSize={28 * zoom}
            gridWidth={width}
            gridHeight={height}
            scrollX={0}
            scrollY={0}
          />
        )}
        <div
          className="inline-block bg-white shadow-xl"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <div className="flex">
            {/* Row labels (left) */}
            {labelConfig.position !== 'right' && (
              <div className="flex flex-col shrink-0"
                style={{ gridTemplateRows: `repeat(${height}, ${effectiveCell}px)` }}>
                {Array.from({ length: height }, (_, i) => {
                  const labelNum = labelConfig.startNumber + i
                  const labelSt = getLabelStyle(i, labelConfig)
                  const isHeavy = i > 0 && i % 10 === 0
                  const isMedium = i > 0 && i % 5 === 0
                  
                  return (
                    <div
                      key={`row-${i}`}
                      className="flex items-center justify-center"
                      style={{ 
                        height: effectiveCell, 
                        width: 28,
                        fontSize: isHeavy ? '11px' : isMedium ? '10px' : '9px',
                        fontWeight: labelSt.bold ? 600 : 400,
                        color: labelSt.color,
                      }}
                    >
                      {labelSt.show ? labelNum : ''}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Main grid with multi-weight lines */}
            <div className="flex flex-col bg-white">
              {/* Column labels (top) */}
              {labelConfig.position !== 'left' && (
                <div className="flex shrink-0"
                  style={{ gridTemplateColumns: `repeat(${width}, ${effectiveCell}px)` }}>
                  {Array.from({ length: width }, (_, i) => {
                    const labelNum = labelConfig.startNumber + i
                    const labelSt = getLabelStyle(i, labelConfig)
                    const isHeavy = i > 0 && i % 10 === 0
                    const isMedium = i > 0 && i % 5 === 0
                    
                    return (
                      <div
                        key={`col-${i}`}
                        className="flex items-center justify-center"
                        style={{ 
                          height: 24, 
                          width: effectiveCell,
                          fontSize: isHeavy ? '11px' : isMedium ? '10px' : '9px',
                          fontWeight: labelSt.bold ? 600 : 400,
                          color: labelSt.color,
                        }}
                      >
                        {labelSt.show ? labelNum : ''}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Grid cells with multi-weight lines */}
              {Array.from({ length: height }, (_, row) => (
                <div
                  key={`row-grid-${row}`}
                  className="flex"
                  style={{
                    gridTemplateColumns: `repeat(${width}, ${effectiveCell}px)`,
                  }}
                >
                  {Array.from({ length: width }, (_, col) => {
                    const colorIndex = panel?.design[row]?.[col] || 0
                    const isAlt = showAlternatingColors && (row + col) % 2 === 1
                    const rowColor = colorIndex > 0 ? getDMCHex(colorIndex) : undefined
                    
                    // Get line weights for this cell's borders
                    const bottomLine = getGridLineWeight(row, gridLineConfig, height)
                    const rightLine = getGridLineWeight(col, gridLineConfig, width)
                    
                    // Calculate box-shadow for multi-weight lines
                    // The box-shadow inset creates the right and bottom borders
                    let shadowString = ''
                    if (gridLineConfig.showLines) {
                      const shadows: string[] = []
                      if (rightLine.show) {
                        shadows.push(`inset -${rightLine.width}px 0 0 ${rightLine.color}`)
                      }
                      if (bottomLine.show) {
                        shadows.push(`inset 0 -${bottomLine.width}px 0 ${bottomLine.color}`)
                      }
                      // Always show light lines if any heavy/medium are shown
                      if (shadows.length === 0 && rightLine.width > 0 && bottomLine.width > 0) {
                        shadows.push(`inset -${gridLineConfig.lightLineWidth}px 0 0 ${gridLineConfig.lightLineColor}`)
                        shadows.push(`inset 0 -${gridLineConfig.lightLineWidth}px 0 ${gridLineConfig.lightLineColor}`)
                      }
                      if (shadows.length > 0) {
                        shadowString = shadows.join(', ')
                      }
                    }
                    
                    const isCompleted = isStitchCompleted(panelId, row, col)
                    const semiCrossKey = `${panelId}-${row}-${col}`
                    const scType = semiCrosses.get(semiCrossKey)
                    const cellStyle: React.CSSProperties = {
                      width: effectiveCell,
                      height: effectiveCell,
                      backgroundColor: rowColor || (isAlt ? '#f8f9fa' : '#ffffff'),
                      cursor: tools.pencil || tools.eraser || tools.fill || backstitchConfig.enabled || tools.line || tools.eraseline || tools.rectangle || tools.circle || tools.dropper || tools.select || tools.brush || tools.semicross ? 'crosshair' : 'default',
                      boxSizing: 'border-box',
                      boxShadow: shadowString || 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: Math.max(6, effectiveCell * 0.35),
                      fontWeight: showSymbols ? 700 : 400,
                      color: showSymbols ? (colorIndex > 0 ? '#374151' : '#9ca3af') : undefined,
                      opacity: isCompleted ? 0.45 : 1,
                      // Preview highlight for active multi-cell tool
                      outline: toolPreview?.some(p => p.x === col && p.y === row) ? '2px solid #818cf8' : undefined,
                      outlineOffset: '-1px',
                      outlineStyle: toolPreview?.some(p => p.x === col && p.y === row) ? 'solid' : undefined,
                    }
                    
                    const sym = showSymbols && colorIndex > 0
                      ? symbolMapping.get(colorIndex)
                      : null
                    const symbolChar = sym?.char || ''
                    
                    // Semi-cross rendering
                    const semiCrossColor = colorIndex > 0 ? getDMCHex(colorIndex) : '#374151'
                    const sc = scType && scType !== 'none' ? scType : null
                    let semiCrossSvg: React.ReactNode = null
                    if (sc) {
                      const s = effectiveCell * 0.85
                      const cx = effectiveCell / 2
                      switch (sc) {
                        case 'tl-br':
                          semiCrossSvg = (
                            <line x1={cx - s/2} y1={cx - s/2} x2={cx + s/2} y2={cx + s/2}
                                  stroke={semiCrossColor} strokeWidth={2} strokeLinecap="round" />
                          )
                          break
                        case 'tr-bl':
                          semiCrossSvg = (
                            <line x1={cx + s/2} y1={cx - s/2} x2={cx - s/2} y2={cx + s/2}
                                  stroke={semiCrossColor} strokeWidth={2} strokeLinecap="round" />
                          )
                          break
                        case 'top':
                          semiCrossSvg = (
                            <path d={`M${cx - s/2},${cx} L${cx + s/2},${cx} L${cx + s/2},${cx - s/2} L${cx - s/2},${cx - s/2} Z`}
                                  fill={semiCrossColor} opacity={0.7} />
                          )
                          break
                        case 'bottom':
                          semiCrossSvg = (
                            <path d={`M${cx - s/2},${cx} L${cx + s/2},${cx} L${cx + s/2},${cx + s/2} L${cx - s/2},${cx + s/2} Z`}
                                  fill={semiCrossColor} opacity={0.7} />
                          )
                          break
                        case 'left':
                          semiCrossSvg = (
                            <path d={`M${cx - s/2},${cx - s/2} L${cx},${cx - s/2} L${cx},${cx + s/2} L${cx - s/2},${cx + s/2} Z`}
                                  fill={semiCrossColor} opacity={0.7} />
                          )
                          break
                        case 'right':
                          semiCrossSvg = (
                            <path d={`M${cx},${cx - s/2} L${cx + s/2},${cx - s/2} L${cx + s/2},${cx + s/2} L${cx},${cx + s/2} Z`}
                                  fill={semiCrossColor} opacity={0.7} />
                          )
                          break
                      }
                    }

                    return (
                      <div
                        key={`${row}-${col}`}
                        onMouseDown={(e) => handleMouseDown(row, col, e)}
                        onDoubleClick={() => {
                          setNoteCreateState({ row, col })
                          setNoteText('')
                          setNoteColor('#6366f1')
                        }}
                        onMouseEnter={() => {
                          const handleEnter = (row: number, col: number) => {
                            if (backstitchConfig.enabled && backstitchStart && !isDrawing) {
                              setBackstitchPreview({ x1: backstitchStart.x, y1: backstitchStart.y, x2: col, y2: row })
                            } else if (isDrawing) {
                              stitchAt(row, col)
                            }
                          }
                          handleEnter(row, col)
                        }}
                        onMouseUp={handleMouseUp}
                        data-cell={`${row}-${col}`} className="transition-colors"
                        style={cellStyle}
                      >
                        {showSymbols && symbolChar ? (
                          <span style={{ pointerEvents: 'none' }}>{symbolChar}</span>
                        ) : null}
                        {isCompleted && !backstitchConfig.enabled && (
                          <div
                            className="pointer-events-none"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div className="w-2 h-2 bg-green-500/60 rounded-full" />
                          </div>
                        )}
                        {semiCrossSvg}
                        {/* Note marker indicator */}
                        {(panels.find((p) => p.id === panelId)?.notes || []).find((n) => n.row === row && n.col === col) && (
                          <div
                            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: '#6366f1' }}
                            title="Note on this cell"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
              
              {/* Tool preview overlay SVG */}
              {toolPreview && toolPreview.length > 0 && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    width: effectiveCell * width,
                    height: effectiveCell * height,
                    top: labelConfig.position !== 'right' ? 28 : 0,
                    left: labelConfig.position !== 'left' ? (labelConfig.position === 'both' ? 28 : 0) : 0,
                  }}
                >
                  {toolPreview.map((pt, i) => (
                    <rect
                      key={`prev-${i}`}
                      x={pt.x * effectiveCell}
                      y={pt.y * effectiveCell}
                      width={effectiveCell}
                      height={effectiveCell}
                      fill="rgba(129, 140, 248, 0.25)"
                      stroke="#818cf8"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                  ))}
                </svg>
              )}

              {/* Backstitch layer SVG overlay */}
              {panelBackstitch.length > 0 && backstitchConfig.enabled && (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    width: effectiveCell * width,
                    height: effectiveCell * height,
                    top: labelConfig.position !== 'right' ? 28 : 0,
                    left: labelConfig.position !== 'left' ? (labelConfig.position === 'both' ? 28 : 0) : 0,
                  }}
                >
                  {panelBackstitch.map((line) => (
                    <line
                      key={line.id}
                      x1={line.x1 * effectiveCell + effectiveCell / 2}
                      y1={line.y1 * effectiveCell + effectiveCell / 2}
                      x2={line.x2 * effectiveCell + effectiveCell / 2}
                      y2={line.y2 * effectiveCell + effectiveCell / 2}
                      stroke={line.color}
                      strokeWidth={line.lineWidth * effectiveCell * 0.3}
                      strokeLinecap="round"
                      opacity={backstitchConfig.opacity}
                    />
                  ))}
                  {backstitchPreview && backstitchStart && (
                    <line
                      x1={backstitchStart.x * effectiveCell + effectiveCell / 2}
                      y1={backstitchStart.y * effectiveCell + effectiveCell / 2}
                      x2={backstitchPreview.x2 * effectiveCell + effectiveCell / 2}
                      y2={backstitchPreview.y2 * effectiveCell + effectiveCell / 2}
                      stroke={backstitchConfig.color}
                      strokeWidth={backstitchConfig.lineWidth * effectiveCell * 0.3}
                      strokeDasharray="4,4"
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                  )}
                </svg>
              )}
              
              {/* Row labels (right) */}
              {labelConfig.position !== 'left' && (
                <div className="flex flex-col shrink-0"
                  style={{ gridTemplateRows: `repeat(${height}, ${effectiveCell}px)` }}>
                  {Array.from({ length: height }, (_, i) => {
                    const labelNum = labelConfig.startNumber + i
                    const labelSt = getLabelStyle(i, labelConfig)
                    const isHeavy = i > 0 && i % 10 === 0
                    const isMedium = i > 0 && i % 5 === 0
                    
                    return (
                      <div
                        key={`row-right-${i}`}
                        className="flex items-center justify-center"
                        style={{ 
                          height: effectiveCell, 
                          width: 28,
                          fontSize: isHeavy ? '11px' : isMedium ? '10px' : '9px',
                          fontWeight: labelSt.bold ? 600 : 400,
                          color: labelSt.color,
                        }}
                      >
                        {labelSt.show ? labelNum : ''}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom corner */}
          <div className="w-6 h-6 bg-gray-200" />

          {/* Note creation popover */}
          {noteCreateState && (
            <div
              className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64"
              style={{
                left: `${noteCreateState.col * 20 * zoom + 10}px`,
                top: `${noteCreateState.row * 20 * zoom + 10}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Note at R{noteCreateState.row} C{noteCreateState.col}
                </span>
                <button
                  onClick={() => setNoteCreateState(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Type your note..."
                rows={3}
                autoFocus
                className="w-full px-2 py-1 text-xs border rounded resize-none mb-2"
              />
              <div className="flex gap-1 flex-wrap mb-2">
                {['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setNoteColor(c)}
                    className={`w-4 h-4 rounded-full border-2 transition-transform ${
                      noteColor === c ? 'border-gray-800 scale-125' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  if (noteText.trim()) {
                    addNote(panelId, noteCreateState.row, noteCreateState.col, noteText.trim(), noteColor)
                    setNoteCreateState(null)
                    setNoteText('')
                    setNoteColor('#6366f1')
                  }
                }}
                disabled={!noteText.trim()}
                className="w-full py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
              >
                Add Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phase 20: Context menu */}
      {contextMenu?.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onColorClick={(idx) => setSelectedColor(idx)}
        />
      )}
    </div>
  )
}
