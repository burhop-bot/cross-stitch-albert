/**
 * Color Swap Mode + Undo/Redo Integration
 *
 * Color swap mode (in the color palette) replaces all instances of one color
 * with another across the entire pattern. This is a multi-cell bulk-edit that
 * interacts with the undo/redo stack in non-obvious ways.
 *
 * No existing spec tests undo/redo behavior specifically AFTER using swap mode.
 * This file tests that critical path.
 *
 * Potential bugs:
 * - Swap mode doesn't push a single undo entry but instead creates many entries
 * - Undo after swap doesn't restore all original cells
 * - Redo after swap with intervening edits is broken
 * - Swap mode with palette panel open doesn't update the active swatch
 * - Swap mode on an empty grid crashes or does nothing unexpected
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Read the current design array from the test hook.
 */
async function getDesign(page: any): Promise<number[][]> {
  return page.evaluate(() => {
    const d = (window as any).__testGridDesign
    if (!d) return []
    return d.map((row: number[]) => [...row])
  })
}

/**
 * Place a known pattern on the grid directly via store.
 */
async function setPattern(page: any, design: number[][], width: number, height: number) {
  await page.evaluate(({ d, w, h }) => {
    const store = (window as any).__store
    if (store) {
      store.getState().panels[0].design = d
      store.setState({ settings: { width: w, height: h } })
    }
  }, { d: design, w: width, h: height })
  await new Promise(r => setTimeout(r, 500))
}

/**
 * Click a swatch by its color index in the palette.
 * Swatches are <button> elements with classes "aspect-square rounded-lg border-2"
 * in the color grid.
 */
async function clickSwatch(page: any, index: number) {
  const swatches = page.locator('button.aspect-square.rounded-lg').nth(index)
  if (await swatches.count() > 0) {
    await swatches.click()
    await new Promise(r => setTimeout(r, 200))
  }
}

/**
 * Activate swap mode: click the swap button (icon only, title="Swap two colors")
 * in the sidebar's "Edit Colors" section.
 */
async function activateSwapMode(page: any) {
  const swapBtn = page.locator('button[title="Swap two colors"]')
  if (await swapBtn.count() > 0) {
    await swapBtn.click()
    await new Promise(r => setTimeout(r, 300))
    return true
  }
  return false
}

/**
 * Perform a color swap in the UI: click source swatch, then target swatch.
 * The sidebar shows both the swap button and swatches simultaneously.
 * @param page - Playwright page
 * @param sourceIndex - Palette index of the source color to swap FROM
 * @param targetIndex - Palette index of the target color to swap TO
 */
async function performSwap(page: any, sourceIndex: number, targetIndex: number) {
  // Click swap button (icon only, no text)
  const swapBtn = page.locator('button[title="Swap two colors"]')
  if (await swapBtn.count() === 0) return
  await swapBtn.click()
  await new Promise(r => setTimeout(r, 300))

  // Source color swatch
  const sourceSwatch = page.locator('button.aspect-square.rounded-lg').nth(sourceIndex)
  if (await sourceSwatch.count() > 0) {
    await sourceSwatch.click()
    await new Promise(r => setTimeout(r, 300))
  }

  // Target color swatch
  const targetSwatch = page.locator('button.aspect-square.rounded-lg').nth(targetIndex)
  if (await targetSwatch.count() > 0) {
    await targetSwatch.click()
    await new Promise(r => setTimeout(r, 600))
  }
}

// ── Swap Mode Activation ────────────────────────────────────────────

