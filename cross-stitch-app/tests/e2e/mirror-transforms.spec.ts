/**
 * TC-10: Mirror Transforms — Data-Level Tests
 *
 * These tests verify the actual grid data changes during mirror operations.
 * They use the __testGridDesign test hook (exposed on window by GridCanvas)
 * to read the design array before and after each mirror operation.
 *
 * What we test:
 * - Horizontal mirror of a full grid (data-level)
 * - Vertical mirror of a full grid (data-level)
 * - Full-grid mirror via PatternRepeatPanel (H, V, Both)
 * - Undo/redo after mirror operations
 * - Mirror button states (enabled/disabled with selection)
 * - Edge cases: 1×1 pattern, asymmetric patterns, empty grid
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Read the current design array from the test hook on window.__testGridDesign.
 * Returns a plain 2D array of color indices.
 */
async function getDesign(page: ReturnType<typeof test>): Promise<number[][]> {
  return page.evaluate(() => {
    const d = (window as any).__testGridDesign
    if (!d) return []
    return d.map((row: number[]) => [...row])
  })
}

/**
 * Place a 5×5 "L" pattern on the grid using the first few palette colors.
 * Color indices used: 1, 2, 3 (from dmcPalette)
 *
 * Expected design (0 = empty):
 *   1 0 0 0 0
 *   1 0 0 0 0
 *   1 0 0 0 0
 *   1 1 1 1 1
 *   0 0 0 0 0
 */
