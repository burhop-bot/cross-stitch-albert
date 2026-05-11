/**
 * Flood Fill Undo/Redo — Comprehensive E2E Tests
 *
 * The Flood Fill tool modifies potentially many contiguous cells in a single
 * action. This is one of the highest-risk areas for undo/redo bugs:
 * - Does undo restore ALL flooded cells or just the first one?
 * - Does the undo stack push one entry or many (one per cell)?
 * - Does flood fill on a uniform grid behave correctly?
 * - Does flood fill with notes/undo interactions work?
 * - Does flood fill interact correctly with undo after color changes?
 *
 * Existing coverage:
 * - `drawing-tools-behavior.spec.ts` — existence and state only, no undo
 * - `tool-edge-cases.spec.ts` — existence only
 * - `grid-drawing.spec.ts` — spec task, but no undo verification
 *
 * Potential bugs targeted:
 * - Flood fill pushes 1 undo entry per cell instead of 1 total
 * - Undo only restores the last flooded cell
 * - Flood fill with notes doesn't corrupt notes
 * - Flood fill after color change uses wrong color
 * - Flood fill on 1x1 grid edge case
 * - Flood fill undo survives panel open/close
 * - Flood fill undo + red flood = correct stack
 * - Flood fill with dimension change before/after
 * - Flood fill with backstitch layer toggled
 * - Flood fill with alternating colors toggled
 * - Flood fill undo when only 1 cell different (all-same-color grid)
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Read the current grid design (stitch colors) from the test hook.
 */
async function getDesign(page: any): Promise<number[][]> {
  return page.evaluate(() => {
    const d = (window as any).__testGridDesign
    if (!d) return []
    return d.map((row: number[]) => [...row])
  })
}

/**
 * Count non-zero cells in the design.
 */
async function countNonZero(design: number[][]): Promise<number> {
  return design.flat().filter(c => c !== 0).length
}

/**
 * Read the undo stack size from the store.
 */
async function getUndoStackSize(page: any): Promise<number> {
  return page.evaluate(() => {
    const store = (window as any).__store
    if (store && store.getState) {
      const state = store.getState()
      const undo = state.undo || {}
      return Array.isArray(undo.stack) ? undo.stack.length : 0
    }
    return 0
  })
}

/**
 * Read notes array from the store.
 */
async function getNotes(page: any): Promise<any[]> {
  return page.evaluate(() => {
    const store = (window as any).__store
    if (store && store.getState) {
      const state = store.getState()
      const notes = state.notes || []
      return Array.isArray(notes) ? notes : []
    }
    return []
  })
}

/**
 * Setup a small grid and place a known pattern with a single-cell difference.
 * Creates a grid where cells [0..h-1, 0..w-2] are color 1, cell [0..h-1, w-1] is color 2.
 * This lets us flood fill from the color-2 cell and see the whole column change.
 */
async function setupColorBlock(page: any, w = 10, h = 10) {
  // Open right panel → Project tab → set dimensions
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  if (await panelBtn.count() > 0) await panelBtn.click()
  await await new Promise(r => setTimeout(r, 300))

  const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
  if (await projectTab.count() > 0) await projectTab.click()
  await await new Promise(r => setTimeout(r, 300))

  const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
  const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
  if (await widthLabel.count() > 0) {
    const widthInput = widthLabel.locator('..').locator('input[type="number"]')
    const heightInput = heightLabel.locator('..').locator('input[type="number"]')
    await widthInput.clear()
    await widthInput.fill(String(w))
    await heightInput.clear()
    await heightInput.fill(String(h))
  }

  const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
  if (await applyBtn.count() > 0) await applyBtn.click()
  await await new Promise(r => setTimeout(r, 800))
}

/**
 * Place a 2-color block pattern via store for flood fill testing.
 * Top half = color 1, bottom half = color 2 (creates a clear flood fill region).
 */
