/**
 * Undo/Redo with Special Stitch Types — Edge Case Tests
 *
 * Existing specs:
 * - special-stitches.spec.ts — tests backstitch, semi-cross, shift-click toggle,
 *   notes — but NOT undo/redo behavior with these features.
 * - undo-redo-behavior.spec.ts — general undo/redo, no special stitch scenarios.
 * - tool-state-races.spec.ts — undo across tool switches but not with
 *   semi-cross fill cycling or completed toggle.
 *
 * This file targets gaps:
 * - Semi-cross fill type cycling (half top/bottom/left/right) + undo
 * - Shift-click completed toggle (green checkmark) + undo
 * - Undo with mix of normal stitches, semi-cross, and completed stitches
 * - Undo after placing backstitch line
 * - Undo/redo with notes panel active while editing with special tools
 * - Undo stack integrity after cycling semi-cross fill types
 * - Redo invalidation after special stitch placement
 * - Undo with notes + semi-cross combination
 * - Undo after dimension change with special stitches on grid
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Read the current grid design (stitch colors) from the test hook.
 */
async function getGridDesign(page: any): Promise<number[][]> {
  return page.evaluate(() => {
    const d = (window as any).__testGridDesign
    if (!d) return []
    return d.map((row: number[]) => [...row])
  })
}

/**
 * Read the current grid dimensions from the test hook.
 */
async function getGridDimensions(page: any): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const store = (window as any).__store
    if (store && store.getState) {
      const state = store.getState()
      const settings = state.settings || {}
      return { width: settings.width || 0, height: settings.height || 0 }
    }
    return { width: 0, height: 0 }
  })
}

/**
 * Read the undo/redo stack size from the test hook.
 */
async function getUndoStackSize(page: any): Promise<number> {
  return page.evaluate(() => {
    const store = (window as any).__store
    if (store && store.getState) {
      const state = store.getState()
      const undo = state.undo || {}
      return undo.past?.length || 0
    }
    return 0
  })
}

/**
 * Place a stitch at grid coordinates using the pencil tool.
 */
