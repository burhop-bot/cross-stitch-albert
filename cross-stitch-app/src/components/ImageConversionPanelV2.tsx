/**
 * Advanced image-to-chart conversion panel
 * Uses K-Means++ color quantization + optional dithering
 */
import { useState, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { getDMCHex } from '../utils/dmcColors'
import {
  resizeImageToGrid,
  PixelData,
} from '../utils/imageConverter'
import { quantizeImage, ColorPoint, kMeansCluster } from '../utils/kMeans'
import { applyDithering, medianFilter, isolateNoise, reduceColors } from '../utils/dithering'
import { cropBlankBorders, getCropInfo, batchRecolor, batchRecolorMultiple, countColorsInGrid } from '../utils/patternEdit'
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  Settings,
  Eye,
  EyeOff,
  Check,
  ArrowDown,
  Scissors,
  Minus,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { LoadingSpinner } from './LoadingSpinner'

interface ImageSource {
  type: 'file' | 'url'
  value: File | string
}

export interface ConversionResult {
  grid: number[][]
  palette: { r: number; g: number; b: number }[]
  originalWidth: number
  originalHeight: number
  stitchWidth: number
  stitchHeight: number
  cropStats?: { top: number; bottom: number; left: number; right: number }
  stats: {
    totalPixels: number
    uniqueColors: number
    dominantColor: string
    colorDistribution: number[]
  }
}

interface ImageConversionPanelV2Props {
  onApply: (result: ConversionResult) => void
  onCancel: () => void
}

export function ImageConversionPanelV2({ onApply, onCancel }: ImageConversionPanelV2Props) {
  const { dmcPalette, settings } = useProjectStore()
  
  // Image source state
  const [imageSource, setImageSource] = useState<ImageSource | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)
  
  // Conversion settings
  const [stitchWidth, setStitchWidth] = useState(settings.width)
  const [stitchHeight, setStitchHeight] = useState(settings.height)
  const [aspectRatioLock, setAspectRatioLock] = useState(true)
  const [maxColors, setMaxColors] = useState(16)
  const [dithering, setDithering] = useState<'none' | 'floyd-steinberg' | 'sierra-3-2-1' | 'stucki'>('none')
  const [smoothAfter, setSmoothAfter] = useState(false)
  const [isolateNoiseAfter, setIsolateNoiseAfter] = useState(false)
  const [cropBlank, setCropBlank] = useState(false)
  
  // Batch recolor
  const [batchRecolorFrom, setBatchRecolorFrom] = useState(0)
  const [batchRecolorTo, setBatchRecolorTo] = useState(1)
  
  // Conversion state
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [progressPct, setProgressPct] = useState<number>(0)
  const [conversionDone, setConversionDone] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const dataUrl = await fileToDataUrl(file)
    setImageSource({ type: 'file', value: file })
    setImagePreview(dataUrl)

    const img = new Image()
    img.onload = () => {
      setImageDimensions({ w: img.width, h: img.height })
      setStitchWidth(settings.width)
      const aspectRatio = img.height / img.width
      setStitchHeight(Math.round(settings.width * aspectRatio))
    }
    img.src = dataUrl
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleUrlImport = async () => {
    if (!imageUrl.trim()) return
    setUrlError(null)

    const url = imageUrl.trim()
    setImageSource({ type: 'url', value: url })
    setImagePreview(url)

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image from URL'))
        img.src = url
      })
      setImageDimensions({ w: img.width, h: img.height })
      setStitchWidth(settings.width)
      const aspectRatio = img.height / img.width
      setStitchHeight(Math.round(settings.width * aspectRatio))
    } catch {
      setUrlError(
        `Could not load image from URL. This may be due to CORS restrictions. Try downloading the image and uploading it directly instead.`
      )
      setImageSource(null)
      setImagePreview(null)
    }
  }

  const handleWidthChange = (w: number) => {
    setStitchWidth(w)
    if (aspectRatioLock && imageDimensions) {
      setStitchHeight(Math.round(w * (imageDimensions.h / imageDimensions.w)))
    }
  }

  const handleHeightChange = (h: number) => {
    setStitchHeight(h)
    if (aspectRatioLock && imageDimensions) {
      setStitchWidth(Math.round(h * (imageDimensions.w / imageDimensions.h)))
    }
  }

  const convertImage = useCallback(async () => {
    if (!imagePreview) return
    setConverting(true)
    setProgress('Loading image...')
    setProgressPct(5)
    setConversionDone(false)

    try {
      // Step 1: Resize image
      setProgress('Resizing image...')
      setProgressPct(15)
      const canvas = document.createElement('canvas')
      canvas.width = stitchWidth
      canvas.height = stitchHeight
      const ctx = canvas.getContext('2d')!

      const img = await loadImage(imagePreview)
      ctx.drawImage(img, 0, 0, stitchWidth, stitchHeight)

      // Verify canvas is not tainted (CORS check)
      try {
        ctx.getImageData(0, 0, 1, 1)
      } catch {
        throw new Error(
          'CORS error: The image server blocks canvas access. Try downloading the image and uploading it directly.'
        )
      }
      ctx.drawImage(img, 0, 0, stitchWidth, stitchHeight)
      const imageData = ctx.getImageData(0, 0, stitchWidth, stitchHeight)
      const pixels = imageData.data

      // Step 2: K-Means color quantization
      setProgress(`Quantizing ${maxColors} colors with K-Means++...`)
      setProgressPct(30)
      
      // Collect non-transparent pixels
      const colorPoints: ColorPoint[] = []
      for (let y = 0; y < stitchHeight; y++) {
        for (let x = 0; x < stitchWidth; x++) {
          const idx = (y * stitchWidth + x) * 4
          const a = pixels[idx + 3]
          if (a >= 128) {
            colorPoints.push({
              r: pixels[idx],
              g: pixels[idx + 1],
              b: pixels[idx + 2],
            })
          }
        }
      }

      // Run K-Means
      const clusters = kMeansCluster(colorPoints.slice(0, 10000), maxColors, 15)
      const palette = clusters.map((c) => ({
        r: c.center[0],
        g: c.center[1],
        b: c.center[2],
      }))

      // Step 3: Map pixels to palette indices
      setProgress('Mapping pixels to palette...')
      setProgressPct(50)
      const grid: number[][] = []
      for (let y = 0; y < stitchHeight; y++) {
        const row: number[] = []
        for (let x = 0; x < stitchWidth; x++) {
          const idx = (y * stitchWidth + x) * 4
          const a = pixels[idx + 3]
          
          if (a < 128) {
            row.push(-1)
          } else {
            let minDist = Infinity
            let bestIdx = 0
            for (let ci = 0; ci < clusters.length; ci++) {
              const center = clusters[ci].center
              const dr = pixels[idx] - center[0]
              const dg = pixels[idx + 1] - center[1]
              const db = pixels[idx + 2] - center[2]
              const d = dr * dr + dg * dg + db * db
              if (d < minDist) {
                minDist = d
                bestIdx = ci
              }
            }
            row.push(bestIdx)
          }
        }
        grid.push(row)
      }

      // Step 4: Dithering
      if (dithering !== 'none') {
        setProgress(`Applying ${dithering} dithering...`)
        setProgressPct(70)
        const { grid: ditheredGrid } = applyDithering(
          grid, palette,
          { algorithm: dithering, errorDiffusion: true }
        )
        grid.length = 0
        grid.push(...ditheredGrid)
      }

      // Step 5: Post-processing
      if (smoothAfter) {
        setProgress('Smoothing with median filter...')
        setProgressPct(80)
        const filtered = medianFilter(grid, 3)
        grid.length = 0
        grid.push(...filtered)
      }

      if (isolateNoiseAfter) {
        setProgress('Removing isolated noise stitches...')
        const { grid: denoised } = isolateNoise(grid)
        grid.length = 0
        grid.push(...denoised)
      }

      // Step 6: Crop blank borders
      let cropStats: { top: number; bottom: number; left: number; right: number } | null = null
      if (cropBlank) {
        setProgress('Cropping blank borders...')
        setProgressPct(90)
        const { cropped, top, bottom, left, right } = getCropInfo(grid)
        cropStats = { top, bottom, left, right }
        grid.length = 0
        grid.push(...cropped)
        if (cropped.length > 0) {
          setStitchWidth(cropped[0].length)
          setStitchHeight(cropped.length)
        }
      }

      // Calculate stats
      const usage = new Map<number, number>()
      for (const row of grid) {
        for (const idx of row) {
          if (idx >= 0) usage.set(idx, (usage.get(idx) || 0) + 1)
        }
      }

      let dominantColor = ''
      let maxCount = 0
      for (const [idx, count] of usage) {
        if (count > maxCount) {
          maxCount = count
          const c = palette[idx]
          dominantColor = `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`
        }
      }

      const colorDistribution = Array.from(usage.values()).sort((a, b) => b - a)

      const conversionResult: ConversionResult = {
        grid,
        palette,
        originalWidth: imageDimensions?.w ?? 0,
        originalHeight: imageDimensions?.h ?? 0,
        stitchWidth,
        stitchHeight,
        cropStats: cropStats ?? undefined,
        stats: {
          totalPixels: stitchWidth * stitchHeight,
          uniqueColors: usage.size,
          dominantColor,
          colorDistribution,
        },
      }

      setResult(conversionResult)
      setShowPreview(true)
      setProgressPct(100)
      setConversionDone(true)
    } catch (error) {
      console.error('Conversion failed:', error)
      setProgress('Conversion failed. Check console.')
    } finally {
      setTimeout(() => setConverting(false), 1500)
    }
  }, [imagePreview, stitchWidth, stitchHeight, maxColors, dithering, smoothAfter, isolateNoiseAfter, imageDimensions])

  const handleApply = () => {
    if (result) {
      onApply(result)
    }
  }

  return (
    <>
      {/* Loading overlay with progress */}
      <LoadingSpinner
        visible={converting}
        message={progress}
        progress={progressPct}
        done={conversionDone}
      />
      <div className="p-4 space-y-5">
      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Advanced Image Conversion
      </h3>

      {/* URL Import */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">Or import from URL</label>
        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
              placeholder="https://example.com/pattern.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              disabled={converting}
            />
            <button
              onClick={handleUrlImport}
              disabled={converting || !imageUrl.trim() || urlError !== null}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              title="Load image from URL"
            >
              <LinkIcon size={14} />
              Load
            </button>
          </div>
        </div>
        {urlError && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-red-600">{urlError}</p>
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <label className="block text-xs font-medium text-gray-600">Or upload a file</label>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Click to upload or drag & drop</span>
            <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, GIF, WebP</span>
          </label>
        </div>
      </div>

      {/* Preview (either from file or URL) */}
      {imagePreview && (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-32 object-contain"
            />
            {imageDimensions && (
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                {imageDimensions.w}×{imageDimensions.h}
              </span>
            )}
            {imageSource?.type === 'url' && (
              <span className="absolute top-1 left-1 text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <ExternalLink size={10} /> URL
              </span>
            )}
          </div>
          {imageSource?.type === 'file' && imageSource.value instanceof File && (
            <p className="text-[10px] text-gray-500 text-center truncate">
              File: {imageSource.value.name}
            </p>
          )}
        </div>
      )}

      {/* Stitch Dimensions */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Stitch Dimensions</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Width</label>
            <input
              type="number"
              min="5"
              max="200"
              value={stitchWidth}
              onChange={(e) => handleWidthChange(parseInt(e.target.value) || 5)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Height</label>
            <input
              type="number"
              min="5"
              max="200"
              value={stitchHeight}
              onChange={(e) => handleHeightChange(parseInt(e.target.value) || 5)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={aspectRatioLock}
            onChange={(e) => setAspectRatioLock(e.target.checked)}
            className="rounded"
          />
          Lock aspect ratio
        </label>
      </div>

      {/* Conversion Options */}
      <div className="border-t border-gray-200 pt-3 space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
          <Settings className="w-3 h-3" /> Options
        </h4>

        {/* Max Colors */}
        <div>
          <label className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Colors</span>
            <span className="font-mono">{maxColors}</span>
          </label>
          <input
            type="range"
            min="2"
            max="64"
            value={maxColors}
            onChange={(e) => setMaxColors(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Dithering */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Dithering</label>
          <select
            value={dithering}
            onChange={(e) => setDithering(e.target.value as typeof dithering)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="none">None (clean blocks)</option>
            <option value="floyd-steinberg">Floyd-Steinberg (standard)</option>
            <option value="sierra-3-2-1">Sierra 3-2-1 (smooth)</option>
            <option value="stucki">Stucki (wide diffusion)</option>
          </select>
        </div>

        {/* Post-processing */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={smoothAfter}
              onChange={(e) => setSmoothAfter(e.target.checked)}
              className="rounded"
            />
            Median filter smoothing
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={isolateNoiseAfter}
              onChange={(e) => setIsolateNoiseAfter(e.target.checked)}
              className="rounded"
            />
            Remove isolated noise
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={cropBlank}
              onChange={(e) => setCropBlank(e.target.checked)}
              className="rounded"
            />
            Crop blank borders
          </label>
        </div>
      </div>

      {/* Convert Button */}
      <button
        onClick={convertImage}
        disabled={converting || !imagePreview}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {converting ? 'Converting...' : 'Convert to Cross-Stitch'}
      </button>

      {progress && (
        <p className="text-xs text-gray-500 text-center">{progress}</p>
      )}

      {/* Result Preview */}
      {showPreview && result && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          {result.cropStats && (
            <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">
                ✂️ Cropped: top={result.cropStats.top}, bottom={result.cropStats.bottom}, left={result.cropStats.left}, right={result.cropStats.right}
              </p>
            </div>
          )}
          <h4 className="text-xs font-semibold text-gray-500">Preview ({result.stitchWidth}×{result.stitchHeight})</h4>
          
          {/* Mini grid preview */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <div className="flex-1">
              <div className="grid gap-px"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(result.stitchWidth, 80)}, 1fr)`,
                }}
              >
                {result.grid.slice(0, Math.min(result.stitchWidth, 80)).map((row, y) =>
                  row.slice(0, Math.min(result.stitchWidth, 80)).map((colorIdx, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="aspect-square"
                      style={{
                        backgroundColor: colorIdx >= 0 ? rgbToHex(result.palette[colorIdx]) : 'transparent',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Batch Recolor */}
          <div className="border-t border-gray-200 pt-3">
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Batch Recolor</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">From color</label>
                <select
                  value={batchRecolorFrom}
                  onChange={(e) => setBatchRecolorFrom(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {result.palette.map((c, i) => (
                    <option key={i} value={i}>
                      #{c.r.toString(16).padStart(2, '0')}{c.g.toString(16).padStart(2, '0')}{c.b.toString(16).padStart(2, '0')} ({i})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500">To color</label>
                <select
                  value={batchRecolorTo}
                  onChange={(e) => setBatchRecolorTo(parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {result.palette.map((c, i) => (
                    <option key={i} value={i}>
                      #{c.r.toString(16).padStart(2, '0')}{c.g.toString(16).padStart(2, '0')}{c.b.toString(16).padStart(2, '0')} ({i})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => {
                // Apply batch recolor locally (would integrate with store in full app)
                const { grid: recoloredGrid, count } = batchRecolor(result.grid, batchRecolorFrom, batchRecolorTo)
                setResult({ ...result, grid: recoloredGrid })
                setProgress(`Replaced ${count} stitches`)
              }}
              className="mt-2 w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700"
            >
              Recolor All ({batchRecolorFrom} → {batchRecolorTo})
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Total pixels</div>
              <div className="font-mono font-semibold">{result.stats.totalPixels}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Unique colors</div>
              <div className="font-mono font-semibold">{result.stats.uniqueColors}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Dominant color</div>
              <div
                className="w-4 h-4 rounded border inline-block align-middle"
                style={{ backgroundColor: result.stats.dominantColor }}
              />
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Method</div>
              <div className="font-mono">{dithering === 'none' ? 'K-Means' : `K-Means + ${dithering}`}</div>
            </div>
          </div>

          {/* Apply / Cancel */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1"
            >
              <Check className="w-3 h-3" /> Apply to Pattern
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}

// Helper
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function rgbToHex(color: { r: number; g: number; b: number }): string {
  return `#${[color.r, color.g, color.b]
    .map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0'))
    .join('')}`
}
