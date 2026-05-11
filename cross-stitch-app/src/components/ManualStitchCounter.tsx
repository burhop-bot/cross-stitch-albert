/**
 * Manual stitch counter component
 * Allows stitchers to manually count stitches as they work
 */
import { useState, useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'
import { Hash, Minus, Plus, RotateCcw } from 'lucide-react'

export function ManualStitchCounter() {
  const { 
    panels, 
    selectedPanelId, 
    manualStitchCount, 
    setManualStitchCount, 
    incrementManualStitchCount, 
    decrementManualStitchCount, 
    resetManualStitchCount,
    lastEditedRow,
    lastEditedCol,
  } = useProjectStore()

  const panel = panels.find(p => p.id === selectedPanelId)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Update counter when switching panels
  useEffect(() => {
    if (selectedPanelId !== null) {
      // Reset per panel — in a real app, this would be panel-specific
      setManualStitchCount(0)
    }
  }, [selectedPanelId, setManualStitchCount])

  const handleQuickIncrement = () => {
    incrementManualStitchCount()
  }

  const handleQuickDecrement = () => {
    decrementManualStitchCount()
  }

  const handleReset = () => {
    resetManualStitchCount()
    setShowResetConfirm(false)
  }

  // Calculate percentage for visual progress bar
  const totalStitches = panel ? panel.design.length * (panel.design[0]?.length || 0) : 0
  const pct = totalStitches > 0 ? Math.min(100, Math.round((manualStitchCount / totalStitches) * 100)) : 0

  return (
    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
          <Hash className="w-3.5 h-3.5" />
          Stitch Counter
        </span>
        <div className="flex items-center gap-1">
          {showResetConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="px-1.5 py-0.5 text-[10px] bg-green-600 text-white rounded hover:bg-green-700"
              >
                ✓
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-1.5 py-0.5 text-[10px] bg-gray-300 rounded hover:bg-gray-400"
              >
                ✗
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-0.5 text-amber-400 hover:text-amber-600 transition-colors"
              title="Reset counter"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Counter display */}
      <div className="text-center py-2">
        <div className="text-3xl font-bold text-amber-800 font-mono tabular-nums">
          {manualStitchCount.toLocaleString()}
        </div>
        {totalStitches > 0 && (
          <div className="text-[10px] text-amber-600 mt-0.5">
            of {totalStitches.toLocaleString()} stitches ({pct}%)
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleQuickDecrement}
          className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors"
          title="Decrement (-1)"
        >
          <Minus className="w-3 h-3 text-amber-700" />
        </button>
        <button
          onClick={handleQuickIncrement}
          className="flex-1 flex items-center justify-center gap-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
          title="Increment (+1)"
        >
          <Plus className="w-3 h-3" />
          <span className="text-xs">+1</span>
        </button>
      </div>

      {/* Current position */}
      {(lastEditedRow !== null || lastEditedCol !== null) && (
        <div className="mt-2 text-[10px] text-amber-600 text-center">
          Last edited: Row {lastEditedRow ?? '?'}, Col {lastEditedCol ?? '?'}
          {panel && (
            <span className="block text-amber-500">
              {panel.name} · {panel.design.length}×{panel.design[0]?.length || 0}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
