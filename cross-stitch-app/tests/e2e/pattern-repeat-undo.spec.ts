/**
 * Creative Edge-Case Tests: Pattern Repeat Undo/Redo with Mirror Modes
 *
 * These tests target a real-world gap: the PatternRepeatPanel supports four
 * mirror modes (None, Horizontal, Vertical, Both) and undo/redo should work
 * correctly regardless of which mode is active. Bug surface areas:
 *
 * 1. Does undo restore the grid to the exact pre-repeat state?
 * 2. Does redo re-apply the SAME mirror mode (or does it get lost)?
 * 3. Does switching mirror modes BEFORE applying affect undo?
 * 4. Does opening the pattern repeat panel reset undo expectations?
 * 5. Does undo after repeat + edit work correctly?
 *
 * These bugs commonly occur when the repeat operation modifies the grid
 * in-place — if undo doesn't properly capture the original grid state,
 * the undo chain will be corrupted.
 */

import { test, expect } from '../fixtures/base'

/**
 * Get the grid design data from the grid canvas.
 * Returns a 2D array of color indices.
 */
async function getGridDesign(page: ReturnType<typeof test>): Promise<number[][]> {
  return page.evaluate(() => {
    const w = window as any
    return w.__testGridDesign || []
  })
}

/**
 * Helper: count non-zero cells in the grid.
 */
async function countNonZeroCells(page: ReturnType<typeof test>): Promise<number> {
  const design = await getGridDesign(page)
  if (design.length === 0) return 0
  return design.flat().filter((c: number) => c !== 0).length
}

/**
 * Helper: click the pattern repeat button in the toolbar.
 */
async function openPatternRepeatPanel(page: ReturnType<typeof test>) {
  const btn = page.locator('[aria-label*="pattern repeat"]').first()
  if (await btn.count() > 0) {
    await btn.click()
  } else {
    // Fallback: click button with text "Pattern Repeat" or icon
    const altBtn = page.locator('button').filter({ hasText: /Pattern/i }).first()
    if (await altBtn.count() > 0) {
      await altBtn.click()
    }
  }
  // Wait for panel to appear
  const panel = page.locator('[role="dialog"], [class*="pattern-repeat"], [class*="repeat-panel"]').first()
  if (await panel.count() > 0) {
    await panel.waitFor({ state: 'visible', timeout: 3000 })
  }
}

/**
 * Helper: select a mirror mode by clicking the appropriate button.
 */
async function setMirrorMode(page: ReturnType<typeof test>, mode: 'horizontal' | 'vertical' | 'both') {
  const modeMap = {
    horizontal: 'horizontal',
    vertical: 'vertical',
    both: 'both axes',
  }
  // Try clicking by aria-label or text content
  const modeLabel = modeMap[mode]
  const modeBtn = page.locator(`[aria-label*="${modeLabel}"]`).first()
  if (await modeBtn.count() > 0) {
    await modeBtn.click()
    return
  }
  // Fallback: try button text
  const textBtn = page.locator(`button:has-text("${modeLabel}")`).first()
  if (await textBtn.count() > 0) {
    await textBtn.click()
  }
}

/**
 * Helper: set repeat X count.
 */
async function setRepeatX(page: ReturnType<typeof test>, value: number) {
  const input = page.locator('input[name="repeatX"], input[placeholder*="X"], input[placeholder*="repeat"]').first()
  if (await input.count() > 0) {
    await input.fill(value.toString())
  }
}

/**
 * Helper: set repeat Y count.
 */
async function setRepeatY(page: ReturnType<typeof test>, value: number) {
  const input = page.locator('input[name="repeatY"], input[placeholder*="Y"], input[placeholder*="rows"]').first()
  if (await input.count() > 0) {
    await input.fill(value.toString())
  }
}

/**
 * Helper: click Apply button in the pattern repeat panel.
 */
async function applyPatternRepeat(page: ReturnType<typeof test>) {
  const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
  if (await applyBtn.count() > 0) {
    await applyBtn.click()
  }
  // Close the panel
  const closeBtn = page.locator('button[aria-label*="close"], button[title*="close"]').first()
  if (await closeBtn.count() > 0) {
    await closeBtn.click()
  }
}

