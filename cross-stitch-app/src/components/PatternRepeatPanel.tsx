import { useState, useCallback, useEffect } from 'react'
import { useProjectStore } from '../store/projectStore'
import { Layers, Grid3X3, FlipHorizontal, FlipVertical, CornerDownLeft, X } from 'lucide-react'

type MirrorMode = 'none' | 'h' | 'v' | 'both'

export function PatternRepeatPanel() {
  const settings = useProjectStore((s) => s.settings)
  const repeatGrid = useProjectStore((s) => s.repeatGrid)
  const repeatGridWithMirrorH = useProjectStore((s) => s.repeatGridWithMirrorH)
  const repeatGridWithMirrorV = useProjectStore((s) => s.repeatGridWithMirrorV)
  const repeatGridWithMirrorBoth = useProjectStore((s) => s.repeatGridWithMirrorBoth)
  const showPatternRepeat = useProjectStore((s) => s.showPatternRepeat)
  const setShowPatternRepeat = useProjectStore((s) => s.setShowPatternRepeat)
  const { width, height } = settings

  const [repeatX, setRepeatX] = useState(2)
  const [repeatY, setRepeatY] = useState(2)
  const [mirrorMode, setMirrorMode] = useState<MirrorMode>('none')

  // Close panel on Escape key
  useEffect(() => {
    if (!showPatternRepeat) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowPatternRepeat(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showPatternRepeat, setShowPatternRepeat])

  const toggle = useCallback(() => setShowPatternRepeat(!showPatternRepeat), [setShowPatternRepeat, showPatternRepeat])

  const handleRepeat = useCallback(() => {
    if (repeatX < 1 || repeatY < 1) return
    switch (mirrorMode) {
      case 'h': repeatGridWithMirrorH(repeatX, repeatY); break
      case 'v': repeatGridWithMirrorV(repeatX, repeatY); break
      case 'both': repeatGridWithMirrorBoth(repeatX, repeatY); break
      default: repeatGrid(repeatX, repeatY); break
    }
  }, [repeatX, repeatY, mirrorMode, repeatGrid, repeatGridWithMirrorH, repeatGridWithMirrorV, repeatGridWithMirrorBoth])

  const previewW = width * repeatX * (mirrorMode === 'h' ? 2 : 1)
  const previewH = height * repeatY * (mirrorMode === 'v' ? 2 : 1)
  const both = mirrorMode === 'both'
  const finalW = width * repeatX * (both ? 2 : 1)
  const finalH = height * repeatY * (both ? 2 : 1)

  if (!showPatternRepeat) {
    return (
      <button
        onClick={toggle}
        className="absolute top-2 right-2 p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition-colors z-10"
        title="Pattern Repeat"
      >
        <Layers className="w-4 h-4" />
      </button>
    )
  }

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-2xl p-5 z-20 max-w-sm mx-auto mt-16">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-indigo-500" />
          Pattern Repeat
        </h3>
        <button onClick={toggle} className="p-1 rounded hover:bg-gray-100 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mirror mode */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mirror Mode</label>
        <div className="flex gap-1 mt-1">
          {([
            ['none', 'None', <Grid3X3 key="none" className="w-3 h-3" />],
            ['h', 'Horizontal', <FlipHorizontal key="h" className="w-3 h-3" />],
            ['v', 'Vertical', <FlipVertical key="v" className="w-3 h-3" />],
            ['both', 'Both Axes', <CornerDownLeft key="both" className="w-3 h-3" />],
          ] as const).map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setMirrorMode(key)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mirrorMode === key
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Repeat count */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Repeat Count</label>
        <div className="flex gap-3 mt-1">
          <div className="flex-1">
            <label className="text-xs text-gray-400">X (columns)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={repeatX}
              onChange={(e) => {
                const v = e.target.value
                const n = parseInt(v, 10)
                setRepeatX(isNaN(n) || v === '' ? 1 : Math.max(1, Math.min(20, n)))
              }}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono text-center focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400">Y (rows)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={repeatY}
              onChange={(e) => {
                const v = e.target.value
                const n = parseInt(v, 10)
                setRepeatY(isNaN(n) || v === '' ? 1 : Math.max(1, Math.min(20, n)))
              }}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono text-center focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Result Size</label>
        <div className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-xs font-mono text-gray-600">
          {finalW} × {finalH} stitches
        </div>
        <div className="mt-2 px-3 py-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
          {both ? '4-way mirror' : mirrorMode === 'h' ? '2-way horizontal mirror' : mirrorMode === 'v' ? '2-way vertical mirror' : 'direct repeat'}
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={handleRepeat}
        className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
      >
        Apply Pattern Repeat
      </button>
    </div>
  )
}
