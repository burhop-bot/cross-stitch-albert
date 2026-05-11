import { useState, useMemo } from 'react'
import { useProjectStore } from '../store/projectStore'
import { generateInstructions, instructionsToText, instructionsToMarkdown, instructionsToPDF, type RowInstruction, type ReadingDirection } from '../utils/writtenInstructions'
import { FileText, Copy, Download, Settings, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'

export function WrittenInstructionsPanel() {
  const { panels, selectedPanelId, activeRightPanel, setActiveRightPanel } = useProjectStore()
  const panel = panels.find(p => p.id === selectedPanelId)
  const grid = panel?.design

  const [readingDirection, setReadingDirection] = useState<ReadingDirection>('left-to-right')
  const [useAbbreviations, setUseAbbreviations] = useState(true)
  const [includeRowNumbers, setIncludeRowNumbers] = useState(true)
  const [format, setFormat] = useState<'plain' | 'markdown'>('plain')
  const [showPreview, setShowPreview] = useState(true)

  // Generate instructions from current grid
  const instructions = useMemo(() => {
    if (!grid) return []
    return generateInstructions(grid, {
      readingDirection,
      useAbbreviations,
      includeRowNumbers,
    })
  }, [grid, readingDirection, useAbbreviations, includeRowNumbers])

  // Total stats
  const totalStitches = instructions.reduce((sum, r) => sum + r.stitchCount, 0)
  const totalColors = new Set(instructions.flatMap(r => r.colorBreakdown.map(s => s.dmcNumber))).size
  const totalRows = instructions.length

  // Get text output
  const textOutput = useMemo(() => {
    return instructionsToText(instructions, { includeRowNumbers })
  }, [instructions, includeRowNumbers])

  const markdownOutput = useMemo(() => {
    return instructionsToMarkdown(instructions, `Pattern Instructions - ${panel?.name || 'Untitled'}`)
  }, [instructions, panel?.name])

  const currentOutput = format === 'markdown' ? markdownOutput : textOutput

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput)
  }

  const handleDownload = () => {
    const ext = format === 'markdown' ? '.md' : '.txt'
    const content = format === 'markdown' ? markdownOutput : textOutput
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(panel?.name || 'pattern').replace(/\s+/g, '_')}_instructions${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!grid) {
    return (
      <div className="px-3 py-4 text-center text-gray-400 text-xs">
        No grid data available. Create or load a pattern first.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center gap-2">
        <FileText className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-semibold text-gray-700">Chart Instructions</span>
      </div>

      {/* Stats bar */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex gap-3">
        <span>{totalRows} rows</span>
        <span>·</span>
        <span>{totalStitches.toLocaleString()} stitches</span>
        <span>·</span>
        <span>{totalColors} colors</span>
      </div>

      {/* Settings */}
      <details className="px-3 py-2 border-b border-gray-200" open>
        <summary className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          <Settings className="w-3 h-3" />
          Settings
        </summary>
        <div className="mt-2 space-y-2">
          {/* Reading direction */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-24">Direction:</label>
            <select
              value={readingDirection}
              onChange={e => setReadingDirection(e.target.value as ReadingDirection)}
              className="text-xs border rounded px-1 py-0.5 flex-1"
            >
              <option value="left-to-right">Left → Right</option>
              <option value="right-to-left">Right → Left</option>
            </select>
          </div>

          {/* Abbreviations toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={useAbbreviations}
              onChange={e => setUseAbbreviations(e.target.checked)}
              className="rounded"
            />
            Use color abbreviations
          </label>

          {/* Row numbers toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={includeRowNumbers}
              onChange={e => setIncludeRowNumbers(e.target.checked)}
              className="rounded"
            />
            Include row numbers
          </label>

          {/* Format selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-24">Format:</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value as 'plain' | 'markdown')}
              className="text-xs border rounded px-1 py-0.5 flex-1"
            >
              <option value="plain">Plain text</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        </div>
      </details>

      {/* Preview toggle */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs text-gray-500">Preview</span>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          {showPreview ? (
            <span className="flex items-center gap-1"><EyeOff className="w-3 h-3" /> Hide</span>
          ) : (
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Show</span>
          )}
        </button>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="px-3 py-2 flex-1 overflow-auto">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded border border-gray-100 max-h-64 overflow-auto">
            {textOutput.split('\n').slice(0, 30).join('\n')}
            {instructions.length > 30 && `\n... (${instructions.length - 30} more rows)`}
          </pre>
        </div>
      )}

      {/* Export buttons */}
      <div className="px-3 py-2 border-t border-gray-200 flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700"
        >
          <Download className="w-3 h-3" />
          Download
        </button>
      </div>

      {/* First 5 rows detail */}
      {instructions.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-1">First 5 rows:</div>
          <div className="space-y-0.5">
            {instructions.slice(0, 5).map(row => (
              <div key={row.rowNumber} className="text-xs font-mono text-gray-600 truncate" title={row.description}>
                {row.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
