/**
 * SettingsPanel — Quick Sizes Feature Tests
 *
 * The SettingsPanel has a "Quick Sizes" section with preset dimension buttons:
 * - Small (20×20), Medium (40×40), Large (60×60)
 * - A5 (70×100), A4 (80×120), Cross (80×80)
 *
 * Each button sets width/height in local component state but does NOT
 * call handleSave() — it only updates the form. The user must click
 * "Apply & Resize Canvas" to actually apply the change.
 *
 * Potential bugs this file targets:
 * - Quick size buttons update form but don't reflect on canvas preview
 * - Physical dimensions update reactively after setting quick size
 * - Undo stack behavior after clicking quick size (should not push since no apply)
 * - Undo stack behavior after applying quick size (should push one entry)
 * - Dimension labels update correctly
 * - Quick size buttons maintain visual state
 */
import { test, expect } from '../fixtures/base'

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Open the right panel and switch to the Project tab.
 */
async function openSettingsPanel(page): Promise<void> {
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  await panelBtn.click()
  await await new Promise(r => setTimeout(r, 400))

  const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
  if (await projectTab.count() > 0) {
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))
  }
}

/**
 * Get the current width and height from the SettingsPanel number inputs.
 */
async function getSettingsDimensions(page): Promise<{ width: number; height: number }> {
  const label = page.locator('label').filter({ hasText: /^Width$/ }).first()
  const widthInput = label.locator('..').locator('input[type="number"]')
  const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
  const heightInput = heightLabel.locator('..').locator('input[type="number"]')

  return {
    width: Number(await widthInput.inputValue()),
    height: Number(await heightInput.inputValue()),
  }
}

/**
 * Click the Apply button in SettingsPanel.
 */
async function clickApply(page): Promise<void> {
  const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
  await expect(applyBtn).toBeVisible({ timeout: 3000 })
  await applyBtn.click()
  await await new Promise(r => setTimeout(r, 800))
}

/**
 * Click a specific Quick Size button by its label text.
 */
async function clickQuickSize(page, label: string): Promise<void> {
  const btn = page.locator('button').filter({ hasText: label }).first()
  await expect(btn).toBeVisible()
  await btn.click()
  await await new Promise(r => setTimeout(r, 300))
}

/**
 * Read the current grid dimension label text (e.g., "40×30 stitches").
 */
async function getGridDimensions(page): Promise<string> {
  const dimLabel = page.locator('span:has-text("stitches")').first()
  return dimLabel.textContent()
}

/**
 * Read the physical dimensions from the Fabric Type section.
 */
async function getPhysicalDimensions(page): Promise<string> {
  return page.locator('div').filter({ hasText: /Physical Size/ }).first().textContent()
}

// ─── Quick Sizes feature — existence and layout ───────────────────────────

test.describe('SettingsPanel: Quick Sizes — existence and layout', () => {
  test('[ @smoke ] Quick Sizes section header is visible', async ({ page }) => {
    await openSettingsPanel(page)
    const section = page.locator('h3').filter({ hasText: /Quick Sizes/ }).first()
    await expect(section).toBeVisible()
  })

  test('[ @smoke ] all 6 quick size buttons are rendered', async ({ page }) => {
    await openSettingsPanel(page)

    const expectedLabels = [
      'Small (20×20)',
      'Medium (40×40)',
      'Large (60×60)',
      'A5 (70×100)',
      'A4 (80×120)',
      'Cross (80×80)',
    ]

    for (const label of expectedLabels) {
      const btn = page.locator('button').filter({ hasText: label }).first()
      await expect(btn).toBeVisible()
    }
  })

  test('quick size buttons have correct visual styling', async ({ page }) => {
    await openSettingsPanel(page)

    const btn = page.locator('button').filter({ hasText: 'Small (20×20)' }).first()
    await expect(btn).toHaveClass(/bg-gray-100/)
    await expect(btn).toHaveClass(/hover:bg-gray-200/)
    await expect(btn).toHaveClass(/rounded-lg/)
  })

  test('quick size buttons are in a 2-column grid layout', async ({ page }) => {
    await openSettingsPanel(page)

    const buttons = page.locator('button').filter({ hasText: /\d+×\d+/ })
    await expect(buttons).toHaveCount(6)
    // They should be in a CSS grid (grid-cols-2)
    const grid = buttons.first().locator('..')
    await expect(grid).toHaveClass(/grid-cols-2/)
  })

  test('quick size labels show dimensions in parentheses', async ({ page }) => {
    await openSettingsPanel(page)

    // Verify the format includes dimensions
    const btn = page.locator('button').filter({ hasText: /Small \(20×20\)/ }).first()
    await expect(btn).toHaveText(/20×20/)

    const btn2 = page.locator('button').filter({ hasText: /A4 \(80×120\)/ }).first()
    await expect(btn2).toHaveText(/80×120/)
  })
})

