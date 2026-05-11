import { test, expect } from '../fixtures/base'

test('debug: check swap triggers', async ({ page }) => {
  // Check initial state
  const initialDesign = await page.evaluate(() => {
    const store = (window as any).__store
    if (!store) return { error: 'no store' }
    const state = store.getState()
    return {
      panelsLen: state.panels.length,
      firstPanelDesign: state.panels[0]?.design,
      dmcPalette: state.dmcPalette?.slice(0, 5),
      undoStackLen: state.undoStack?.length,
    }
  })
  console.log('INITIAL:', JSON.stringify(initialDesign, null, 2))

  // Wait for app to be ready
  await page.waitForSelector('button[title="File"]', { timeout: 10000 })

  // Click swap button
  const swapBtn = page.locator('button').filter({ hasText: /swap/i }).first()
  await swapBtn.click()
  await page.waitForTimeout(300)

  // Check swap mode is active
  const swapModeActive = await page.evaluate(() => {
    const store = (window as any).__store
    if (!store) return false
    // Check sidebar state via React - we can't directly, but we can check UI
    return true // Assume it worked if button was clickable
  })

  // Click first swatch
  const swatches = page.locator('[class*="swatch"]')
  const swatchCount = await swatches.count()
  console.log('SWATCH COUNT:', swatchCount)

  if (swatchCount > 0) {
    await swatches.nth(0).click()
    await page.waitForTimeout(300)
  }

  if (swatchCount > 1) {
    await swatches.nth(1).click()
    await page.waitForTimeout(500)
  }

  // Check state after swap
  const afterDesign = await page.evaluate(() => {
    const store = (window as any).__store
    if (!store) return { error: 'no store' }
    const state = store.getState()
    return {
      firstPanelDesign: state.panels[0]?.design,
      undoStackLen: state.undoStack?.length,
      redoStackLen: state.redoStack?.length,
    }
  })
  console.log('AFTER:', JSON.stringify(afterDesign, null, 2))
  console.log('UNDO BUTTON DISABLED:', await page.locator('button[title="Undo"]').first().isDisabled())
})
