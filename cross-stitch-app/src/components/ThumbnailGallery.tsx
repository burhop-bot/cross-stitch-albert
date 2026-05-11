import { useProjectStore } from '../store/projectStore'
import { getAllDMCColors } from '../utils/dmcColors'

const paletteHex = (colorIndex: number): string => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return dmc[colorIndex].hex
  return '#ffffff'
}

interface ThumbnailGalleryProps {
  onClose?: () => void
}

/**
 * Generate a thumbnail preview of the current pattern.
 * Returns an SVG data URL representing the colored grid.
 */
function generateThumbnailSVG(panelDesign: number[][], palette: number[], title: string): string {
  const rows = panelDesign.length
  const cols = panelDesign[0]?.length ?? 0
  const maxDim = 320
  const scale = maxDim / Math.max(cols, rows)
  const cellSize = Math.max(1, Math.floor(scale))
  const svgW = cols * cellSize
  const svgH = rows * cellSize

  let content = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`

  // Title background
  content += `<rect width="100%" height="20" fill="#4f46e5"/>`
  content += `<text x="8" y="14" fill="white" font-size="10" font-family="sans-serif">${title || 'Pattern'}</text>`

  // Grid cells
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const colorIdx = panelDesign[y][x]
      const hex = paletteHex(colorIdx)
      content += `<rect x="${x * cellSize}" y="${y * cellSize + 20}" width="${cellSize}" height="${cellSize}" fill="${hex}"/>`
    }
  }

  content += `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(content)}`
}

export function ThumbnailGallery({ onClose }: ThumbnailGalleryProps) {
  const panels = useProjectStore((s) => s.panels)
  const palette = useProjectStore((s) => s.dmcPalette)
  const title = useProjectStore((s) => s.settings.title)
  const show = useProjectStore((s) => s.showThumbnailGallery)

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => {
      if (e.target === e.currentTarget) onClose?.()
    }}>
      <div className="mx-4 max-w-3xl max-h-[85vh] w-full overflow-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Pattern Preview</h2>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {panels.map((panel) => {
            const svgDataUrl = generateThumbnailSVG(panel.design, palette, panel.name)
            return (
              <div key={panel.id} className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700">{panel.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {panel.design[0]?.length ?? 0}×{panel.design.length}
                  </span>
                </div>
                <div className="flex justify-center bg-white p-2">
                  <img
                    src={svgDataUrl}
                    alt={panel.name}
                    className="max-h-48 w-auto rounded border border-gray-100"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          {panels.length} panel{panels.length !== 1 ? 's' : ''} · {palette.length} colors used
        </div>
      </div>
    </div>
  )
}
