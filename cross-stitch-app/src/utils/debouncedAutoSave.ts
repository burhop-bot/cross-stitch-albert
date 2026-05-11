/**
 * Debounced auto-save utility.
 * Wraps save operations in a debounce delay so rapid changes don't
 * trigger redundant saves. Defaults to 30-second delay.
 */

import { useProjectStore } from '../store/projectStore'
import { saveProjectToIDB, isIndexedDBAvailable } from '../utils/idbPersistence'

export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  isSavingToIDB: boolean
  debounceMs: number
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let debounceState: AutoSaveState = {
  isSaving: false,
  lastSaved: null,
  isSavingToIDB: false,
  debounceMs: 30000,
}

/**
 * Debounced auto-save trigger.
 * Call this whenever the project changes.
 * If called again within the debounce window, resets the timer.
 */
export function triggerDebouncedAutoSave(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceState = { ...debounceState, isSaving: true }

  debounceTimer = setTimeout(async () => {
    debounceState = { ...debounceState, isSaving: false }

    const store = useProjectStore.getState()
    const useIDB = isIndexedDBAvailable()
    debounceState = { ...debounceState, isSavingToIDB: useIDB }

    try {
      const saved = await saveProjectToIDB(
        {
          title: store.settings.title,
          author: store.settings.author,
          fabric: store.settings.fabric,
          width: store.settings.width,
          height: store.settings.height,
          panels: store.panels,
          flossBrand: store.flossBrand,
        },
        store.panels,
        store.settings
      )
      if (saved) {
        debounceState = { ...debounceState, lastSaved: new Date() }
        // Update store's lastSaved timestamp
        useProjectStore.getState().triggerAutoSave()
      }
    } catch {
      // Silently fail — localStorage fallback is already handled by zustand/persist
    }
  }, debounceState.debounceMs)
}

/**
 * Cancel any pending auto-save.
 */
export function cancelDebouncedAutoSave(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
    debounceState = { ...debounceState, isSaving: false }
  }
}

/**
 * Set the debounce delay (in milliseconds).
 * Default is 30 seconds.
 */
export function setAutoSaveDebounce(ms: number): void {
  debounceState = { ...debounceState, debounceMs: ms }
  // If there's a pending save, restart the timer
  if (debounceTimer) {
    cancelDebouncedAutoSave()
    triggerDebouncedAutoSave()
  }
}

/**
 * Get the current auto-save state.
 */
export function getAutoSaveState(): AutoSaveState {
  return { ...debounceState }
}

/**
 * Force an immediate save (ignoring debounce).
 */
export async function forceSave(): Promise<boolean> {
  cancelDebouncedAutoSave()

  const store = useProjectStore.getState()
  const useIDB = isIndexedDBAvailable()

  try {
    const saved = await saveProjectToIDB(
      {
        title: store.settings.title,
        author: store.settings.author,
        fabric: store.settings.fabric,
        width: store.settings.width,
        height: store.settings.height,
        panels: store.panels,
        flossBrand: store.flossBrand,
      },
      store.panels,
      store.settings
    )
    if (saved) {
      debounceState = { ...debounceState, lastSaved: new Date(), isSavingToIDB: useIDB }
      store.triggerAutoSave()
    }
    return saved
  } catch {
    return false
  }
}
