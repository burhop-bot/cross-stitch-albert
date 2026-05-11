/**
 * ClearPatternDialog — confirmation dialog before clearing a pattern.
 * Prevents accidental data loss by requiring explicit confirmation.
 */
import { useState } from 'react'
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react'

interface ClearPatternDialogProps {
  onClose: () => void
  onClear: () => void
  panelName?: string
}

export function ClearPatternDialog({
  onClose,
  onClear,
  panelName = 'current panel',
}: ClearPatternDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const CONFIRM_WORD = 'CLEAR'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Clear pattern confirmation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-200 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-red-800">Clear Pattern</h2>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="mb-2">
                This will permanently clear all stitches from <strong>{panelName}</strong>.
                This action cannot be undone.
              </p>
              <p className="text-gray-500">
                The undo history will be cleared as well. Consider saving your pattern
                before proceeding.
              </p>
            </div>
          </div>

          {/* Type-to-confirm */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <label className="text-xs font-medium text-yellow-800 block mb-1">
              Type <code className="bg-yellow-100 px-1.5 py-0.5 rounded font-mono font-bold">{CONFIRM_WORD}</code> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm font-mono uppercase placeholder:text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-white"
              placeholder={CONFIRM_WORD}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && confirmText === CONFIRM_WORD) {
                  onClear()
                }
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (confirmText === CONFIRM_WORD) onClear()
            }}
            disabled={confirmText !== CONFIRM_WORD}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={14} />
            Clear Pattern
          </button>
        </div>
      </div>
    </div>
  )
}