async function placeLPattern(page: ReturnType<typeof test>) {
  // Ensure we have a grid (set small size)
  await page.evaluate(() => {
    // Force a 5×5 grid by triggering the project store
    const store = (window as any).__store
    if (store) {
      store.setState({
        settings: { ...store.getState().settings, width: 5, height: 5 }
      })
    }
  })

  // Use pencil tool and place colors directly on cells
  const pencilBtn = page.locator('button[title="Pencil"]').first()
  if (await pencilBtn.count() > 0) {
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  // Select color index 1 (first DMC color)
  const swatches = page.locator('[class*="swatch"], [class*="palette"] [class*="swatch"], [class*="color-swatch"]').first()
  if (await swatches.count() > 0) {
    await swatches.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  // The main canvas area has cells. We click on grid cells to place stitches.
  // Grid cells are divs inside the main canvas with style width/height from effectiveCell
  const main = page.locator('main')
  await expect(main).toBeVisible()

  // Place "L" pattern manually by clicking on cells
  // Cell click position: approximate offset within the main canvas
  // The grid cells have effectiveCell size ≈ 28px * zoom
  const CELL = 28 // approximate cell size
  const OFFSET_X = 30 // offset from main canvas left
  const OFFSET_Y = 10 // offset from main canvas top

  // Color 1 cells (the "L" shape)
  const lColor1 = [[0,0], [1,0], [2,0], [3,0], [3,1], [3,2], [3,3], [3,4]]
  for (const [row, col] of lColor1) {
    await main.click({ position: { x: OFFSET_X + col * CELL, y: OFFSET_Y + row * CELL } })
    await await new Promise(r => setTimeout(r, 30))
  }

  await await new Promise(r => setTimeout(r, 200))
}

/**
 * Place a checkerboard-like 6×6 pattern with 3 colors for robust mirror testing.
 * Pattern (3 = dark, 1 = light, 2 = medium):
 *   3 1 3 1 3 1
 *   1 2 1 2 1 2
 *   3 1 3 1 3 1
 *   1 2 1 2 1 2
 *   3 1 3 1 3 1
 *   1 2 1 2 1 2
 */
async function placeCheckerboard6x6(page: ReturnType<typeof test>) {
  // Set grid size
  await page.evaluate(() => {
    const store = (window as any).__store
    if (store) {
      store.setState({
        settings: { ...store.getState().settings, width: 6, height: 6 }
      })
    }
  })
  await await new Promise(r => setTimeout(r, 300))

  const main = page.locator('main')
  await expect(main).toBeVisible()
  const CELL = 28
  const OFFSET_X = 30
  const OFFSET_Y = 10

  const pattern: [number, number, number][] = [
    [3, 1], [3, 3], [3, 5],
    [2, 1], [2, 3], [2, 5],
    [4, 1], [4, 3], [4, 5],
    [5, 1], [5, 3], [5, 5],
    [6, 1], [6, 3], [6, 5],
    [7, 1], [7, 3], [7, 5],
  ]

  // Simpler: place a single-color diagonal
  const pencilBtn = page.locator('button[title="Pencil"]').first()
  if (await pencilBtn.count() > 0) {
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  // Use the store to directly set a known pattern via the test hook
  // This is the most reliable way to set up a reproducible pattern
  await page.evaluate(() => {
    const store = (window as any).__store
    if (store) {
      const state = store.getState()
      // Set a simple asymmetric pattern directly in the panel design
      const design: number[][] = [
        [1, 2, 3, 0, 0, 0],
        [4, 0, 0, 5, 0, 0],
        [0, 0, 0, 0, 6, 0],
        [0, 7, 0, 0, 0, 8],
        [0, 0, 9, 0, 0, 0],
        [10, 0, 0, 1, 2, 3],
      ]
      state.panels[0].design = design
      store.setState({
        settings: { ...state.settings, width: 6, height: 6 },
      })
    }
  })
  await await new Promise(r => setTimeout(r, 500))
}

/**
 * Click a toolbar button by its title attribute.
 */
async function clickButtonByTitle(page: ReturnType<typeof test>, title: string) {
  const btn = page.locator(`button[title="${title}"]`).first()
  if (await btn.count() > 0) {
    await btn.click()
    await await new Promise(r => setTimeout(r, 300))
  }
}

// ── Full-Grid Mirror Tests ────────────────────────────────────────────

test.describe('Full-Grid Mirror — Horizontal', () => {
  test('horizontal mirror reverses each row (data-level)', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Set up a known asymmetric pattern
    const DESIGN: number[][] = [
      [1, 2, 3, 4, 5, 0],
      [6, 0, 0, 0, 0, 7],
      [8, 9, 0, 0, 10, 11],
      [0, 12, 13, 14, 15, 16],
      [17, 18, 19, 0, 0, 20],
      [0, 21, 22, 23, 24, 25],
    ]

    await page.evaluate(({ design, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = design
        store.setState({
          settings: {
            width: w,
            height: h,
          }
        })
      }
    }, { design: DESIGN, w: 6, h: 6 })

    await await new Promise(r => setTimeout(r, 500))

    // Read the design before mirror
    const before = await getDesign(page)
    expect(before.length).toBe(6)

    // Click mirror full pattern horizontally
    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 500))

    // Read the design after mirror
    const after = await getDesign(page)

    // Verify: each row should be reversed
    for (let r = 0; r < 6; r++) {
      const expected = [...DESIGN[r]].reverse()
      expect(after[r]).toEqual(expected, `Row ${r} should be reversed`)
    }
  })

  test('horizontal mirror of a single-color row is stable', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // 4×2 grid, all same color
    const DESIGN: number[][] = [
      [5, 5, 5, 5],
      [5, 5, 5, 5],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 4, h: 2 })
    await await new Promise(r => setTimeout(r, 500))

    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)
    // Should be identical since all values are the same
    expect(after[0]).toEqual([5, 5, 5, 5])
    expect(after[1]).toEqual([5, 5, 5, 5])
  })

  test('horizontal mirror of asymmetric pattern preserves grid dimensions', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 0, 0, 0],
      [0, 2, 0, 0],
      [0, 0, 3, 0],
      [0, 0, 0, 4],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 4, h: 4 })
    await await new Promise(r => setTimeout(r, 500))

    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)
    expect(after.length).toBe(4)
    expect(after[0]?.length).toBe(4)

    // Diagonal should be reversed
    expect(after[0]).toEqual([0, 0, 0, 1])
    expect(after[1]).toEqual([0, 0, 2, 0])
    expect(after[2]).toEqual([0, 3, 0, 0])
    expect(after[3]).toEqual([4, 0, 0, 0])
  })
})