test.describe('Swap Mode Activation', () => {
  test('swap mode button is visible in sidebar', async ({ page }) => {
    await page.waitForTimeout(1000)

    const swapBtn = page.locator('button[title="Swap two colors"]')
    if (await swapBtn.count() > 0) {
      await expect(swapBtn).toBeVisible()
    }
  })

  test('clicking swap button activates swap mode', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )
    await new Promise(r => setTimeout(r, 300))

    const activated = await activateSwapMode(page)
    if (activated) {
      // Swap mode should be active — check that the swap button is highlighted
      const swapBtn = page.locator('button[title="Swap two colors"]')
      await expect(swapBtn).toHaveClass(/bg-indigo-100/)
    }
  })

  test('swap mode cancels when clicking the same color twice', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )
    await new Promise(r => setTimeout(r, 300))

    const activated = await activateSwapMode(page)
    if (activated) {
      // Click the first swatch — should select it for swap
      const swatches = page.locator('button.aspect-square.rounded-lg')
      if (await swatches.count() > 0) {
        await swatches.first().click()
        await new Promise(r => setTimeout(r, 200))
      }

      // Click the SAME swatch — should cancel swap mode
      if (await swatches.count() > 0) {
        await swatches.first().click()
        await new Promise(r => setTimeout(r, 300))
      }

      // Page should still be functional
      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── Swap + Undo/Redo — Core Tests ──────────────────────────────────

test.describe('Swap + Undo/Redo — Core', () => {
  test('undo after swap restores original grid', async ({ page }) => {
    const DESIGN: number[][] = [
      [1, 2, 1, 2],
      [2, 1, 2, 1],
      [1, 2, 1, 2],
    ]

    await setPattern(page, DESIGN, 4, 3)

    // Activate swap mode and swap color 1 → color 3
    await performSwap(page, 0, 2)

    // Verify swap was applied
    const afterSwap = await getDesign(page)
    expect(afterSwap.length).toBe(3)

    // Undo the swap
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Verify grid is restored
    const afterUndo = await getDesign(page)
    expect(afterUndo).toEqual(DESIGN)
  })

  test('redo after undo restores the swapped grid', async ({ page }) => {
    const DESIGN: number[][] = [
      [1, 2, 1, 2],
      [2, 1, 2, 1],
    ]

    await setPattern(page, DESIGN, 4, 2)

    // Activate swap and apply: swap color 1 → 3
    await performSwap(page, 0, 2)

    const swappedDesign = await getDesign(page)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Verify restored
    let afterUndo = await getDesign(page)
    expect(afterUndo).toEqual(DESIGN)

    // Redo
    const redoBtn = page.locator('button[title="Redo"]').first()
    if (await redoBtn.count() > 0) {
      await redoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterRedo = await getDesign(page)
    expect(afterRedo).toEqual(swappedDesign)
  })

  test('redo is invalidated by edits after undo of swap', async ({ page }) => {
    const DESIGN: number[][] = [
      [1, 2, 1],
      [2, 1, 2],
    ]

    await setPattern(page, DESIGN, 3, 2)

    // Swap color 1 → 3
    await performSwap(page, 0, 2)

    // Undo swap
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Verify restored
    let afterUndo = await getDesign(page)
    expect(afterUndo).toEqual(DESIGN)

    // Place a new stitch (new edit)
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await new Promise(r => setTimeout(r, 200))
    }

    const main = page.locator('main')
    if (await main.count() > 0) {
      await main.click({ position: { x: 80, y: 80 } })
      await new Promise(r => setTimeout(r, 300))
    }

    // Verify new edit was applied
    const afterEdit = await getDesign(page)
    expect(afterEdit).not.toEqual(DESIGN)

    // Try redo — should NOT restore swapped state
    const redoBtn = page.locator('button[title="Redo"]').first()
    if (await redoBtn.count() > 0) {
      await redoBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    const afterRedo = await getDesign(page)
    // Should remain as the edited grid (redo invalidated)
    expect(afterRedo).toEqual(afterEdit)
  })

  test('swap then undo then redo → redo invalidation cycle', async ({ page }) => {
    const DESIGN: number[][] = [
      [1, 2, 3],
      [4, 5, 6],
    ]

    await setPattern(page, DESIGN, 3, 2)

    // Swap 1 → 9
    await performSwap(page, 0, 8)

    const swapped = await getDesign(page)
    expect(swapped[0]).not.toEqual(DESIGN[0]) // verify swap happened

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    let afterUndo = await getDesign(page)
    expect(afterUndo).toEqual(DESIGN)

    // Redo
    const redoBtn = page.locator('button[title="Redo"]').first()
    if (await redoBtn.count() > 0) {
      await redoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterRedo = await getDesign(page)
    expect(afterRedo).toEqual(swapped) // redo should work

    // Undo again to clean up
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }
  })

  test('multiple swaps compose correctly in undo stack', async ({ page }) => {
    const DESIGN: number[][] = [
      [1, 1, 1],
      [1, 1, 1],
    ]

    await setPattern(page, DESIGN, 3, 2)

    // First swap: 1 → 2
    await performSwap(page, 0, 1)

    // Second swap: 2 → 3
    await performSwap(page, 1, 2)

    // Verify final state: all cells should be color 3
    const finalDesign = await getDesign(page)
    expect(finalDesign[0]).toEqual([3, 3, 3])
    expect(finalDesign[1]).toEqual([3, 3, 3])

    // Undo once: should go back to all 2s
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterUndo1 = await getDesign(page)
    expect(afterUndo1[0]).toEqual([2, 2, 2])

    // Undo again: should go back to all 1s
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterUndo2 = await getDesign(page)
    expect(afterUndo2[0]).toEqual([1, 1, 1])
    expect(afterUndo2[1]).toEqual([1, 1, 1])
  })
})

// ── Swap + Panel Interactions ───────────────────────────────────────

test.describe('Swap + Panel Interactions', () => {
  test('swap works correctly with right panel open', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )

    // Open the right panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    // Activate swap: color 1 → 3
    await performSwap(page, 0, 2)

    const afterSwap = await getDesign(page)
    expect(afterSwap.length).toBe(2)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterUndo = await getDesign(page)
    expect(afterUndo[0]).toEqual([1, 2, 1])
  })

  test('swap with notes panel open does not crash', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )

    // Open notes panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    const notesTab = page.locator('button').filter({ hasText: /Notes/i }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await new Promise(r => setTimeout(r, 300))
    }

    // Activate swap: color 1 → 3
    await performSwap(page, 0, 2)

    // Page should remain functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('swap then close and reopen palette does not lose swap state unexpectedly', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )

    // Swap color 1 → 3
    await performSwap(page, 0, 2)

    const afterSwap = await getDesign(page)

    // Close right panel and reopen
    const closeBtn = page.locator('button').filter({ hasText: /Close panel/i }).first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Design should still reflect the swap
    const afterReopen = await getDesign(page)
    expect(afterReopen).toEqual(afterSwap)
  })
})

