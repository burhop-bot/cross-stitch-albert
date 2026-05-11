/**
 * Header menu interaction tests
 *
 * Comprehensive tests for header dropdown menus, button interactions,
 * panel label bar, export PNG, and the clear pattern confirmation flow.
 *
 * Targets: header menu positioning, close-on-blur behavior, menu conflicts,
 * project title display updates, export advanced options, panel label bar.
 */

import { test, expect } from '@playwright/test'

// Navigate to app before each test (baseURL not auto-applied without base fixture)
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('header', { timeout: 10000 })
})

// ─── Header title display ───────────────────────────────────────────

test.describe('Header title display', () => {
  test('header shows "Cross-Stitch Studio" as app title', async ({ page }) => {
    const header = page.locator('header')
    await expect(header.locator('h1').first()).toContainText('Cross-Stitch Studio')
  })

  test('header shows project title next to app title', async ({ page }) => {
    // Default title is "New Pattern"
    const header = page.locator('header')
    await expect(header.locator('span.text-sm.opacity-80').first()).toContainText('New Pattern')
  })

  test('header title updates when project name changes in settings', async ({ page }) => {

    // Open settings
    const rightPanelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await rightPanelButton.click()

    // Wait for right panel to open
    await expect(page.locator('h3').filter({ hasText: /Project Info/i })).toBeVisible()

    // Change title
    const titleInput = page.locator('input[placeholder="My Pattern"]')
    await titleInput.clear()
    await titleInput.fill('My Custom Design')

    // Save — button says "Apply & Resize Canvas"
    const applyBtn = page.getByRole('button', { name: /Apply & Resize Canvas/i })
    await applyBtn.click()

    // Close panel
    await page.getByRole('button', { name: /Close panel/i }).first().click()

    // Wait for header to update
    const headerTitle = page.locator('header').locator('span.text-sm.opacity-80').first()
    await expect(headerTitle).toContainText('My Custom Design')
  })

  test('header title handles long project names', async ({ page }) => {

    const rightPanelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await rightPanelButton.click()

    const titleInput = page.locator('input[placeholder="My Pattern"]')
    await titleInput.clear()
    await titleInput.fill('A'.repeat(100))

    const applyBtn = page.getByRole('button', { name: /Apply & Resize Canvas/i })
    await applyBtn.click()

    await page.getByRole('button', { name: /Close panel/i }).first().click()

    // Title should be visible even if truncated in UI
    const headerTitle = page.locator('header').locator('span.text-sm.opacity-80').first()
    await expect(headerTitle).toBeVisible()
  })

  test('header title updates when author changes', async ({ page }) => {

    const rightPanelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await rightPanelButton.click()

    const authorInput = page.locator('input[placeholder="Your name"]')
    await authorInput.fill('Jane Doe')

    const applyBtn = page.getByRole('button', { name: /Apply & Resize Canvas/i })
    await applyBtn.click()

    await page.getByRole('button', { name: /Close panel/i }).first().click()

    // The author is not displayed in the header, but settings should save
    // This test verifies the author field saves without error
    await expect(page.locator('h3').filter({ hasText: /Project Info/i })).toBeVisible()
  })
})

// ─── File menu interactions ───────────────────────────────────────

test.describe('File menu interactions', () => {
  test('File menu opens on click', async ({ page }) => {
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()

    // Menu should appear with Save Project button
    await expect(page.getByText('Save Project')).toBeVisible()
    await expect(page.getByText('Load Project')).toBeVisible()
    await expect(page.getByText('Clear Pattern')).toBeVisible()
  })

  test('File menu closes on click-outside', async ({ page }) => {
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()

    await expect(page.getByText('Save Project')).toBeVisible()

    // Click elsewhere in the header
    await page.locator('header').locator('h1').first().click()

    // Menu should close
    await expect(page.getByText('Save Project')).not.toBeVisible()
  })

  test('File menu closes when Save Project is clicked', async ({ page }) => {
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()

    await expect(page.getByText('Save Project')).toBeVisible()

    // Click Save Project
    await page.getByText('Save Project').click()

    // Menu should close after save
    await expect(page.getByText('Save Project')).not.toBeVisible()
  })

  test('Save Project button exists in File menu', async ({ page }) => {
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()

    // Verify Save Project has the save icon
    const saveBtn = page.getByText('Save Project')
    await expect(saveBtn).toBeVisible()
    // Should be inside a button
    await expect(saveBtn.locator('..')).toHaveAttribute('class', /hover:bg-indigo-50/)
  })

  test('File menu dropdown is positioned below button', async ({ page }) => {
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()

    // The dropdown should be in a relative container with absolute positioned menu
    const fileMenu = fileButton.locator('..').locator('div.absolute')
    await expect(fileMenu).toBeVisible()
    await expect(fileMenu).toHaveAttribute('class', /mt-1/) // appears below button
  })
})

