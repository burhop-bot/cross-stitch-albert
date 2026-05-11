import { test, expect } from '../fixtures/base'

test('debug: trace UI swap', async ({ page }) => {
  await page.waitForSelector('header', { timeout: 10000 })
  
  // Set a design
  await page.evaluate(() => {
    const store = (window as any).__store
    if (store) {
      const state = store.getState()
      state.panels[0].design = [[0, 1, 2], [2, 1, 0]]
      state.panels[1] = { ...state.panels[1], design: [[0, 1, 2], [2, 1, 0]] }
    }
  })
  await page.waitForTimeout(300)
  
  // Check before state
  console.log('BEFORE:', await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { design: s.panels[0].design, undoLen: s.undoStack?.length, swapFrom: (window as any).__swapFrom }
  }))
  
  // Click swap button
  const swapBtn = page.locator('button').filter({ hasText: /swap/i }).first()
  await swapBtn.click()
  await page.waitForTimeout(500)
  console.log('After swap btn:', await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { swapMode: (window as any).__swapMode, undoLen: s.undoStack?.length }
  }))
  
  // Click first swatch
  const swatches = page.locator('[class*="swatch"]')
  const count = await swatches.count()
  console.log('Swatches:', count)
  
  if (count > 0) {
    await swatches.nth(0).click()
    await page.waitForTimeout(300)
    console.log('After 1st swatch:', await page.evaluate(() => {
      const s = (window as any).__store.getState()
      return { design: s.panels[0].design, undoLen: s.undoStack?.length }
    }))
  }
  
  if (count > 1) {
    await swatches.nth(1).click()
    await page.waitForTimeout(500)
  }
  
  // Check after state
  console.log('AFTER:', await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { design: s.panels[0].design, undoLen: s.undoStack?.length }
  }))
  
  console.log('UNDO BTN DISABLED:', await page.locator('button[title="Undo"]').first().isDisabled())
})
