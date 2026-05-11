/**
 * Progress tracker component
 * Shows per-panel and overall progress
 */
import { useProjectStore } from '../store/projectStore'
import { Target, CheckCircle2, Circle, ArrowUp, ArrowDown, Save, SaveOff, Hash } from 'lucide-react'
import { useState } from 'react'

export function ProgressTracker() {
  const { 
    panels, selectedPanelId, setSelectedPanelId, getOverallProgressPercent, completedStitches,
    manualStitchCount, setManualStitchCount, incrementManualStitchCount, resetManualStitchCount,
    lastEditedRow, lastEditedCol, setLastEditedPosition,
    lastSaved, autoSaveEnabled, setAutoSaveEnabled,
  } = useProjectStore()
  const [showDetails, setShowDetails] = useState(false)

  const overallProgress = getOverallProgressPercent()

  const getPanelProgress = (panelId: number) => {
    const panel = panels.find(p => p.id === panelId)
    if (!panel) return 0
    const total = panel.design.length * (panel.design[0]?.length || 0)
    if (total === 0) return 0
    let completed = 0
    for (let r = 0; r < panel.design.length; r++) {
      for (let c = 0; c < panel.design[r].length; c++) {
        if (completedStitches.has(`${panelId}:${r}:${c}`)) {
          completed++
        }
      }
    }
    return Math.round((completed / total) * 100)
  }

  const handlePanelClick = (panelId: number) => {
    setSelectedPanelId(panelId)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-indigo-500" />
          Progress Tracker
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Overall progress */}
      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-800">Overall</span>
          <span className="text-lg font-bold text-indigo-600">{overallProgress}%</span>
        </div>
        <div className="h-3 bg-indigo-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Panel progress */}
      <div className="space-y-2">
        {panels.map((panel) => {
          const progress = getPanelProgress(panel.id)
          const isActive = panel.id === selectedPanelId
          const statusColor = progress === 100 ? 'green' : progress > 0 ? 'indigo' : 'gray'

          return (
            <button
              key={panel.id}
              onClick={() => handlePanelClick(panel.id)}
              className={`w-full p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {statusColor === 'green' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : progress > 0 ? (
                    <ArrowUp className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-800">{panel.name}</span>
                </div>
                <span className={`text-sm font-mono ${
                  progress === 100 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    statusColor === 'green' ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* Help text */}
      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
        <p className="font-medium mb-1">How to track progress:</p>
        <ul className="space-y-1">
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-500 mt-0.5">•</span>
            <span><strong>Shift+Click</strong> on a stitch to mark it as complete</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-500 mt-0.5">•</span>
            <span>Completed stitches show a green dot overlay</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-indigo-500 mt-0.5">•</span>
            <span>Click a panel to jump to it</span>
          </li>
        </ul>
      </div>

      {/* Manual stitch counter */}
      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" />
            Manual Counter
          </span>
          <button
            onClick={() => resetManualStitchCount()}
            className="text-[10px] text-amber-500 hover:text-amber-700"
            title="Reset counter"
          >
            Reset
          </button>
        </div>
        <div className="text-center py-1">
          <div className="text-2xl font-bold text-amber-800 font-mono tabular-nums">
            {manualStitchCount.toLocaleString()}
          </div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <button
              onClick={() => setManualStitchCount(Math.max(0, manualStitchCount - 1))}
              className="w-6 h-6 rounded bg-amber-200 hover:bg-amber-300 text-amber-700 text-xs font-bold"
            >
              −
            </button>
            <button
              onClick={() => incrementManualStitchCount()}
              className="w-6 h-6 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
            >
              +
            </button>
          </div>
        </div>
        {(lastEditedRow !== null || lastEditedCol !== null) && (
          <div className="mt-2 text-[10px] text-amber-600 text-center">
            Last edited: Row {lastEditedRow ?? '?'}, Col {lastEditedCol ?? '?'}
          </div>
        )}
      </div>

      {/* Auto-save status */}
      <div className="p-2 bg-gray-50 rounded-lg flex items-center justify-between text-xs">
        <span className="text-gray-600">Auto-save</span>
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            className="rounded"
          />
          <span className={`text-[10px] ${autoSaveEnabled ? 'text-green-600' : 'text-gray-400'}`}>
            {autoSaveEnabled ? 'On' : 'Off'}
          </span>
        </label>
      </div>
      {lastSaved && (
        <div className="text-[10px] text-gray-400 text-center">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
