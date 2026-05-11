import { useState, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { StickyNote, X, Trash2, Plus, Save, Edit3, Check, AlertCircle } from 'lucide-react'

export function NotesPanel() {
  const { panels, selectedPanelId, notes, addNote, updateNote, deleteNote, setShowNotesPanel } = useProjectStore()
  const panel = panels.find((p) => p.id === selectedPanelId)
  const panelNotes = panel?.notes || []

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editColor, setEditColor] = useState('#6366f1')
  const [newNoteRow, setNewNoteRow] = useState(0)
  const [newNoteCol, setNewNoteCol] = useState(0)
  const [newNoteText, setNewNoteText] = useState('')
  const [newNoteColor, setNewNoteColor] = useState('#6366f1')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleAddNote = useCallback(() => {
    if (!newNoteText.trim() || selectedPanelId === null) return
    addNote(selectedPanelId, newNoteRow, newNoteCol, newNoteText.trim(), newNoteColor)
    setNewNoteText('')
    setNewNoteRow(0)
    setNewNoteCol(0)
  }, [newNoteText, newNoteRow, newNoteCol, newNoteColor, selectedPanelId, addNote])

  const handleEditStart = useCallback((note: typeof panelNotes[0]) => {
    setEditingId(note.id)
    setEditText(note.text)
    setEditColor(note.color || '#6366f1')
  }, [])

  const handleEditSave = useCallback(() => {
    if (!editingId || !editText.trim()) return
    updateNote(editingId, editText.trim(), editColor)
    setEditingId(null)
    setEditText('')
  }, [editingId, editText, editColor, updateNote])

  const handleEditCancel = useCallback(() => {
    setEditingId(null)
    setEditText('')
  }, [])

  const handleDelete = useCallback((noteId: string) => {
    deleteNote(noteId)
    setConfirmDeleteId(null)
    if (editingId === noteId) {
      setEditingId(null)
      setEditText('')
    }
  }, [deleteNote, editingId])

  const noteColors = [
    '#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-amber-500" />
          Notes & Annotations
        </h3>
        <button
          onClick={() => setShowNotesPanel(false)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel context */}
      {selectedPanelId !== null && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
          Panel: {panel?.name || `#${selectedPanelId}`}
        </div>
      )}

      {/* Add new note form */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 space-y-2">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add Note
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            value={newNoteRow}
            onChange={(e) => setNewNoteRow(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-xs border rounded bg-white"
            placeholder="Row"
          />
          <input
            type="number"
            min={0}
            value={newNoteCol}
            onChange={(e) => setNewNoteCol(parseInt(e.target.value) || 0)}
            className="w-16 px-2 py-1 text-xs border rounded bg-white"
            placeholder="Col"
          />
        </div>
        <textarea
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          placeholder="Note text..."
          rows={2}
          className="w-full px-2 py-1 text-xs border rounded bg-white resize-none"
        />
        <div className="flex gap-1.5 flex-wrap">
          {noteColors.map((c) => (
            <button
              key={c}
              onClick={() => setNewNoteColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-colors ${
                newNoteColor === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <button
          onClick={handleAddNote}
          disabled={!newNoteText.trim()}
          className="w-full py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <StickyNote className="w-3 h-3" /> Add Note
        </button>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            {panelNotes.length} note{panelNotes.length !== 1 ? 's' : ''}
          </span>
          {panelNotes.length > 0 && (
            <span className="text-[10px] text-gray-400">
              Row {panelNotes[0]?.row}, Col {panelNotes[0]?.col}
            </span>
          )}
        </div>

        {panelNotes.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No notes yet. Double-click a cell on the grid to add one.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {panelNotes
              .sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col)
              .map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                  style={{ borderLeftColor: note.color, borderLeftWidth: 3 }}
                >
                  {editingId === note.id ? (
                    <div className="p-2 space-y-2 bg-indigo-50">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1 text-xs border rounded bg-white resize-none"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {noteColors.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={`w-4 h-4 rounded-full border-2 transition-colors ${
                              editColor === c ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={handleEditSave}
                          disabled={!editText.trim()}
                          className="flex-1 py-1 text-[10px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="flex-1 py-1 text-[10px] font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-gray-500">
                          R{note.row} C{note.col}
                        </span>
                        <div className="flex gap-0.5">
                          {confirmDeleteId === note.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(note.id)}
                                className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                title="Confirm delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-0.5 text-gray-400 hover:bg-gray-50 rounded"
                                title="Cancel"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditStart(note)}
                                className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                                title="Edit note"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(note.id)}
                                className="p-0.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                title="Delete note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{note.text}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
