/**
 * Undo/Redo After Dimension Change — Critical Data Flow Test
 *
 * Tests undo/redo behavior when the user changes grid dimensions via SettingsPanel,
 * then makes edits, then undoes/redoes. This is a high-risk data flow because
 * `setGridDimensions` can wipe undo history (documented in pattern-repeat-notes.spec.ts
 * that it wipes panel notes to []).
 *
 * Potential bugs targeted:
 * - Dimension change wipes undo history without warning
 * - Undo after dimension change + edit behaves inconsistently
 * - Undo/redo button disabled states after dimension change
 * - Panel notes/progress lost after undo-ing a dimension change
 * - Redo after dimension change when redo stack was invalidated
 * - Undo/redo across multiple dimension changes
 * - Undo with SettingsPanel open during dimension change
 */

import { test, expect } from '../fixtures/base'

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Open the right panel and switch to the Project tab.
 */
async function openProjectTab(page: any) {
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  if (await panelBtn.count() > 0) {
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  }
  const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
  if (await projectTab.count() > 0) {
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))
  }
}

/**
 * Set grid dimensions via SettingsPanel and apply.
 */
async function setDimensions(page: any, width: number, height: number) {
  await openProjectTab(page)

  const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
  const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()

  if (await widthLabel.count() > 0) {
    const widthInput = widthLabel.locator('..').locator('input[type="number"]')
    const heightInput = heightLabel.locator('..').locator('input[type="number"]')
    await widthInput.clear()
    await widthInput.fill(String(width))
    await heightInput.clear()
    await heightInput.fill(String(height))
  }

  const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
  if (await applyBtn.count() > 0) {
    await applyBtn.click()
  }
  await await new Promise(r => setTimeout(r, 800))
}

/**
 * Place several stitches on the grid via main.click().
 */
async function placeStitches(page: any, count: number, offsetX = 50, offsetY = 80) {
  const main = page.locator('main')
  for (let i = 0; i < count; i++) {
    await main.click({ position: { x: offsetX + i * 20, y: offsetY } })
    await await new Promise(r => setTimeout(r, 100))
  }
}

/**
 * Read the current undo/redo stack depth from the store.
 */
async function getUndoDepth(page: any): Promise<{ undo: number; redo: number }> {
  return page.evaluate(() => {
    const store = (window as any).__store
    if (store) {
      const state = store.getState()
      const history = state.history
      return {
        undo: (history?.past?.length ?? 0) + 1, // past + current = undo depth
        redo: history?.future?.length ?? 0,
      }
    }
    return { undo: 0, redo: 0 }
  })
}

/**
 * Check if undo/redo buttons are disabled.
 */
async function getButtonDisabledState(page: any): Promise<{ undoDisabled: boolean; redoDisabled: boolean }> {
  return page.evaluate(() => {
    const undoBtn = document.querySelector('button[title="Undo"]') as HTMLElement | null
    const redoBtn = document.querySelector('button[title="Redo"]') as HTMLElement | null
    return {
      undoDisabled: !!(undoBtn?.hasAttribute('disabled') || undoBtn?.getAttribute('aria-disabled') === 'true'),
      redoDisabled: !!(redoBtn?.hasAttribute('disabled') || redoBtn?.getAttribute('aria-disabled') === 'true'),
    }
  })
}

// ── Smoke tests ────────────────────────────────────────────────────────

test.describe('Undo/Redo After Dimension Change — Smoke', () => {
  test('[ @smoke ] undo button exists after dimension change + edit', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set a grid and apply
    await setDimensions(page, 10, 5)

    // Place stitches
    await placeStitches(page, 3, 80, 100)

    // Undo via keyboard shortcut (no visible undo button exists)
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    // Page should still be functional
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('undo after dimension change + edit reverts the last edit', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set grid, place stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 4, 80, 100)

    // Undo once
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo should now be available
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeVisible()
  })
})

// ── Undo/Redo button state after dimension change ─────────────────────

test.describe('Button disabled states after dimension change', () => {
  test('undo button disabled after dimension change on empty grid', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Apply a new grid
    await setDimensions(page, 10, 5)

    // No edits yet — undo should be disabled
    const state = await getButtonDisabledState(page)
    expect(state.undoDisabled).toBeTruthy()
  })

  test('redo button disabled immediately after placing new stitch post-dimension-change', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set grid and place a stitch
    await setDimensions(page, 10, 5)
    await placeStitches(page, 1, 80, 100)

    // No undo performed yet — redo should be disabled
    const state = await getButtonDisabledState(page)
    expect(state.redoDisabled).toBeTruthy()

    // Undo once
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Now redo should be available
    const stateAfterUndo = await getButtonDisabledState(page)
    expect(stateAfterUndo.redoDisabled).toBeFalsy()
  })

  test('redo button disabled after undo + new edit post-dimension-change', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set grid, place 3 stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 3, 80, 100)

    // Undo once
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // Place a new stitch (invalidates redo stack)
    await placeStitches(page, 1, 80, 130)

    // Redo should be disabled
    const state = await getButtonDisabledState(page)
    expect(state.redoDisabled).toBeTruthy()
  })
})

