/**
 * Keyboard shortcut system for the cross-stitch editor.
 * Uses a stack-based shortcut manager (like vimium) so nested contexts
 * can push/pop their own shortcut sets.
 */
import { useEffect, useRef, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'

export interface Shortcut {
  /** Key combo: e.g. 'mod+s', 'Escape', '1', 'Space' */
  key: string
  /** Description for UI (e.g. "Save") */
  label: string
  /** Handler function */
  action: () => void
  /** Only active when this context is on top of the stack */
  context: string
}

// Default shortcut definitions
const DEFAULT_SHORTCUTS: Shortcut[] = [
  { key: 'mod+z', label: 'Undo', action: () => {}, context: 'default' },
  { key: 'mod+shift+z', label: 'Redo (not yet implemented)', action: () => {}, context: 'default' },
  { key: 'mod+s', label: 'Save', action: () => {
    useProjectStore.getState().triggerAutoSave()
  }, context: 'default' },
  { key: 'Escape', label: 'Cancel tool', action: () => useProjectStore.getState().setTool('pencil', true), context: 'default' },
  { key: '1', label: 'Pencil', action: () => useProjectStore.getState().setTool('pencil', true), context: 'default' },
  { key: '2', label: 'Eraser', action: () => useProjectStore.getState().setTool('eraser', true), context: 'default' },
  { key: '3', label: 'Fill', action: () => useProjectStore.getState().setTool('fill', true), context: 'default' },
  { key: '4', label: 'Line', action: () => useProjectStore.getState().setTool('line', true), context: 'default' },
  { key: '5', label: 'Rectangle', action: () => useProjectStore.getState().setTool('rectangle', true), context: 'default' },
  { key: '6', label: 'Circle', action: () => useProjectStore.getState().setTool('circle', true), context: 'default' },
  { key: '7', label: 'Brush', action: () => useProjectStore.getState().setTool('brush', true), context: 'default' },
  { key: '8', label: 'Dropper', action: () => useProjectStore.getState().setTool('dropper', true), context: 'default' },
  { key: '9', label: 'Backstitch', action: () => useProjectStore.getState().setBackstitchConfig({ ...useProjectStore.getState().backstitchConfig, enabled: true }), context: 'default' },
  { key: 'ArrowLeft', label: 'Pan left', action: () => {}, context: 'default' },
  { key: 'ArrowRight', label: 'Pan right', action: () => {}, context: 'default' },
  { key: 'ArrowUp', label: 'Pan up', action: () => {}, context: 'default' },
  { key: 'ArrowDown', label: 'Pan down', action: () => {}, context: 'default' },
  { key: '-', label: 'Zoom out', action: () => useProjectStore.getState().setZoom(Math.max(0.1, useProjectStore.getState().zoom - 0.25)), context: 'default' },
  { key: '=', label: 'Zoom in', action: () => useProjectStore.getState().setZoom(useProjectStore.getState().zoom + 0.25), context: 'default' },
  { key: '0', label: 'Zoom fit', action: () => useProjectStore.getState().setZoom(1), context: 'default' },
  { key: 'Shift+Click', label: 'Toggle completed', action: () => {}, context: 'canvas' },
]

const KEY_MAP: Record<string, string> = {
  'Control': 'mod',
  'Meta': 'mod',
  ' ': 'Space',
}

function normalizeKey(e: KeyboardEvent): string {
  let parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.shiftKey) parts.push('shift')
  let key = e.key
  if (KEY_MAP[key]) key = KEY_MAP[key]
  parts.push(key.toLowerCase())
  return parts.join('+')
}

// ─── Hook ───────────────────────────────────────────────────────────

/**
 * Register keyboard shortcuts.
 * Call from any component to register shortcuts for its context.
 * Pass `context="default"` for always-active shortcuts.
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const combo = normalizeKey(e)
      const matches = shortcutsRef.current.filter(
        (s) => s.key === combo && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)
      )

      if (matches.length > 0) {
        e.preventDefault()
        e.stopPropagation()
        matches.forEach((s) => s.action())
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [])
}

// Global shortcuts (always active)
export function useGlobalShortcuts() {
  const store = useProjectStore()
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle shortcuts when the user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }

      const combo = normalizeKey(e)

      // Undo / Redo (Phase 22)
      if (combo === 'mod+z' && !e.shiftKey) {
        e.preventDefault()
        useProjectStore.getState().undo()
      } else if ((combo === 'mod+shift+z' || combo === 'mod+y') && e.shiftKey) {
        e.preventDefault()
        useProjectStore.getState().redo()
      } else if (combo === 'mod+y' && !e.shiftKey) {
        e.preventDefault()
        useProjectStore.getState().redo()
      }
      // Save
      else if (combo === 'mod+s') {
        e.preventDefault()
        useProjectStore.getState().triggerAutoSave()
      }
      // Quick tool selection
      else if (combo === '1') {
        useProjectStore.getState().setTool('pencil', true)
      } else if (combo === '2') {
        useProjectStore.getState().setTool('eraser', true)
      } else if (combo === '3') {
        useProjectStore.getState().setTool('fill', true)
      } else if (combo === '4') {
        useProjectStore.getState().setTool('line', true)
      } else if (combo === '5') {
        useProjectStore.getState().setTool('rectangle', true)
      } else if (combo === '6') {
        useProjectStore.getState().setTool('circle', true)
      } else if (combo === '7') {
        useProjectStore.getState().setTool('brush', true)
      } else if (combo === '8') {
        useProjectStore.getState().setTool('dropper', true)
      } else if (combo === '9') {
        const bs = useProjectStore.getState().backstitchConfig
        useProjectStore.getState().setBackstitchConfig({ ...bs, enabled: true })
      }
      // Zoom
      else if (combo === '=') {
        e.preventDefault()
        useProjectStore.getState().setZoom(storeRef.current.zoom + 0.25)
      } else if (combo === '-') {
        e.preventDefault()
        useProjectStore.getState().setZoom(Math.max(0.1, storeRef.current.zoom - 0.25))
      } else if (combo === '0') {
        e.preventDefault()
        useProjectStore.getState().setZoom(1)
      }
      // Escape cancels tools
      else if (combo === 'escape') {
        useProjectStore.getState().setTool('pencil', true)
      }
          // Arrow keys — placeholder for future pan integration
      // Pan is currently handled via mouse drag on canvas
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [])
}

/**
 * Utility: format shortcut display string.
 * Converts 'mod+s' → '⌘S' for display.
 */
export function formatShortcut(key: string): string {
  return key
    .replace(/mod\+/g, '⌘')
    .replace(/\+/g, ' ')
    .replace(/shift/g, '⇧')
    .replace(/space/gi, '⎵')
}

/**
 * Utility: get all shortcuts grouped by context.
 */
export function getShortcutGroups(shortcuts: Shortcut[] = DEFAULT_SHORTCUTS): Record<string, Shortcut[]> {
  const groups: Record<string, Shortcut[]> = {}
  for (const s of shortcuts) {
    if (!groups[s.context]) groups[s.context] = []
    groups[s.context].push(s)
  }
  return groups
}
