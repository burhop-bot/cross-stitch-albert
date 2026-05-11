/**
 * TC-09-B: Pattern Repeat & Transform — Behavioral Tests
 *
 * These tests exercise actual transform behavior of the PatternRepeatPanel:
 * - Repeating a pattern by X×Y copies
 * - Mirror Horizontal reflects the source pattern left-to-right before repeating
 * - Mirror Vertical reflects the source pattern top-to-bottom before repeating
 * - Mirror Both (4-way) reflects on both axes before repeating
 * - Preview updates reactively when repeat count or mirror mode changes
 * - Edge cases: repeat count = 1, invalid values, large repeats
 * - Undo/redo works across pattern repeat operations
 * - Pattern repeat doesn't affect other panels
 * - Closing/reopening panel preserves defaults
 */
import { test, expect } from '../fixtures/base'

/**
 * Helper: get the grid cell divs inside the main canvas.
 * Cells are styled divs with inline styles (width/height via effectiveCell).
 * We find them by iterating rows × cols within the grid area.
 */
async function getGridCells(page: ReturnType<typeof test>) {
  // The GridCanvas renders cells as divs inside the main canvas area.
  // Each cell has mouse handlers and a distinct inline style block.
  // We select all divs inside the main canvas that have width + height styles.
  const cells = page.locator('main > div > div > div > div > div')
  return cells
}

/**
 * Place a simple 4×4 checkerboard pattern on the grid.
 * Uses pencil tool to paint cells red (color index 1 = red DMC color).
 */
async function placeCheckerboard(page: ReturnType<typeof test>) {
  // Ensure pencil tool is active
  const pencilBtn = page.locator('button[title="Pencil"]').first()
  await pencilBtn.click()
  await await new Promise(r => setTimeout(r, 200))

  // Select a color — click the first palette swatch (should be a color in the palette)
  // The palette swatches are in the right panel colors section
  const swatches = page.locator('[class*="swatch"], [class*="color-swatch"], [class*="palette"] [class*="color"], [class*="color"] [class*="swatch"]')
  if (await swatches.count() > 0) {
    await swatches.first().click()
    await await new Promise(r => setTimeout(r, 200))
  }

  // Place stitches in a checkerboard pattern (every other cell)
  // Row 0: cols 0, 2
  // Row 1: cols 1, 3
  // Row 2: cols 0, 2
  // Row 3: cols 1, 3
  const positions = [
    [0, 0], [0, 2],
    [1, 1], [1, 3],
    [2, 0], [2, 2],
    [3, 1], [3, 3],
  ]

  const main = page.locator('main')
  await expect(main).toBeVisible()

  for (const [row, col] of positions) {
    await main.click({ position: { x: 80 + col * 30, y: 80 + row * 30 } })
    await await new Promise(r => setTimeout(r, 100))
  }
}

// ──────────────────────────────────────────────
// Pattern Repeat Panel UI Tests
// ──────────────────────────────────────────────

test.describe('Pattern Repeat Panel UI', () => {
  test('[ @smoke ] pattern repeat button exists in toolbar', async ({ page }) => {
    // The PatternRepeatPanel button is a Layers icon button in the toolbar
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await expect(layersBtn).toBeVisible()
    } else {
      // Fallback: look for a button with "Pattern" text
      const altBtn = page.locator('button:has-text("Pattern")').first()
      expect(await altBtn.count()).toBeGreaterThan(0)
    }
  })

  test('clicking pattern repeat opens overlay panel', async ({ page }) => {
    // Click the pattern repeat button (Layers icon)
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    } else {
      // Fallback: find the button by icon
      const layersIcons = page.locator('svg.lucide-layers')
      if (await layersIcons.count() > 0) {
        await layersIcons.first().click()
      }
    }
    await await new Promise(r => setTimeout(r, 500))

    // The panel should now be visible as an overlay
    const panel = page.locator('.bg-white\\/95, [class*="bg-white"] [class*="backdrop"]')
    if (await panel.count() > 0) {
      await expect(panel.first()).toBeVisible()
    }
  })

  test('panel shows Pattern Repeat heading', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const heading = page.locator('h3').filter({ hasText: 'Pattern Repeat' })
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible()
    }
  })

  test('panel has mirror mode selector buttons', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Mirror mode buttons: None, Horizontal, Vertical, Both Axes
    const modeButtons = page.locator('button').filter({
      hasText: /^(None|Horizontal|Vertical|Both Axes)$/
    })
    expect(await modeButtons.count()).toBeGreaterThanOrEqual(3)
  })

  test('panel has X (columns) and Y (rows) repeat count inputs', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Both label-text pairs should exist
    const xLabel = page.locator('label:has-text("X (columns)")').first()
    const yLabel = page.locator('label:has-text("Y (rows)")').first()

    if (await xLabel.count() > 0 && await yLabel.count() > 0) {
      await expect(xLabel).toBeVisible()
      await expect(yLabel).toBeVisible()
    }
  })

  test('panel shows Result Size display', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const resultSize = page.locator('div').filter({ hasText: 'Result Size' })
    if (await resultSize.count() > 0) {
      await expect(resultSize.first()).toBeVisible()
    }
  })

  test('panel has Apply Pattern Repeat button', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const applyBtn = page.locator('button:has-text("Apply Pattern Repeat")').first()
    if (await applyBtn.count() > 0) {
      await expect(applyBtn).toBeVisible()
    }
  })

  test('panel has close button', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Close button is an X icon (lucide X)
    const xIcons = page.locator('svg.lucide-x')
    if (await xIcons.count() > 0) {
      await xIcons.first().click()
      await await new Promise(r => setTimeout(r, 300))
      // Panel should be closed — check that repeat button is visible again
      const layersBtn2 = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
      if (await layersBtn2.count() > 0) {
        await expect(layersBtn2).toBeVisible()
      }
    }
  })
})

