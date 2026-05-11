/**
 * Enhanced Symbol Editor — color overrides and expanded custom symbols
 * 
 * Tasks: 049 (symbol color override), 050 (custom symbol support)
 */
import { useState, useEffect } from 'react'
import { useProjectStore, SymbolDefinition } from '../store/projectStore'
import { getDMCHex } from '../utils/dmcColors'
import {
  Circle,
  Square,
  Triangle,
  Diamond,
  Star,
  Heart,
  X,
  Dot,
  EyeOff,
  Paintbrush2,
  Type,
  MoveUp,
  MoveDown,
  Trash2,
} from 'lucide-react'

const SYMBOL_STYLES = [
  { id: 'circle' as const, label: 'Circle', icon: Circle },
  { id: 'square' as const, label: 'Square', icon: Square },
  { id: 'triangle' as const, label: 'Triangle', icon: Triangle },
  { id: 'diamond' as const, label: 'Diamond', icon: Diamond },
  { id: 'star' as const, label: 'Star', icon: Star },
  { id: 'heart' as const, label: 'Heart', icon: Heart },
  { id: 'cross' as const, label: 'Cross', icon: X },
  { id: 'dot' as const, label: 'Dot', icon: Dot },
  { id: 'none' as const, label: 'None', icon: EyeOff },
]

// Expanded character sets for custom symbols
const CHAR_SETS = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  greek: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω',
  shapes: '⬛⬜◼◻◆◇●○■□▲△▶▷◀◁⬟⬠✦✧★☆♠♣♥♦♢',
  special: '※¶†‡§¶•◦⁕⋆✶✴✹❋❖❘❙❚❯',
}

const SYMBOL_SIZE_MAP: Record<string, number> = {
  sm: 0.6,
  md: 0.8,
  lg: 1.0,
}

interface SymbolEditorProps {
  colorIndex: number
  onClose: () => void
}