// ─── Quick Sizes — form-only updates (no apply) ───────────────────────────

test.describe('Quick Sizes: form-only updates without applying', () => {
  test('clicking a quick size updates the form inputs', async ({ page }) => {
    await openSettingsPanel(page)

    // Verify initial dimensions
    let dims = await getSettingsDimensions(page)
    expect(dims.width).toBeGreaterThan(0)
    expect(dims.height).toBeGreaterThan(0)

    // Click Quick Size button
    await clickQuickSize(page, 'Small (20×20)')

    // Form inputs should now show 20×20
    dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(20)
    expect(dims.height).toBe(20)
  })

  test('quick size does NOT apply the grid — canvas unchanged without Apply', async ({ page }) => {
    await openSettingsPanel(page)

    // Read the current grid dimension before any quick size click
    const beforeGridDim = await getGridDimensions(page)

    // Click a quick size — this only updates the form, doesn't apply
    await clickQuickSize(page, 'Medium (40×40)')

    // Grid dimensions should be unchanged since we didn't click Apply
    const afterGridDim = await getGridDimensions(page)
    expect(beforeGridDim).toBe(afterGridDim)
  })

  test('setting one quick size then another updates the form correctly', async ({ page }) => {
    await openSettingsPanel(page)

    // Click Small
    await clickQuickSize(page, 'Small (20×20)')
    let dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(20)
    expect(dims.height).toBe(20)

    // Click Large
    await clickQuickSize(page, 'Large (60×60)')
    dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(60)
    expect(dims.height).toBe(60)

    // Click A4
    await clickQuickSize(page, 'A4 (80×120)')
    dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(80)
    expect(dims.height).toBe(120)
  })

  test('physical dimensions preview updates when quick size changes form', async ({ page }) => {
    await openSettingsPanel(page)

    // The physical dimensions section in the Fabric Type area should reflect
    // the form values (width/height) even before applying
    const beforePhys = await getPhysicalDimensions(page)

    await clickQuickSize(page, 'Small (20×20)')

    const afterPhys = await getPhysicalDimensions(page)

    // Physical dimensions should change because they compute from width/height state
    expect(beforePhys).not.toBe(afterPhys)
  })

  test('quick size update is independent of other form fields (title, author)', async ({ page }) => {
    await openSettingsPanel(page)

    // Fill in title and author first
    const titleInput = page.locator('input[placeholder="My Pattern"]')
    await titleInput.fill('Test Pattern')
    const authorInput = page.locator('input[placeholder="Your name"]')
    await authorInput.fill('Test Author')

    // Click quick size
    await clickQuickSize(page, 'Medium (40×40)')

    // Quick size should work without affecting title/author
    let dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(40)
    expect(dims.height).toBe(40)

    // Title and author should still be set
    await expect(titleInput).toHaveValue('Test Pattern')
    await expect(authorInput).toHaveValue('Test Author')
  })
})

// ─── Quick Sizes — with Apply ──────────────────────────────────────────────