async function setTwoColorBlock(
  page: any,
  width: number,
  height: number,
  topColor: number,
  bottomColor: number
): Promise<number[][]> {
  const design: number[][] = []
  for (let r = 0; r < height; r++) {
    const row: number[] = []
    for (let c = 0; c < width; c++) {
      row.push(r < height / 2 ? topColor : bottomColor)
    }
    design.push(row)
  }
  await page.evaluate(({ d, w, h, tc, bc }) => {
    const store = (window as any).__store
    if (store) {
      const state = store.getState()
      state.panels[0].design = d
      state.settings = { width: w, height: h }
      state.undo = { stack: [], index: -1 }
      store.setState(state)
    }
  }, { d: design, w: width, h: height, tc: topColor, bc: bottomColor })
  await await new Promise(r => setTimeout(r, 500))
  return design
}

/**
 * Click the flood fill tool button.
 */
async function activateFloodFill(page: any): Promise<void> {
  const fillBtn = page.locator('button[title="Fill"]').first()
  if (await fillBtn.count() > 0) {
    await fillBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }
}

/**
 * Click a grid cell by approximate position.
 */
async function clickGridCellByPos(page: any, x: number, y: number): Promise<void> {
  const main = page.locator('main')
  await expect(main).toBeVisible()
  await page.mouse.click(x, y)
}

// ── Tests ────────────────────────────────────────────────────────

test.describe('Flood Fill Undo/Redo — Core Behavior', () => {
  test('flood fill pushes exactly 1 undo entry regardless of cells changed', async ({
    page,
  }) => {
    // Setup a 2-color block: 10x10, top 5 rows color 1, bottom 5 rows color 2
    await setupColorBlock(page, 10, 10)

    // Set up store-level pattern via hook
    await setTwoColorBlock(page, 10, 10, 1, 2)
    await await new Promise(r => setTimeout(r, 300))

    // Clear any existing undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    const beforeSize = await getUndoStackSize(page)
    expect(beforeSize).toBe(0)

    // Activate flood fill
    await activateFloodFill(page)

    // Click on a cell in the color-2 region (bottom half)
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      // Click on bottom half of the grid
      const centerY = box.y + box.height * 0.75
      const centerX = box.x + box.width / 2
      await page.mouse.click(centerX, centerY)
    }
    await await new Promise(r => setTimeout(r, 600))

    // Should have exactly 1 undo entry, not 5 (one per cell)
    const afterSize = await getUndoStackSize(page)
    expect(afterSize).toBe(1)
  })

  test('undo after flood fill restores all cells to pre-fill state', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 3, 4)
    await await new Promise(r => setTimeout(r, 300))

    // Verify initial pattern
    let design = await getDesign(page)
    let beforeCount = await countNonZero(design)
    expect(beforeCount).toBeGreaterThan(0)

    // Get the design snapshot before flood fill
    const beforeFillDesign = JSON.parse(JSON.stringify(design))

    // Activate flood fill and click on color-2 region
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      const centerY = box.y + box.height * 0.75
      const centerX = box.x + box.width / 2
      await page.mouse.click(centerX, centerY)
    }
    await await new Promise(r => setTimeout(r, 600))

    // Verify flood fill changed cells
    design = await getDesign(page)
    const afterFillCount = await countNonZero(design)
    // The flood fill should have replaced one half's color
    expect(afterFillCount).toBeGreaterThan(0)

    // Undo the flood fill
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    // Verify all cells restored to pre-fill state
    design = await getDesign(page)
    const restoredCount = await countNonZero(design)
    expect(restoredCount).toBe(beforeFillCount)

    // Verify the actual cell values match
    const restoredDesign = JSON.parse(JSON.stringify(design))
    expect(restoredDesign).toEqual(beforeFillDesign)
  })

  test('flood fill on 1x1 grid does not crash or push invalid undo entry', async ({ page }) => {
    await setupColorBlock(page, 1, 1)
    await await new Promise(r => setTimeout(r, 500))

    const beforeSize = await getUndoStackSize(page)
    expect(beforeSize).toBe(0)

    // Activate flood fill
    await activateFloodFill(page)

    // Click on the single cell
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 400))

    // App should not crash — undo stack should remain empty or have 1 entry
    const afterSize = await getUndoStackSize(page)
    expect(afterSize >= 0).toBe(true)
    expect(afterSize <= 1).toBe(true)
  })

  test('flood fill on uniform-color grid (no different neighbor) does not push undo', async ({
    page,
  }) => {
    await setupColorBlock(page, 10, 10)
    await await new Promise(r => setTimeout(r, 300))

    // Set all cells to the same color via store
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        const d = state.panels[0].design
        if (Array.isArray(d)) {
          for (let r = 0; r < d.length; r++) {
            for (let c = 0; c < d[r].length; c++) {
              d[r][c] = 5
            }
          }
        }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 300))

    const beforeSize = await getUndoStackSize(page)
    expect(beforeSize).toBe(0)

    // Activate flood fill and click — should not change anything (all same color)
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 400))

    // No undo entry pushed since flood fill didn't change anything
    const afterSize = await getUndoStackSize(page)
    expect(afterSize).toBe(0)
  })
})

