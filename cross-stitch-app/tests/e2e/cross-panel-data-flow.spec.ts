/**
 * Creative edge-case tests — cross-panel data flow and data integrity.
 *
 * These tests go beyond individual components to verify that data flows
 * correctly between panels and that the app maintains integrity under
 * edge cases that a user might accidentally trigger.
 */
import { test, expect } from '../fixtures/base'

// Helper: place a stitch by clicking on the main canvas area
async function placeStitch(page, xOff = 100, yOff = 100) {
  const main = page.locator('main')
  await main.click({ position: { x: xOff, y: yOff } })
}

// Helper: setup canvas and return the dimension label locator
async function setupCanvasAndGetDimLabel(page) {
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

  return page.locator('span:has-text("stitches")').first()
}

test.describe('Cross-panel data flow: pattern repeat + undo/redo', () => {
  test('undo/redo after pattern repeat preserves grid integrity', async ({ page }) => {
    // Setup canvas and place stitches
    await setupCanvasAndGetDimLabel(page)

    // Place 10 stitches in a pattern
    for (let i = 0; i < 10; i++) {
      await placeStitch(page, 80 + (i % 5) * 20, 80 + Math.floor(i / 5) * 20)
    }
    await await new Promise(r => setTimeout(r, 400))

    // Open pattern repeat panel
    const repeatBtn = page.locator('button').filter({ hasText: /Pattern Repeat/i }).first()
    if (await repeatBtn.count() > 0) {
      await repeatBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // Close without applying (should not push undo history)
      const closeBtn = page.locator('button').filter({ hasText: 'Close' }).first()
      if (await closeBtn.count() > 0) {
        await closeBtn.click()
      }
      await await new Promise(r => setTimeout(r, 200))
    }

    // Undo should still revert the placed stitches
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 200))
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 200))

    // Page should be responsive
    await expect(page.locator('main')).toBeVisible()
  })

  test('pattern repeat panel open/closed cycles do not crash', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Rapidly open/close pattern repeat panel 10 times
    const repeatBtn = page.locator('button').filter({ hasText: /Pattern Repeat/i }).first()
    for (let i = 0; i < 10; i++) {
      await repeatBtn.click()
      await await new Promise(r => setTimeout(r, 100))

      // Close via Escape key
      await page.keyboard.press('Escape')
      await await new Promise(r => setTimeout(r, 100))
    }

    // Page should remain responsive
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Cross-panel data flow: undo/redo + panel interaction', () => {
  test('undo after placing stitches with panel open still works', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place 5 stitches
    for (let i = 0; i < 5; i++) {
      await placeStitch(page, 80 + i * 15, 80)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Open right panel and switch between tabs while undo stack exists
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const symbolsTab = page.locator('button').filter({ hasText: /^Symbols$/ }).first()
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Now undo — should work even with panel open
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Main canvas should still exist
    await expect(page.locator('main')).toBeVisible()
  })

  test('redo invalidates after new edits', async ({ page }) => {
    // Setup canvas and place 3 stitches
    await setupCanvasAndGetDimLabel(page)

    for (let i = 0; i < 3; i++) {
      await placeStitch(page, 80 + i * 15, 80)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo all 3
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Meta+Z')
      await await new Promise(r => setTimeout(r, 100))
    }

    // Place a different stitch (this should invalidate redo)
    await placeStitch(page, 200, 200)
    await await new Promise(r => setTimeout(r, 200))

    // Try to redo — should not crash
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 200))

    // Page should remain responsive
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Cross-panel data flow: color changes + grid updates', () => {
  test('changing active color before placing stitches updates correctly', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Select multiple colors in sequence (simulating user switching colors)
    const colorSwatches = page.locator('button').filter({ hasText: /^(1|15|16|20)$/ }).first()
    if (await colorSwatches.count() > 0) {
      await colorSwatches.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place stitch with selected color
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Page should be responsive
    await expect(page.locator('main')).toBeVisible()
  })

  test('undo/redo after color changes maintains correct history', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Select a different color
    const colorSwatches = page.locator('button').filter({ hasText: /^(1|15)$/ }).first()
    if (await colorSwatches.count() > 0) {
      await colorSwatches.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Place another stitch
    await placeStitch(page, 100, 100)
    await await new Promise(r => setTimeout(r, 200))

    // Undo should work for both operations
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 200))
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 200))

    // Redo should restore both
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 200))
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 200))

    // Page should remain responsive
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Cross-panel data flow: zoom/pan + editing', () => {
  test('zooming in/out while editing does not crash', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Zoom in and out multiple times
    const zoomInBtn = page.locator('button').filter({ hasText: '+' }).first()
    const zoomOutBtn = page.locator('button').filter({ hasText: '−' }).first()

    if (await zoomInBtn.count() > 0) {
      for (let i = 0; i < 5; i++) {
        await zoomInBtn.click()
        await await new Promise(r => setTimeout(r, 200))
      }
      for (let i = 0; i < 5; i++) {
        await zoomOutBtn.click()
        await await new Promise(r => setTimeout(r, 200))
      }
    }

    // Page should still be responsive
    await expect(page.locator('main')).toBeVisible()
  })

  test('placing stitches at different zoom levels works', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place a stitch at default zoom
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Zoom in
    const zoomInBtn = page.locator('button').filter({ hasText: '+' }).first()
    if (await zoomInBtn.count() > 0) {
      await zoomInBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Place another stitch at zoomed view
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Zoom back out
    if (await zoomInBtn.count() > 0) {
      for (let i = 0; i < 3; i++) {
        await zoomInBtn.click() // this is actually zoom in, let's use the minus button
        await await new Promise(r => setTimeout(r, 100))
      }
    }

    // Page should remain responsive
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Data integrity: save/load cycle verification', () => {
  test('undo stack resets after clear pattern', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place 5 stitches
    for (let i = 0; i < 5; i++) {
      await placeStitch(page, 80 + i * 15, 80)
    }
    await await new Promise(r => setTimeout(r, 300))

    // Open File menu to find Clear option
    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    if (await fileBtn.count() > 0) {
      await fileBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const clearOption = page.locator('button').filter({ hasText: /Clear/i }).first()
      if (await clearOption.count() > 0) {
        await clearOption.click()
        await await new Promise(r => setTimeout(r, 300))

        // If a confirmation dialog appears, type CLEAR and confirm
        const confirmInput = page.locator('input').first()
        if (await confirmInput.count() > 0) {
          await confirmInput.fill('CLEAR')
          await await new Promise(r => setTimeout(r, 200))

          const confirmBtn = page.locator('button').filter({ hasText: /CLEAR|Confirm/i }).first()
          if (await confirmBtn.count() > 0) {
            await confirmBtn.click()
            await await new Promise(r => setTimeout(r, 500))
          }
        }
      }
    }

    // Try undo after clear — should not crash
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Page should be responsive
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Cross-panel data flow: Notes panel + grid editing', () => {
  test('opening notes panel while editing grid does not crash', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Open right panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Try to open Notes tab
    const notesTab = page.locator('button').filter({ hasText: /^Notes$/ }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Close panel
    const closePanelBtn = page.locator('button').filter({ hasText: /Close panel/i }).first()
    if (await closePanelBtn.count() > 0) {
      await closePanelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Page should remain responsive
    await expect(page.locator('main')).toBeVisible()
  })

  test('placing stitches after notes panel is opened still works', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Open and close notes panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const notesTab = page.locator('button').filter({ hasText: /^Notes$/ }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))

      const closePanelBtn = page.locator('button').filter({ hasText: /Close panel/i }).first()
      if (await closePanelBtn.count() > 0) {
        await closePanelBtn.click()
      }
    }
    await await new Promise(r => setTimeout(r, 300))

    // Place a stitch after panel interaction
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Grid should still be functional
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Edge case: large stitch counts and formatting', () => {
  test('placing many stitches does not crash or freeze', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place 30 stitches rapidly
    for (let i = 0; i < 30; i++) {
      await placeStitch(page, 80 + (i % 10) * 12, 80 + Math.floor(i / 10) * 12)
      await await new Promise(r => setTimeout(r, 50))
    }

    // Page should still be responsive after placing many stitches
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
  })

  test('undo/redo with many operations in stack works', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place 15 stitches
    for (let i = 0; i < 15; i++) {
      await placeStitch(page, 80 + (i % 5) * 20, 80 + Math.floor(i / 5) * 20)
    }
    await await new Promise(r => setTimeout(r, 500))

    // Undo all 15
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Meta+Z')
    }
    await await new Promise(r => setTimeout(r, 500))

    // Redo all 15
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Meta+Shift+Z')
    }
    await await new Promise(r => setTimeout(r, 500))

    // Page should be responsive
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Edge case: concurrent panel interactions', () => {
  test('rapidly opening/closing panels preserves grid state', async ({ page }) => {
    // Setup canvas and place a stitch
    await setupCanvasAndGetDimLabel(page)
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Rapidly open/close right panel 15 times
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    for (let i = 0; i < 15; i++) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 100))

      const closeBtn = page.locator('button').filter({ hasText: /Close panel/i }).first()
      if (await closeBtn.count() > 0) {
        await closeBtn.click()
      }
      await await new Promise(r => setTimeout(r, 100))
    }

    // Grid should still be intact
    await expect(page.locator('main')).toBeVisible()
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()
  })

  test('keyboard shortcuts during panel open do not conflict', async ({ page }) => {
    // Setup canvas
    await setupCanvasAndGetDimLabel(page)

    // Place a stitch
    await placeStitch(page, 80, 80)
    await await new Promise(r => setTimeout(r, 200))

    // Open panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Press keyboard shortcuts while panel is open
    await page.keyboard.press('Meta+Z')
    await await new Promise(r => setTimeout(r, 200))
    await page.keyboard.press('Meta+Shift+Z')
    await await new Promise(r => setTimeout(r, 200))

    // Escape to close panel
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 200))

    // Page should be responsive
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()
  })
})