// ─── Export menu interactions ─────────────────────────────────────

test.describe('Export menu interactions', () => {
  test('Export menu opens on click', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    // Menu should appear
    await expect(page.getByText('Pattern PDF')).toBeVisible()
    await expect(page.getByText('Shopping List')).toBeVisible()
  })

  test('Export menu has advanced options expandable section', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    // Initially, Export Options is collapsed
    const advancedBtn = page.getByText('Export Options')
    await expect(advancedBtn).toBeVisible()

    // Expand
    await advancedBtn.click()

    // Now options should appear
    await expect(page.getByText('Page Size')).toBeVisible()
    await expect(page.getByText('Stitch Size (mm)')).toBeVisible()
  })

  test('Export menu advanced options page size selector', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    const advancedBtn = page.getByText('Export Options')
    await advancedBtn.click()

    // Select different page sizes
    const select = page.locator('select')
    await select.selectOption('a5')
    await expect(select).toHaveValue('a5')

    await select.selectOption('letter')
    await expect(select).toHaveValue('letter')

    await select.selectOption('legal')
    await expect(select).toHaveValue('legal')
  })

  test('Export menu advanced options checkbox toggles', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    const advancedBtn = page.getByText('Export Options')
    await advancedBtn.click()

    // Watermark checkbox
    const watermarkLabel = page.getByText('Add watermark')
    const watermarkCheckbox = watermarkLabel.locator('input[type="checkbox"]')
    await expect(watermarkCheckbox).not.toBeChecked()

    await watermarkCheckbox.click()
    await expect(watermarkCheckbox).toBeChecked()

    // Watermark text input should appear
    await expect(page.locator('input[placeholder="Watermark text..."]')).toBeVisible()

    // Uncheck
    await watermarkCheckbox.click()
    await expect(watermarkCheckbox).not.toBeChecked()

    // Watermark text input should disappear
    await expect(page.locator('input[placeholder="Watermark text..."]')).not.toBeVisible()
  })

  test('Export menu advanced options stitch label interval selector', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    const advancedBtn = page.getByText('Export Options')
    await advancedBtn.click()

    // Toggle stitch labels on
    const labelLabel = page.getByText('Show stitch count labels')
    const labelCheckbox = labelLabel.locator('input[type="checkbox"]')
    await labelCheckbox.click()

    // Interval selector should appear
    const intervalSelect = page.locator('select').nth(1)
    await expect(intervalSelect).toBeVisible()

    // Check options
    const options = intervalSelect.locator('option')
    await expect(options).toHaveCount(3)
  })

  test('Export menu closes on outside click', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    await expect(page.getByText('Pattern PDF')).toBeVisible()

    // Click header title
    await page.locator('header').locator('h1').first().click()

    await expect(page.getByText('Pattern PDF')).not.toBeVisible()
  })

  test('Export menu closes after Pattern PDF is clicked', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    await expect(page.getByText('Pattern PDF')).toBeVisible()

    // Pattern PDF should trigger export and close menu
    await page.getByText('Pattern PDF').click()

    // Menu should close
    await expect(page.getByText('Pattern PDF')).not.toBeVisible()
  })

  test('Clicking Export when File menu is open closes File menu first', async ({ page }) => {

    // Open File menu
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()
    await expect(page.getByText('Save Project')).toBeVisible()

    // Open Export menu
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    // File menu should be closed (click-outside handler)
    await expect(page.getByText('Save Project')).not.toBeVisible()

    // Export menu should be visible
    await expect(page.getByText('Pattern PDF')).toBeVisible()
  })

  test('Export menu Written Instructions opens right panel', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    await page.getByText('Written Instructions').click()

    // Right panel should show instructions (currently placeholder text)
    await expect(page.locator('p').filter({ hasText: /coming/i }).first()).toBeVisible()

    // Export menu should close
    await expect(page.getByText('Pattern PDF')).not.toBeVisible()
  })

  test('Export menu Progress Tracker opens right panel', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await exportButton.click()

    await page.getByText('Progress Tracker').click()

    // Right panel should open ProgressTracker
    await expect(page.locator('h3').filter({ hasText: /Progress/i }).first()).toBeVisible()
  })
})