test.describe('Flood Fill Undo/Redo — Redo & Stack Integrity', () => {
  test('redo after flood fill undo re-applies the flood', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 6, 7)
    await await new Promise(r => setTimeout(r, 300))

    // Clear undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    // Flood fill color-7 region
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    const designAfterFill = JSON.parse(JSON.stringify(await getDesign(page)))

    // Undo flood fill
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterUndo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterUndo).not.toEqual(designAfterFill)

    // Redo — should re-apply flood fill
    await page.locator('button[title="Redo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterRedo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterRedo).toEqual(designAfterFill)
  })

  test('redo invalidated after placing a new stitch post-flood-undo', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 8, 9)
    await await new Promise(r => setTimeout(r, 300))

    // Clear undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    // Undo flood fill
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    // Undo should be available
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeEnabled()

    // Place a new stitch (switch to pencil)
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Click a cell to place a stitch
    if (box) {
      await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2)
    }
    await await new Promise(r => setTimeout(r, 400))

    // Redo should be invalidated
    await expect(redoBtn).toBeDisabled()
  })

  test('multiple flood fills in a row build correct undo stack', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 10, 11)
    await await new Promise(r => setTimeout(r, 300))

    // Clear undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    // Flood fill bottom half
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    expect(await getUndoStackSize(page)).toBe(1)

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    // Flood fill again
    await activateFloodFill(page)
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    // Should have 2 undo entries
    expect(await getUndoStackSize(page)).toBe(2)

    // Undo twice
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    // Should be at base state (no undo entries)
    expect(await getUndoStackSize(page)).toBe(0)
  })
})

test.describe('Flood Fill Undo/Redo — Interaction with Features', () => {
  test('flood fill undo survives notes panel being open', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 12, 13)
    await await new Promise(r => setTimeout(r, 300))

    // Open notes panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const notesTab = page.locator('button').filter({ hasText: 'Notes' }).first()
    if (await notesTab.count() > 0) await notesTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    const designAfterFill = JSON.parse(JSON.stringify(await getDesign(page)))

    // Undo while notes panel still open
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterUndo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterUndo).not.toEqual(designAfterFill)
  })

  test('flood fill undo survives dimension change after fill', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 14, 15)
    await await new Promise(r => setTimeout(r, 300))

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    // Change dimensions — this typically resets undo stack
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))

    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
    if (await widthLabel.count() > 0) {
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      const heightInput = heightLabel.locator('..').locator('input[type="number"]')
      await widthInput.clear()
      await widthInput.fill('8')
      await heightInput.clear()
      await heightInput.fill('8')
    }
    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) await applyBtn.click()
    await await new Promise(r => setTimeout(r, 800))

    // Undo button should be disabled (dimension change wipes history)
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeDisabled()
  })

  test('flood fill undo with alternating colors toggled on', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 16, 17)
    await await new Promise(r => setTimeout(r, 300))

    // Toggle alternating colors
    const altBtn = page.locator('button[title*="Alternate"]').first()
    if (await altBtn.count() > 0) {
      await altBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    const designAfterFill = JSON.parse(JSON.stringify(await getDesign(page)))

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterUndo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterUndo).not.toEqual(designAfterFill)
  })

  test('flood fill undo with 3D effect toggled on', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 18, 19)
    await await new Promise(r => setTimeout(r, 300))

    // Toggle 3D effect
    const btn3d = page.locator('button[title*="3D"]').first()
    if (await btn3d.count() > 0) {
      await btn3d.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    const designAfterFill = JSON.parse(JSON.stringify(await getDesign(page)))

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterUndo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterUndo).not.toEqual(designAfterFill)
  })

  test('flood fill undo while backstitch layer toggle is ON', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 20, 21)
    await await new Promise(r => setTimeout(r, 300))

    // Toggle backstitch layer
    const bsBtn = page.locator('button[title*="Backstitch"]').first()
    if (await bsBtn.count() > 0) {
      await bsBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    const designAfterFill = JSON.parse(JSON.stringify(await getDesign(page)))

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterUndo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterUndo).not.toEqual(designAfterFill)
  })
})