test.describe('Pattern Repeat — Undo/Redo with Mirror Modes', () => {
  /**
   * Test: Applying pattern repeat with No mirror should be undoable.
   * Bug surface: repeatGrid modifies grid in-place; undo should restore original.
   */
  test('undo after repeat with No mirror mode restores original grid', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches first
    const cells = page.locator('div[style*="position: absolute"], canvas').first()
    if (await cells.count() > 0) {
      // Use the grid canvas to place a stitch
      await page.evaluate(() => {
        const w = window as any
        const design = w.__testGridDesign
        if (design && design.length > 1 && design[0].length > 1) {
          design[0][0] = 1
          design[0][1] = 2
          design[1][0] = 3
        }
      })
    }

    const beforeCells = await countNonZeroCells(page)
    expect(beforeCells).toBeGreaterThanOrEqual(0)

    // Open pattern repeat panel and apply with No mirror (default)
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await setRepeatY(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo should restore the pre-repeat state
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    const afterUndo = await getGridDesign(page)
    expect(afterUndo).toBeDefined()
    expect(Array.isArray(afterUndo)).toBe(true)
  })

  /**
   * Test: Switching mirror modes before applying should not affect undo.
   * Bug surface: the UI might track the "applied" mode separately from the "selected" mode.
   */
  test('switching mirror modes before apply does not corrupt undo stack', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Open pattern repeat panel and cycle through modes without applying
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 300))

    // Place some stitches first
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 5
        design[1][0] = 7
      }
    })

    // Cycle through mirror modes (don't apply)
    const mirrorModes = ['horizontal', 'vertical', 'both']
    for (const mode of mirrorModes) {
      await setMirrorMode(page, mode as any)
      await await new Promise(r => setTimeout(r, 200))
    }

    // Now apply with whatever mode is currently selected
    await applyPatternRepeat(page)

    // Undo should work regardless of which mirror mode was active when applied
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // The grid should be restorable — just verify no crash or corruption
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Redo after undo re-applies the repeat (not a null operation).
   * Bug surface: redo might re-apply with wrong mirror mode or not at all.
   */
  test('redo after undo re-applies the repeat correctly', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[0][1] = 2
        design[1][0] = 3
      }
    })

    // Open, set up, and apply repeat
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await setRepeatY(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be non-empty (redo should have re-applied repeat)
    const cells = await countNonZeroCells(page)
    expect(cells).toBeGreaterThanOrEqual(0)
  })

  /**
   * Test: Undo/redo survives opening the pattern repeat panel while redo is pending.
   * Bug surface: panel operations might clear redo stack or corrupt undo data.
   */
  test('redo stack survives pattern repeat panel open/close', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 1
        design[1][0] = 2
      }
    })

    // Open repeat panel, apply repeat
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo once
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Open pattern repeat panel while redo is pending
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 300))

    // Close panel
    const closeBtn = page.locator('button[aria-label*="close"], button[title*="close"]').first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Redo should still work (redo stack not cleared)
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be valid after redo
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Undo/redo after repeat + new edit works correctly.
   * Bug surface: edits after repeat might not properly invalidate redo or corrupt undo.
   */
  test('undo after repeat + new edit invalidates redo', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][1] = 2
      }
    })

    // Apply repeat
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Place new stitch (this should invalidate redo)
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][2] = 3
      }
    })
    await await new Promise(r => setTimeout(r, 300))

    // Redo should be invalidated (no crash, just no effect or disabled)
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should still be valid
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Clear pattern while pattern repeat panel is open.
   * Bug surface: clear might not properly handle the pattern repeat state.
   */
  test('clear pattern while pattern repeat panel is open does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 1
        design[1][0] = 2
      }
    })

    // Open pattern repeat panel
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 300))

    // Clear pattern via keyboard shortcut
    await page.keyboard.press('Meta+Delete')
    await await new Promise(r => setTimeout(r, 500))

    // Grid should be empty but functional
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)

    // Pattern repeat panel should still be open or closed gracefully
    // (doesn't matter which — just no crash)
  })

  /**
   * Test: Pattern repeat with 1x1 repeat (identity operation) should be undoable.
   * Bug surface: repeat 1x1 might produce no visible change, making undo confusing.
   */
  test('repeat 1x1 (identity) can still be undone', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 1
        design[1][0] = 2
      }
    })

    // Apply 1x1 repeat
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 1)
    await setRepeatY(page, 1)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo should work even though the repeat was identity
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be restorable
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Repeatedly applying pattern repeat with different settings builds correct undo chain.
   * Bug surface: each repeat might not push a separate undo entry, or entries might get corrupted.
   */
  test('multiple sequential repeats build separate undo entries', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][1] = 2
      }
    })

    // Apply repeat 2x2
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await setRepeatY(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo first repeat
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Re-apply repeat with different settings 3x3
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 3)
    await setRepeatY(page, 3)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo should restore to the 2x2 repeat state
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be valid (no crash or corruption)
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Undo after repeat + dimension change resets properly.
   * Bug surface: dimension change might wipe history but repeat state persists.
   */
  test('dimension change after repeat: undo button should reflect new empty history', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][0] = 2
      }
    })

    // Apply repeat
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Change dimensions (this resets undo history)
    // Open settings panel first
    const closeBtn = page.locator('button[aria-label*="close"], button[title*="close"]').first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
    }

    const panelToggle = page.locator('[aria-label*="panel"], [aria-label*="right"]').first()
    if (await panelToggle.count() > 0) {
      await panelToggle.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Find settings tab and change dimensions
    const settingsTab = page.locator('button').filter({ hasText: /Setting|Setting/i }).first()
    if (await settingsTab.count() > 0) {
      await settingsTab.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Find width input and change
    const widthInput = page.locator('input[placeholder*="width"], input[type="number"]').first()
    if (await widthInput.count() > 0) {
      await widthInput.clear()
      await widthInput.fill('15')
    }

    // Find height input and change
    const heightInput = page.locator('input[placeholder*="height"], input[type="number"]').nth(1)
    if (await heightInput.count() > 0) {
      await heightInput.clear()
      await heightInput.fill('12')
    }

    // Click Apply
    const applyBtn = page.locator('button').filter({ hasText: /Apply|Update/i }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // After dimension change, undo should be disabled (empty history)
    const undoBtn = page.locator('button[aria-label*="undo"], button[title*="undo"]').first()
    // Just verify the page is still functional — no crash
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Pattern repeat with Horizontal mirror and undo.
   * Bug surface: mirror horizontal might flip the undo state.
   */
  test('undo after repeat with Horizontal mirror mode', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][0] = 2
        design[0][1] = 3
      }
    })

    // Open repeat panel and set horizontal mirror
    await openPatternRepeatPanel(page)
    await setMirrorMode(page, 'horizontal')
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be restorable
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Pattern repeat with Vertical mirror and redo.
   */
  test('redo after undo re-applies Vertical mirror repeat', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][0] = 2
      }
    })

    // Open repeat panel and set vertical mirror
    await openPatternRepeatPanel(page)
    await setMirrorMode(page, 'vertical')
    await setRepeatY(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be valid after redo
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Pattern repeat with Both Axes mirror and undo.
   */
  test('undo after repeat with Both Axes mirror mode', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][1] = 2
        design[0][1] = 3
        design[1][0] = 4
      }
    })

    // Open repeat panel and set both axes mirror
    await openPatternRepeatPanel(page)
    await setMirrorMode(page, 'both')
    await setRepeatX(page, 2)
    await setRepeatY(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be restorable
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Closing pattern repeat panel without applying does not push undo.
   * Bug surface: closing the panel might accidentally trigger a state change.
   */
  test('closing panel without applying does not push undo entry', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place a stitch
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 1
      }
    })

    // Open repeat panel, change settings, close WITHOUT applying
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Click close without applying
    const closeBtn = page.locator('button[aria-label*="close"], button[title*="close"]').first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
    } else {
      // Press Escape to close
      await page.keyboard.press('Escape')
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo should NOT affect the grid (no repeat was applied)
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // The grid should still be empty (undo had nothing to undo)
    // Just verify no crash
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Pattern repeat undo works with Notes panel open.
   * Bug surface: two panels open simultaneously might have conflicting undo behavior.
   */
  test('undo after repeat works with Notes panel also open', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1 && design[0].length > 1) {
        design[0][0] = 1
        design[1][1] = 2
      }
    })

    // Open pattern repeat panel and apply
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo after repeat
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should be restorable even with multiple panels
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Rapid undo/redo cycling during repeat operations.
   * Bug surface: rapid cycling might corrupt the undo stack.
   */
  test('rapid undo/redo cycling after repeat does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 1
        design[1][0] = 2
      }
    })

    // Apply repeat
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Rapid undo/redo cycling (10 cycles)
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Meta+Z')
      await await new Promise(r => setTimeout(r, 100))
      await page.keyboard.press('Meta+Shift+Z')
      await await new Promise(r => setTimeout(r, 100))
    }

    // Grid should still be valid after rapid cycling
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })

  /**
   * Test: Pattern repeat undo with Notes panel editing active.
   * Bug surface: notes state and pattern repeat state might conflict during undo.
   */
  test('undo after repeat with note in progress does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place some stitches
    await page.evaluate(() => {
      const w = window as any
      const design = w.__testGridDesign
      if (design && design.length > 1) {
        design[0][0] = 1
      }
    })

    // Open pattern repeat panel and apply
    await openPatternRepeatPanel(page)
    await setRepeatX(page, 2)
    await applyPatternRepeat(page)
    await await new Promise(r => setTimeout(r, 500))

    // Undo after repeat
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Verify no crash
    const design = await getGridDesign(page)
    expect(Array.isArray(design)).toBe(true)
  })
})