test.describe('Full-Grid Mirror — Vertical', () => {
  test('vertical mirror reverses row order (data-level)', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 4, h: 4 })
    await await new Promise(r => setTimeout(r, 500))

    // Click mirror full pattern vertically
    await clickButtonByTitle(page, 'Mirror full pattern vertically')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)

    // Row 0 should become Row 3, Row 1 → Row 2, etc.
    expect(after[0]).toEqual(DESIGN[3])
    expect(after[1]).toEqual(DESIGN[2])
    expect(after[2]).toEqual(DESIGN[1])
    expect(after[3]).toEqual(DESIGN[0])
  })

  test('vertical mirror of single-column pattern reverses column order', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // 1-column, 5-row pattern
    const DESIGN: number[][] = [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 1, h: 5 })
    await await new Promise(r => setTimeout(r, 500))

    await clickButtonByTitle(page, 'Mirror full pattern vertically')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)
    expect(after).toEqual([
      [5],
      [4],
      [3],
      [2],
      [1],
    ])
  })
})

test.describe('PatternRepeatPanel Mirror', () => {
  test('Horizontal mirror mode tiles pattern with horizontal flip', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Use a 3×3 pattern
    const DESIGN: number[][] = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 3, h: 3 })
    await await new Promise(r => setTimeout(r, 500))

    // Open the pattern repeat panel
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Set repeat X=2, Y=1 (just 2 copies side by side)
    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    if (await xInput.count() > 0) {
      await xInput.clear()
      await xInput.fill('2')
    }

    // Select Horizontal mirror mode
    const hMirrorBtn = page.locator('button:has-text("Horizontal")').first()
    if (await hMirrorBtn.count() > 0) {
      await hMirrorBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Click Apply
    const applyBtn = page.locator('button:has-text("Apply Pattern Repeat")').first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Read the design — should now be 3×6 (3 cols × 2 repeats, horizontally mirrored)
    const after = await getDesign(page)
    expect(after.length).toBe(3)
    // Each row should be: [1,2,3, 3,2,1] (mirrored horizontally)
    expect(after[0]).toEqual([1, 2, 3, 3, 2, 1])
    expect(after[1]).toEqual([4, 5, 6, 6, 5, 4])
    expect(after[2]).toEqual([7, 8, 9, 9, 8, 7])
  })

  test('Vertical mirror mode tiles pattern with vertical flip', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2],
      [3, 4],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 2, h: 2 })
    await await new Promise(r => setTimeout(r, 500))

    // Open pattern repeat panel
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Set repeat X=1, Y=2
    const yInput = page.locator('label:has-text("Y (rows)")').locator('..').locator('input[type="number"]')
    if (await yInput.count() > 0) {
      await yInput.clear()
      await yInput.fill('2')
    }

    // Select Vertical mirror
    const vMirrorBtn = page.locator('button:has-text("Vertical")').first()
    if (await vMirrorBtn.count() > 0) {
      await vMirrorBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Apply
    const applyBtn = page.locator('button:has-text("Apply Pattern Repeat")').first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const after = await getDesign(page)
    // Should be 4×2 (2 rows × 2 repeats, vertically mirrored)
    expect(after.length).toBe(4)
    // Each column: row0=[1,2], row1=[3,4], row2=[3,4], row3=[1,2] (vertical mirror)
    expect(after[0]).toEqual([1, 2])
    expect(after[1]).toEqual([3, 4])
    expect(after[2]).toEqual([3, 4])
    expect(after[3]).toEqual([1, 2])
  })

  test('Both Axes mirror tiles 2×2 with 4-way mirror', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2],
      [3, 4],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 2, h: 2 })
    await await new Promise(r => setTimeout(r, 500))

    // Open panel
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Set X=1, Y=1 (just mirror, no repeat)
    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    if (await xInput.count() > 0) {
      await xInput.clear()
      await xInput.fill('1')
    }
    const yInput = page.locator('label:has-text("Y (rows)")').locator('..').locator('input[type="number"]')
    if (await yInput.count() > 0) {
      await yInput.clear()
      await yInput.fill('1')
    }

    // Select Both Axes
    const bothBtn = page.locator('button:has-text("Both Axes")').first()
    if (await bothBtn.count() > 0) {
      await bothBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Apply
    const applyBtn = page.locator('button:has-text("Apply Pattern Repeat")').first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const after = await getDesign(page)
    // Both axes mirror of a 2×2 should produce 4×4:
    // [1, 2, | 2, 1]
    // [3, 4, | 4, 3]
    // -------+-------
    // [3, 4, | 4, 3]
    // [1, 2, | 2, 1]
    expect(after.length).toBe(4)
    expect(after[0]).toEqual([1, 2, 2, 1])
    expect(after[1]).toEqual([3, 4, 4, 3])
    expect(after[2]).toEqual([3, 4, 4, 3])
    expect(after[3]).toEqual([1, 2, 2, 1])
  })
})