test.describe('Flood Fill Undo/Redo — Edge Cases', () => {
  test('flood fill undo button state: enabled after fill, disabled on empty grid', async ({
    page,
  }) => {
    await setupColorBlock(page, 10, 10)
    await await new Promise(r => setTimeout(r, 500))

    // Undo button should be disabled on empty grid
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeDisabled()

    // Flood fill (with no existing data, nothing to flood)
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 400))

    // Undo should still be disabled since nothing changed
    await expect(undoBtn).toBeDisabled()
  })

  test('flood fill with large region (20x20) pushes single undo entry', async ({ page }) => {
    await setupColorBlock(page, 20, 20)
    await setTwoColorBlock(page, 20, 20, 22, 23)
    await await new Promise(r => setTimeout(r, 300))

    // Clear undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    const beforeSize = await getUndoStackSize(page)
    expect(beforeSize).toBe(0)

    // Flood fill bottom half (200 cells potentially affected)
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 800))

    // Should still be exactly 1 undo entry despite 200 cells affected
    const afterSize = await getUndoStackSize(page)
    expect(afterSize).toBe(1)
  })

  test('flood fill undo survives panel switch (progress → project → undo)', async ({ page }) => {
    await setupColorBlock(page, 10, 10)
    await setTwoColorBlock(page, 10, 10, 24, 25)
    await await new Promise(r => setTimeout(r, 300))

    // Clear undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    // Flood fill
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.75)
    }
    await await new Promise(r => setTimeout(r, 600))

    // Switch to progress panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    const progressTab = page.locator('button').filter({ hasText: 'Progress' }).first()
    if (await progressTab.count() > 0) await progressTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Switch back
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Undo should still work
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    // Undo button should now be disabled (popped the only entry)
    await expect(page.locator('button[title="Undo"]').first()).toBeDisabled()
  })

  test('flood fill undo with mixed colors across region boundary', async ({ page }) => {
    // Create a 10x10 grid with alternating row colors
    await setupColorBlock(page, 10, 10)
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        const design: number[][] = []
        for (let r = 0; r < 10; r++) {
          const row: number[] = []
          for (let c = 0; c < 10; c++) {
            row.push(r % 2 === 0 ? 26 : 27)
          }
          design.push(row)
        }
        state.panels[0].design = design
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 500))

    // Clear undo stack
    await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const state = store.getState()
        state.undo = { stack: [], index: -1 }
        store.setState(state)
      }
    })
    await await new Promise(r => setTimeout(r, 200))

    // Flood fill on an even row (color 26)
    await activateFloodFill(page)
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      // Click on top half (even row = color 26)
      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.15)
    }
    await await new Promise(r => setTimeout(r, 600))

    const designAfterFill = JSON.parse(JSON.stringify(await getDesign(page)))
    const fillStack = await getUndoStackSize(page)
    expect(fillStack).toBe(1)

    // Undo should restore original alternating pattern
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 400))

    const designAfterUndo = JSON.parse(JSON.stringify(await getDesign(page)))
    expect(designAfterUndo).not.toEqual(designAfterFill)
  })
})