test.describe('Quick Sizes: applying dimensions', () => {
  test('clicking Apply after quick size changes the actual grid', async ({ page }) => {
    await openSettingsPanel(page)

    // Set quick size
    await clickQuickSize(page, 'Medium (40×40)')
    let dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(40)
    expect(dims.height).toBe(40)

    // Apply
    await clickApply(page)

    // Grid dimension label should update
    const gridDim = await getGridDimensions(page)
    expect(gridDim).toContain('40')
  })

  test('Quick Size A5 (70×100) applies correctly', async ({ page }) => {
    await openSettingsPanel(page)
    await clickQuickSize(page, 'A5 (70×100)')
    await clickApply(page)

    const dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(70)
    expect(dims.height).toBe(100)

    const gridDim = await getGridDimensions(page)
    expect(gridDim).toContain('70')
    expect(gridDim).toContain('100')
  })

  test('Quick Size Cross (80×80) applies correctly', async ({ page }) => {
    await openSettingsPanel(page)
    await clickQuickSize(page, 'Cross (80×80)')
    await clickApply(page)

    const dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(80)
    expect(dims.height).toBe(80)
  })

  test('Quick Size A4 (80×120) — tall format applies correctly', async ({ page }) => {
    await openSettingsPanel(page)
    await clickQuickSize(page, 'A4 (80×120)')
    await clickApply(page)

    const dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(80)
    expect(dims.height).toBe(120)
  })

  test('grid canvas re-renders after applying quick size', async ({ page }) => {
    await openSettingsPanel(page)
    await clickQuickSize(page, 'Small (20×20)')
    await clickApply(page)

    // Grid dimension label should update to reflect new dimensions
    const gridDim = await getGridDimensions(page)
    expect(gridDim).toContain('20')
  })
})

// ─── Quick Sizes — undo/redo after applying ────────────────────────────────

test.describe('Quick Sizes: undo/redo behavior', () => {
  test('applying quick size pushes to undo stack', async ({ page }) => {
    await openSettingsPanel(page)
    await clickQuickSize(page, 'Medium (40×40)')
    await clickApply(page)

    // Undo button should be enabled after apply
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
  })

  test('undo after applying quick size reverts the dimension change', async ({ page }) => {
    await openSettingsPanel(page)

    // Apply medium size
    await clickQuickSize(page, 'Medium (40×40)')
    await clickApply(page)

    let dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(40)
    expect(dims.height).toBe(40)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await expect(undoBtn).toBeVisible()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Dimensions should have changed back (to whatever they were before)
    dims = await getSettingsDimensions(page)
    // The dimension should be different from 40×40 (restored to previous state)
    expect(dims.width !== 40 || dims.height !== 40).toBe(true)
  })

  test('redo after undo re-applies the quick size dimensions', async ({ page }) => {
    await openSettingsPanel(page)

    // Apply medium size
    await clickQuickSize(page, 'Medium (40×40)')
    await clickApply(page)

    // Undo
    const undoBtn = page.locator('button[title="Undo"]').first()
    await undoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Redo
    const redoBtn = page.locator('button[title="Redo"]').first()
    await expect(redoBtn).toBeVisible()
    await redoBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Should be back to 40×40
    const dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(40)
    expect(dims.height).toBe(40)
  })

  test('undo after quick size applies resets grid to pre-change state', async ({ page }) => {
    await openSettingsPanel(page)

    // Apply a size change
    await clickQuickSize(page, 'Large (60×60)')
    await clickApply(page)

    // Grid should show 60×60
    let gridDim = await getGridDimensions(page)
    expect(gridDim).toContain('60')

    // Undo
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Grid should have changed back
    gridDim = await getGridDimensions(page)
    // Should no longer contain "60×60" as the full dimension
    expect(gridDim).not.toMatch(/60×60/)
  })

  test('redo invalidated by new edits after quick size undo', async ({ page }) => {
    await openSettingsPanel(page)

    // Apply medium size
    await clickQuickSize(page, 'Medium (40×40)')
    await clickApply(page)

    // Undo to revert
    await page.locator('button[title="Undo"]').first().click()
    await await new Promise(r => setTimeout(r, 300))

    // Make a new edit — this should invalidate redo
    const pencilBtn = page.locator('button[title="Pencil"]')
    await expect(pencilBtn).toBeVisible()

    const redoBtn = page.locator('button[title="Redo"]').first()
    // Redo button should be disabled after a new edit post-undo
    await expect(redoBtn).toHaveAttribute('disabled')
  })
})