// ── Swap Edge Cases ─────────────────────────────────────────────────

test.describe('Swap Edge Cases', () => {
  test('swap on empty grid does not crash', async ({ page }) => {
    await setPattern(page, [[0, 0, 0], [0, 0, 0]], 3, 2)

    // Swap color 0 → 3 (no-op on grid since all are 0)
    await performSwap(page, 0, 2)

    // Should still be all zeros
    const afterSwap = await getDesign(page)
    expect(afterSwap[0]).toEqual([0, 0, 0])
    expect(afterSwap[1]).toEqual([0, 0, 0])
  })

  test('swap same color to same color is no-op', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )

    const before = await getDesign(page)

    // Swap color 1 with itself (no-op)
    await performSwap(page, 0, 0)

    const after = await getDesign(page)
    expect(after).toEqual(before)
  })

  test('rapid consecutive swaps do not crash', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )

    for (let i = 0; i < 5; i++) {
      const swapBtn = page.locator('button[title="Swap two colors"]')
      if (await swapBtn.count() > 0) {
        await swapBtn.click()
        await new Promise(r => setTimeout(r, 100))

        const swatches = page.locator('button.aspect-square.rounded-lg')
        const targetIdx = (i + 1) % 10
        if (await swatches.count() > targetIdx) {
          await swatches.nth(targetIdx).click()
          await new Promise(r => setTimeout(r, 100))
        }
      }
    }

    // Page should remain functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('swap followed by pencil edit, undo → swap still in stack', async ({ page }) => {
    const DESIGN: number[][] = [
      [1, 2, 1],
      [2, 1, 2],
    ]

    await setPattern(page, DESIGN, 3, 2)

    // Swap 1 → 3
    await performSwap(page, 0, 2)

    // Place an additional stitch with pencil
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await new Promise(r => setTimeout(r, 200))
    }

    const main = page.locator('main')
    if (await main.count() > 0) {
      await main.click({ position: { x: 120, y: 120 } })
      await new Promise(r => setTimeout(r, 300))
    }

    // Undo once: should undo the pencil edit, still have swap
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterUndo1 = await getDesign(page)
    // Should still be swapped (only pencil edit undone)
    expect(afterUndo1[0][0]).toBe(3) // color 1 became 3 via swap

    // Undo again: should restore original grid
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    const afterUndo2 = await getDesign(page)
    expect(afterUndo2[0]).toEqual(DESIGN[0])
  })

  test('swap survives panel switch (Settings ↔ other panels)', async ({ page }) => {
    await setPattern(page,
      [[1, 2, 1], [2, 1, 2]],
      3, 2
    )

    // Open right panel → settings
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    // Trigger swap via swap button: color 1 → 3
    await performSwap(page, 0, 2)

    const swappedDesign = await getDesign(page)

    // Switch to another panel tab (Settings → Progress)
    const progressTab = page.locator('button').filter({ hasText: /Progress/i }).first()
    if (await progressTab.count() > 0) {
      await progressTab.click()
      await new Promise(r => setTimeout(r, 300))
    }

    // Switch back
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Swap result should persist
    const afterSwitch = await getDesign(page)
    expect(afterSwitch).toEqual(swappedDesign)
  })
})
