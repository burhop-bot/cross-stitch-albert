import { useProjectStore } from '../store/projectStore'
import { getAllDMCColors } from '../utils/dmcColors'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onColorClick?: (colorIndex: number) => void
}

const paletteHex = (colorIndex: number): string => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return dmc[colorIndex].hex
  return '#cccccc'
}

const paletteLabel = (colorIndex: number): string => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return String(dmc[colorIndex].number)
  return '?'
}

export function ContextMenu({ x, y, onClose, onColorClick }: ContextMenuProps) {
  const showRuler = useProjectStore((s) => s.showRuler)
  const setShowRuler = useProjectStore((s) => s.setShowRuler)
  const setContextMenu = useProjectStore((s) => s.setContextMenu)
  const setShowThumbnailGallery = useProjectStore((s) => s.setShowThumbnailGallery)
  const setSelectedColor = useProjectStore((s) => s.setSelectedColor)
  const selectedColor = useProjectStore((s) => s.selectedColor)

  // Clamp to viewport
  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - 320)

  return (
    <div
      className="fixed z-[110] w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
      style={{ left: adjustedX, top: adjustedY }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Palette section */}
      <div className="px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Colors</span>
      </div>
      <div className="max-h-48 overflow-y-auto px-2">
        {Array.from({ length: 30 }, (_, i) => (
          <button
            key={i}
            className={`group flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition hover:bg-indigo-50 ${
              i === selectedColor ? 'bg-indigo-50' : ''
            }`}
            onClick={() => {
              setSelectedColor(i)
              onColorClick?.(i)
              setContextMenu(null)
            }}
            title={`${paletteLabel(i)} ${paletteHex(i)}`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded border border-gray-200"
              style={{ backgroundColor: paletteHex(i) }}
            />
            <span className="text-gray-700">{paletteLabel(i)}</span>
            {i === selectedColor && <span className="ml-auto text-indigo-500">●</span>}
          </button>
        ))}
      </div>

      <div className="my-1 border-t border-gray-100" />

      {/* View options */}
      <button
        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition hover:bg-gray-50 ${
          showRuler ? 'text-indigo-600 font-medium' : 'text-gray-700'
        }`}
        onClick={() => setShowRuler(!showRuler)}
      >
        <span className={showRuler ? 'text-indigo-500' : 'text-gray-400'}>
          {showRuler ? '✓' : '○'}
        </span>
        Show Ruler
      </button>

      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition hover:bg-gray-50"
        onClick={() => { setShowThumbnailGallery(true); setContextMenu(null) }}
      >
        <span className="text-gray-400">🖼️</span>
        View Thumbnail Gallery
      </button>

      <div className="my-1 border-t border-gray-100" />

      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-gray-700 transition hover:bg-gray-50"
        onClick={() => setContextMenu(null)}
      >
        <span className="text-gray-400">✕</span>
        Close
      </button>
    </div>
  )
}