export function SymbolEditor({ colorIndex, onClose }: SymbolEditorProps) {
  const {
    symbolDefinitions,
    setSymbolDefinition,
    clearSymbolDefinition,
  } = useProjectStore()

  const currentDef = symbolDefinitions.get(colorIndex)
  const hexColor = getDMCHex(colorIndex) || '#888888'

  const [char, setChar] = useState(currentDef?.character || 'A')
  const [style, setStyle] = useState<SymbolDefinition['style']>(currentDef?.style || 'circle')
  const [size, setSize] = useState<SymbolDefinition['size']>(currentDef?.size || 'md')
  const [fillOverride, setFillOverride] = useState(currentDef?.fill || '')
  const [strokeOverride, setStrokeOverride] = useState(currentDef?.stroke || '')
  const [charSet, setCharSet] = useState<'latin' | 'greek' | 'shapes' | 'special'>('latin')

  // Load existing definition on mount
  useEffect(() => {
    const def = symbolDefinitions.get(colorIndex)
    if (def) {
      setChar(def.character)
      setStyle(def.style)
      setSize(def.size)
      setFillOverride(def.fill || '')
      setStrokeOverride(def.stroke || '')
    }
  }, [colorIndex, symbolDefinitions])

  const handleAssign = () => {
    const def: SymbolDefinition = {
      character: char || 'A',
      style,
      size,
      ...(fillOverride ? { fill: fillOverride } : {}),
      ...(strokeOverride ? { stroke: strokeOverride } : {}),
    }
    setSymbolDefinition(colorIndex, def)
    onClose()
  }

  const handleClear = () => {
    clearSymbolDefinition(colorIndex)
    onClose()
  }

  const hasExistingDef = symbolDefinitions.has(colorIndex)

  // Calculate preview size relative to cell
  const previewSize = SYMBOL_SIZE_MAP[size]

  return (
    <div className="absolute top-0 right-0 mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3.5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-700">Symbol Editor</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Color preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-gray-300 shadow-sm"
          style={{ backgroundColor: hexColor }}
        />
        <div>
          <span className="text-xs text-gray-500">Color #{colorIndex}</span>
          {hasExistingDef && (
            <span className="ml-1 text-xs text-indigo-500 font-medium">✎ defined</span>
          )}
        </div>
      </div>

      {/* Character input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Symbol Character</label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={char}
            onChange={(e) => setChar(e.target.value.slice(-1))}
            maxLength={2}
            className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm font-mono text-center focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="A-Z"
          />
          {/* Character set selector */}
          <select
            value={charSet}
            onChange={(e) => setCharSet(e.target.value as typeof charSet)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            title="Character set"
          >
            <option value="latin">ABC</option>
            <option value="greek">αω</option>
            <option value="shapes">◆</option>
            <option value="special">※</option>
          </select>
        </div>
        {/* Character set quick-pick */}
        <div className="mt-1.5 flex flex-wrap gap-0.5">
          {CHAR_SETS[charSet].split('').map((c) => (
            <button
              key={c}
              onClick={() => setChar(c)}
              className={`w-5 h-5 flex items-center justify-center text-xs rounded border transition-colors ${
                char === c
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Symbol style */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Style</label>
        <div className="grid grid-cols-3 gap-1">
          {SYMBOL_STYLES.map(({ id: sId, label, icon: Icon }) => (
            <button
              key={sId}
              onClick={() => setStyle(sId)}
              className={`p-1.5 rounded-lg text-xs flex flex-col items-center gap-0.5 transition-colors ${
                style === sId
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Size</label>
        <div className="flex gap-1">
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex-1 py-1 rounded-lg text-xs transition-colors ${
                size === s
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Color overrides (Task 049) */}
      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
        <div className="flex items-center gap-1.5 mb-2">
          <Paintbrush2 className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">Color Overrides</span>
          <span className="text-[10px] text-amber-400">(optional)</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-16">Fill:</label>
            <div className="flex-1 flex items-center gap-1.5">
              <input
                type="text"
                value={fillOverride}
                onChange={(e) => setFillOverride(e.target.value)}
                placeholder="Auto"
                className="flex-1 px-2 py-1 border border-amber-200 rounded text-xs font-mono focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <input
                type="color"
                value={fillOverride || hexColor}
                onChange={(e) => setFillOverride(e.target.value)}
                className="w-7 h-7 rounded border border-amber-200 cursor-pointer"
                title="Fill color"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-16">Stroke:</label>
            <div className="flex-1 flex items-center gap-1.5">
              <input
                type="text"
                value={strokeOverride}
                onChange={(e) => setStrokeOverride(e.target.value)}
                placeholder="Auto"
                className="flex-1 px-2 py-1 border border-amber-200 rounded text-xs font-mono focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <input
                type="color"
                value={strokeOverride || '#000000'}
                onChange={(e) => setStrokeOverride(e.target.value)}
                className="w-7 h-7 rounded border border-amber-200 cursor-pointer"
                title="Stroke color"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-200">
        <span className="text-xs text-gray-400">Preview ({size}):</span>
        <div
          className="text-2xl font-bold mt-1.5"
          style={{
            color: fillOverride || hexColor,
            WebkitTextStroke: strokeOverride ? `0.5px ${strokeOverride}` : undefined,
            textShadow: 'none',
          }}
        >
          {char}
        </div>
        {style !== 'none' && (
          <div className="text-xs text-gray-400 mt-1">{style}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {hasExistingDef && (
          <button
            onClick={handleClear}
            className="flex-1 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
        <button
          onClick={handleAssign}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            hasExistingDef
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {hasExistingDef ? 'Update Symbol' : 'Assign'}
        </button>
      </div>
    </div>
  )
}

/**
 * Symbol preview icon for palette cells
 */
export function SymbolPreviewIcon({ colorIndex, size = 'sm' }: { colorIndex: number; size?: 'sm' | 'md' | 'lg' }) {
  const { symbolDefinitions } = useProjectStore()
  const def = symbolDefinitions.get(colorIndex)
  if (!def || def.style === 'none' || !def.character) return null
  
  const sizeMap = { sm: 0.6, md: 0.8, lg: 1.0 }
  const color = getDMCHex(colorIndex) || '#888888'
  
  return (
    <div
      className="flex items-center justify-center pointer-events-none"
      style={{
        fontSize: `${sizeMap[size] * 14}px`,
        color: color,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {def.character}
    </div>
  )
}

/**
 * Symbol SVG for legend and PDF rendering
 */
export function SymbolSVG({
  def,
  size = 20,
}: {
  def: SymbolDefinition
  size?: number
}) {
  const center = size / 2
  const radius = size * 0.35
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Shape */}
      {def.style === 'circle' && (
        <circle cx={center} cy={center} r={radius} fill={def.fill || 'none'} stroke={def.stroke || '#374151'} strokeWidth={1} />
      )}
      {def.style === 'square' && (
        <rect x={center - radius} y={center - radius} width={radius * 2} height={radius * 2} fill={def.fill || 'none'} stroke={def.stroke || '#374151'} strokeWidth={1} />
      )}
      {def.style === 'triangle' && (
        <polygon
          points={`${center},${center - radius} ${center - radius},${center + radius} ${center + radius},${center + radius}`}
          fill={def.fill || 'none'}
          stroke={def.stroke || '#374151'}
          strokeWidth={1}
        />
      )}
      {def.style === 'diamond' && (
        <polygon
          points={`${center},${center - radius} ${center + radius},${center} ${center},${center + radius} ${center - radius},${center}`}
          fill={def.fill || 'none'}
          stroke={def.stroke || '#374151'}
          strokeWidth={1}
        />
      )}
      {def.style === 'star' && (
        <polygon
          points={`${center},${center - radius} ${center + radius * 0.3},${center - radius * 0.3} ${center + radius},${center} ${center + radius * 0.3},${center + radius * 0.3} ${center},${center + radius} ${center - radius * 0.3},${center + radius * 0.3} ${center - radius},${center} ${center - radius * 0.3},${center - radius * 0.3}`}
          fill={def.fill || 'none'}
          stroke={def.stroke || '#374151'}
          strokeWidth={1}
        />
      )}
      {def.style === 'heart' && (
        <path
          d={`M${center},${center + radius * 0.6} C${center - radius},${center - radius * 0.2} ${center - radius * 1.5},${center + radius * 0.2} ${center - radius},${center + radius} C${center - radius * 0.5},${center + radius * 1.2} ${center},${center + radius * 0.5} ${center},${center + radius * 0.5} C${center},${center + radius * 0.5} ${center + radius * 0.5},${center + radius * 1.2} ${center + radius},${center + radius} C${center + radius * 1.5},${center + radius * 0.2} ${center + radius},${center - radius * 0.2} ${center},${center + radius * 0.6} Z`}
          fill={def.fill || 'none'}
          stroke={def.stroke || '#374151'}
          strokeWidth={1}
        />
      )}
      {def.style === 'cross' && (
        <>
          <line x1={center - radius} y1={center - radius} x2={center + radius} y2={center + radius} stroke={def.stroke || '#374151'} strokeWidth={1.5} />
          <line x1={center + radius} y1={center - radius} x2={center - radius} y2={center + radius} stroke={def.stroke || '#374151'} strokeWidth={1.5} />
        </>
      )}
      {def.style === 'dot' && (
        <circle cx={center} cy={center} r={2} fill={def.fill || '#374151'} />
      )}
      
      {/* Character on top */}
      {def.style !== 'none' && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.5}
          fontWeight="600"
          fill={def.fill || '#374151'}
        >
          {def.character}
        </text>
      )}
    </svg>
  )
}
