import { useProjectStore } from '../store/projectStore'
import { getAllDMCColors } from '../utils/dmcColors'
import { FLOSS_BRANDS, FlossBrandId } from '../utils/flossBrands'

const paletteHex = (colorIndex: number): string => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return dmc[colorIndex].hex
  return '#cccccc'
}

const paletteLabel = (colorIndex: number): string => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return `DMC ${dmc[colorIndex].number}`
  return '?'
}

// Get the DMC number for a stored palette index
const paletteNumber = (colorIndex: number): number => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return dmc[colorIndex].number
  return 0
}

interface ColorHistoryPanelProps {
  onClose?: () => void
}

export function ColorHistoryPanel({ onClose }: ColorHistoryPanelProps) {
  const colorHistory = useProjectStore((s) => s.colorHistory)
  const setSelectedColor = useProjectStore((s) => s.setSelectedColor)

  if (colorHistory.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recently Used Colors</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-500">Colors you click on the palette appear here for quick access.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recently Used Colors</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {colorHistory.map((idx, i) => {
          const colorNum = paletteNumber(idx)
          return (
            <button
              key={`${idx}-${i}`}
              onClick={() => setSelectedColor(colorNum)}
              className="group relative flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 shadow-sm transition hover:scale-110 hover:shadow-md"
              title={`${paletteLabel(idx)} (${paletteHex(idx)})`}
            >
              <span
                className="absolute inset-0 rounded-md"
                style={{ backgroundColor: paletteHex(idx) }}
              />
              <span className="relative z-10 text-[9px] font-mono text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {paletteLabel(idx)}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-gray-400">{colorHistory.length} recent colors</p>
    </div>
  )
}
