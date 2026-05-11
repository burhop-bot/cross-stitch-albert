/**
 * KeyboardShortcutsPanel — displays available keyboard shortcuts.
 * Accessible from Settings or via "?" shortcut.
 */
import { X } from 'lucide-react'
import { formatShortcut, type Shortcut } from '../utils/keyboardShortcuts'

interface KeyboardShortcutsPanelProps {
  onClose: () => void
  onEdit?: () => void
}

const SHORTCUTS: Shortcut[] = [
  { key: 'mod+z', label: 'Undo', action: () => {}, context: 'shortcuts' },
  { key: 'mod+shift+z', label: 'Redo', action: () => {}, context: 'shortcuts' },
  { key: 'mod+s', label: 'Save / auto-save', action: () => {}, context: 'shortcuts' },
  { key: 'Escape', label: 'Cancel current tool', action: () => {}, context: 'shortcuts' },
  { key: '1', label: 'Pencil tool', action: () => {}, context: 'shortcuts' },
  { key: '2', label: 'Eraser tool', action: () => {}, context: 'shortcuts' },
  { key: '3', label: 'Fill tool', action: () => {}, context: 'shortcuts' },
  { key: '4', label: 'Line tool', action: () => {}, context: 'shortcuts' },
  { key: '5', label: 'Rectangle tool', action: () => {}, context: 'shortcuts' },
  { key: '6', label: 'Circle tool', action: () => {}, context: 'shortcuts' },
  { key: '7', label: 'Brush tool', action: () => {}, context: 'shortcuts' },
  { key: '8', label: 'Dropper / eyedropper', action: () => {}, context: 'shortcuts' },
  { key: '9', label: 'Backstitch tool', action: () => {}, context: 'shortcuts' },
  { key: '+', label: 'Zoom in', action: () => {}, context: 'shortcuts' },
  { key: '-', label: 'Zoom out', action: () => {}, context: 'shortcuts' },
  { key: '0', label: 'Zoom to fit (100%)', action: () => {}, context: 'shortcuts' },
  { key: 'Shift+Click', label: 'Mark stitch as completed', action: () => {}, context: 'shortcuts' },
]

export function KeyboardShortcutsPanel({ onClose, onEdit }: KeyboardShortcutsPanelProps) {
  // Group shortcuts by context
  const grouped: Record<string, Shortcut[]> = {}
  for (const s of SHORTCUTS) {
    if (!grouped[s.context]) grouped[s.context] = []
    grouped[s.context].push(s)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close shortcuts help"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {Object.entries(grouped).map(([context, shortcuts]) => (
            <div key={context} className="mb-5 last:mb-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {context === 'shortcuts' ? 'General' : context}
              </h3>
              <div className="space-y-1.5">
                {shortcuts.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700">{s.label}</span>
                    <kbd className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                      {formatShortcut(s.key)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>Press <kbd className="font-mono px-1 bg-gray-200 rounded">?</kbd> to show again</span>
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                ✏️ Customize shortcuts
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
