import { useState } from 'react'
import { Settings, Image as ImageIcon, Sliders, Palette, Check } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { convertImageToPattern } from '../utils/imageConverter'
import { mapPixelGridToDMC, limitDMCColors } from '../utils/dmcMapper'
import { PixelData } from '../utils/imageConverter'

export function ImageConversionPanel() {
  const { currentImage, setGrid, addDMCColors, setDMCUsage } = useProjectStore()
  const [stitchWidth, setStitchWidth] = useState(20)
  const [maxColors, setMaxColors] = useState(16)
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversionResult, setConversionResult] = useState<{
    grid: number[][]
    dmcPalette: { number: number; name: string; hex: string }[]
    dmcUsage: Map<number, number>
    gridWidth: number
    gridHeight: number
  } | null>(null)

  if (!currentImage) return null

  const handleConvert = async () => {
    setIsProcessing(true)
    setConversionResult(null)
    try {
      const result = await convertImageToPattern(currentImage.dataUrl, stitchWidth, maxColors)
      
      const pixelGrid: PixelData[][] = []
      for (let y = 0; y < result.height; y++) {
        const row: PixelData[] = []
        for (let x = 0; x < result.width; x++) {
          const colorIdx = result.grid[y][x]
          if (colorIdx < 0 || colorIdx >= result.colors.length) {
            row.push({ r: 0, g: 0, b: 0, a: 0 })
          } else {
            row.push(result.colors[colorIdx])
          }
        }
        pixelGrid.push(row)
      }
      
      const { grid: dmcGrid, dmcPalette, dmcUsage } = mapPixelGridToDMC(pixelGrid)
      
      let finalGrid = dmcGrid
      let finalPalette = dmcPalette
      let finalUsage = dmcUsage
      
      if (dmcPalette.length > maxColors) {
        const limited = limitDMCColors(dmcGrid, dmcUsage, maxColors)
        finalGrid = limited.grid
        finalPalette = limited.dmcPalette
        finalUsage = limited.dmcUsage
      }
      
      addDMCColors(finalPalette)
      setDMCUsage(finalUsage)
      
      const gridHeight = finalGrid.length
      const gridWidth = finalGrid[0]?.length || 0

      setConversionResult({
        grid: finalGrid,
        dmcPalette: finalPalette,
        dmcUsage: finalUsage,
        gridWidth,
        gridHeight,
      })
      
      console.log('Conversion complete:', {
        dimensions: `${gridWidth}x${gridHeight}`,
        colorsUsed: finalPalette.length,
      })
      
    } catch (error) {
      console.error('Conversion failed:', error)
      alert('Failed to convert image. Check console for details.')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyConversion = () => {
    if (!conversionResult) return
    
    const { setGrid, setSelectedPanelId, setProjectSettings, setGridDimensions, panels, createDefaultPanels, settings } = useProjectStore.getState()
    
    // Set the grid
    setGrid(conversionResult.grid)
    
    // Update current grid in store
    const store = useProjectStore.getState()
    store.setGrid(conversionResult.grid)
    
    console.log(`Applied ${conversionResult.gridWidth}x${conversionResult.gridHeight} pattern`)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Image preview */}
      <div>
        <img
          src={currentImage.dataUrl}
          alt={currentImage.fileName}
          className="w-full h-32 object-contain bg-gray-100 rounded-lg border mb-2"
        />
        <p className="text-xs text-gray-500 truncate">{currentImage.fileName}</p>
        <p className="text-xs text-gray-400">{currentImage.width}×{currentImage.height}px</p>
      </div>

      {/* Stitch Width */}
      <div>
        <label className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span className="flex items-center gap-1">
            <ImageIcon size={14} /> Stitch Width
          </span>
          <span className="font-mono font-medium">{stitchWidth}px</span>
        </label>
        <p className="text-xs text-gray-400 mb-1">
          1 stitch = {stitchWidth}px in source image
        </p>
        <input
          type="range"
          min="5"
          max="80"
          value={stitchWidth}
          onChange={(e) => setStitchWidth(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Max Colors */}
      <div>
        <label className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span className="flex items-center gap-1">
            <Palette size={14} /> Max Colors
          </span>
          <span className="font-mono font-medium">{maxColors}</span>
        </label>
        <input
          type="range"
          min="2"
          max="50"
          value={maxColors}
          onChange={(e) => setMaxColors(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={isProcessing}
        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium text-sm ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sliders size={16} />
            Convert to Pattern
          </>
        )}
      </button>

      {/* Results */}
      {conversionResult && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-green-700">
            <Check size={16} />
            <span className="font-medium text-sm">Conversion Complete</span>
          </div>
          <div className="text-xs text-green-600 space-y-1">
            <p>
              <strong>Grid:</strong> {conversionResult.gridWidth} × {conversionResult.gridHeight} stitches
            </p>
            <p>
              <strong>Colors:</strong> {conversionResult.dmcPalette.length} / {maxColors}
            </p>
            {conversionResult.dmcPalette.length < maxColors && (
              <p className="text-green-500">Image naturally had fewer colors</p>
            )}
          </div>
          {/* Color swatches */}
          <div className="flex flex-wrap gap-1">
            {conversionResult.dmcPalette.map((color, idx) => (
              <div
                key={idx}
                className="w-5 h-5 rounded border border-gray-300"
                style={{ backgroundColor: color.hex }}
                title={`DMC ${color.number}: ${color.name}`}
              />
            ))}
          </div>
          {/* Apply button */}
          <button
            onClick={applyConversion}
            className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Apply to Canvas
          </button>
        </div>
      )}
    </div>
  )
}