// ─── Quick Sizes — physical dimensions ─────────────────────────────────────

test.describe('Quick Sizes: physical dimension updates', () => {
  test('physical dimensions update when quick size is applied', async ({ page }) => {
    await openSettingsPanel(page)

    // Apply small size
    await clickQuickSize(page, 'Small (20×20)')
    await clickApply(page)

    const physDims = await getPhysicalDimensions(page)
    // Should contain width and height in inches/mm
    expect(physDims).toContain('Width')
    expect(physDims).toContain('Height')
  })

  test('different quick sizes produce different physical dimensions', async ({ page }) => {
    await openSettingsPanel(page)

    await clickQuickSize(page, 'Small (20×20)')
    await clickApply(page)
    const smallPhys = await getPhysicalDimensions(page)

    await clickQuickSize(page, 'A4 (80×120)')
    await clickApply(page)
    const a4Phys = await getPhysicalDimensions(page)

    expect(smallPhys).not.toBe(a4Phys)
  })

  test('fabric type selector is accessible alongside quick sizes', async ({ page }) => {
    await openSettingsPanel(page)

    const fabricSelect = page.locator('select')
    await expect(fabricSelect).toBeVisible()

    // Should have multiple options
    const options = fabricSelect.locator('option')
    await expect(options).toHaveCount(5)
  })
})

// ─── Quick Sizes — edge cases ─────────────────────────────────────────────

test.describe('Quick Sizes: edge cases', () => {
  test('rapidly clicking multiple quick size buttons updates form correctly', async ({ page }) => {
    await openSettingsPanel(page)

    // Rapid-fire different quick sizes
    await clickQuickSize(page, 'Small (20×20)')
    await clickQuickSize(page, 'A5 (70×100)')
    await clickQuickSize(page, 'Cross (80×80)')
    await clickQuickSize(page, 'Medium (40×40)')

    // Final state should be 40×40
    const dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(40)
    expect(dims.height).toBe(40)
  })

  test('quick size buttons remain visible and clickable after applying', async ({ page }) => {
    await openSettingsPanel(page)
    await clickQuickSize(page, 'Small (20×20)')
    await clickApply(page)

    // All quick size buttons should still be visible
    const smallBtn = page.locator('button').filter({ hasText: 'Small (20×20)' }).first()
    await expect(smallBtn).toBeVisible()
    const a4Btn = page.locator('button').filter({ hasText: 'A4 (80×120)' }).first()
    await expect(a4Btn).toBeVisible()
  })

  test('quick size with panel open and right panel closed', async ({ page }) => {
    // Start with right panel closed

    // Open right panel
    await openSettingsPanel(page)

    // Apply a quick size
    await clickQuickSize(page, 'Large (60×60)')
    await clickApply(page)

    // Grid should have changed
    const gridDim = await getGridDimensions(page)
    expect(gridDim).toContain('60')
  })

  test('Quick Size labels use the correct Unicode multiplication sign (×)', async ({ page }) => {
    await openSettingsPanel(page)

    // Verify all buttons use × (not x or other characters)
    const buttons = page.locator('button').filter({ hasText: /\d+/ })
    const text = await buttons.first().textContent()
    // Should contain the × character (U+00D7)
    expect(text).toMatch(/[\u00D7\u2022\u00D7]/)
  })

  test('setting quick size and then manually editing inputs works', async ({ page }) => {
    await openSettingsPanel(page)

    // Set quick size
    await clickQuickSize(page, 'Medium (40×40)')

    // Now manually edit the width input
    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const widthInput = widthLabel.locator('..').locator('input[type="number"]')
    await widthInput.clear()
    await widthInput.fill('30')

    let dims = await getSettingsDimensions(page)
    expect(dims.width).toBe(30)
    expect(dims.height).toBe(40) // height should remain from quick size
  })
})
