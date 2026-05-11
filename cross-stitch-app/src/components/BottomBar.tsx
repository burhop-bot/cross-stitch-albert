/**
 * BottomBar — visible on tablet and phone layouts.
 * Provides quick access to panels, tool selection, and project info.
 */
import { useState } from 'react'
import {
  Palette,
  PanelRight,
  Grid3x3,
  Info,
  ChevronDown,
} from 'lucide-react'
import { useProjectStore } from '../store/projectStore'
import { useResponsiveLayout, useResponsiveRightPanel } from '../hooks/useResponsiveLayout'

const TAB_LABELS: Record<string, string> = {
  settings: 'Settings',
  import: 'Import',
  conversion: 'Image',
  'conversion-v2': 'Convert',
  inventory: 'Stock',
  progress: 'Progress',
  instructions: 'Write',
  symbols: 'Symbols',
  notes: 'Notes',
}

export function BottomBar() {
  const { layoutMode } = useResponsiveLayout()
  const { rightPanel, toggleRightPanel } = useResponsiveRightPanel()
  const activeRightPanel = useProjectStore((s) => s.activeRightPanel)
  const setActiveRightPanel = useProjectStore((s) => s.setActiveRightPanel)
  const currentGrid = useProjectStore((s) => s.currentGrid)
  const settings = useProjectStore((s) => s.settings)

  const [showInfo, setShowInfo] = useState(false)

  const panelButtons = [
    {
      icon: Palette,
      label: 'Colors',
      active: false,
      onClick: () => {},
      disabled: true,
    },
    {
      icon: Grid3x3,
      label: 'Grid',
      active: true,
      onClick: () => {},
      disabled: true,
    },
    {
      icon: PanelRight,
      label: rightPanel ? (activeRightPanel ? (TAB_LABELS[activeRightPanel] || 'Panel') : 'Panel') : 'Panel',
      active: rightPanel,
      onClick: toggleRightPanel,
    },
    {
      icon: Info,
      label: 'Info',
      active: showInfo,
      onClick: () => setShowInfo(!showInfo),
    },
  ]

  if (layoutMode === 'desktop') return null

  // Derive stitch count from current grid
  const gridWidth = currentGrid ? currentGrid.length : 0
  const gridHeight = currentGrid && currentGrid[0] ? currentGrid[0].length : 0

  return (
    <>
      {/* Main tab bar */}
      <div className="bg-white border-t border-gray-200 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {panelButtons.map((btn) => (
            <button
              key={btn.label}
              disabled={btn.disabled}
              onClick={btn.onClick}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-lg transition-colors select-none ${
                btn.disabled
                  ? 'text-gray-300 cursor-default'
                  : btn.active
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              style={{ minWidth: '48px', minHeight: '48px', touchAction: 'manipulation' }}
              aria-label={btn.label}
              role="tab"
              aria-selected={btn.active}
            >
              <btn.icon size={22} strokeWidth={1.5} />
              <span className="text-[10px] mt-0.5 font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Expandable info panel (phone/tablet) */}
      {showInfo && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 safe-area-bottom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Project Info</span>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Close info"
            >
              <ChevronDown size={18} />
            </button>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Title:</span>
              <span className="font-medium">{settings.title || 'Untitled'}</span>
            </div>
            {gridWidth > 0 && gridHeight > 0 && (
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{gridWidth} × {gridHeight}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