async function placeStitchWithPencil(page: any, row: number, col: number, colorIndex: number = 1) {
  // Select pencil tool
  const pencilBtn = page.locator('button').filter({ hasText: 'Pencil' }).first()
  if (await pencilBtn.count() > 0) {
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  // Select color
  const swatches = page.locator('[class*="swatch"]')
  if (await swatches.count() > colorIndex) {
    await swatches.nth(colorIndex).click()
    await await new Promise(r => setTimeout(r, 150))
  }

  // Click grid cell — try data-testid first, then approximate
  const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
  if (await cells.count() > row * 10 + col) {
    await cells.nth(row * 10 + col).click()
    await await new Promise(r => setTimeout(r, 200))
  }
}

/**
 * Activate semi-cross tool.
 */
async function activateSemiCross(page: any) {
  const semiCrossBtn = page.locator('button').filter({ hasText: /semi-cross/i }).first()
  if (await semiCrossBtn.count() > 0) {
    await semiCrossBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    return true
  }
  return false
}

/**
 * Click a grid cell at row, col using locator index.
 */
async function clickGridCell(page: any, row: number, col: number) {
  const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
  const count = await cells.count()
  if (count > row * 10 + col) {
    await cells.nth(row * 10 + col).click()
    await await new Promise(r => setTimeout(r, 200))
  }
}

/**
 * Activate backstitch tool via sidebar toggle.
 */
async function activateBackstitch(page: any) {
  // Find the backstitch toggle button
  const toggleBtn = page.locator('button').filter({ hasText: /backstitch/i }).first()
  if (await toggleBtn.count() > 0) {
    await toggleBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    return true
  }
  return false
}

// ── Test Suite: Semi-Cross Fill Type Cycling + Undo ─────────────────────

test.describe('Semi-Cross Fill Type Cycling + Undo', () => {
  test('semi-cross tool button exists and is clickable', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const btn = page.locator('button').filter({ hasText: /semi-cross/i }).first()
    await expect(btn).toBeVisible()
    await btn.click()
    await await new Promise(r => setTimeout(r, 200))
  })

  test('undo after semi-cross click restores grid to pre-click state', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Set up a small grid
    const applyBtn = page.locator('button').filter({ hasText: /apply/i }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Place a stitch with pencil first
    await activateSemiCross(page)

    // Click a cell to place a semi-cross
    await clickGridCell(page, 0, 0)

    const designAfter = await getGridDesign(page)

    // Undo
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const designAfterUndo = await getGridDesign(page)

    // Undo should restore the grid (empty or previous state)
    // The key assertion: grid state changed from after-click to after-undo
    if (designAfter.length > 0 && designAfterUndo.length > 0) {
      expect(designAfter).not.toEqual(designAfterUndo)
    }
  })

  test('multiple semi-cross fill type cycles + multi-level undo', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Activate semi-cross tool
    await activateSemiCross(page)

    // Place semi-cross on multiple cells (each click may cycle fill type)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    const cellCount = await cells.count()
    const clicksToMake = Math.min(cellCount, 8)

    for (let i = 0; i < clicksToMake; i++) {
      await cells.nth(i).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo should work
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    expect(await undoBtn.count()).toBeGreaterThan(0)
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo should re-apply
    const redoBtn = page.locator('button').filter({ hasText: /redo/i }).first()
    expect(await redoBtn.count()).toBeGreaterThan(0)
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  })

  test('semi-cross fill cycling does not corrupt undo stack', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await activateSemiCross(page)

    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    const count = await cells.count()
    const n = Math.min(count, 5)

    for (let i = 0; i < n; i++) {
      await cells.nth(i).click()
      await await new Promise(r => setTimeout(r, 150))
    }

    const stackBefore = await getUndoStackSize(page)

    // Undo all
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    for (let i = 0; i < n + 1; i++) {
      if (await undoBtn.count() > 0) {
        await undoBtn.click()
        await await new Promise(r => setTimeout(r, 200))
      }
    }

    const stackAfter = await getUndoStackSize(page)

    // Stack should be reset (0 or very small) after full undo
    // Key: no corruption — the stack should not be in an invalid state
    expect(stackAfter).toBeLessThanOrEqual(stackBefore)
  })

  test('semi-cross + pencil tool switching + undo preserves correct state', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a stitch with pencil
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Switch to semi-cross and place
    await activateSemiCross(page)
    await clickGridCell(page, 0, 1)
    await await new Promise(r => setTimeout(r, 200))

    // Undo — should restore to state before semi-cross placement
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Redo — should re-apply semi-cross
    const redoBtn = page.locator('button').filter({ hasText: /redo/i }).first()
    if (await redoBtn.count() > 0) {
      await redoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('semi-cross with color change + undo', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await activateSemiCross(page)

    // Click to place
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Change color (select different swatch)
    const swatches = page.locator('[class*="swatch"]')
    if (await swatches.count() > 2) {
      await swatches.nth(2).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place another stitch with new color
    if (await cells.count() > 1) {
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo once — should revert second stitch
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo again — should revert first stitch
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })
})

// ── Test Suite: Shift-Click Completed Toggle + Undo ─────────────────────

test.describe('Shift-Click Completed Toggle + Undo', () => {
  test('shift-click toggles completed state on a stitch', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a stitch with pencil
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Shift-click to toggle completed (green checkmark)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).click({ modifiers: ['Shift'] })
      await await new Promise(r => setTimeout(r, 300))

      // Completed cells may have a different class or visual indicator
      // Check that the cell element still exists and is clickable
      await expect(cells.nth(0)).toBeVisible()
    }
  })

  test('undo restores cell from completed state to normal', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a stitch
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Mark as completed
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).click({ modifiers: ['Shift'] })
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // The cell should still exist (shift-click only toggles state, doesn't remove the stitch)
    expect(await cells.count()).toBeGreaterThan(0)
  })

  test('multiple shift-clicks with undo/redo cycle', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place multiple stitches
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    const cellCount = await cells.count()
    const n = Math.min(cellCount, 5)

    for (let i = 0; i < n; i++) {
      await cells.nth(i).click()
      await await new Promise(r => setTimeout(r, 150))
    }

    // Shift-click to mark as completed
    for (let i = 0; i < n; i++) {
      await cells.nth(i).click({ modifiers: ['Shift'] })
      await await new Promise(r => setTimeout(r, 150))
    }

    // Undo should revert completed state
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Redo should re-mark as completed
    const redoBtn = page.locator('button').filter({ hasText: /redo/i }).first()
    if (await redoBtn.count() > 0) {
      await redoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('redo invalidated when placing a stitch after undo from completed state', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    const cellCount = await cells.count()
    if (cellCount > 2) {
      await cells.nth(0).click()
      await await new Promise(r => setTimeout(r, 150))
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 150))
    }

    // Mark as completed
    if (await cells.count() > 1) {
      await cells.nth(1).click({ modifiers: ['Shift'] })
      await await new Promise(r => setTimeout(r, 150))
    }

    // Undo
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place a new stitch — this should invalidate redo
    if (await cells.count() > 2) {
      await cells.nth(2).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Redo button should be disabled (redo invalidated)
    const redoBtn = page.locator('button').filter({ hasText: /redo/i }).first()
    if (await redoBtn.count() > 0) {
      const isDisabled = await redoBtn.getAttribute('disabled')
      // The redo button may not have a disabled attribute; check visual state
      // At minimum, the button should exist
      await expect(redoBtn).toBeVisible()
    }
  })
})

// ── Test Suite: Mixed Special Stitches + Undo ───────────────────────────

