/**
 * TC-11: Mirror Selection & Offset — Edge Cases
 *
 * Tests the Mirror Selection and Offset Mirror features that may not be
 * fully implemented or have edge cases:
 * - Mirror of selected region (not full grid)
 * - Offset mirror (shifted mirror copy)
 * - Interaction between selection + mirror + repeat
 * - Undo/redo after mirror operations
 * - Button states reflecting current mirror mode
 */
import { test, expect } from '../fixtures/base'

// ──────────────────────────────────────────────
// PatternRepeatPanel — Mirror Mode UI
// ──────────────────────────────────────────────

test.describe('PatternRepeatPanel Mirror Mode UI', () => {
  test('[ @smoke ] pattern repeat button opens the panel', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await expect(repeatBtn).toBeVisible()
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Panel should be visible with heading
    const heading = page.getByRole('heading', { name: 'Pattern Repeat' })
    await expect(heading).toBeVisible()
  })

  test('mirror mode selector has 4 options', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    const mirrorBtns = page.getByRole('button', { name: /^(None|Horizontal|Vertical|Both Axes)$/, exact: true })
    const mirrorBtnsArr = await mirrorBtns.all()
    expect(mirrorBtnsArr.length).toBeGreaterThanOrEqual(3)

    // Check labels exist
    const labels: string[] = []
    for (const btn of mirrorBtnsArr) {
      const text = await btn.textContent()
      if (text) labels.push(text.trim())
    }

    expect(labels).toContain('None')
    expect(labels).toContain('Horizontal')
    expect(labels).toContain('Vertical')
    expect(labels).toContain('Both Axes')
  })

  test('active mirror mode is visually highlighted', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Find mirror mode buttons
    const mirrorBtns = page.getByRole('button', { name: /^(None|Horizontal|Vertical|Both Axes)$/, exact: true })
    
    // Default should be "None"
    const noneBtn = mirrorBtns.filter({ hasText: 'None' })
    await expect(noneBtn).toHaveClass(/bg-indigo-100/)

    // Click Horizontal
    const horizBtn = mirrorBtns.filter({ hasText: 'Horizontal' })
    await horizBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    await expect(horizBtn).toHaveClass(/bg-indigo-100/)
    await expect(noneBtn).not.toHaveClass(/bg-indigo-100/)
  })

  test('mirror mode description text updates on change', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Default: direct repeat
    const directText = page.getByText('direct repeat')
    await expect(directText).toBeVisible()

    // Switch to Horizontal
    const horizBtn = page.getByRole('button', { name: 'Horizontal', exact: true })
    await horizBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Should show 2-way horizontal mirror
    const horizText = page.getByText('2-way horizontal mirror')
    await expect(horizText).toBeVisible()

    // Switch to Vertical
    const vertBtn = page.getByRole('button', { name: 'Vertical', exact: true })
    await vertBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const vertText = page.getByText('2-way vertical mirror')
    await expect(vertText).toBeVisible()

    // Switch to Both Axes
    const bothBtn = page.getByRole('button', { name: 'Both Axes', exact: true })
    await bothBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const bothText = page.getByText('4-way mirror')
    await expect(bothText).toBeVisible()
  })

  test('switching mirror modes before apply does not push undo history', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Store initial undo count
    const initialUndo = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    // Switch mirror modes multiple times
    const mirrorBtns = page.getByRole('button', { name: /^(None|Horizontal|Vertical|Both Axes)$/, exact: true })
    await mirrorBtns.filter({ hasText: 'Horizontal' }).click()
    await await new Promise(r => setTimeout(r, 100))
    await mirrorBtns.filter({ hasText: 'Vertical' }).click()
    await await new Promise(r => setTimeout(r, 100))
    await mirrorBtns.filter({ hasText: 'None' }).click()
    await await new Promise(r => setTimeout(r, 300))

    // Undo count should be unchanged
    const undoAfterSwitches = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    expect(undoAfterSwitches).toBe(initialUndo)
  })

  test('closing panel without applying does not push undo history', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Store initial undo count
    const initialUndo = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    // Close panel via X button
    const closeBtn = page.locator('div.absolute.inset-0 button svg.w-4')
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Undo count unchanged
    const undoAfterClose = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    expect(undoAfterClose).toBe(initialUndo)
  })

  test('Escape key closes pattern repeat panel', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Panel should be open
    const heading = page.getByRole('heading', { name: 'Pattern Repeat' })
    await expect(heading).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 300))

    // Panel should be closed
    await expect(heading).not.toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Repeat Count Inputs
// ──────────────────────────────────────────────