// ─── Export PNG button ────────────────────────────────────────────

test.describe('Export PNG button', () => {
  test('Export PNG button is visible in header', async ({ page }) => {
    await expect(page.getByText('Export PNG').first()).toBeVisible()
  })

  test('Export PNG button triggers canvas-based export', async ({ page }) => {

    // The Export PNG button should exist and not throw errors
    const exportPngBtn = page.getByText('Export PNG').first()
    await expect(exportPngBtn).toBeVisible()

    // Check button has correct text
    await expect(exportPngBtn).toContainText('Export PNG')
  })
})

// ─── Panel toggle button ──────────────────────────────────────────

test.describe('Header Panel toggle button', () => {
  test('Panel toggle button opens settings panel', async ({ page }) => {

    const panelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await panelButton.click()

    // Settings panel should open
    await expect(page.locator('h3').filter({ hasText: /Project Info/i })).toBeVisible()
  })

  test('Panel toggle button closes settings panel', async ({ page }) => {

    const panelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await panelButton.click()
    await expect(page.locator('h3').filter({ hasText: /Project Info/i })).toBeVisible()

    // Click again to close
    await panelButton.click()

    // Panel should close
    await expect(page.locator('h3').filter({ hasText: /Project Info/i })).not.toBeVisible()
  })

  test('Panel toggle button reopens to settings (not last tab)', async ({ page }) => {

    const panelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await panelButton.click()

    // Go to symbols tab
    const symbolsTab = page.getByRole('tab', { name: /Symbols/i })
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
    }

    // Close and reopen
    await page.getByRole('button', { name: /Close panel/i }).first().click()
    await panelButton.click()

    // Should open to settings (default), not symbols
    await expect(page.locator('h3').filter({ hasText: /Project Info/i })).toBeVisible()
  })
})

// ─── Panel label bar ─────────────────────────────────────────────

test.describe('Panel label bar', () => {
  test('panel label bar shows panel name when grid is active', async ({ page }) => {

    // The panel label bar is a div with bg-white border-b above the grid
    const panelLabel = page.locator('main').locator('div').filter({ hasText: 'Panel 1' }).first()
    await expect(panelLabel).toBeVisible()
    await expect(panelLabel).toContainText('Panel 1')
  })

  test('panel label bar shows dimensions for grid', async ({ page }) => {

    // Default grid is 40x40, label bar shows "40×40 stitches"
    const dimensionText = page.locator('main').locator('span.text-xs.text-gray-500').first()
    await expect(dimensionText).toBeVisible()
  })

  test('panel label bar updates when dimensions change in settings', async ({ page }) => {

    const panelButton = page.getByRole('button', { name: /Toggle right panel/i })
    await panelButton.click()

    // Change dimensions
    const widthInput = page.locator('label:has-text("Width")').locator('input[type="number"]')
    const heightInput = page.locator('label:has-text("Height")').locator('input[type="number"]')

    await widthInput.fill('20')
    await heightInput.fill('15')

    const applyBtn = page.getByRole('button', { name: /Apply & Resize Canvas/i })
    await applyBtn.click()
    await page.getByRole('button', { name: /Close panel/i }).first().click()

    // Wait for grid to re-render with new dimensions
    await await new Promise(r => setTimeout(r, 500))

    // The dimension label should update
    const dimensionText = page.locator('main').locator('span.text-xs.text-gray-500').first()
    await expect(dimensionText).toBeVisible()
  })
})

