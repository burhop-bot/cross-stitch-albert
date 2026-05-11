/**
 * ResponsiveLayout — wraps the app layout for responsive breakpoints.
 *
 * Desktop (≥1024px):    Sidebar | MainCanvas | RightPanel
 * Tablet  (768-1023):   Collapsed Sidebar | MainCanvas | BottomBar
 * Phone   (<768px):     MainCanvas | BottomBar (panels via bottom bar)
 */
import { MainCanvas } from './MainCanvas'
import { RightPanel } from './RightPanel'
import { BottomBar } from './BottomBar'
import { Sidebar } from './Sidebar'
import { useResponsiveLayout } from '../hooks/useResponsiveLayout'
import { useProjectStore } from '../store/projectStore'

export function ResponsiveLayout() {
  const { layoutMode, panelVisibility } = useResponsiveLayout()
  const activeRightPanel = useProjectStore((s) => s.activeRightPanel)
  const showInventory = useProjectStore((s) => s.showInventory)

  const handleCloseRightPanel = () => {
    useProjectStore.getState().setActiveRightPanel(null)
  }

  return (
    <>
      <div className={`flex-1 flex overflow-hidden ${
        layoutMode === 'phone' ? 'flex-col' : 'flex-row'
      }`}>
        {/* Sidebar — hidden on phone, collapsed on tablet */}
        {panelVisibility.sidebar && (
          <div
            className={`${
              layoutMode === 'tablet'
                ? 'w-12 flex-shrink-0 bg-white border-r border-gray-200' // collapsed icon bar
                : 'w-64 flex-shrink-0 bg-white border-r border-gray-200' // full sidebar
            } flex flex-col overflow-hidden transition-all duration-200`}
            role="complementary"
            aria-label="Color and tool sidebar"
            aria-hidden={!panelVisibility.sidebar}
          >
            <Sidebar
              collapsed={layoutMode === 'tablet'}
            />
          </div>
        )}

        {/* Main canvas area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MainCanvas />
        </div>

        {/* Right panel — desktop/tablet sidebar (sibling to main canvas) */}
        {activeRightPanel && layoutMode !== 'phone' && (
          <RightPanel
            activeTab={activeRightPanel}
            onClose={handleCloseRightPanel}
          />
        )}

        {/* Right panel overlay for phone */}
        {layoutMode === 'phone' && activeRightPanel && (
          <div className="absolute inset-x-0 bottom-0 z-40">
            <div className="bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[70vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {activeRightPanel === 'settings' ? 'Settings' :
                   activeRightPanel === 'inventory' ? 'Inventory' :
                   activeRightPanel === 'progress' ? 'Progress' :
                   activeRightPanel === 'instructions' ? 'Instructions' :
                   activeRightPanel === 'symbols' ? 'Symbols' :
                   activeRightPanel === 'notes' ? 'Notes' :
                   activeRightPanel === 'conversion-v2' ? 'Convert' :
                   activeRightPanel === 'conversion' ? 'Image' :
                   activeRightPanel === 'import' ? 'Import' :
                   activeRightPanel}
                </span>
                <button
                  onClick={handleCloseRightPanel}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                  aria-label="Close panel"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <RightPanel
                  activeTab={activeRightPanel}
                  onClose={handleCloseRightPanel}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — shown on tablet and phone */}
      <BottomBar />
    </>
  )
}