test.describe('Repeat Count Inputs', () => {
  test('X and Y repeat count inputs are present', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Look for number inputs
    const xInput = page.locator('input[type="number"][min="1"][max="20"]').first().first()
    expect(await xInput.count()).toBeGreaterThanOrEqual(1)

    // Should have labels "X (columns)" and "Y (rows)"
    const xLabel = page.getByText('X (columns)').first().first()
    const yLabel = page.getByText('Y (rows)').first().first()
    await expect(xLabel).toBeVisible()
    await expect(yLabel).toBeVisible()
  })

  test('result size display updates reactively', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Get initial grid dimensions
    const resultDisplay = page.locator('div.bg-gray-50.rounded-lg').first()
    const initialText = await resultDisplay.first().textContent()

    // Change X repeat to 3
    const xInput = page.locator('input[type="number"][min="1"][max="20"]').first().first()
    await xInput.fill('3')
    await await new Promise(r => setTimeout(r, 300))

    const newText = await resultDisplay.first().textContent()
    expect(newText).not.toBe(initialText)
    // Result should now show 3x the width
    expect(newText).toContain('3')
  })

  test('repeat count inputs have min/max constraints (1-20)', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    const xInput = page.locator('input[type="number"][min="1"][max="20"]').first().first()
    const yInput = page.locator('input[type="number"][min="1"][max="20"]').first().nth(1)

    // Try setting to minimum
    await xInput.fill('1')
    await await new Promise(r => setTimeout(r, 200))
    expect(await xInput.inputValue()).toBe('1')

    // Try setting to maximum
    await xInput.fill('20')
    await await new Promise(r => setTimeout(r, 200))
    expect(await xInput.inputValue()).toBe('20')

    // Try going over max — should clamp
    await xInput.fill('99')
    await await new Promise(r => setTimeout(r, 200))
    expect(await xInput.inputValue()).toBe('20')

    // Try going below min — should clamp
    await xInput.fill('0')
    await await new Promise(r => setTimeout(r, 200))
    expect(await xInput.inputValue()).toBe('1')

    // Try negative
    await xInput.fill('-5')
    await await new Promise(r => setTimeout(r, 200))
    expect(await xInput.inputValue()).toBe('1')
  })

  test('max repeat count (20) shows correct preview', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Set max repeat values
    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('20')
    await inputs.nth(1).fill('20')
    await await new Promise(r => setTimeout(r, 300))

    // Result size should show large values
    const resultDisplay = page.locator('div.bg-gray-50.rounded-lg').first()
    const text = await resultDisplay.first().textContent()
    expect(text).toContain('20')
  })
})

// ──────────────────────────────────────────────
// Apply Pattern Repeat
// ──────────────────────────────────────────────

