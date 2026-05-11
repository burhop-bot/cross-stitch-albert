import { test, expect } from '../fixtures/base'

test('debug: trace full swap flow with state checks', async ({ page }) => {
  await page.waitForSelector('header', { timeout: 10000 })
  
  // Set a design via store
  await page.evaluate(() => {
    const store = (window as any).__store
    if (store) {
      const s = store.getState()
      s.panels[0].design = [[0, 1, 2], [2, 1, 0]]
      s.panels[1] = { ...s.panels[1], design: [[0, 1, 2], [2, 1, 0]] }
    }
  })
  await page.waitForTimeout(300)
  
  // Check initial state
  let state = await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { design: JSON.stringify(s.panels[0].design), undoLen: s.undoStack?.length }
  })
  console.log('STEP 0 (initial):', state)
  
  // Open palette tab
  const paletteTab = page.locator('button[aria-label="Palette"]')
  if (await paletteTab.count() === 0) {
    // Try tab icon
    const tabs = page.locator('[role="tablist"] button, [class*="tab"]')
    console.log('TAB COUNT:', await tabs.count())
    await tabs.first().click()
  } else {
    await paletteTab.click()
  }
  await page.waitForTimeout(500)
  
  // Click swap button (icon button with title)
  const swapBtn = page.locator('button[title*="Swap"]')
  console.log('SWAP BTN COUNT:', await swapBtn.count())
  await swapBtn.click()
  await page.waitForTimeout(500)
  
  // Check state after swap click
  state = await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { design: JSON.stringify(s.panels[0].design), undoLen: s.undoStack?.length }
  })
  console.log('STEP 1 (after swap btn):', state)
  
  // Get swatches
  const swatches = page.locator('[class*="swatch"]')
  const swatchCount = await swatches.count()
  console.log('SWATCH COUNT:', swatchCount)
  
  // Click first swatch
  if (swatchCount > 0) {
    await swatches.first().click()
    await page.waitForTimeout(300)
  }
  
  state = await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { design: JSON.stringify(s.panels[0].design), undoLen: s.undoStack?.length }
  })
  console.log('STEP 2 (after 1st swatch):', state)
  
  // Click second swatch
  if (swatchCount > 1) {
    await swatches.nth(1).click()
    await page.waitForTimeout(500)
  }
  
  state = await page.evaluate(() => {
    const s = (window as any).__store.getState()
    return { design: JSON.stringify(s.panels[0].design), undoLen: s.undoStack?.length }
  })
  console.log('STEP 3 (after 2nd swatch):', state)
  
  // Check undo button
  const undoBtn = page.locator('button[title="Undo"]').first()
  const undoDisabled = await undoBtn.isDisabled()
  console.log('UNDO DISABLED:', undoDisabled)
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-swap-flow.png', fullPage: true })
  
  // Assert
  expect(state.undoLen).toBeGreaterThan(0)
})
