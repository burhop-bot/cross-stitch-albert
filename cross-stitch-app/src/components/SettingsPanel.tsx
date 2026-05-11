import { useProjectStore } from '../store/projectStore'
import { getDMCHex } from '../utils/dmcColors'
import { calculatePhysicalSize, stitchSizeMM } from '../utils/fabricUtils'
import { useState } from 'react'
import { GridLineConfig, LabelConfig } from '../types/gridLines'
import { Ruler } from 'lucide-react'

function getFabricCountLabel(fabric: string): string {
  const match = fabric.match(/(\d+)-count/)
  return match ? `${match[1]}-count` : '14-count'
}

export function SettingsPanel() {
  const {
    settings,
    setProjectSettings,
    setGridDimensions,
    panels,
    selectedPanelId,
    setSelectedPanelId,
    dmcPalette,
  } = useProjectStore()

  const [title, setTitle] = useState(settings.title)
  const [author, setAuthor] = useState(settings.author)
  const [fabric, setFabric] = useState(settings.fabric)
  const [width, setWidth] = useState(settings.width)
  const [height, setHeight] = useState(settings.height)
  
  // Grid line config state
  const [gridInterval, setGridInterval] = useState(settings.width >= 100 ? 10 : settings.width >= 50 ? 5 : 5)
  const [labelInterval, setLabelInterval] = useState(1)

  const fabrics = [
    '11-count Aida',
    '14-count Aida',
    '16-count Evenweave',
    '18-count Aida',
    '14-count Evenweave',
  ] as const

  const handleSave = () => {
    setProjectSettings({ title, author, fabric, width, height })
    setGridDimensions(width, height)
  }

  const handleStitchCount = () => {
    return `${width} × ${height} stitches`
  }

  return (
    <div className="p-4 space-y-5">
      {/* Project Info */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Project Info</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Pattern Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="My Pattern"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Designer (optional)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Your name"
            />
          </div>
        </div>
      </div>

      {/* Stitch Dimensions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stitch Size</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
            <input
              type="number"
              min="10"
              max="200"
              value={width}
              onChange={(e) => setWidth(Math.max(10, Math.min(200, parseInt(e.target.value) || 10)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
            <input
              type="number"
              min="10"
              max="200"
              value={height}
              onChange={(e) => setHeight(Math.max(10, Math.min(200, parseInt(e.target.value) || 10)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Total: <span className="font-mono font-medium">{handleStitchCount()}</span>
        </p>
      </div>

      {/* Fabric Type */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fabric Type</h3>
        <select
          value={fabric}
          onChange={(e) => setFabric(e.target.value as typeof fabrics[number])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
        >
          {fabrics.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Fabric-based physical dimensions */}
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Ruler className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-700">Physical Size</span>
          </div>
          {(() => {
            const dims = calculatePhysicalSize(fabric, width, height)
            const mmPerStitch = stitchSizeMM(fabric)
            return (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-blue-500 font-medium">Width:</span>{' '}
                    <span className="font-mono text-blue-700">
                      {dims.widthInches}" ({dims.widthMM}mm)
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-500 font-medium">Height:</span>{' '}
                    <span className="font-mono text-blue-700">
                      {dims.heightInches}" ({dims.heightMM}mm)
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-blue-400">
                  {mmPerStitch.toFixed(2)}mm per stitch ({getFabricCountLabel(fabric)})
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleSave}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Apply & Resize Canvas
      </button>

      <p className="text-xs text-gray-400 text-center">
        ⚠️ This will reset all panel designs
      </p>

      {/* Fabric guide */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fabric Guide</h3>
        <div className="space-y-1.5 text-xs">
          {[
            { name: '11-count Aida', mm: 2.3, desc: 'Large, easy counting' },
            { name: '14-count Aida', mm: 1.8, desc: 'Standard, most popular' },
            { name: '18-count Aida', mm: 1.4, desc: 'Fine detail work' },
            { name: '14-count Evenweave', mm: 1.8, desc: 'Smooth surface' },
            { name: '28-count Linen', mm: 0.9, desc: 'Very fine' },
          ].map((row) => (
            <div key={row.name} className="flex items-center justify-between px-2 py-1.5 bg-gray-50 rounded">
              <div>
                <span className="text-gray-700 font-medium">{row.name}</span>
                <span className="text-gray-400 ml-2">{row.desc}</span>
              </div>
              <span className="text-gray-500 font-mono text-xs">{row.mm}mm/stitch</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick sizes */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Sizes</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Small (20×20)', w: 20, h: 20 },
            { label: 'Medium (40×40)', w: 40, h: 40 },
            { label: 'Large (60×60)', w: 60, h: 60 },
            { label: 'A5 (70×100)', w: 70, h: 100 },
            { label: 'A4 (80×120)', w: 80, h: 120 },
            { label: 'Cross (80×80)', w: 80, h: 80 },
          ].map((size) => (
            <button
              key={size.label}
              onClick={() => {
                setWidth(size.w)
                setHeight(size.h)
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600 transition-colors"
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Lines Configuration */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Grid Lines</h3>
        
        {/* Medium lines */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Heavy lines every</label>
          <select
            value={gridInterval}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              setGridInterval(val)
              useProjectStore.getState().setGridLineConfig({
                mediumInterval: val,
                heavyInterval: val * 2,
                mediumLineColor: val === 5 ? '#9ca3af' : '#6b7280',
                heavyLineColor: val === 5 ? '#4b5563' : '#374151',
              })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value={5}>Every 5 stitches</option>
            <option value={10}>Every 10 stitches</option>
            <option value={15}>Every 15 stitches</option>
            <option value={20}>Every 20 stitches</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Heavy lines every {gridInterval * 2} stitches, medium every {gridInterval}
          </p>
        </div>
        
        {/* Label interval */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Label every</label>
          <select
            value={labelInterval}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              setLabelInterval(val)
              useProjectStore.getState().setLabelConfig({ interval: val })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value={1}>Every stitch</option>
            <option value={5}>Every 5 stitches</option>
            <option value={10}>Every 10 stitches</option>
          </select>
        </div>
        
        {/* Visual preview */}
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Visual preview:</p>
          <div className="flex items-center gap-1">
            <div className="flex gap-px">
              {Array.from({ length: gridInterval * 2 }, (_, i) => (
                <div
                  key={i}
                  className="w-4 h-4"
                  style={{
                    borderRight: (i + 1) % (gridInterval * 2) === 0 ? `3px solid #4b5563` :
                                 (i + 1) % gridInterval === 0 ? `2px solid #9ca3af` :
                                 `0.5px solid #e5e7eb`,
                    borderBottom: '1px solid #f3f4f6',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {gridInterval * 2} cells shown
          </div>
        </div>
      </div>

      {/* Palette info */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color Palette</h3>
        <div className="flex flex-wrap gap-1">
          {dmcPalette.slice(0, 50).map((num) => {
            const hex = getDMCHex(num)
            return (
              <div
                key={num}
                className="w-5 h-5 rounded border border-gray-300"
                style={{ backgroundColor: hex }}
                title={`DMC ${num}`}
              />
            )
          })}
          {dmcPalette.length > 50 && (
            <span className="text-xs text-gray-400 self-center">+{dmcPalette.length - 50}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {dmcPalette.length} colors in palette
        </p>
      </div>

      {/* Panels */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Panels</h3>
        <div className="space-y-1">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => {
                const { setSelectedPanelId } = useProjectStore.getState()
                setSelectedPanelId(panel.id)
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                selectedPanelId === panel.id
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{panel.name}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {panel.design.length > 0 ? `${panel.design.length}×${panel.design[0]?.length || 0}` : 'Empty'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

