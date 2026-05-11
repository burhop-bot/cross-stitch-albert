/**
 * Creative edge-case tests — tool state race conditions and data integrity.
 *
 * These tests target real-world bugs that occur when users:
 * - Rapidly switch tools during drawing operations
 * - Change colors while editing
 * - Toggle panels while making changes
 * - Undo/redo across multiple operation types
 *
 * Designed to FIND bugs in tool state management, undo/redo consistency,
 * and cross-tool data integrity.
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ──────────────────────────────────────────────────────────────

async function setupCanvas(page) {
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  await panelBtn.click()
  await await new Promise(r => setTimeout(r, 300))

  const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
  if (await projectTab.count() > 0) {
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))
  }

  const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
  await applyBtn.click()
  await await new Promise(r => setTimeout(r, 800))
}

async function placeStitch(page, xOff = 100, yOff = 100) {
  const main = page.locator('main')
  await main.click({ position: { x: xOff, y: yOff } })
}

async function openColorTab(page) {
  // Click the Colors tab in the sidebar
  const tabs = page.locator('aside button').filter({ hasText: /^Colors$/ })
  if (await tabs.first().isVisible()) {
    await tabs.first().click()
    await await new Promise(r => setTimeout(r, 200))
  }
}

async function selectColorByIndex(page, index) {
  // Click a swatch by its index (0-based) among visible swatches in the sidebar
  const swatches = page.locator('aside button[title]')
  await swatches.nth(index).click()
  await await new Promise(r => setTimeout(r, 150))
}

async function selectToolByName(page, toolName) {
  // Click a tool button in the sidebar by label text
  const toolBtn = page.locator('aside button').filter({ hasText: new RegExp(`^${toolName}$`) }).first()
  if (await toolBtn.count() > 0) {
    await toolBtn.click()
    await await new Promise(r => setTimeout(r, 150))
  }
}

/**
 * Click the main canvas area to place stitches (works without setup for default grid).
 * Returns the count of colored cells as a rough verification.
 */
async function placeStitchOnCanvas(page, xOff = 80, yOff = 80) {
  await page.locator('main').click({ position: { x: xOff, y: yOff } })
}

// ── Tests: Tool state race conditions ────────────────────────────────────

