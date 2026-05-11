/**
 * KeyboardShortcutEditor — configurable keyboard shortcut bindings.
 * Extends the read-only KeyboardShortcutsPanel with inline editing.
 * Bindings are persisted to localStorage.
 */
import { useState, useEffect } from 'react'
import { X, Save, RotateCcw, Edit2, Check, AlertCircle } from 'lucide-react'
import {
  loadCustomShortcuts,
  saveCustomShortcuts,
  resetToDefaultShortcuts,
  formatKeyDisplay,
  validateShortcutKey,
  groupShortcuts,
  type ShortcutBinding,
} from '../utils/shortcutEditor'

interface KeyboardShortcutEditorProps {
  onClose: () => void
}

export function KeyboardShortcutEditor({ onClose }: KeyboardShortcutEditorProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [newKey, setNewKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load custom shortcuts on mount
  useEffect(() => {
    setShortcuts(loadCustomShortcuts())
  }, [])

  const handleEditStart = (key: string) => {
    setEditingKey(key)
    // Format the current key for the input (remove mod+ prefix for display)
    setNewKey(key.replace('mod+', 'Ctrl+'))
    setError(null)
  }

  const handleEditSave = (action: string) => {
    if (!validateShortcutKey(newKey.toLowerCase())) {
      setError('Invalid key combination. Try Ctrl+S, Escape, or a single letter.')
      return
    }

    // Check for conflicts
    const conflicts = shortcuts.filter((s) => s.key.toLowerCase() === newKey.toLowerCase() && s.action !== action)
    if (conflicts.length > 0) {
      setError(`Conflict: "${conflicts[0].label}" also uses this key.`)
      return
    }

    setShortcuts((prev) =>
      prev.map((s) =>
        s.action === action
          ? { ...s, key: newKey.toLowerCase(), isCustom: true }
          : s
      )
    )
    setEditingKey(null)
    setNewKey('')
    setError(null)
  }

  const handleCancel = () => {
    setEditingKey(null)
    setNewKey('')
    setError(null)
  }

  const handleReset = () => {
    if (window.confirm('Reset all shortcuts to defaults?')) {
      setShortcuts(resetToDefaultShortcuts())
      setEditingKey(null)
      setError(null)
    }
  }

  const handleSave = () => {
    saveCustomShortcuts(shortcuts)
    // Reload to refresh the global shortcuts
    window.dispatchEvent(new CustomEvent('css-shortcuts-reload', {
      detail: loadCustomShortcuts()
    }))
  }

  const hasChanges = shortcuts.some((s) => s.isCustom)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Keyboard shortcut editor">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Edit2 size={18} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 text-sm text-gray-500">
            Click a shortcut to change it. Changes are saved automatically.
            Custom shortcuts persist across sessions.
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {Object.entries(groupShortcuts(shortcuts)).map(([context, group]) => (
            <div key={context} className="mb-6 last:mb-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                {context}
              </h3>
              <div className="space-y-1">
                {group.map((s) => (
                  <div key={s.action} className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${s.isCustom ? 'bg-indigo-50' : ''}`}>
                    <span className="text-sm text-gray-700">{s.label}</span>
                    <div className="flex items-center gap-2">
                      {editingKey === s.action ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newKey}
                            onChange={(e) => {
                              setNewKey(e.target.value)
                              setError(null)
                            }}
                            className="w-28 px-2 py-1 text-xs border rounded font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="new key..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave(s.action)
                              if (e.key === 'Escape') handleCancel()
                            }}
                          />
                          <button onClick={() => handleEditSave(s.action)} className="p-1 rounded hover:bg-green-100 text-green-600" aria-label="Save">
                            <Check size={14} />
                          </button>
                          <button onClick={handleCancel} className="p-1 rounded hover:bg-gray-100 text-gray-400" aria-label="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <kbd className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200 min-w-[4em] text-right">
                            {formatKeyDisplay(s.key)}
                          </kbd>
                          <button
                            onClick={() => handleEditStart(s.action)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-500 transition-colors"
                            aria-label={`Edit shortcut for ${s.label}`}
                          >
                            <Edit2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} />
            Reset to defaults
          </button>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-amber-600 font-medium">
                {shortcuts.filter((s) => s.isCustom).length} custom shortcut(s)
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save size={14} />
              Save All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