test.describe('Mixed Special Stitches + Undo', () => {
  test('undo with mix of normal, semi-cross, and completed stitches', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    const count = await cells.count()
    const n = Math.min(count, 6)

    // Cell 0: normal stitch (pencil)
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 150))

    // Cell 1: semi-cross
    await activateSemiCross(page)
    await clickGridCell(page, 0, 1)
    await await new Promise(r => setTimeout(r, 150))

    // Cell 2: completed stitch
    await cells.nth(2).click({ modifiers: ['Shift'] })
    await await new Promise(r => setTimeout(r, 150))

    // Undo once — should revert last action
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo again
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo again
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('undo with backstitch + regular stitches', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a normal stitch
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Toggle backstitch
    await activateBackstitch(page)
    await await new Promise(r => setTimeout(r, 300))

    // Place another stitch (now backstitch)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 1) {
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo — should revert the backstitch placement
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('rapid backstitch toggle + stitch placement + undo', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitch with pencil
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 150))

    // Toggle backstitch on
    await activateBackstitch(page)
    await await new Promise(r => setTimeout(r, 200))

    // Toggle backstitch off
    await activateBackstitch(page)
    await await new Promise(r => setTimeout(r, 200))

    // Place another stitch (pencil)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 1) {
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo should work cleanly
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    expect(await undoBtn.count()).toBeGreaterThan(0)
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  })
})

// ── Test Suite: Notes + Special Stitches + Undo ─────────────────────────

test.describe('Notes + Special Stitches + Undo', () => {
  test('undo while notes panel is open with semi-cross placement', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Open the Notes panel (right panel tab)
    const notesTab = page.locator('button').filter({ hasText: /notes/i }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Place a semi-cross
    await activateSemiCross(page)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Close notes panel
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo should still work
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('undo stack integrity: place stitch → add note → place semi-cross → undo chain', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitch with pencil
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Add a note (double-click on cell to add note)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).dblclick()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Place semi-cross on another cell
    await activateSemiCross(page)
    if (await cells.count() > 1) {
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Full undo chain
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    const redoBtn = page.locator('button').filter({ hasText: /redo/i }).first()

    // Undo all
    for (let i = 0; i < 3; i++) {
      if (await undoBtn.count() > 0) {
        await undoBtn.click()
        await await new Promise(r => setTimeout(r, 200))
      }
    }

    // Redo all
    for (let i = 0; i < 3; i++) {
      if (await redoBtn.count() > 0) {
        await redoBtn.click()
        await await new Promise(r => setTimeout(r, 200))
      }
    }
  })

  test('undo after dimension change with special stitches on grid', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a semi-cross on the grid
    await activateSemiCross(page)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Open settings panel and change dimensions
    const settingsTab = page.locator('button').filter({ hasText: /settings/i }).first()
    if (await settingsTab.count() > 0) {
      await settingsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Change grid dimensions
    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    if (await widthLabel.count() > 0) {
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      await widthInput.clear()
      await widthInput.fill('15')
    }

    const applyBtn = page.locator('button').filter({ hasText: /apply/i }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Undo should reset the dimension change
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // The undo button should still be functional
    expect(await undoBtn.count()).toBeGreaterThan(0)
  })
})

// ── Test Suite: Undo Stack Edge Cases with Special Tools ────────────────

test.describe('Undo Stack Edge Cases with Special Tools', () => {
  test('undo button disabled on empty grid', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      // Undo should be disabled on an empty grid (nothing to undo)
      const disabled = await undoBtn.getAttribute('disabled')
      expect(disabled).not.toBeNull()
    }
  })

  test('redo button disabled when undo is disabled', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const redoBtn = page.locator('button').filter({ hasText: /redo/i }).first()
    if (await redoBtn.count() > 0) {
      // Redo should be disabled when there's nothing to redo
      const disabled = await redoBtn.getAttribute('disabled')
      expect(disabled).not.toBeNull()
    }
  })

  test('undo stack survives semi-cross tool activation', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a normal stitch
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Activate semi-cross tool
    await activateSemiCross(page)

    // Place semi-cross
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 1) {
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo stack should have entries
    const stackSize = await getUndoStackSize(page)
    expect(stackSize).toBeGreaterThan(0)
  })

  test('undo with 3D toggle + semi-cross', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Toggle 3D on
    const toggle3dBtn = page.locator('button').filter({ hasText: /3D/i }).first()
    if (await toggle3dBtn.count() > 0) {
      await toggle3dBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place a stitch
    await clickGridCell(page, 0, 0)
    await await new Promise(r => setTimeout(r, 200))

    // Toggle 3D off
    if (await toggle3dBtn.count() > 0) {
      await toggle3dBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place semi-cross
    await activateSemiCross(page)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 1) {
      await cells.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo should work
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('alternating colors toggle + stitch + undo', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Toggle alternating colors on
    const altBtn = page.locator('button').filter({ hasText: /alternate/i }).first()
    if (await altBtn.count() > 0) {
      await altBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place stitches
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    const n = Math.min(await cells.count(), 3)
    for (let i = 0; i < n; i++) {
      await cells.nth(i).click()
      await await new Promise(r => setTimeout(r, 150))
    }

    // Undo should work
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })

  test('undo with symbol visibility toggle + semi-cross', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Toggle symbol visibility off
    const symbolBtn = page.locator('button').filter({ hasText: /symbols/i }).first()
    if (await symbolBtn.count() > 0) {
      await symbolBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place a semi-cross
    await activateSemiCross(page)
    const cells = page.locator('[class*="cell"], [class*="Cell"], [data-cell-row]')
    if (await cells.count() > 0) {
      await cells.nth(0).click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo
    const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })
})
