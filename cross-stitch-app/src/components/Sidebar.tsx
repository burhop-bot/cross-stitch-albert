import { useProjectStore } from '../store/projectStore'
import { getDMCHex, getDMCName } from '../utils/dmcColors'
import { FLOSS_BRANDS, getCrossReferences } from '../utils/flossBrands'
import { Palette, Pencil, Eraser, PaintBucket, Grid3X3, Eye, EyeOff, PencilOff, Target, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { ManualStitchCounter } from './ManualStitchCounter'

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  if (collapsed) return <SidebarCollapsed />
  return <SidebarFull />
}

// ─── Full Sidebar ───────────────────────────────────────────────────
function SidebarFull() {
  const {
    selectedPanelId,
    selectedColor,
    setSelectedColor,
    tools,
    setTool,
    zoom,
    setZoom,
    showSymbols,
    setShowSymbols,
    gridLineConfig,
    setGridLineConfig,
    showAlternatingColors,
    setShowAlternatingColors,
    dmcPalette,
    backstitchConfig,
    setBackstitchConfig,
    getProgressPercent,
    flossBrand,
    setFlossBrand,
    swapColors,
  } = useProjectStore()

  const [showBrandSelector, setShowBrandSelector] = useState(false)
  const [showBsColor, setShowBsColor] = useState(true)
  const [swapMode, setSwapMode] = useState(false)
  const [swapFrom, setSwapFrom] = useState<number | null>(null)
  const panelProgress = selectedPanelId !== null ? getProgressPercent(selectedPanelId) : 0
  const currentBrand = FLOSS_BRANDS[flossBrand as keyof typeof FLOSS_BRANDS] || FLOSS_BRANDS.dmc

  const brandColors = dmcPalette.map((num) => {
    const dmcNum = num.toString()
    const refs = getCrossReferences(dmcNum)
    let color = refs?.dmc
    let altNumber = ''
    if (flossBrand === 'anchor' && refs?.anchor) {
      color = refs.anchor
      altNumber = `DMC ${dmcNum}`
    } else if (flossBrand === 'madeira' && refs?.madeira) {
      color = refs.madeira
      altNumber = `DMC ${dmcNum}`
    }
    return { number: color?.number || dmcNum, name: color?.name || getDMCName(num), hex: color?.hex || getDMCHex(num), altNumber }
  })

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 ${
            tools.pencil ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500'
          }`}
          onClick={() => setTool('pencil', true)}
        >
          <Pencil className="w-3 h-3" /> Tools
        </button>
        <button
          className={`flex-1 py-2 text-xs font-semibold ${
            !tools.pencil ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500'
          }`}
          onClick={() => {}}
        >
          <Palette className="w-3 h-3" /> Colors
        </button>
      </div>

      {/* Progress indicator */}
      {panelProgress > 0 && (
        <div className="px-3 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-green-600" />
            <span className="text-xs text-gray-600">Panel progress</span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden ml-1">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${panelProgress}%` }} />
            </div>
            <span className="text-xs text-gray-500 font-mono">{panelProgress}%</span>
          </div>
        </div>
      )}

      {/* Backstitch tool */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Backstitch</h3>
          <button onClick={() => setShowBsColor(!showBsColor)} className="text-gray-400 hover:text-gray-600">
            {showBsColor ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
        <button
          onClick={() => setBackstitchConfig({ ...backstitchConfig, enabled: !backstitchConfig.enabled })}
          className={`w-full p-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-all ${
            backstitchConfig.enabled
              ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title="Click to set start point, click again for end point"
        >
          <PencilOff className="w-4 h-4" />
          <span>{backstitchConfig.enabled ? 'Backstitching...' : 'Backstitch Tool'}</span>
        </button>
        {backstitchConfig.enabled && showBsColor && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500">Color:</label>
              <input type="color" value={backstitchConfig.color} onChange={(e) => setBackstitchConfig({ ...backstitchConfig, color: e.target.value })} className="w-6 h-6 rounded border border-gray-300 cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-gray-500">Width:</label>
              <select value={backstitchConfig.lineWidth} onChange={(e) => setBackstitchConfig({ ...backstitchConfig, lineWidth: parseFloat(e.target.value) })} className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs">
                <option value={1}>1× (thin)</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2× (normal)</option>
                <option value={3}>3× (thick)</option>
              </select>
            </div>
            <p className="text-[10px] text-amber-600">Click grid to set start, click again to finish line</p>
          </div>
        )}
      </div>

      {/* Tools Section */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Drawing Tools</h3>
        <div className="flex gap-1">
          {[
            { tool: 'pencil' as const, icon: Pencil, label: 'Pencil' },
            { tool: 'eraser' as const, icon: Eraser, label: 'Eraser' },
            { tool: 'fill' as const, icon: PaintBucket, label: 'Fill' },
          ].map(({ tool, icon: Icon, label }) => (
            <button
              key={tool}
              onClick={() => setTool(tool, true)}
              className={`p-2 rounded-lg transition-all flex-1 ${
                tools[tool] ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={label}
            >
              <Icon className="w-5 h-5 mx-auto" />
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowSymbols(!showSymbols)}
            className={`flex-1 p-2 rounded-lg text-xs flex items-center justify-center gap-1 ${
              showSymbols ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title="Toggle symbol view"
          >
            {showSymbols ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Symbols</span>
          </button>
          <button
            onClick={() => setGridLineConfig({ showLines: !gridLineConfig.showLines })}
            className={`p-2 rounded-lg text-xs flex items-center justify-center gap-1 ${
              gridLineConfig.showLines ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title="Toggle grid lines"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Stitch Counter */}
      <div className="border-b border-gray-200">
        <ManualStitchCounter />
      </div>

      {/* Zoom */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Zoom</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(zoom - 0.25)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">−</button>
          <span className="flex-1 text-center text-sm font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.25)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm">+</button>
          <button onClick={() => setZoom(1)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">Fit</button>
        </div>
      </div>

      {/* Alternating colors toggle */}
      <div className="p-3 border-b border-gray-200">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showAlternatingColors} onChange={(e) => setShowAlternatingColors(e.target.checked)} className="rounded" />
          Alternating cells (counting aid)
        </label>
      </div>

      {/* Color Swap / Batch Recolor */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Edit Colors</h3>
          <button
            onClick={() => { setSwapMode(true); setSwapFrom(null) }}
            className={`p-1.5 rounded transition-all ${
              swapMode ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
            }`}
            title="Swap two colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        {swapMode && (
          <div className="space-y-2">
            {swapFrom !== null ? (
              <div className="text-xs">
                <p className="text-gray-600 mb-1">Click a second color to swap with <span className="font-mono font-bold">{swapFrom}</span></p>
                <button onClick={() => { setSwapMode(false); setSwapFrom(null) }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Click a color to select it, then click another to swap</p>
            )}
          </div>
        )}
      </div>

      {/* Color Palette */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Colors</h3>
            <button onClick={() => setShowBrandSelector(!showBrandSelector)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium" aria-label={`Select ${currentBrand.name} brand`}>
              {currentBrand.name}
            </button>
          </div>
          {showBrandSelector && (
            <div className="mt-2 space-y-1">
              {(Object.keys(FLOSS_BRANDS) as string[]).map((brandId) => (
                <button
                  key={brandId}
                  onClick={() => { setFlossBrand(brandId as any); setShowBrandSelector(false) }}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                    flossBrand === brandId ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {FLOSS_BRANDS[brandId as keyof typeof FLOSS_BRANDS].name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {brandColors.map(({ number, name, hex, altNumber }, index) => {
              if (!hex || hex === '#000000') return null
              const colorNum = parseInt(number)
              const isSelected = selectedColor === colorNum
              const isSwapFrom = swapFrom === index
              const handleColorClick = () => {
                if (swapMode) {
                  if (swapFrom === null) {
                    setSwapFrom(index)
                    setSelectedColor(colorNum)
                  } else if (swapFrom !== index) {
                    swapColors(swapFrom, index)
                    setSelectedColor(colorNum)
                    setSwapMode(false)
                    setSwapFrom(null)
                  } else {
                    setSwapMode(false)
                    setSwapFrom(null)
                  }
                } else {
                  setSelectedColor(colorNum)
                }
              }
              return (
                <button
                  key={number}
                  onClick={handleColorClick}
                  className={`aspect-square rounded-lg border-2 transition-all relative group ${
                    isSwapFrom
                      ? 'border-amber-500 ring-2 ring-amber-300 scale-110 z-10'
                      : isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110 z-10'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={altNumber ? `${altNumber} → ${number}` : `${currentBrand.name} ${number}: ${name}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold pointer-events-none"
                    style={{ color: isLightColor(hex) ? '#333' : '#fff' }}
                  >
                    {number}
                  </span>
                </button>
              )
            })}
          </div>
          {selectedColor > 0 && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: getDMCHex(selectedColor) }} />
                <div>
                  <div className="font-semibold">{currentBrand.name} {selectedColor}</div>
                  <div className="text-gray-500">{getDMCName(selectedColor)}</div>
                  {flossBrand !== 'dmc' && <div className="text-gray-400">Cross-ref: DMC {selectedColor}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ─── Collapsed Sidebar (tablet icon strip) ──────────────────────────
function SidebarCollapsed() {
  const {
    selectedColor,
    setSelectedColor,
    tools,
    setTool,
    zoom,
    setZoom,
    showSymbols,
    setShowSymbols,
    gridLineConfig,
    setGridLineConfig,
    showAlternatingColors,
    setShowAlternatingColors,
    dmcPalette,
    backstitchConfig,
    setBackstitchConfig,
    flossBrand,
    setFlossBrand,
  } = useProjectStore()

  const [showBrandSelector, setShowBrandSelector] = useState(false)
  const currentBrand = FLOSS_BRANDS[flossBrand as keyof typeof FLOSS_BRANDS] || FLOSS_BRANDS.dmc

  return (
    <aside className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-2 shrink-0 overflow-y-auto" role="navigation" aria-label="Collapsed tool sidebar">
      {/* Backstitch toggle */}
      <button
        onClick={() => setBackstitchConfig({ ...backstitchConfig, enabled: !backstitchConfig.enabled })}
        className={`p-1.5 rounded mb-1 ${backstitchConfig.enabled ? 'bg-amber-100 text-amber-700' : 'text-gray-500 hover:bg-gray-100'}`}
        title="Backstitch Tool"
        aria-label="Toggle backstitch tool"
      >
        <PencilOff className="w-4 h-4" />
      </button>

      {/* Drawing tools */}
      {[
        { tool: 'pencil' as const, icon: Pencil, label: 'Pencil' },
        { tool: 'eraser' as const, icon: Eraser, label: 'Eraser' },
        { tool: 'fill' as const, icon: PaintBucket, label: 'Fill' },
        { tool: 'semicross' as const, icon: Grid3X3, label: 'Semi-cross' },
      ].map(({ tool, icon: Icon, label }) => (
        <button
          key={tool}
          onClick={() => setTool(tool, true)}
          className={`p-1.5 rounded mb-1 ${tools[tool] ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          title={label}
          aria-label={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-6 h-px bg-gray-200 my-1" />

      {/* Toggles */}
      <button
        onClick={() => setShowSymbols(!showSymbols)}
        className={`p-1.5 rounded mb-1 ${showSymbols ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
        title="Toggle symbols"
        aria-label="Toggle symbol view"
      >
        {showSymbols ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      <button
        onClick={() => setGridLineConfig({ showLines: !gridLineConfig.showLines })}
        className={`p-1.5 rounded mb-1 ${gridLineConfig.showLines ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
        title="Toggle grid"
        aria-label="Toggle grid lines"
      >
        <Grid3X3 className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-gray-200 my-1" />

      {/* Alternating cells */}
      <button
        onClick={() => setShowAlternatingColors(!showAlternatingColors)}
        className={`p-1.5 rounded mb-1 ${showAlternatingColors ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
        title="Alternating cells"
        aria-label="Toggle alternating cell shading"
      >
        <Palette className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-gray-200 my-1" />

      {/* Zoom */}
      <div className="flex flex-col items-center mb-1">
        <button onClick={() => setZoom(zoom - 0.25)} className="text-gray-500 hover:text-gray-700 text-xs p-0.5">−</button>
        <span className="text-[8px] text-gray-400">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(zoom + 0.25)} className="text-gray-500 hover:text-gray-700 text-xs p-0.5">+</button>
      </div>

      <div className="w-6 h-px bg-gray-200 my-1" />

      {/* Brand selector */}
      <div className="relative">
        <button
          onClick={() => setShowBrandSelector(!showBrandSelector)}
          className="p-1.5 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 w-full text-center"
          title={currentBrand.name}
          aria-label="Select floss brand"
        >
          {currentBrand.name.substring(0, 2).toUpperCase()}
        </button>
        {showBrandSelector && (
          <div className="absolute left-0 top-7 z-50 bg-white border border-gray-200 rounded shadow-lg min-w-[100px]">
            {(Object.keys(FLOSS_BRANDS) as string[]).map((brandId) => (
              <button
                key={brandId}
                onClick={() => { setFlossBrand(brandId as any); setShowBrandSelector(false) }}
                className={`w-full text-left px-2 py-1 text-xs ${flossBrand === brandId ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
              >
                {FLOSS_BRANDS[brandId as keyof typeof FLOSS_BRANDS].name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick color strip — show top 6 colors */}
      <div className="flex flex-col items-center mt-2">
        {dmcPalette.slice(0, 6).map((num) => {
          const hex = getDMCHex(num)
          const numStr = num.toString()
          const refs = getCrossReferences(numStr)
          let colorHex = hex
          if (flossBrand === 'anchor' && refs?.anchor) colorHex = refs.anchor.hex
          else if (flossBrand === 'madeira' && refs?.madeira) colorHex = refs.madeira.hex
          const isSelected = selectedColor === num
          return (
            <button
              key={num}
              onClick={() => setSelectedColor(num)}
              className={`w-6 h-6 rounded border mb-0.5 ${isSelected ? 'ring-2 ring-indigo-400 ring-offset-1' : 'border-gray-300'}`}
              style={{ backgroundColor: colorHex }}
              title={`${numStr}`}
              aria-label={`Color ${numStr}`}
            />
          )
        })}
      </div>
    </aside>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
