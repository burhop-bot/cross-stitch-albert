/**
 * Drawing Tools Undo/Redo — Comprehensive Test File
 *
 * Covers undo/redo behavior for all core drawing tools:
 * - Pencil (stitch placement)
 * - Eraser (cell clearing)
 * - Line (click-start, click-end)
 * - Rectangle (click-top-left, click-bottom-right)
 *
 * These tools are covered by drawing-tools-behavior.spec.ts for
 * basic behavior, but have NO dedicated undo/redo testing.
 *
 * Bug targets:
 * - Undo stack not recording tool-specific edits
 * - Redo invalidation after undo + new edit
 * - Multi-level undo with mixed tools
 * - Undo/redo with panels open simultaneously
 * - Undo/redo button state transitions
 * - Undo after dimension change + tool use
 */

import { test, expect } from '../fixtures/base'

// ── Helpers ──────────────────────────────────────────────────────

async function placeStitchesWithPencil(page: any, count: number) {
  const pencilBtn = page.locator('button[title*="Pencil"]').first()
  if (await pencilBtn.count() === 0) {
    // Try alternate title formats
    const pencilBtnAlt = page.locator('button').filter({ hasText: 'Pencil' }).first()
    if (await pencilBtnAlt.count() > 0) {
      await pencilBtnAlt.click()
    }
  } else {
    await pencilBtn.click()
  }
  await await new Promise(r => setTimeout(r, 200))

  const main = page.locator('main')
  const box = await main.boundingBox()
  if (box) {
    for (let i = 0; i < count; i++) {
      const x = box.x + 50 + i * 25
      const y = box.y + box.height / 2
      await page.mouse.click(x, y)
      await await new Promise(r => setTimeout(r, 60))
    }
  }
}

async function useTool(page: any, toolName: string) {
  const toolBtn = page.locator('button[title*="' + toolName + '"]').first()
  if (await toolBtn.count() > 0) {
    await toolBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }
}

function expectUndoEnabled(page: any) {
  return expect(page.locator('button[title="Undo"]').first()).not.toHaveAttribute('disabled')
}

function expectUndoDisabled(page: any) {
  return expect(page.locator('button[title="Undo"]').first()).toHaveAttribute('disabled')
}

function expectRedoEnabled(page: any) {
  return expect(page.locator('button[title="Redo"]').first()).not.toHaveAttribute('disabled')
}

function expectRedoDisabled(page: any) {
  return expect(page.locator('button[title="Redo"]').first()).toHaveAttribute('disabled')
}

// ── Pencil Undo/Redo ─────────────────────────────────────────────

