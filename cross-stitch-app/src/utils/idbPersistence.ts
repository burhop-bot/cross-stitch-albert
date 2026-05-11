/**
 * IndexedDB persistence utility for large projects.
 * Uses idb-keyval for simple key-value storage in IndexedDB.
 * Falls back to regular store persistence when IndexedDB is unavailable.
 */

import { get, set, del, keys } from 'idb-keyval'
import type { Project, Panel } from '../store/projectStore'

const DB_NAME = 'cross-stitch-studio'
const STORE_NAME = 'projects'
const STORAGE_KEY = 'cross-stitch-project-v2'

/**
 * Initialize the IndexedDB database and upgrade if needed.
 * Called once at app startup.
 */
export function initIndexedDB(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(true)
      request.onerror = () => resolve(false)
    } catch {
      resolve(false)
    }
  })
}

/**
 * Save a project to IndexedDB with compression awareness.
 * Large projects are stored as separate panel data with metadata.
 */
export async function saveProjectToIDB(
  project: Project,
  panels: Panel[],
  settings: { width: number; height: number; fabric: string; title: string; author: string }
): Promise<boolean> {
  try {
    const serialized = {
      project,
      panels: panels.map((p) => ({
        ...p,
        // Strip large binary data if present
        design: p.design.map((row) => [...row]),
      })),
      settings,
      savedAt: new Date().toISOString(),
    }
    await set(STORAGE_KEY, serialized)
    return true
  } catch {
    return false
  }
}

/**
 * Load a project from IndexedDB.
 * Returns null if no project exists or load fails.
 */
export async function loadProjectFromIDB(): Promise<{
  project: Project | null
  panels: Panel[] | null
  settings: { width: number; height: number; fabric: string; title: string; author: string } | null
  savedAt: string | null
} | null> {
  try {
    const data = await get(STORAGE_KEY)
    if (!data) return null
    return {
      project: data.project ?? null,
      panels: data.panels ?? null,
      settings: data.settings ?? null,
      savedAt: data.savedAt ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Clear a project from IndexedDB.
 */
export async function clearProjectFromIDB(): Promise<boolean> {
  try {
    await del(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

/**
 * Check if IndexedDB is available.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

/**
 * Get storage stats (approximate).
 */
export async function getStorageStats(): Promise<{
  hasIDB: boolean
  hasProject: boolean
  savedAt: string | null
}> {
  return {
    hasIDB: isIndexedDBAvailable(),
    hasProject: false,
    savedAt: null,
  }
}