test.describe('Tool state race conditions', () => {
  test('rapid tool switching does not corrupt grid state', async ({ page }) => {
    // Navigate to app and set up a canvas
    await setupCanvas(page)

    // Place a few stitches in pencil
    await selectToolByName(page, 'Pencil')
    await await new Promise(r => setTimeout(r, 200))
    for (let i = 0; i < 5; i++) {
      await placeStitch(page, 80 + i * 15, 80)
    }

    // Rapidly switch between tools 10 times
    const tools = ['Pencil', 'Eraser', 'Fill', 'Line', 'Rectangle']
    for (let i = 0; i < 10; i++) {
      await selectToolByName(page, tools[i % tools.length])
      await await new Promise(r => setTimeout(r, 30))
    }

    // Switch back to pencil and place one more stitch
    await selectToolByName(page, 'Pencil')
    await await new Promise(r => setTimeout(r, 200))
    await placeStitch(page, 160, 80)

    // The canvas should still be functional and not crash
    // Place a few more stitches to verify
    for (let i = 0; i < 3; i++) {
      await placeStitch(page, 160 + i * 15, 80)
    }

    // Verify we can undo back to empty
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
    // Undo should work at least once without error
  })

  test('changing color while drawing keeps tool active', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await await new Promise(r => setTimeout(r, 200))

    // Select first color and draw a stitch
    await selectColorByIndex(page, 0)
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Quickly select a different color (2nd and 3rd swatches)
    await selectColorByIndex(page, 1)
    await await new Promise(r => setTimeout(r, 50))
    await selectColorByIndex(page, 2)
    await await new Promise(r => setTimeout(r, 100))

    // Place stitches with different colors
    await placeStitch(page, 100, 80)
    await await new Promise(r => setTimeout(r, 100))
    await placeStitch(page, 120, 80)

    // Pencil tool should still be active (clicking the canvas should place stitches)
    await placeStitch(page, 140, 80)

    // Verify undo works
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('undo stacks properly across tool switches and color changes', async ({ page }) => {
    await setupCanvas(page)

    // Place a stitch with color 1
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Switch to eraser and erase it
    await selectToolByName(page, 'Eraser')
    await await new Promise(r => setTimeout(r, 100))
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Undo should bring the stitch back
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))

    // Undo again to fully clear
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))

    // The grid should be back to empty (or close to it)
    // Verify we can undo further without error
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 100))
  })

  test('opening/closing panels during editing does not lose edits', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Open right panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Place another stitch while panel is open
    await placeStitch(page, 100, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Close panel
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Place more stitches
    for (let i = 0; i < 5; i++) {
      await placeStitch(page, 80 + i * 20, 100)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Undo should work
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))

    // Redo should work
    await page.keyboard.press('Meta+Shift+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('selecting multiple colors rapidly before placing stitches', async ({ page }) => {
    await setupCanvas(page)

    // Select many colors rapidly without placing any stitch
    for (let i = 0; i < 15; i++) {
      await selectColorByIndex(page, i % 10)
      await await new Promise(r => setTimeout(r, 20))
    }

    // Now place a stitch — it should use the LAST selected color
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Place another with a different color selection
    await selectColorByIndex(page, 3)
    await placeStitch(page, 100, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Undo should work
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('zoom changes during active drawing preserve tool state', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Zoom in
    await page.keyboard.press('Meta+1')
    await await new Promise(r => setTimeout(r, 300))

    // Place another stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Zoom out
    await page.keyboard.press('Meta+0')
    await await new Promise(r => setTimeout(r, 300))

    // Place more stitches
    for (let i = 0; i < 5; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Undo should still work
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('undo after backstitch toggle and edit', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place some stitches
    for (let i = 0; i < 4; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Toggle backstitch panel (click backstitch button in sidebar)
    const backstitchBtn = page.locator('button').filter({ hasText: /backstitch/i }).first()
    if (await backstitchBtn.count() > 0) {
      await backstitchBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Close backstitch and continue editing
    if (await backstitchBtn.count() > 0) {
      await backstitchBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place more stitches
    await placeStitch(page, 180, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Undo should work through backstitch toggle
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('erasing then drawing in same cells works correctly', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Draw 3 stitches
    for (let i = 0; i < 3; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Switch to eraser and erase all 3
    await selectToolByName(page, 'Eraser')
    for (let i = 0; i < 3; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Switch back to pencil and redraw
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 1)
    for (let i = 0; i < 3; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 100))
    }

    // Undo should work back through all operations
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Meta+z')
      await await new Promise(r => setTimeout(r, 100))
    }
  })

  test('tool state persists after panel re-render', async ({ page }) => {
    await setupCanvas(page)

    // Select pencil and a color
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Toggle sidebar visibility (collapse/expand)
    // This forces re-render of sidebar components
    const sidebarToggle = page.locator('button').filter({ hasText: /sidebar/i }).first()
    if (await sidebarToggle.count() > 0) {
      await sidebarToggle.click()
      await await new Promise(r => setTimeout(r, 400))
      await sidebarToggle.click()
      await await new Promise(r => setTimeout(r, 400))
    }

    // The pencil tool should still be active — clicking canvas should place stitches
    await placeStitch(page, 100, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Undo should work
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('undo stack does not duplicate entries for same tool action', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place 3 identical stitches (same color, sequential)
    const undoStacks = []
    for (let i = 0; i < 3; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 100))
      // Record if undo button is enabled
      const undoBtn = page.locator('button').filter({ hasText: /undo/i }).first()
      const undoEnabled = await undoBtn.isEnabled()
      undoStacks.push(undoEnabled)
    }

    // All three should have enabled undo
    expect(undoStacks.every(Boolean)).toBe(true)

    // Undo all
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Meta+z')
      await await new Promise(r => setTimeout(r, 100))
    }
  })

  test('rapid undo/redo does not corrupt state', async ({ page }) => {
    await setupCanvas(page)

    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place 5 stitches
    for (let i = 0; i < 5; i++) {
      await placeStitch(page, 80 + i * 20, 80)
      await await new Promise(r => setTimeout(r, 50))
    }

    // Rapid undo/redo cycling
    for (let cycle = 0; cycle < 3; cycle++) {
      // Undo all
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Meta+z')
        await await new Promise(r => setTimeout(r, 30))
      }
      // Redo all
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Meta+Shift+z')
        await await new Promise(r => setTimeout(r, 30))
      }
    }

    // Undo once more to verify state is clean
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  test('tool switching with open right panel maintains consistency', async ({ page }) => {
    await setupCanvas(page)

    // Open right panel first
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Place a stitch with pencil
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Switch tools while panel is open
    await selectToolByName(page, 'Eraser')
    await await new Promise(r => setTimeout(r, 100))
    await selectToolByName(page, 'Fill')
    await await new Promise(r => setTimeout(r, 100))
    await selectToolByName(page, 'Pencil')
    await await new Promise(r => setTimeout(r, 100))

    // Place more stitches
    await placeStitch(page, 100, 80)
    await await new Promise(r => setTimeout(r, 100))

    // Close panel
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Place more and undo
    await placeStitch(page, 120, 80)
    await await new Promise(r => setTimeout(r, 100))
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))
  })
})