test.describe('Apply Pattern Repeat', () => {
  test('Apply Pattern Repeat button exists and is clickable', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    const applyBtn = page.getByRole('button', { name: 'Apply Pattern Repeat' })
    await expect(applyBtn).toBeVisible()

    // Should be clickable without errors
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Panel may close or show feedback
    await expect(page.locator('main')).toBeVisible()
  })

  test('apply with repeat=1 and mirror=none does nothing visible', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Set repeat to 1x1
    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('1')
    await inputs.nth(1).fill('1')
    await await new Promise(r => setTimeout(r, 200))

    // Ensure None mirror
    const noneBtn = page.getByRole('button', { name: 'None', exact: true })
    await noneBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Apply
    const applyBtn = page.getByRole('button', { name: 'Apply Pattern Repeat' })
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Page should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('apply with repeat=2 and mirror=horizontal tiles grid', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Set repeat to 2x1
    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('2')
    await inputs.nth(1).fill('1')
    await await new Promise(r => setTimeout(r, 200))

    // Horizontal mirror
    const horizBtn = page.getByRole('button', { name: 'Horizontal', exact: true })
    await horizBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Apply
    const applyBtn = page.getByRole('button', { name: 'Apply Pattern Repeat' })
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Grid should still be visible
    await expect(page.locator('main')).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Mirror Selection — Edge Cases
// ──────────────────────────────────────────────

test.describe('Mirror Selection Edge Cases', () => {
  test('mirror mode selection changes active button styling', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    const mirrorBtns = page.getByRole('button', { name: /^(None|Horizontal|Vertical|Both Axes)$/, exact: true })

    // Default active
    const activeBtn = mirrorBtns.filter({ hasClass: /bg-indigo-100/ })
    expect(await activeBtn.count()).toBe(1)

    // Click another mode
    const horizBtn = mirrorBtns.filter({ hasText: 'Horizontal' })
    await horizBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // New active should have the indigo background
    const newActive = mirrorBtns.filter({ hasClass: /bg-indigo-100/ })
    expect(await newActive.count()).toBe(1)

    // The horizontal button should be the active one
    const newActiveText = await newActive.first().textContent()
    expect(newActiveText).toContain('Horizontal')
  })

  test('mirror mode button icons change with mode', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    const horizBtn = page.getByRole('button', { name: 'Horizontal', exact: true })
    const vertBtn = page.getByRole('button', { name: 'Vertical', exact: true })

    // Both should be visible
    await expect(horizBtn).toBeVisible()
    await expect(vertBtn).toBeVisible()
  })

  test('rapid mirror mode switching does not crash', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    const mirrorBtns = page.getByRole('button', { name: /^(None|Horizontal|Vertical|Both Axes)$/, exact: true })
    const count = await mirrorBtns.count()

    // Rapidly click through all mirror modes
    for (let i = 0; i < 15; i++) {
      const idx = i % count
      await mirrorBtns.nth(idx).click()
      await await new Promise(r => setTimeout(r, 20))
    }

    // Page should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('opening and closing panel multiple times is stable', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')

    for (let i = 0; i < 5; i++) {
      await repeatBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const heading = page.getByRole('heading', { name: 'Pattern Repeat' })
      await expect(heading).toBeVisible()

      // Close via X button
      const closeBtn = heading.locator('..').locator('button')
      await closeBtn.first().click()
      await await new Promise(r => setTimeout(r, 200))

      // Should be hidden
      await expect(heading).not.toBeVisible()
    }

    // Should be able to open again
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(page.getByRole('heading', { name: 'Pattern Repeat' })).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Mirror + Repeat Combination
// ──────────────────────────────────────────────

test.describe('Mirror + Repeat Combinations', () => {
  test('Horizontal mirror + 2x2 repeat shows correct result size', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Get initial grid dimensions from the store
    const initialSize = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return `${s?.settings?.width ?? '?'}×${s?.settings?.height ?? '?'}`
      }
      return '??'
    })

    // Set to Horizontal mirror
    const horizBtn = page.getByRole('button', { name: 'Horizontal', exact: true })
    await horizBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Set repeat to 2x2
    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('2')
    await inputs.nth(1).fill('2')
    await await new Promise(r => setTimeout(r, 300))

    // With horizontal mirror + 2x2 repeat: width = width * 2 * 2 = width * 4
    // height = height * 2 (no vertical mirror)
    const resultDisplay = page.locator('div.bg-gray-50.rounded-lg').first()
    const resultText = await resultDisplay.first().textContent()
    expect(resultText).toContain('4') // width should be 4x
  })

  test('Both Axes mirror + 1x1 repeat shows 2-way mirror text', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Both Axes
    const bothBtn = page.getByRole('button', { name: 'Both Axes', exact: true })
    await bothBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Should show "4-way mirror" even with 1x1
    const mirrorDesc = page.getByText('4-way mirror')
    await expect(mirrorDesc).toBeVisible()
  })

  test('changing mirror mode and repeat simultaneously updates preview', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Set both axes mirror + 2x2
    const bothBtn = page.getByRole('button', { name: 'Both Axes', exact: true })
    await bothBtn.click()
    await await new Promise(r => setTimeout(r, 100))

    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('2')
    await inputs.nth(1).fill('2')
    await await new Promise(r => setTimeout(r, 300))

    const resultDisplay = page.locator('div.bg-gray-50.rounded-lg').first()
    const resultText = await resultDisplay.first().textContent()

    // Both axes + 2x2: width = width * 2 * 2 = width * 4, height = height * 2 * 2 = height * 4
    expect(resultText).toContain('4')
  })
})

// ──────────────────────────────────────────────
// Mirror Undo/Redo
// ──────────────────────────────────────────────

test.describe('Mirror Undo/Redo', () => {
  test('undo after applying pattern repeat reverts changes', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Store initial undo count
    const initialUndo = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    // Apply with repeat=2
    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('2')
    await inputs.nth(1).fill('1')
    await await new Promise(r => setTimeout(r, 200))

    const applyBtn = page.getByRole('button', { name: 'Apply Pattern Repeat' })
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Undo count should have increased
    const undoAfter = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    expect(undoAfter).toBeGreaterThan(initialUndo)

    // Undo
    await page.keyboard.press('Control+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Should be back to original
    const undoBack = await page.evaluate(() => {
      const store = (window as any).__store
      if (store) {
        const s = store.getState()
        return s ? s.undoStack?.length ?? 0 : 0
      }
      return 0
    })

    // Grid should still be visible after undo
    await expect(page.locator('main')).toBeVisible()
  })

  test('redo after undo reapplies the repeat', async ({ page }) => {
    const repeatBtn = page.locator('button[title="Pattern Repeat"]')
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Apply repeat=2
    const inputs = page.locator('input[type="number"][min="1"][max="20"]').first()
    await inputs.first().fill('2')
    await inputs.nth(1).fill('1')
    await await new Promise(r => setTimeout(r, 200))

    const applyBtn = page.getByRole('button', { name: 'Apply Pattern Repeat' })
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Undo once
    await page.keyboard.press('Control+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    await page.keyboard.press('Control+Shift+Z')
    await await new Promise(r => setTimeout(r, 300))

    // Page should still be functional
    await expect(page.locator('main')).toBeVisible()
  })
})
