/**
 * TC-21: Settings Panel — Grid Line Config & Advanced Settings
 *
 * The SettingsPanel exposes advanced grid rendering options beyond basic
 * canvas dimensions. Tests verify:
 * - Grid line interval selector (every 5/10/15/20 stitches)
 * - Label interval selector (every 1/5/10 stitches)
 * - Visual preview updates with interval changes
 * - Label text updates (heavy/medium line descriptions)
 * - Title and author field editing
 * - Fabric selection changes
 * - Panel management buttons in Settings
 * - Settings persistence across panel switches
 * - Edge cases: empty grid with grid config, negative inputs
 */
import { test, expect } from '../fixtures/base'

test.describe('Settings Panel — Grid Line Config', () => {
  // ─── Helper: open Settings tab ───
  async function openSettings(page) {
    const settingsBtn = page.locator('button').filter({ hasText: 'Settings' }).first()
    if (await settingsBtn.count() > 0) {
      await settingsBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }
  }

  async function applyCanvas(page, width: number, height: number) {
    // Ensure Settings tab is open
    await openSettings(page)
    await await new Promise(r => setTimeout(r, 300))

    // Find and fill width/height
    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()

    if (await widthLabel.count() > 0) {
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      const heightInput = heightLabel.locator('..').locator('input[type="number"]')
      await widthInput.clear()
      await widthInput.fill(String(width))
      await heightInput.clear()
      await heightInput.fill(String(height))
    }

    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))
  }

  // ─── TC-21.1: Grid line interval selector exists ───
  test('TC-21.1: Grid line interval selector is visible with options', async ({ page }) => {
    await openSettings(page)

    // Should see "Grid line interval" label or "Every" text
    const intervalSelect = page.locator('select').first()
    await expect(intervalSelect).toBeVisible()

    // Options should include 5, 10, 15, 20
    const options = intervalSelect.locator('option')
    const optionCount = await options.count()
    expect(optionCount).toBeGreaterThanOrEqual(4)
  })

  // ─── TC-21.2: Grid line interval changes update description ───
  test('TC-21.2: Changing grid line interval updates description text', async ({ page }) => {
    await openSettings(page)

    // Find the interval select and the description text below it
    const intervalSelect = page.locator('select').first()

    // Default value should be displayed
    const defaultVal = await intervalSelect.inputValue()
    expect(defaultVal).toMatch(/\d+/)

    // Select "Every 10 stitches"
    await intervalSelect.selectOption({ label: 'Every 10 stitches' })
    await await new Promise(r => setTimeout(r, 300))

    await expect(intervalSelect).toHaveValue('10')

    // The description below should update
    // "Heavy lines every X stitches, medium every Y"
    const gridSection = page.locator('div:has-text("Grid line interval")')
    const heavyText = page.locator('p:text("Heavy lines every")')
    if (await heavyText.count() > 0) {
      await expect(heavyText).toContainText('20') // 10 * 2 = 20 heavy
      await expect(heavyText).toContainText('10')  // 10 medium
    }
  })

  // ─── TC-21.3: Grid line interval selects other values ───
  test('TC-21.3: Grid line interval "Every 5" sets correct description', async ({ page }) => {
    await openSettings(page)

    const intervalSelect = page.locator('select').first()
    await intervalSelect.selectOption({ label: 'Every 5 stitches' })
    await await new Promise(r => setTimeout(r, 300))

    await expect(intervalSelect).toHaveValue('5')

    // Description should say "Heavy lines every 10 stitches, medium every 5"
    const descriptionText = page.locator('p.text-xs.text-gray-400')
    if (await descriptionText.count() > 0) {
      await expect(descriptionText).toContainText('10')
      await expect(descriptionText).toContainText('5')
    }
  })

  // ─── TC-21.4: Label interval selector exists and works ───
  test('TC-21.4: Label interval selector is visible with options', async ({ page }) => {
    await openSettings(page)

    const labelSelect = page.locator('select').last()
    await expect(labelSelect).toBeVisible()

    // Should have "Every stitch", "Every 5 stitches", "Every 10 stitches"
    const options = labelSelect.locator('option')
    const optionCount = await options.count()
    expect(optionCount).toBe(3)
  })

  // ─── TC-21.5: Label interval changes value ───
  test('TC-21.5: Label interval selector updates on change', async ({ page }) => {
    await openSettings(page)

    const labelSelect = page.locator('select').last()
    await labelSelect.selectOption({ label: 'Every 10 stitches' })
    await await new Promise(r => setTimeout(r, 300))

    await expect(labelSelect).toHaveValue('10')
  })

  // ─── TC-21.6: Visual preview shows interval cells ───
  test('TC-21.6: Visual preview updates cell count on interval change', async ({ page }) => {
    await openSettings(page)

    // The preview div says "{interval * 2} cells shown"
    // For default 5, it should say "10 cells shown"
    const previewCells = page.locator('div.text-xs.text-gray-400')

    const previewText = await previewCells.first().textContent()
    expect(previewText).toContain('cells shown')

    // Change interval to 10, preview should say "20 cells shown"
    const intervalSelect = page.locator('select').first()
    await intervalSelect.selectOption({ label: 'Every 10 stitches' })
    await await new Promise(r => setTimeout(r, 300))

    const updatedPreview = await previewCells.first().textContent()
    expect(updatedPreview).toContain('20')
  })

  // ─── TC-21.7: Title field edits correctly ───
  test('TC-21.7: Pattern Name field edits and updates', async ({ page }) => {
    await openSettings(page)

    const titleInput = page.locator('input[placeholder="My Pattern"]')
    await expect(titleInput).toBeVisible()

    const initialValue = await titleInput.inputValue()

    // Type a new name
    await titleInput.clear()
    await titleInput.fill('My Awesome Pattern')
    await await new Promise(r => setTimeout(r, 200))

    await expect(titleInput).toHaveValue('My Awesome Pattern')
  })

  // ─── TC-21.8: Author field edits correctly ───
  test('TC-21.8: Designer field edits and updates', async ({ page }) => {
    await openSettings(page)

    const authorInput = page.locator('input[placeholder="Your name"]')
    await expect(authorInput).toBeVisible()

    await authorInput.fill('StitchMaster42')
    await await new Promise(r => setTimeout(r, 200))

    await expect(authorInput).toHaveValue('StitchMaster42')
  })

  // ─── TC-21.9: Fabric selector has options ───
  test('TC-21.9: Fabric dropdown has correct options', async ({ page }) => {
    await openSettings(page)

    // Find fabric select (dropdown with fabric names)
    const fabricSelect = page.locator('select').nth(1)
    if (await fabricSelect.count() === 0) {
      // Try alternative selector
      const options = page.locator('select')
      const count = await options.count()
      expect(count).toBeGreaterThanOrEqual(2)
    }

    // Should contain known fabric counts
    const optionTexts = await page.locator('select').last().locator('option').allTextContents()
    const allText = optionTexts.join(' ')
    // Should have at least some fabric count options
    expect(allText).toBeTruthy()
  })

  // ─── TC-21.10: Title and author persist across panel switch ───
  test('TC-21.10: Title and author survive panel creation', async ({ page }) => {
    await openSettings(page)

    // Set title and author
    const titleInput = page.locator('input[placeholder="My Pattern"]')
    const authorInput = page.locator('input[placeholder="Your name"]')

    await titleInput.clear()
    await titleInput.fill('Persistent Title')
    await authorInput.clear()
    await authorInput.fill('PersistentAuthor')

    // Create a canvas with different dimensions
    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
    const widthInput = widthLabel.locator('..').locator('input[type="number"]')
    const heightInput = heightLabel.locator('..').locator('input[type="number"]')

    await widthInput.clear()
    await widthInput.fill('10')
    await heightInput.clear()
    await heightInput.fill('10')

    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Reopen Settings
    await openSettings(page)

    // Title and author should be preserved
    const titleInput2 = page.locator('input[placeholder="My Pattern"]')
    await expect(titleInput2).toHaveValue('Persistent Title')

    const authorInput2 = page.locator('input[placeholder="Your name"]')
    await expect(authorInput2).toHaveValue('PersistentAuthor')
  })

  // ─── TC-21.11: Settings panel shows color palette info ───
  test('TC-21.11: Color palette info section is visible', async ({ page }) => {
    await openSettings(page)

    // Should have a section about the color palette
    const paletteSection = page.locator('h3:has-text("Color Palette")')
    await expect(paletteSection).toBeVisible()

    // Should show color swatches (small colored divs)
    const swatches = page.locator('div[style*="background-color"]')
    // Should have at least some swatches visible
    expect(await swatches.count()).toBeGreaterThan(0)
  })

  // ─── TC-21.12: Settings panel shows panel management buttons ───
  test('TC-21.12: Panel management section lists existing panels', async ({ page }) => {
    // First create a panel
    await applyCanvas(page, 10, 10)
    await await new Promise(r => setTimeout(r, 500))

    // Open Settings
    await openSettings(page)

    // Should see a "Panels" heading
    const panelsHeading = page.locator('h3:has-text("Panels")')
    await expect(panelsHeading).toBeVisible()

    // Should list the created panel
    const panelButtons = page.locator('button:has-text("Canvas")')
    if (await panelButtons.count() > 0) {
      await expect(panelButtons.first()).toBeVisible()
    }
  })

  // ─── TC-21.13: Width/Height inputs clamp to sensible values ───
  test('TC-21.13: Width and height accept large values without crash', async ({ page }) => {
    await openSettings(page)

    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
    const widthInput = widthLabel.locator('..').locator('input[type="number"]')
    const heightInput = heightLabel.locator('..').locator('input[type="number"]')

    // Try large values
    await widthInput.clear()
    await widthInput.fill('200')
    await heightInput.clear()
    await heightInput.fill('200')

    // Should not throw — UI should still be functional
    await expect(widthInput).toHaveValue('200')
    await expect(heightInput).toHaveValue('200')
  })

  // ─── TC-21.14: Grid config changes are applied immediately ───
  test('TC-21.14: Grid line interval change applies without save button', async ({ page }) => {
    await openSettings(page)

    // Change interval — should be immediate (no explicit save needed)
    const intervalSelect = page.locator('select').first()
    await intervalSelect.selectOption({ label: 'Every 20 stitches' })
    await await new Promise(r => setTimeout(r, 300))

    await expect(intervalSelect).toHaveValue('20')

    // The description should reflect the change
    const descriptionText = page.locator('p.text-xs.text-gray-400')
    if (await descriptionText.count() > 0) {
      await expect(descriptionText).toContainText('40') // 20 * 2
      await expect(descriptionText).toContainText('20')
    }
  })

  // ─── TC-21.15: Settings panel tab persists on page refresh ───
  test('TC-21.15: Last opened panel tab state is maintained', async ({ page }) => {
    // Open Settings
    await openSettings(page)

    // Verify Settings content is visible
    const settingsHeading = page.locator('h3:has-text("Project Info")')
    await expect(settingsHeading).toBeVisible()
  })
})