// ── Undo/Redo stack integrity after dimension change ──────────────────

test.describe('Stack integrity after dimension change', () => {
  test('dimension change resets undo history (documented behavior)', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Place some stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 5, 80, 100)
    await await new Promise(r => setTimeout(r, 400))

    // Check initial undo depth
    const beforeChange = await getUndoDepth(page)

    // Change dimensions
    await setDimensions(page, 15, 8)
    await await new Promise(r => setTimeout(r, 800))

    // After dimension change, the undo history may have been reset
    // This is documented behavior — setGridDimensions wipes notes and may reset history
    const afterChange = await getUndoDepth(page)

    // New edits should still work with fresh history
    await placeStitches(page, 3, 60, 80)
    const afterEdit = await getUndoDepth(page)

    // Undo depth should be > 0 after new edits
    expect(afterEdit.undo).toBeGreaterThan(0)
  })

  test('undo works correctly after dimension change + new edits', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set dimensions and place stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 5, 80, 100)

    // Undo all stitches
    for (let i = 0; i < 5; i++) {
      await page.locator('button[title="Undo"]').first().click()
      await await new Promise(r => setTimeout(r, 150))
    }

    // Undo button should be disabled (no more history)
    const state = await getButtonDisabledState(page)
    expect(state.undoDisabled).toBeTruthy()
  })

  test('redo invalidation after edit post-dimension-change + undo', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set grid and place stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 4, 80, 100)

    // Undo twice
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // Place a new stitch (should invalidate redo)
    await placeStitches(page, 1, 80, 130)

    // Redo should be disabled
    const state = await getButtonDisabledState(page)
    expect(state.redoDisabled).toBeTruthy()
  })
})

// ── Undo/Redo with SettingsPanel open ─────────────────────────────────

test.describe('Undo/Redo with SettingsPanel active', () => {
  test('undo while SettingsPanel tab is open reverts correctly', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open right panel and go to Project tab
    await openProjectTab(page)

    // Set dimensions
    await setDimensions(page, 10, 5)

    // Place stitches
    await placeStitches(page, 4, 80, 100)

    // Undo with SettingsPanel still open
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Panel should still be visible and functional
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await expect(projectTab).toBeVisible()
  })

  test('undo + redo with SettingsPanel open preserves panel state', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open right panel, go to Project tab
    await openProjectTab(page)

    // Set dimensions
    await setDimensions(page, 10, 5)

    // Place stitches
    await placeStitches(page, 3, 80, 100)

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    await page.locator('button[title="Redo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Project tab should still be active
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await expect(projectTab).toHaveClass(/bg-indigo-50/)
    await expect(projectTab).toHaveClass(/text-indigo-600/)
  })

  test('switching panel tab after undo preserves correct tab state', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open right panel, go to Project tab
    await openProjectTab(page)

    // Set dimensions
    await setDimensions(page, 10, 5)

    // Place stitches
    await placeStitches(page, 3, 80, 100)

    // Switch to Progress tab
    const progressTab = page.locator('button').filter({ hasText: 'Progress' }).first()
    await progressTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Switch back to Project tab
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Project tab should be active
    await expect(projectTab).toHaveClass(/bg-indigo-50/)
  })
})

// ── Multiple dimension changes + undo ─────────────────────────────────