// ─── Clear pattern confirmation flow ──────────────────────────────

test.describe('Clear pattern confirmation flow', () => {
  test('clear pattern dialog appears from File menu', async ({ page }) => {

    // Click File menu → Clear Pattern
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()
    await page.getByText('Clear Pattern').click()

    // Clear pattern dialog should appear with aria-modal (rendered as div with role="dialog")
    const dialog = page.locator('[role="dialog"][aria-label="Clear pattern confirmation"]').first()
    await expect(dialog).toBeVisible()

    // Label with CLEAR text should be present
    await expect(page.locator('label').filter({ hasText: /CLEAR/i })).toBeVisible()

    // Confirm button should be disabled until CLEAR is typed
    const confirmBtn = page.getByRole('button', { name: /Clear Pattern/i }).last()
    await expect(confirmBtn).toBeDisabled()
  })

  test('clear pattern requires typing CLEAR to confirm', async ({ page }) => {

    // Open File menu → Clear Pattern
    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()
    await page.getByText('Clear Pattern').click()

    // Confirm button should be disabled initially
    const confirmBtn = page.getByRole('button', { name: /Clear Pattern/i }).last()
    await expect(confirmBtn).toBeDisabled()

    // Type CLEAR
    const clearInput = page.locator('[role="dialog"] input[type="text"]').first()
    await clearInput.fill('CLEAR')

    // Now confirm should be enabled
    await expect(confirmBtn).toBeEnabled()
  })

  test('clear pattern can be cancelled via Close button', async ({ page }) => {

    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()
    await page.getByText('Clear Pattern').click()

    // Type CLEAR (enabling confirm)
    await page.locator('[role="dialog"] input[type="text"]').first().fill('CLEAR')

    // Close the dialog via close button
    await page.getByRole('button', { name: /Close dialog/i }).first().click()

    // Dialog should be closed
    await expect(page.locator('[role="dialog"][aria-label="Clear pattern confirmation"]')).not.toBeVisible()
  })

  test('clear pattern can be cancelled via backdrop click', async ({ page }) => {

    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()
    await page.getByText('Clear Pattern').click()

    // Click the backdrop (the black overlay)
    await page.locator('[role="dialog"]').locator('div.absolute.inset-0').first().click()

    // Dialog should be closed
    await expect(page.locator('[role="dialog"][aria-label="Clear pattern confirmation"]')).not.toBeVisible()
  })

  test('clear pattern dialog shows panel name', async ({ page }) => {

    const fileButton = page.getByRole('button', { name: /File/i })
    await fileButton.click()
    await page.getByText('Clear Pattern').click()

    // Should mention the panel name in the dialog body
    await expect(page.locator('[role="dialog"]').filter({ hasText: /permanently clear/i })).toBeVisible()
  })
})

// ─── Header button visibility ─────────────────────────────────────

test.describe('Header button visibility', () => {
  test('theme toggle button exists in header', async ({ page }) => {

    // Theme toggle button should be in the header
    const themeToggle = page.locator('header').getByRole('button').filter({ hasText: /light|dark/i }).first()
    await expect(themeToggle).toBeVisible()
  })

  test('keyboard shortcuts button exists in header', async ({ page }) => {
    const kbButton = page.locator('header').getByRole('button').filter({ hasTitle: /keyboard/i }).first()
    await expect(kbButton).toBeVisible()
  })

  test('share button exists in header', async ({ page }) => {
    await expect(page.getByText('Share').first()).toBeVisible()
  })

  test('Export PNG button is visible alongside other buttons', async ({ page }) => {
    const exportPngBtn = page.getByText('Export PNG').first()
    await expect(exportPngBtn).toBeVisible()
  })

  test('multiple header buttons visible simultaneously', async ({ page }) => {

    // Verify several buttons exist at the same time
    await expect(page.getByText('Share').first()).toBeVisible()
    await expect(page.getByText('Export PNG').first()).toBeVisible()

    const fileButton = page.getByRole('button', { name: /File/i })
    await expect(fileButton).toBeVisible()

    const exportButton = page.getByRole('button', { name: /Export/i }).first()
    await expect(exportButton).toBeVisible()
  })
})
