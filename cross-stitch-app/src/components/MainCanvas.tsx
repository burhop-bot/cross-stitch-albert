import { GridCanvas } from '../editor/GridCanvas'
import { PatternRepeatPanel } from './PatternRepeatPanel'
import { useProjectStore } from '../store/projectStore'

export function MainCanvas() {
  const selectedPanelId = useProjectStore((state) => state.selectedPanelId)
  const panels = useProjectStore((state) => state.panels)

  return (
    <main className="flex-1 bg-gray-200 overflow-hidden flex flex-col">
      {selectedPanelId !== null && panels[selectedPanelId] ? (
        <>
          {/* Panel label */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
            <span className="text-sm font-medium text-gray-700">
              {panels[selectedPanelId].name}
            </span>
            <span className="text-xs text-gray-500">
              {panels[selectedPanelId].design.length > 0
                ? `${panels[selectedPanelId].design[0]?.length || 0}×${panels[selectedPanelId].design.length} stitches`
                : 'Empty canvas'}
            </span>
          </div>
          <GridCanvas panelId={selectedPanelId} />
          <PatternRepeatPanel />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Select a panel to start designing</p>
            <p className="text-sm">Open the Settings panel to create a new canvas</p>
          </div>
        </div>
      )}
    </main>
  )
}
