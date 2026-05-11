import { useProjectStore } from '../store/projectStore'
import { stitchSizeMM } from '../utils/fabricUtils'

interface RulerOverlayProps {
  cellSize: number
  gridWidth: number
  gridHeight: number
  scrollX: number
  scrollY: number
}

export function RulerOverlay({ cellSize, gridWidth, gridHeight, scrollX, scrollY }: RulerOverlayProps) {
  const fabric = useProjectStore((s) => s.settings.fabric)
  const mmPerStitch = stitchSizeMM(fabric)

  // Ruler dimensions
  const rulerHeight = 30 // px
  const rulerWidth = 30 // px

  // Generate ruler marks
  const marks: number[] = []
  for (let mm = 0; mm <= Math.max(gridWidth, gridHeight) * mmPerStitch + 20; mm += 5) {
    const stitchPos = Math.round(mm / mmPerStitch)
    if (stitchPos >= 0 && stitchPos <= Math.max(gridWidth, gridHeight)) {
      marks.push(mm)
    }
  }

  const showMinor = mmPerStitch > 1 // Show minor marks every mm when stitch is >1mm

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      {/* Top ruler */}
      <div
        className="absolute left-0 top-0 overflow-hidden border-r border-b border-gray-400 bg-gray-100"
        style={{ height: rulerHeight, width: '100%' }}
      >
        {marks.map((mm) => {
          const pxPos = mm * (cellSize / mmPerStitch) - scrollX
          if (pxPos < -10 || pxPos > gridWidth * cellSize + 10) return null
          const isMajor = mm % 25 === 0
          const isMid = mm % 10 === 0
          return (
            <div key={mm} className="absolute bottom-0" style={{ left: pxPos }}>
              <div
                className="bg-gray-500"
                style={{
                  width: isMajor ? 1 : isMid ? 1 : 0.5,
                  height: isMajor ? 10 : isMid ? 6 : 3,
                }}
              />
              {isMajor && (
                <span
                  className="absolute text-[8px] text-gray-600"
                  style={{ left: -4, top: 2 }}
                >
                  {mm}
                </span>
              )}
            </div>
          )
        })}
        {/* "mm" label */}
        <div className="absolute right-2 top-1 text-[9px] font-semibold text-gray-500">mm</div>
      </div>

      {/* Left ruler */}
      <div
        className="absolute top-0 overflow-hidden border-r border-b border-gray-400 bg-gray-100"
        style={{ width: rulerWidth, height: '100%' }}
      >
        {marks.map((mm) => {
          const pxPos = mm * (cellSize / mmPerStitch) - scrollY
          if (pxPos < -10 || pxPos > gridHeight * cellSize + 10) return null
          const isMajor = mm % 25 === 0
          const isMid = mm % 10 === 0
          return (
            <div key={mm} className="absolute left-0" style={{ top: pxPos }}>
              <div
                className="bg-gray-500"
                style={{
                  width: isMajor ? 10 : isMid ? 6 : 3,
                  height: 1,
                }}
              />
              {isMajor && (
                <span
                  className="absolute text-[8px] text-gray-600"
                  style={{ left: 4, top: 1 }}
                >
                  {mm}
                </span>
              )}
            </div>
          )
        })}
        <div
          className="absolute bottom-1 left-1 text-[9px] font-semibold text-gray-500"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'left bottom' }}
        >
          mm
        </div>
      </div>

      {/* Corner label */}
      <div
        className="absolute left-0 top-0 flex items-center justify-center bg-gray-200"
        style={{ width: rulerWidth, height: rulerHeight }}
      >
        <span className="text-[8px] font-mono text-gray-600">
          {mmPerStitch.toFixed(1)}mm
        </span>
      </div>
    </div>
  )
}
