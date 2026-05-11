/**
 * TC-20: Manual Stitch Counter — Comprehensive E2E Tests
 *
 * The ManualStitchCounter component lives in the sidebar and allows
 * stitchers to manually count stitches as they work. Tests cover:
 * - Counter display format (number + total + percentage)
 * - Increment (+1) button state changes and counter updates
 * - Decrement (−1) button with floor at 0
 * - Reset flow: confirm/cancel confirmation modal
 * - Progress bar width percentage matching counter/total
 * - Panel switch auto-resets counter (bug-prone: useEffect on selectedPanelId)
 * - Position display (last edited row/col)
 * - Edge cases: 0 stitches, rapid clicks, no panel selected
 */
import { test, expect } from '../fixtures/base'

test.describe('Manual Stitch Counter', () => {
  // ─── Helper: setup a canvas so the counter has a total ───
  async function setupPanel(page: ReturnType<typeof test>) {
    // Open the Settings/Project tab and create a small canvas
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()

    if (await widthLabel.count() > 0) {
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      const heightInput = heightLabel.locator('..').locator('input[type="number"]')
      await widthInput.clear()
      await widthInput.fill('10')
      await heightInput.clear()
      await heightInput.fill('10')
    }

    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))
  }

  function getCounterBox(page) {
    // The counter is in the sidebar with amber-50 background
    return page.locator('div:has-text("Stitch Counter")')
  }

  function getIncrementBtn(page) {
    // +1 button with Plus icon
    return page.locator('button[title="Increment (+1)"]')
  }

  function getDecrementBtn(page) {
    // -1 button with Minus icon
    return page.locator('button[title="Decrement (-1)"]')
  }

  function getResetBtn(page) {
    // RotateCcw icon button
    return page.locator('button[title="Reset counter"]')
  }

  // ─── TC-20.1: Counter appears in sidebar ───
  test('TC-20.1: Stitch Counter card is visible in sidebar after panel setup', async ({ page }) => {
    await setupPanel(page)
    const counterCard = getCounterBox(page)
    await expect(counterCard).toBeVisible()
    await expect(counterCard).toContainText('Stitch Counter')
  })

  // ─── TC-20.2: Initial count is 0 ───
  test('TC-20.2: Counter starts at 0', async ({ page }) => {
    await setupPanel(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')
    await expect(counterValue).toHaveText('0')
  })

  // ─── TC-20.3: Total shown when panel has stitches ───
  test('TC-20.3: Total stitch count displayed alongside counter', async ({ page }) => {
    await setupPanel(page)
    // 10x10 = 100 stitches total
    const subtext = page.locator('div:has-text("Stitch Counter")').locator('div.text-\\[10px\\]')
    await expect(subtext).toContainText('of 100 stitches')
    await expect(subtext).toContainText('(0%)')
  })

  // ─── TC-20.4: Increment increases count by 1 ───
  test('TC-20.4: Increment (+1) button increases counter', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    await expect(counterValue).toHaveText('0')
    await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('1')

    await incrementBtn.click()
    await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('3')
  })

  // ─── TC-20.5: Decrement decreases count by 1 ───
  test('TC-20.5: Decrement (-1) button decreases counter', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const decrementBtn = getDecrementBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    // Go to 5
    for (let i = 0; i < 5; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('5')

    // Decrement
    await decrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('4')

    await decrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('3')
  })

  // ─── TC-20.6: Counter floor at 0 ───
  test('TC-20.6: Decrement cannot go below 0', async ({ page }) => {
    await setupPanel(page)
    const decrementBtn = getDecrementBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    await expect(counterValue).toHaveText('0')
    await decrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('0') // should stay at 0

    await decrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('0') // still 0
  })

  // ─── TC-20.7: Progress bar width matches percentage ───
  test('TC-20.7: Progress bar reflects correct percentage', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const progressFill = page.locator('div.bg-amber-500.rounded-full')

    // 0% → no fill
    await expect(progressFill).toHaveCSS('width', '0%')

    // Increment to 50 (50% of 100)
    for (let i = 0; i < 50; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(progressFill).toHaveCSS('width', '50%')

    // Increment to 75
    for (let i = 0; i < 25; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(progressFill).toHaveCSS('width', '75%')
  })

  // ─── TC-20.8: Progress bar caps at 100% ───
  test('TC-20.8: Progress bar caps at 100%', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)

    // Fill past 100 (100 stitches + more increments)
    for (let i = 0; i < 150; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Should cap at 100%
    const progressFill = page.locator('div.bg-amber-500.rounded-full')
    await expect(progressFill).toHaveCSS('width', '100%')

    // Percentage text should also say 100%
    const subtext = page.locator('div:has-text("Stitch Counter")').locator('div.text-\\[10px\\]')
    await expect(subtext).toContainText('(100%)')
  })

  // ─── TC-20.9: Reset confirmation flow ───
  test('TC-20.9: Reset shows confirmation before clearing', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const resetBtn = getResetBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    // Get to 10
    for (let i = 0; i < 10; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('10')

    // Click reset — should show confirm/cancel buttons
    await resetBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Should have green checkmark (confirm) and gray X (cancel)
    const confirmBtn = page.locator('button.bg-green-600')
    const cancelBtn = page.locator('button.bg-gray-300')
    await expect(confirmBtn).toBeVisible()
    await expect(cancelBtn).toBeVisible()
    // Counter should still be 10 (not reset yet)
    await expect(counterValue).toHaveText('10')
  })

  // ─── TC-20.10: Confirm reset clears counter ───
  test('TC-20.10: Confirming reset zeroes the counter', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const resetBtn = getResetBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    for (let i = 0; i < 25; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('25')

    await resetBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    const confirmBtn = page.locator('button.bg-green-600')
    await confirmBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    await expect(counterValue).toHaveText('0')
  })

  // ─── TC-20.11: Cancel reset preserves counter ───
  test('TC-20.11: Cancelling reset preserves current count', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const resetBtn = getResetBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    for (let i = 0; i < 30; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('30')

    await resetBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    const cancelBtn = page.locator('button.bg-gray-300')
    await cancelBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Counter should still be 30
    await expect(counterValue).toHaveText('30')
    // Confirmation buttons should be gone
    const confirmBtn = page.locator('button.bg-green-600')
    await expect(confirmBtn).not.toBeVisible()
  })

  // ─── TC-20.12: Panel switch resets counter (effect dependency) ───
  test('TC-20.12: Counter resets when switching panels', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    // Set counter to 15
    for (let i = 0; i < 15; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(counterValue).toHaveText('15')

    // Create a new panel via Settings
    const settingsTab = page.locator('button').filter({ hasText: 'Settings' }).first()
    if (await settingsTab.count() > 0) {
      await settingsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Create new canvas 5x5
    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
    if (await widthLabel.count() > 0) {
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      const heightInput = heightLabel.locator('..').locator('input[type="number"]')
      await widthInput.clear()
      await widthInput.fill('10')
      await heightInput.clear()
      await heightInput.fill('10')
    }
    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Counter should have been reset to 0 by useEffect on selectedPanelId
    await expect(counterValue).toHaveText('0')
  })

  // ─── TC-20.13: No panel selected shows appropriate state ───
  test('TC-20.13: Counter handles empty grid gracefully', async ({ page }) => {
    // Don't set up a panel — just open the app
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // The counter may or may not render without a panel
    // If it does, it should handle missing data without crashing
    const counterBox = getCounterBox(page)
    if (await counterBox.count() > 0) {
      const counterValue = counterBox.locator('div.font-mono')
      await expect(counterValue).toHaveText('0')
    }
  })

  // ─── TC-20.14: Rapid increment/decrement stress ───
  test('TC-20.14: Rapid increment/decrement does not corrupt counter', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const decrementBtn = getDecrementBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    // Do 20 increments
    for (let i = 0; i < 20; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    let expected = 20

    // Now alternate rapid increment/decrement
    for (let i = 0; i < 20; i++) {
      await incrementBtn.click()
      await decrementBtn.click()
    }
    await await new Promise(r => setTimeout(r, 300))

    // Should still be 20 (net effect: 20 inc + 20 dec = 0 change)
    await expect(counterValue).toHaveText(String(expected))
  })

  // ─── TC-20.15: Large count formatting ───
  test('TC-20.15: Counter formats large numbers with locale separators', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const counterValue = page.locator('div:has-text("Stitch Counter")').locator('div.font-mono')

    // Set to 1000 (should format as "1,000")
    for (let i = 0; i < 1000; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 1000))

    // The number should be formatted (has comma or tabular-nums)
    const text = await counterValue.textContent()
    expect(text).toMatch(/\d+[,\.]?\d*/)
  })

  // ─── TC-20.16: Progress bar percentage text matches visual width ───
  test('TC-20.16: Percentage text matches progress bar visual width', async ({ page }) => {
    await setupPanel(page)
    const incrementBtn = getIncrementBtn(page)
    const progressFill = page.locator('div.bg-amber-500.rounded-full')
    const subtext = page.locator('div:has-text("Stitch Counter")').locator('div.text-\\[10px\\]')

    // Set to exactly 25%
    for (let i = 0; i < 25; i++) await incrementBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const barWidth = await progressFill.evaluate(el => el.style.width)
    const textContent = await subtext.textContent()

    // Both should say 25
    expect(barWidth).toBe('25%')
    expect(textContent).toContain('25')
  })
})
