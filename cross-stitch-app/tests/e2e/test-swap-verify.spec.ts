import { test, expect } from '../fixtures/base'

test('verify swap works via store', async ({ page }) => {
  await page.waitForSelector('header', { timeout: 10000 })
  
  // Set a simple design via store
  await page.evaluate(() => {
    const store = (window as any).__store
    if (store) {
      const state = store.getState()
      // Set a 2x3 design with palette indices
      state.panels[0].design = [[0, 1, 2], [2, 1, 0]]
      state.panels[1] = { ...state.panels[1], design: [[0, 1, 2], [2, 1, 0]] }
      // Call swapColors via store action
      state.swapColors(0, 1)
      // Check undo stack
      console.log('AFTER SWAP:', {
        panelDesign: state.panels[0].design,
        undoStackLen: state.undoStack?.length,
        redoStackLen: state.redoStack?.length,
        undoBtnDisabled: state.undoStack?.length === 0
      })
    }
  })
  
  await page.waitForTimeout(500)
  
  // Read state back
  const result = await page.evaluate(() => {
    const store = (window as any).__store
    if (!store) return { error: 'no store' }
    const state = store.getState()
    return {
      panelDesign: state.panels[0]?.design,
      undoStackLen: state.undoStack?.length,
      dmcPalette: state.dmcPalette?.slice(0, 5)
    }
  })
  console.log('RESULT:', JSON.stringify(result, null, 2))
  
  // Verify swap changed the design
  const design = result.panelDesign
  expect(design).not.toEqual([[0, 1, 2], [2, 1, 0]])
  
  // Verify undo stack has entries
  expect(result.undoStackLen).toBeGreaterThan(0)
})