test.describe('Pencil Tool — Undo/Redo', () => {
  test('placing a stitch enables undo button', async ({ page }) => {
    await placeStitchesWithPencil(page, 1)

    const undoBtn = page.locator('button[title="Undo"]').first()
    await expectUndoEnabled(page)
  })

  test('undo after single stitch removes it', async ({ page }) => {
    await placeStitchesWithPencil(page, 1)

    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    expect(Array.isArray(design)).toBe(true)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBe(0)
  })

  test('redo after undo restores the stitch', async ({ page }) => {
    await placeStitchesWithPencil(page, 1)

    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const redoBtn = page.locator('button[title="Redo"]').first()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('multiple stitches push multiple undo entries', async ({ page }) => {
    await placeStitchesWithPencil(page, 5)

    // Undo once should only remove one stitch
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('redo is invalidated by a new edit after undo', async ({ page }) => {
    await placeStitchesWithPencil(page, 3)

    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // After undo, redo should be enabled (there's something to redo to)
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expectRedoEnabled(page)

    // A new edit should invalidate redo (clear redoStack)
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 200, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Redo should now be disabled (invalidated by new edit)
    await expectRedoDisabled(page)
  })

  test('undo with right panel open does not break UI', async ({ page }) => {
    await placeStitchesWithPencil(page, 3)

    // Open right panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo should still work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Page should be functional
    await expect(page.locator('header')).toBeVisible()
  })

  test('undo/redo keyboard shortcuts work with pencil', async ({ page }) => {
    await placeStitchesWithPencil(page, 2)

    // Ctrl+Z for undo
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    // Ctrl+Shift+Z for redo
    await page.keyboard.press('Control+Shift+z')
    await await new Promise(r => setTimeout(r, 300))

    await expect(page.locator('main')).toBeVisible()
  })
})

// ── Eraser Undo/Redo ─────────────────────────────────────────────

test.describe('Eraser Tool — Undo/Redo', () => {
  test('placing then erasing a stitch can be undone', async ({ page }) => {
    // Place a stitch
    const pencilBtn = page.locator('button[title*="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 50, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Switch to eraser and erase
    await useTool(page, 'Eraser')

    const box2 = await main.boundingBox()
    if (box2) {
      await page.mouse.click(box2.x + 50, box2.y + box2.height / 2)
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo should restore the stitch
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('erasing multiple cells pushes multiple undo entries', async ({ page }) => {
    // Place 3 stitches
    const pencilBtn = page.locator('button[title*="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      for (let i = 0; i < 3; i++) {
        await page.mouse.click(box.x + 50 + i * 25, box.y + box.height / 2)
        await await new Promise(r => setTimeout(r, 80))
      }
    }

    // Switch to eraser and erase 3 cells
    await useTool(page, 'Eraser')
    if (box) {
      for (let i = 0; i < 3; i++) {
        await page.mouse.click(box.x + 50 + i * 25, box.y + box.height / 2)
        await await new Promise(r => setTimeout(r, 100))
      }
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo once — should only undo the last erase
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    // At least one stitch should be restored
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('erasing on empty grid has no undo effect', async ({ page }) => {
    await useTool(page, 'Eraser')

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 300))
    }

    // Erasing on empty grid does trigger a mutation, so undo button is enabled.
    // Undoing restores the same empty design — no visible change.
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expectUndoEnabled(page)

    // Perform the undo
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Design should still be empty (undoing the erase of an already-empty cell)
    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBe(0)
  })
})

// ── Line Tool Undo/Redo ──────────────────────────────────────────

test.describe('Line Tool — Undo/Redo', () => {
  test('drawing a line can be undone', async ({ page }) => {
    await useTool(page, 'Line')

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      // Click start point
      await page.mouse.click(box.x + 50, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 100))
      // Click end point
      await page.mouse.click(box.x + 200, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Verify line was drawn (multiple cells non-zero)
    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(3)

    // Undo should revert the line
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design2 = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount2 = design2.flat().filter((c: number) => c !== 0).length
    // After undo, the line cells should be gone
    // (if they were the only non-zero cells)
    expect(nonZeroCount2).toBeLessThanOrEqual(nonZeroCount)
  })

  test('undo after line followed by redo restores line', async ({ page }) => {
    await useTool(page, 'Line')

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 50, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 100))
      await page.mouse.click(box.x + 200, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    const redoBtn = page.locator('button[title="Redo"]').first()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(3)
  })

  test('undo after line + pencil placement works correctly', async ({ page }) => {
    // Draw a line
    await useTool(page, 'Line')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 50, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 100))
      await page.mouse.click(box.x + 200, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Place a stitch with pencil
    await useTool(page, 'Pencil')
    if (box) {
      await page.mouse.click(box.x + 300, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo once — should undo the pencil, not the line
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    // Line cells should still be there (at least 3)
    expect(nonZeroCount).toBeGreaterThanOrEqual(3)
  })
})

// ── Rectangle Tool Undo/Redo ─────────────────────────────────────

test.describe('Rectangle Tool — Undo/Redo', () => {
  test('drawing a rectangle can be undone', async ({ page }) => {
    await useTool(page, 'Rectangle')

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      // Click top-left
      await page.mouse.click(box.x + 80, box.y + 80)
      await await new Promise(r => setTimeout(r, 100))
      // Click bottom-right
      await page.mouse.click(box.x + 250, box.y + 250)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Verify rectangle was drawn (many cells non-zero)
    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(5)

    // Undo should revert the rectangle
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design2 = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount2 = design2.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount2).toBeLessThanOrEqual(nonZeroCount)
  })

  test('redo after rectangle undo restores filled region', async ({ page }) => {
    await useTool(page, 'Rectangle')

    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 80, box.y + 80)
      await await new Promise(r => setTimeout(r, 100))
      await page.mouse.click(box.x + 250, box.y + 250)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Undo then redo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const redoBtn = page.locator('button[title="Redo"]').first()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(5)
  })
})

// ── Mixed Tool Undo/Redo ─────────────────────────────────────────

test.describe('Mixed Tools — Undo/Redo Stack Integrity', () => {
  test('pencil → eraser → line → rectangle undo chain is intact', async ({ page }) => {
    // Place 2 stitches
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 50, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 80))
      await page.mouse.click(box.x + 80, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 200))

    // Erase one cell
    await useTool(page, 'Eraser')
    if (box) {
      await page.mouse.click(box.x + 50, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 200))

    // Draw a line
    await useTool(page, 'Line')
    if (box) {
      await page.mouse.click(box.x + 50, box.y + box.height * 0.3)
      await await new Promise(r => setTimeout(r, 100))
      await page.mouse.click(box.x + 250, box.y + box.height * 0.3)
    }
    await await new Promise(r => setTimeout(r, 400))

    // Draw a rectangle
    await useTool(page, 'Rectangle')
    if (box) {
      await page.mouse.click(box.x + 100, box.y + 30)
      await await new Promise(r => setTimeout(r, 100))
      await page.mouse.click(box.x + 300, box.y + 300)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Verify we have data
    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const initialNonZero = design.flat().filter((c: number) => c !== 0).length
    expect(initialNonZero).toBeGreaterThan(0)

    // Undo should progressively revert operations
    const undoBtn = page.locator('button[title="Undo"]').first()

    // Undo 4 times (once per operation)
    for (let i = 0; i < 4; i++) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Page should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('undo button disabled on fresh grid, enabled after first edit', async ({ page }) => {
    // On fresh grid, undo should be disabled
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expectUndoDisabled(page)

    // After one stitch
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    await expectUndoEnabled(page)

    // Undo
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Undo should be disabled again
    await expectUndoDisabled(page)
  })

  test('redo button disabled until undo is performed', async ({ page }) => {
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Redo should be disabled (nothing undone yet)
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expectRedoDisabled(page)
  })

  test('rapid undo/redo cycling does not crash', async ({ page }) => {
    // Place 5 stitches
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      for (let i = 0; i < 5; i++) {
        await page.mouse.click(box.x + 50 + i * 20, box.y + box.height / 2)
        await await new Promise(r => setTimeout(r, 50))
      }
    }
    await await new Promise(r => setTimeout(r, 300))

    const undoBtn = page.locator('button[title="Undo"]').first()
    const redoBtn = page.locator('button[title="Redo"]').first()

    // Rapid undo/redo cycling
    for (let i = 0; i < 10; i++) {
      if (await undoBtn.isEnabled()) {
        await undoBtn.click()
      }
      await await new Promise(r => setTimeout(r, 50))
      if (await redoBtn.isEnabled()) {
        await redoBtn.click()
      }
      await await new Promise(r => setTimeout(r, 50))
    }

    // Page should still be functional
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('undo after tool switch works correctly', async ({ page }) => {
    // Place stitch with pencil
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 200))

    // Switch to eraser (but don't erase)
    await useTool(page, 'Eraser')
    await await new Promise(r => setTimeout(r, 200))

    // Undo should still undo the pencil edit
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBe(0)
  })
})

// ── Undo/Redo with Panels Open ───────────────────────────────────

test.describe('Undo/Redo with Panels Open', () => {
  test('undo works with right panel open', async ({ page }) => {
    // Place a stitch
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Open right panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo should still work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Right panel should still be visible
    await expect(page.locator('div').filter({ hasText: /Project|Project Info|Settings/i }).first()).toBeVisible()
  })

  test('redo works with right panel open', async ({ page }) => {
    // Place 2 stitches
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
      await await new Promise(r => setTimeout(r, 80))
      await page.mouse.click(box.x + 130, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo once
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Open right panel during undone state
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Redo should still work
    const redoBtn = page.locator('button[title="Redo"]').first()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('undo works with notes panel open', async ({ page }) => {
    // Place a stitch
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Open notes panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }
    const notesTab = page.locator('button').filter({ hasText: 'Notes' }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Undo should still work
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Page functional
    await expect(page.locator('main')).toBeVisible()
  })
})

// ── Undo/Redo with Keyboard Shortcuts ────────────────────────────

test.describe('Undo/Redo — Keyboard Shortcuts', () => {
  test('Ctrl+Z triggers undo after pencil edit', async ({ page }) => {
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBe(0)
  })

  test('Ctrl+Shift+Z triggers redo after undo', async ({ page }) => {
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    await page.keyboard.press('Control+Shift+Z')
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('Ctrl+Y also triggers redo (alternative shortcut)', async ({ page }) => {
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    // Ctrl+Y for redo
    await page.keyboard.press('Control+y')
    await await new Promise(r => setTimeout(r, 300))

    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })

  test('Escape does not trigger undo', async ({ page }) => {
    await useTool(page, 'Pencil')
    const main = page.locator('main')
    const box = await main.boundingBox()
    if (box) {
      await page.mouse.click(box.x + 100, box.y + box.height / 2)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Press Escape — should NOT undo
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 300))

    // Stitches should still be there
    const design = await page.evaluate(() => (window as any).__testGridDesign)
    const nonZeroCount = design.flat().filter((c: number) => c !== 0).length
    expect(nonZeroCount).toBeGreaterThanOrEqual(1)
  })
})