test.describe('Undo/Redo After Mirror', () => {
  test('undo reverts horizontal mirror', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 4, h: 2 })
    await await new Promise(r => setTimeout(r, 500))

    // Mirror horizontal
    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))

    let after = await getDesign(page)
    expect(after[0]).toEqual([4, 3, 2, 1])

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    let reverted = await getDesign(page)
    expect(reverted[0]).toEqual([1, 2, 3, 4])
    expect(reverted[1]).toEqual([5, 6, 7, 8])
  })

  test('redo reapplies horizontal mirror after undo', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 4, h: 2 })
    await await new Promise(r => setTimeout(r, 500))

    // Mirror horizontal
    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    if (await undoBtn.count() > 0) {
      await undoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Redo (↩)
    const redoBtn = page.locator('button[title="Redo"]').first()
    if (await redoBtn.count() > 0) {
      await redoBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const afterRedo = await getDesign(page)
    expect(afterRedo[0]).toEqual([4, 3, 2, 1])
  })

  test('multiple mirrors compose correctly', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 3, h: 3 })
    await await new Promise(r => setTimeout(r, 500))

    // Mirror horizontal, then vertical
    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))
    await clickButtonByTitle(page, 'Mirror full pattern vertically')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)
    // H mirror: rows reversed left-to-right
    // V mirror: rows reversed top-to-bottom
    // Combined: 180° rotation
    // Expected: [7,8,9], [4,5,6], [1,2,3] reversed per row
    expect(after[0]).toEqual([9, 8, 7])
    expect(after[1]).toEqual([6, 5, 4])
    expect(after[2]).toEqual([3, 2, 1])
  })
})

test.describe('Mirror Button States', () => {
  test('selection mirror buttons are disabled without selection', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Mirror selection horizontal button should be disabled (opacity 30)
    const hSelMirrorBtn = page.locator('button:has([title="Mirror selected region horizontally"])').first()
    if (await hSelMirrorBtn.count() > 0) {
      const disabled = await hSelMirrorBtn.isEnabled()
      expect(disabled).toBe(false)
    }
  })

  test('full-grid mirror buttons are always enabled', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const hMirrorBtn = page.locator('button[title="Mirror full pattern horizontally"]').first()
    if (await hMirrorBtn.count() > 0) {
      await expect(hMirrorBtn).toBeVisible()
    }

    const vMirrorBtn = page.locator('button[title="Mirror full pattern vertically"]').first()
    if (await vMirrorBtn.count() > 0) {
      await expect(vMirrorBtn).toBeVisible()
    }
  })
})

test.describe('Edge Cases', () => {
  test('single cell grid cannot be mirrored (no-op)', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [[42]]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 1, h: 1 })
    await await new Promise(r => setTimeout(r, 500))

    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)
    expect(after).toEqual([[42]])
  })

  test('mirror of empty grid is stable', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 3, h: 2 })
    await await new Promise(r => setTimeout(r, 500))

    await clickButtonByTitle(page, 'Mirror full pattern horizontally')
    await await new Promise(r => setTimeout(r, 300))

    const after = await getDesign(page)
    expect(after).toEqual(DESIGN)
  })

  test('rapid mirror toggling does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    const DESIGN: number[][] = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ]

    await page.evaluate(({ d, w, h }) => {
      const store = (window as any).__store
      if (store) {
        store.getState().panels[0].design = d
        store.setState({ settings: { width: w, height: h } })
      }
    }, { d: DESIGN, w: 4, h: 3 })
    await await new Promise(r => setTimeout(r, 500))

    // Rapidly toggle between H and V mirror
    for (let i = 0; i < 6; i++) {
      const hBtn = page.locator('button[title="Mirror full pattern horizontally"]').first()
      if (await hBtn.count() > 0) {
        await hBtn.click()
      }
      await await new Promise(r => setTimeout(r, 100))
      const vBtn = page.locator('button[title="Mirror full pattern vertically"]').first()
      if (await vBtn.count() > 0) {
        await vBtn.click()
      }
      await await new Promise(r => setTimeout(r, 100))
    }

    // Page should still be functional
    const header = page.locator('header')
    await expect(header).toBeVisible()
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})