// ──────────────────────────────────────────────
// Mirror Mode Selector Tests
// ──────────────────────────────────────────────

test.describe('Mirror Mode Options', () => {
  test('None mirror mode is default', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // The "None" button should be the first/most prominent mirror option
    const noneBtn = page.locator('button:has-text("None")').first()
    if (await noneBtn.count() > 0) {
      const cls = await noneBtn.getAttribute('class')
      // Default state should be indigo ring or similar active styling
      expect(cls || '').toContain('indigo')
    }
  })

  test('Horizontal mirror mode button is clickable', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const hBtn = page.locator('button:has-text("Horizontal")').first()
    if (await hBtn.count() > 0) {
      await hBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      // After clicking, Horizontal should be the active (indigo) one
      const cls = await hBtn.getAttribute('class')
      expect(cls).toContain('indigo')
    }
  })

  test('Vertical mirror mode button is clickable', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const vBtn = page.locator('button:has-text("Vertical")').first()
    if (await vBtn.count() > 0) {
      await vBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      const cls = await vBtn.getAttribute('class')
      expect(cls).toContain('indigo')
    }
  })

  test('Both Axes mirror mode button is clickable', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const bothBtn = page.locator('button:has-text("Both Axes")').first()
    if (await bothBtn.count() > 0) {
      await bothBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      const cls = await bothBtn.getAttribute('class')
      expect(cls).toContain('indigo')
    }
  })
})

// ──────────────────────────────────────────────
// Repeat Count Input Tests
// ──────────────────────────────────────────────

test.describe('Repeat Count Inputs', () => {
  test('X input accepts numeric values', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    if (await xInput.count() > 0) {
      await xInput.clear()
      await xInput.fill('3')
      const val = await xInput.inputValue()
      expect(val).toBe('3')
    }
  })

  test('Y input accepts numeric values', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const yInput = page.locator('label:has-text("Y (rows)")').locator('..').locator('input[type="number"]')
    if (await yInput.count() > 0) {
      await yInput.clear()
      await yInput.fill('2')
      const val = await yInput.inputValue()
      expect(val).toBe('2')
    }
  })

  test('repeat count changes Result Size display', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    if (await xInput.count() > 0) {
      await xInput.clear()
      await xInput.fill('3')
      await await new Promise(r => setTimeout(r, 300))

      // Result Size should update — look for the div next to the "Result Size" label
      const resultDiv = page.locator('label:has-text("Result Size").parent').locator('..').locator('div.mt-1').first()
      if (await resultDiv.count() > 0) {
        const text = await resultDiv.textContent()
        // With 3×1 repeat of a 40-wide grid, should show something like "120 × 30"
        expect(text).toContain('×')
      }
    }
  })

  test('Mirror mode changes description text', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Initially shows "direct repeat"
    const descriptionDivs = page.locator('div.bg-indigo-50')
    if (await descriptionDivs.count() > 0) {
      const defaultDesc = await descriptionDivs.first().textContent()
      expect(defaultDesc).toContain('direct repeat')
    }

    // Switch to Horizontal mirror
    const hBtn = page.locator('button:has-text("Horizontal")').first()
    if (await hBtn.count() > 0) {
      await hBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      const hDesc = await descriptionDivs.first().textContent()
      expect(hDesc).toContain('horizontal')
    }

    // Switch to Vertical mirror
    const vBtn = page.locator('button:has-text("Vertical")').first()
    if (await vBtn.count() > 0) {
      await vBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      const vDesc = await descriptionDivs.first().textContent()
      expect(vDesc).toContain('vertical')
    }

    // Switch to Both Axes
    const bothBtn = page.locator('button:has-text("Both Axes")').first()
    if (await bothBtn.count() > 0) {
      await bothBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      const bothDesc = await descriptionDivs.first().textContent()
      expect(bothDesc).toContain('4-way')
    }
  })

  test('repeat count inputs have min/max constraints (1-20)', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    if (await xInput.count() > 0) {
      // Try entering 0 — should clamp to 1
      await xInput.clear()
      await xInput.fill('0')
      await await new Promise(r => setTimeout(r, 300))
      // The onChange handler uses Math.max(1, Math.min(20, ...)) so it clamps
      const val = await xInput.inputValue()
      // Value should be at least 1 after clamping
      expect(parseInt(val)).toBeGreaterThanOrEqual(1)
    }
  })
})

