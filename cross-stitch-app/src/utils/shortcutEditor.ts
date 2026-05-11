/**
 * Keyboard shortcut editor — configurable bindings persisted in localStorage.
 * Extends the default shortcuts with user-customizable keybindings.
 */

export interface ShortcutBinding {
  key: string
  label: string
  action: string
  context: string
  isCustom?: boolean
}

export const CUSTOM_SHORTCUTS_KEY = 'css-shortcut-bindings'

export const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { key: 'mod+z', label: 'Undo', action: 'undo', context: 'default' },
  { key: 'mod+shift+z', label: 'Redo', action: 'redo', context: 'default' },
  { key: 'mod+s', label: 'Save / auto-save', action: 'save', context: 'default' },
  { key: 'Escape', label: 'Cancel current tool', action: 'cancel', context: 'default' },
  { key: '1', label: 'Pencil tool', action: 'tool-pencil', context: 'default' },
  { key: '2', label: 'Eraser tool', action: 'tool-eraser', context: 'default' },
  { key: '3', label: 'Fill tool', action: 'tool-fill', context: 'default' },
  { key: '4', label: 'Line tool', action: 'tool-line', context: 'default' },
  { key: '5', label: 'Rectangle tool', action: 'tool-rectangle', context: 'default' },
  { key: '6', label: 'Circle tool', action: 'tool-circle', context: 'default' },
  { key: '7', label: 'Brush tool', action: 'tool-brush', context: 'default' },
  { key: '8', label: 'Dropper / eyedropper', action: 'tool-dropper', context: 'default' },
  { key: '9', label: 'Backstitch tool', action: 'tool-backstitch', context: 'default' },
  { key: '+', label: 'Zoom in', action: 'zoom-in', context: 'default' },
  { key: '-', label: 'Zoom out', action: 'zoom-out', context: 'default' },
  { key: '0', label: 'Zoom to fit (100%)', action: 'zoom-fit', context: 'default' },
  { key: 'Shift+Click', label: 'Mark stitch as completed', action: 'toggle-complete', context: 'canvas' },
]

/**
 * Load custom shortcuts from localStorage.
 * Merges with defaults — custom entries override default bindings.
 */
export function loadCustomShortcuts(): ShortcutBinding[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SHORTCUTS_KEY)
    if (raw) {
      const custom = JSON.parse(raw) as ShortcutBinding[]
      // Merge: defaults first, then custom overrides
      const merged = [...DEFAULT_SHORTCUTS]
      for (const customShortcut of custom) {
        const idx = merged.findIndex((d) => d.key === customShortcut.key)
        if (idx >= 0) {
          merged[idx] = { ...customShortcut, isCustom: true }
        } else {
          merged.push({ ...customShortcut, isCustom: true })
        }
      }
      return merged
    }
  } catch (e) {
    console.warn('Failed to load custom shortcuts:', e)
  }
  return [...DEFAULT_SHORTCUTS]
}

/**
 * Save custom shortcuts to localStorage.
 */
export function saveCustomShortcuts(shortcuts: ShortcutBinding[]): void {
  try {
    const custom = shortcuts.filter((s) => s.isCustom)
    localStorage.setItem(CUSTOM_SHORTCUTS_KEY, JSON.stringify(custom))
  } catch (e) {
    console.warn('Failed to save custom shortcuts:', e)
  }
}

/**
 * Reset shortcuts to defaults.
 */
export function resetToDefaultShortcuts(): ShortcutBinding[] {
  localStorage.removeItem(CUSTOM_SHORTCUTS_KEY)
  return [...DEFAULT_SHORTCUTS]
}

/**
 * Format a key binding for display.
 */
export function formatKeyDisplay(key: string): string {
  return key
    .replace(/mod\+/g, '⌘')
    .replace(/\+/g, ' + ')
    .replace(/shift/gi, '⇧')
    .replace(/space/gi, '⎵')
    .replace(/escape/gi, 'Esc')
}

/**
 * Validate a key binding string.
 */
export function validateShortcutKey(key: string): boolean {
  if (!key || key.length === 0) return false
  // Allow: mod+letter, mod+shift+letter, single keys, Shift+special
  const pattern = /^(mod\+)?shift\+?[a-z0-9\+\-\=\*\/\,\.\[\]\;\'\\`\-]=?$/i
  return pattern.test(key) || ['Escape', 'Enter', 'Space', 'Tab'].includes(key)
}

/**
 * Group shortcuts by context.
 */
export function groupShortcuts(shortcuts: ShortcutBinding[]): Record<string, ShortcutBinding[]> {
  const groups: Record<string, ShortcutBinding[]> = {}
  for (const s of shortcuts) {
    if (!groups[s.context]) groups[s.context] = []
    groups[s.context].push(s)
  }
  return groups
}