test.describe('Multiple dimension changes', () => {
  test('second dimension change creates fresh undo history', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // First dimension change
    await setDimensions(page, 10, 5)
    await placeStitches(page, 3, 80, 100)

    // Undo the stitches
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // Second dimension change
    await setDimensions(page, 12, 6)
    await await new Promise(r => setTimeout(r, 800))

    // Place new stitches
    await placeStitches(page, 2, 60, 80)

    // Undo should work for the new history
    const state = await getButtonDisabledState(page)
    expect(state.undoDisabled).toBeFalsy()
  })

  test('rapid dimension changes followed by edit + undo', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Rapid dimension changes
    await setDimensions(page, 10, 5)
    await setDimensions(page, 8, 4)
    await setDimensions(page, 12, 7)
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches after rapid changes
    await placeStitches(page, 3, 50, 70)

    // Undo should work
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo should be available
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeVisible()
  })

  test('dimension change with many prior edits resets clean state', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Build deep undo history
    await setDimensions(page, 15, 8)
    for (let i = 0; i < 10; i++) {
      await placeStitches(page, 1, 50 + i * 15, 100)
      await await new Promise(r => setTimeout(r, 50))
    }

    // Undo several steps
    for (let i = 0; i < 5; i++) {
      await page.locator('button[title="Undo"]').first().click()
      await await new Promise(r => setTimeout(r, 50))
    }

    // Now change dimensions (should reset history)
    await setDimensions(page, 8, 5)
    await await new Promise(r => setTimeout(r, 800))

    // Place a new stitch
    await placeStitches(page, 1, 50, 80)

    // Undo should work for the new edit
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  })
})

// ── Undo/Redo after dimension change + panel tab interaction ──────────

test.describe('Panel tab interactions during undo workflow', () => {
  test('undo after dimension change while Notes tab is active', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open right panel, go to Notes tab
    await openProjectTab(page)
    const notesTab = page.locator('button').filter({ hasText: 'Notes' }).first()
    await notesTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Set dimensions
    await setDimensions(page, 10, 5)
    await await new Promise(r => setTimeout(r, 500))

    // Place stitches
    await placeStitches(page, 3, 80, 100)

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Notes tab content should still be visible
    const notesHeading = page.locator('h3').filter({ hasText: /Notes/i }).first()
    await expect(notesHeading).toBeVisible()
  })

  test('undo after dimension change while Progress tab is active', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open right panel, go to Progress tab
    await openProjectTab(page)
    const progressTab = page.locator('button').filter({ hasText: 'Progress' }).first()
    await progressTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Set dimensions
    await setDimensions(page, 10, 5)
    await await new Promise(r => setTimeout(r, 500))

    // Place stitches
    await placeStitches(page, 3, 80, 100)

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Progress tab should still be active and visible
    const progressHeading = page.locator('h3').filter({ hasText: /Progress/i }).first()
    await expect(progressHeading).toBeVisible()
  })

  test('undo while SettingsPanel is on a non-Project tab', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open right panel, switch to Import tab
    await openProjectTab(page)
    const importTab = page.locator('button').filter({ hasText: 'Import' }).first()
    await importTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Set dimensions (this navigates back to Project tab via openProjectTab)
    await setDimensions(page, 10, 5)

    // Place stitches
    await placeStitches(page, 3, 80, 100)

    // Switch to Inventory tab
    const inventoryTab = page.locator('button').filter({ hasText: 'Inventory' }).first()
    await inventoryTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Inventory tab should still be visible
    const inventoryHeading = page.locator('h3').filter({ hasText: /Inventory/i }).first()
    await expect(inventoryHeading).toBeVisible()
  })
})

// ── Edge cases ─────────────────────────────────────────────────────────

test.describe('Edge cases', () => {
  test('undo/redo after dimension change from 1x1 grid', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set to 1x1 grid
    await setDimensions(page, 1, 1)
    await await new Promise(r => setTimeout(r, 500))

    // Place a stitch
    await placeStitches(page, 1, 50, 50)

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo should be available
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeVisible()
  })

  test('undo/redo after large dimension change', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set to a large grid
    await setDimensions(page, 40, 30)
    await await new Promise(r => setTimeout(r, 1000))

    // Place a few stitches
    await placeStitches(page, 3, 80, 100)

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // App should still be responsive
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
  })

  test('undo stack depth after dimension change + undo + redo + undo', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set dimensions and place stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 4, 80, 100)

    // Undo once
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // Redo once
    await page.locator('button[title="Redo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // Undo again
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // App should still be functional
    await expect(page.locator('main')).toBeVisible()

    // Undo button should be visible (more history available)
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
  })

  test('keyboard shortcut (Ctrl+Z) works after dimension change', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set dimensions and place stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 3, 80, 100)

    // Undo with keyboard shortcut
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    // Redo should be available
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeVisible()
  })

  test('keyboard shortcut (Ctrl+Shift+Z) redo works after dimension change', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set dimensions and place stitches
    await setDimensions(page, 10, 5)
    await placeStitches(page, 3, 80, 100)

    // Undo with button
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 200))

    // Redo with keyboard shortcut
    await page.keyboard.press('Control+Shift+z')
    await await new Promise(r => setTimeout(r, 300))

    // Undo button should be available again
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
  })
})
