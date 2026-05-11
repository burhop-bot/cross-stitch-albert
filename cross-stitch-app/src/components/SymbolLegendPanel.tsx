/**
 * Symbol Legend Panel — displays symbols sorted by usage, with drag-to-reorder
 * Task 051
 */
import { useState, useRef, useCallback } from 'react'
import { useProjectStore, Panel, SymbolDefinition } from '../store/projectStore'
import { getDMCHex } from '../utils/dmcColors'
import {
  MoveUp,
  MoveDown,
  Trash2,
  Palette,
  GripVertical,
  Download,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react'
import { SymbolSVG, SymbolPreviewIcon } from './SymbolEditor'

export function SymbolLegendPanel() {
  const {
    panels,
    selectedPanelId,
    symbolDefinitions,
    setSymbolDefinition,
    clearSymbolDefinition,
    showSymbols,
    setShowSymbols,
  } = useProjectStore()

  // Count symbol usage per color index in selected panel
  const usageCounts = usePanelUsageCount(selectedPanelId)

  // Build legend entries sorted by usage (most used first)
  const [legendEntries, setLegendEntries] = useState<LegendEntry[]>(() =>
    buildLegendEntries(usageCounts, symbolDefinitions)
  )

  // Rebuild when dependencies change
  const debouncedRebuild = useDebouncedRebuild(
    () => buildLegendEntries(usageCounts, symbolDefinitions),
    [usageCounts, symbolDefinitions]
  )

  // Drag-to-reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const handleDragStart = useCallback(
    (index: number) => (e: React.DragEvent) => {
      setDragIndex(index)
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  const handleDragOver = useCallback(
    (index: number) => (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    },
    []
  )

  const handleDrop = useCallback(
    (targetIndex: number) => (e: React.DragEvent) => {
      e.preventDefault()
      if (dragIndex === null || dragIndex === targetIndex) {
        setDragIndex(null)
        return
      }
      setLegendEntries((prev) => {
        const items = [...prev]
        const [moved] = items.splice(dragIndex, 1)
        items.splice(targetIndex, 0, moved)
        return items
      })
      setDragIndex(null)
    },
    [dragIndex]
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
  }, [])

  // Delete symbol override
  const handleDelete = useCallback(
    (colorIndex: number) => {
      clearSymbolDefinition(colorIndex)
      setLegendEntries((prev) => prev.filter((e) => e.colorIndex !== colorIndex))
    },
    [clearSymbolDefinition]
  )

  // Toggle symbol visibility globally
  const toggleSymbols = useCallback(() => {
    setShowSymbols(!showSymbols)
  }, [showSymbols, setShowSymbols])

  // Export legend as text
  const handleExportLegend = useCallback(() => {
    const text = legendEntries
      .map((e) => {
        const hex = getDMCHex(e.colorIndex) || '??'
        const name = e.colorIndex.toString()
        const def = symbolDefinitions.get(e.colorIndex)
        if (!def) return `  ${name} | ${hex} | — | ${e.usage} stitches`
        const symbol = def.character || ''
        const style = def.style !== 'none' ? ` (${def.style})` : ''
        const size = def.size ? ` [${def.size}]` : ''
        return `  ${name} | ${hex} | ${symbol}${style}${size} | ${e.usage} stitches`
      })
      .join('\n')

    const blob = new Blob(
      [
        `Symbol Legend\n${'='.repeat(50)}\n\n` + text,
      ],
      { type: 'text/plain' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'symbol-legend.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [legendEntries, symbolDefinitions])

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-700">Symbol Legend</h3>
          <span className="text-xs text-gray-400">
            ({legendEntries.filter((e) => e.usage > 0).length} symbols)
          </span>
        </div>
        <button
          onClick={toggleSymbols}
          className={`p-1.5 rounded-lg transition-colors ${
            showSymbols
              ? 'bg-indigo-100 text-indigo-600'
              : 'bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}
          title={showSymbols ? 'Hide symbols' : 'Show symbols'}
        >
          {showSymbols ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Legend table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-500">Drag to reorder legend</span>
          <button
            onClick={handleExportLegend}
            className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
            title="Export legend as text"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {legendEntries.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              No symbols defined. Click a color in the palette to assign one.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {legendEntries.map((entry, index) => (
                <LegendItem
                  key={entry.colorIndex}
                  entry={entry}
                  index={index}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  onDelete={() => handleDelete(entry.colorIndex)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sort hint */}
      {legendEntries.some((e) => e.usage > 0) && (
        <p className="text-xs text-gray-400">
          Sorted by usage count. Drag items to reorder. Unassigned symbols appear below assigned ones.
        </p>
      )}
    </div>
  )
}

interface LegendEntry {
  colorIndex: number
  usage: number // stitches using this color
  symbolDef?: SymbolDefinition
}

function buildLegendEntries(
  usageCounts: Map<number, number>,
  symbolDefs: Map<number, SymbolDefinition>
): LegendEntry[] {
  const entries: LegendEntry[] = []
  const hasDef = new Set<number>()

  // Add all colors with symbol definitions
  for (const [colorIndex, def] of symbolDefs) {
    if (def.style === 'none') continue
    entries.push({
      colorIndex,
      usage: usageCounts.get(colorIndex) || 0,
      symbolDef: def,
    })
    hasDef.add(colorIndex)
  }

  // Add remaining colors that have usage but no symbol
  for (const [colorIndex, usage] of usageCounts) {
    if (usage <= 0 || hasDef.has(colorIndex)) continue
    entries.push({ colorIndex, usage, symbolDef: undefined })
  }

  return entries
}

function usePanelUsageCount(panelId: number | null): Map<number, number> {
  const panel = useProjectStore((s) =>
    s.panels.find((p) => p.id === panelId)
  )

  if (!panel) return new Map()

  const count = new Map<number, number>()
  for (const row of panel.design) {
    for (const cell of row) {
      if (cell > 0) {
        count.set(cell, (count.get(cell) || 0) + 1)
      }
    }
  }
  return count
}

function useDebouncedRebuild(
  rebuild: () => LegendEntry[],
  deps: unknown[]
) {
  const ref = useRef<ReturnType<typeof setTimeout>>(null)

  return useCallback(() => {
    if (ref.current) clearTimeout(ref.current)
    ref.current = setTimeout(() => {
      rebuild()
    }, 300)
  }, deps)
}

function LegendItem({
  entry,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onDelete,
}: {
  entry: LegendEntry
  index: number
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDelete: () => void
}) {
  const hex = getDMCHex(entry.colorIndex) || '#888888'
  const def = entry.symbolDef

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors cursor-grab active:cursor-grabbing ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
      } ${entry.usage === 0 ? 'opacity-50' : ''}`}
    >
      {/* Drag handle */}
      <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />

      {/* Color swatch */}
      <div
        className="w-5 h-5 rounded border border-gray-200 flex-shrink-0"
        style={{ backgroundColor: hex }}
      />

      {/* Symbol preview */}
      {def ? (
        <div className="flex-shrink-0">
          <SymbolSVG def={def} size={24} />
        </div>
      ) : (
        <div className="text-xs text-gray-400 px-1 flex-shrink-0 w-6 text-center">—</div>
      )}

      {/* Color info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-gray-700 font-medium">
            #{entry.colorIndex}
          </span>
          {def && (
            <span className="text-xs text-gray-400">
              {def.character} ({def.style})
            </span>
          )}
        </div>
      </div>

      {/* Usage */}
      <span className="text-xs text-gray-400 flex-shrink-0">
        {entry.usage.toLocaleString()}
      </span>

      {/* Actions */}
      {def && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
          title="Remove symbol"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
