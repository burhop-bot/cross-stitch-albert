import { useProjectStore } from '../store/projectStore'

interface GridSnapToggleProps {
  className?: string
}

/**
 * Toggle for grid snap — when enabled, mouse clicks and tool actions
 * snap to grid cell centers instead of free positions.
 */
export function GridSnapToggle({ className = '' }: GridSnapToggleProps) {
  const enabled = useProjectStore((s) => s.gridSnapEnabled)
  const setEnabled = useProjectStore((s) => s.setGridSnapEnabled)

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition ${
        enabled
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } ${className}`}
      title={enabled ? 'Grid snap: ON' : 'Grid snap: OFF'}
      aria-label="Toggle grid snap"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z" />
      </svg>
      <span>Snap</span>
    </button>
  )
}