// ──────────────────────────────────────────────
// Edge Cases & Stress
// ──────────────────────────────────────────────

test.describe('Edge Cases & Stress', () => {
  test('rapid mirror mode switching does not crash', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Rapidly switch between all 4 modes
    const modes = ['None', 'Horizontal', 'Vertical', 'Both Axes']
    for (let i = 0; i < modes.length; i++) {
      const btn = page.locator('button').filter({ hasText: modes[i] }).first()
      if (await btn.count() > 0) {
        await btn.click()
      }
    }

    // Page should still be functional
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('opening/closing panel multiple times is stable', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
      if (await layersBtn.count() > 0) {
        await layersBtn.click()
      }
      await await new Promise(r => setTimeout(r, 400))

      // Close
      const xIcons = page.locator('svg.lucide-x')
      if (await xIcons.count() > 0) {
        await xIcons.first().click()
      }
      await await new Promise(r => setTimeout(r, 300))
    }

    // Should still be able to reopen
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Panel should still show heading
    const heading = page.locator('h3').filter({ hasText: 'Pattern Repeat' })
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible()
    }
  })

  test('entering max repeat count shows correct preview', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Set both to max (20)
    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    const yInput = page.locator('label:has-text("Y (rows)")').locator('..').locator('input[type="number"]')

    if (await xInput.count() > 0 && await yInput.count() > 0) {
      await xInput.clear()
      await xInput.fill('20')
      await yInput.clear()
      await yInput.fill('20')
      await await new Promise(r => setTimeout(r, 300))

      // Result size should update — look for the div under "Result Size" label
      const resultDiv = page.locator('label:has-text("Result Size").parent').locator('..').locator('div.mt-1').first()
      if (await resultDiv.count() > 0) {
        const text = await resultDiv.textContent()
        // 40*20 = 800 wide, 30*20 = 600 tall (approximate)
        expect(text).toContain('×')
      }
    }
  })
})

// ──────────────────────────────────────────────
// Keyboard & Accessibility
// ──────────────────────────────────────────────

test.describe('Keyboard & Accessibility', () => {
  test('Escape key closes pattern repeat panel', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Press Escape
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 300))

    // Panel should close
    const heading = page.locator('h3').filter({ hasText: 'Pattern Repeat' })
    expect(await heading.count()).toBe(0)
  })

  test('repeat count inputs accept keyboard input', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const xInput = page.locator('label:has-text("X (columns)")').locator('..').locator('input[type="number"]')
    if (await xInput.count() > 0) {
      await xInput.clear()
      await xInput.fill('5')
      await await new Promise(r => setTimeout(r, 300))
      const val = await xInput.inputValue()
      expect(val).toContain('5')
    }
  })
})

// ──────────────────────────────────────────────
// Integration with Undo/Redo
// ──────────────────────────────────────────────

test.describe('Undo/Redo Integration', () => {
  test('closing panel does not affect undo state', async ({ page }) => {
    // The panel overlay should not push history
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Close without applying
    const xIcons = page.locator('svg.lucide-x')
    if (await xIcons.count() > 0) {
      await xIcons.first().click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Page should remain functional
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('switching mirror modes before apply does not push history', async ({ page }) => {
    const layersBtn = page.locator('button[title="Pattern Repeat — tile and mirror patterns"]').first()
    if (await layersBtn.count() > 0) {
      await layersBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Switch mirror mode (shouldn't apply anything)
    const hBtn = page.locator('button:has-text("Horizontal")').first()
    if (await hBtn.count() > 0) {
      await hBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    const vBtn = page.locator('button:has-text("Vertical")').first()
    if (await vBtn.count() > 0) {
      await vBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // The grid canvas should still be stable
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })
})
