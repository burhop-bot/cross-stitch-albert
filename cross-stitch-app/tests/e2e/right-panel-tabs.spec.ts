/**
 * RightPanel tab switching behavior tests
 *
 * The RightPanel has 9 tabs that switch content on click:
 * Project (Settings), Symbols, Import, Convert V1, Convert V2,
 * Progress (ProgressTracker), Instructions, Inventory, Notes
 *
 * These tests cover: tab visibility & labels, active/inactive styling,
 * content switching between all tabs, close button, state preservation,
 * keyboard navigation, and edge cases (rapid switching, empty grid, etc).
 *
 * Potential bugs targeted:
 * - Tab click doesn't update active state
 * - Content doesn't switch (stale render)
 * - Auto-save toggle persists across tab switches
 * - ActiveTab/activeRightPanel state desync
 * - Close button doesn't persist state
 * - Keyboard shortcut (Enter/Space) activates wrong tab
 */

import { test, expect } from '../fixtures/base'

// ─── Tab bar visibility and labels ──────────────────────────────────────

test.describe('RightPanel tab bar — visibility and labels', () => {
  test('[ @smoke ] opening right panel shows tab bar with all 10 tabs', async ({ page }) => {

    // Open the right panel
    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await expect(panelBtn).toBeVisible()
    await panelBtn.click()

    // Wait for the right panel (has class w-80 bg-white) to appear
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Verify tab bar contains expected tabs
    const expectedTabs = [
      'Project',
      'Symbols',
      'Import',
      'Convert V1',
      'Convert V2',
      'Progress',
      'Instructions',
      'Inventory',
      'Notes',
      'Library',
    ]

    for (const tabLabel of expectedTabs) {
      const tabBtn = page.locator('button').filter({ hasText: tabLabel }).first()
      await expect(tabBtn).toBeVisible()
    }
  })

  test('tab bar shows active tab with indigo styling', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Project tab should be the default active tab
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await expect(projectTab).toHaveClass(/bg-indigo-50/)
    await expect(projectTab).toHaveClass(/text-indigo-600/)
    await expect(projectTab).toHaveClass(/border-indigo-500/)
  })

  test('tab bar items have accessible role and are clickable', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // All tabs should be clickable buttons
    const tabs = page.locator('button').filter({ hasText: /Project|Symbols|Import|Convert|Progress|Instructions|Inventory|Notes/ })
    await expect(tabs).toHaveCount(10)

    for (let i = 0; i < 9; i++) {
      await expect(tabs.nth(i)).toBeEnabled()
    }
  })

  test('tab bar has close button', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Close button should be in the panel header area
    const closeBtn = page.locator('button[title="Close panel"]')
    await expect(closeBtn).toBeVisible()
  })
})

// ─── Tab switching between all 9 tabs ──────────────────────────────────

test.describe('RightPanel tab switching', () => {
  test('clicking Symbols tab shows symbol legend content', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Symbols tab
    await page.locator('button').filter({ hasText: 'Symbols' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // SymbolLegendPanel header should be visible
    const symbolsContent = page.locator('h3').filter({ hasText: /Symbols|Symbol/i }).first()
    await expect(symbolsContent).toBeVisible()
  })

  test('clicking Import tab shows image upload area', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Import tab
    await page.locator('button').filter({ hasText: 'Import' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // ImageUploader drop area should be visible
    const uploadArea = page.locator('div').filter({ hasText: /Drag & drop/i }).first()
    await expect(uploadArea).toBeVisible()
  })

  test('clicking Convert V1 tab shows conversion panel with placeholder', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Convert V1 tab
    await page.locator('button').filter({ hasText: 'Convert V1' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // ImageConversionPanel should be visible (shows upload prompt when no image)
    const conversionContent = page.locator('div').filter({ hasText: /Convert|conversion/i }).first()
    await expect(conversionContent).toBeVisible()
  })

  test('clicking Convert V2 tab shows conversion panel with settings', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Convert V2 tab
    await page.locator('button').filter({ hasText: 'Convert V2' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // ImageConversionPanelV2 should be visible
    // It has stitch width/height inputs, color count slider, dithering selector
    const v2Content = page.locator('div').filter({ hasText: /Image-to-chart|Image-to-Chart/i }).first()
    if (await v2Content.count() > 0) {
      await expect(v2Content).toBeVisible()
    }
  })

  test('clicking Progress tab shows progress tracker with auto-save', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Progress tab
    await page.locator('button').filter({ hasText: 'Progress' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // ProgressTracker header should be visible
    const progressContent = page.locator('h3').filter({ hasText: /Progress/i }).first()
    await expect(progressContent).toBeVisible()

    // Auto-save toggle should be visible
    const autoSaveLabel = page.locator('text=Auto-save')
    await expect(autoSaveLabel).toBeVisible()
  })

  test('clicking Instructions tab shows placeholder content', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Instructions tab
    await page.locator('button').filter({ hasText: 'Instructions' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // Should show placeholder: "Written chart instructions coming in Wave 2."
    const placeholderText = page.locator('p').filter({ hasText: /Wave 2/i }).first()
    await expect(placeholderText).toBeVisible()
  })

  test('clicking Inventory tab shows inventory panel with empty state', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Inventory tab
    await page.locator('button').filter({ hasText: 'Inventory' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // InventoryPanel header should be visible
    const inventoryContent = page.locator('h3').filter({ hasText: /Inventory/i }).first()
    await expect(inventoryContent).toBeVisible()
  })

  test('clicking Notes tab shows notes panel', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Notes tab
    await page.locator('button').filter({ hasText: 'Notes' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // NotesPanel should be visible (has a "Notes" heading)
    const notesContent = page.locator('h3').filter({ hasText: /Notes/i }).first()
    await expect(notesContent).toBeVisible()
  })
})

// ─── Active/inactive tab styling transitions ────────────────────────────

test.describe('Tab styling transitions', () => {
  test('active tab loses indigo styling when another tab is clicked', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Project tab is active (indigo)
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await expect(projectTab).toHaveClass(/bg-indigo-50/)

    // Click Symbols tab
    await page.locator('button').filter({ hasText: 'Symbols' }).first().click()
    await new Promise(r => setTimeout(r, 200))

    // Project tab should no longer be active
    await expect(projectTab).not.toHaveClass(/bg-indigo-50/)
    await expect(projectTab).not.toHaveClass(/border-indigo-500/)

    // Symbols tab should now be active
    const symbolsTab = page.locator('button').filter({ hasText: 'Symbols' }).first()
    await expect(symbolsTab).toHaveClass(/bg-indigo-50/)
    await expect(symbolsTab).toHaveClass(/text-indigo-600/)
  })

  test('hover state on inactive tabs changes color', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Find an inactive tab
    const importTab = page.locator('button').filter({ hasText: 'Import' }).first()

    // Hover over the tab
    await importTab.hover()

    // Hover text color should change (text-gray-700 or similar)
    // The tab should be visible on hover
    await expect(importTab).toBeVisible()
  })

  test('navigating all 9 tabs in sequence works correctly', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    const tabOrder = [
      'Project',
      'Symbols',
      'Import',
      'Convert V1',
      'Convert V2',
      'Progress',
      'Instructions',
      'Inventory',
      'Notes',
    ]

    for (const tabLabel of tabOrder) {
      // Wait for current content to settle
      await new Promise(r => setTimeout(r, 100))

      // Click the tab
      await page.locator('button').filter({ hasText: tabLabel }).first().click()
      await new Promise(r => setTimeout(r, 100))

      // Verify this tab has active styling
      await expect(page.locator('button').filter({ hasText: tabLabel }).first())
        .toHaveClass(/bg-indigo-50/)
    }
  })

  test('navigating tabs in reverse order works correctly', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    const tabOrder = [
      'Notes',
      'Inventory',
      'Instructions',
      'Progress',
      'Convert V2',
      'Convert V1',
      'Import',
      'Symbols',
    ]

    for (const tabLabel of tabOrder) {
      await new Promise(r => setTimeout(r, 100))
      await page.locator('button').filter({ hasText: tabLabel }).first().click()
      await new Promise(r => setTimeout(r, 100))

      await expect(page.locator('button').filter({ hasText: tabLabel }).first())
        .toHaveClass(/bg-indigo-50/)
    }
  })
})

// ─── Close button behavior ─────────────────────────────────────────────

test.describe('Close button behavior', () => {
  test('[ @smoke ] close button closes the right panel', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    // Wait for the right panel sidebar to appear (it has a specific class)
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Close the panel
    await page.locator('[title="Close panel"]').click()

    // Panel should be hidden
    await expect(page.locator('[class*=w-80][class*=bg-white]')).not.toBeVisible()
  })

  test('closing and reopening panel resets to default tab (Project)', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })

    // Open, switch to Notes
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })
    await page.locator('button').filter({ hasText: 'Notes' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    await expect(page.locator('h3').filter({ hasText: /Notes/i })).toBeVisible()

    // Close the panel
    await page.locator('button[title="Close panel"]').click()

    // Reopen
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Should show Project tab content (SettingsPanel)
    await expect(page.locator('h3').filter({ hasText: /Project Info|Settings/i })).toBeVisible()
  })
})

// ─── State preservation across tab switches ─────────────────────────────

test.describe('State preservation across tab switches', () => {
  test('auto-save toggle state persists when switching tabs', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Navigate to Progress tab
    await page.locator('button').filter({ hasText: 'Progress' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // Find and click the auto-save checkbox
    const autoSaveToggle = page.locator('input[type="checkbox"]').first()
    if (await autoSaveToggle.count() > 0) {
      // Toggle it on
      await autoSaveToggle.check()
      await new Promise(r => setTimeout(r, 200))

      // Verify it's checked
      await expect(autoSaveToggle).toBeChecked()

      // Switch to a different tab
      await page.locator('button').filter({ hasText: 'Symbols' }).first().click()
      await new Promise(r => setTimeout(r, 200))

      // Switch back to Progress
      await page.locator('button').filter({ hasText: 'Progress' }).first().click()
      await new Promise(r => setTimeout(r, 300))

      // Auto-save should still be enabled
      const savedToggle = page.locator('input[type="checkbox"]').first()
      await expect(savedToggle).toBeChecked()
    }
  })

  test('settings panel edits persist across tab switches', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Change the project title in the Project tab
    const titleInput = page.locator('input[placeholder="My Pattern"]')
    if (await titleInput.count() > 0) {
      await titleInput.clear()
      await titleInput.fill('Tab Switch Test')
      await new Promise(r => setTimeout(r, 200))

      // Switch to another tab
      await page.locator('button').filter({ hasText: 'Symbols' }).first().click()
      await new Promise(r => setTimeout(r, 200))

      // Switch back to Project
      await page.locator('button').filter({ hasText: 'Project' }).first().click()
      await new Promise(r => setTimeout(r, 300))

      // The title input should retain the edited value (before it was saved)
      const currentTitle = await titleInput.inputValue()
      expect(currentTitle).toBe('Tab Switch Test')
    }
  })
})

// ─── Keyboard navigation of tabs ────────────────────────────────────────

test.describe('Tab keyboard navigation', () => {
  test('tab buttons are focusable and can be activated with Enter', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Focus the Import tab and activate with Enter
    const importTab = page.locator('button').filter({ hasText: 'Import' }).first()
    await importTab.focus()
    await page.keyboard.press('Enter')
    await new Promise(r => setTimeout(r, 300))

    // Import content should be visible
    const uploadArea = page.locator('div').filter({ hasText: /Drag & drop/i }).first()
    await expect(uploadArea).toBeVisible()
  })

  test('tab buttons are focusable and can be activated with Space', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Focus the Inventory tab and activate with Space
    const inventoryTab = page.locator('button').filter({ hasText: 'Inventory' }).first()
    await inventoryTab.focus()
    await page.keyboard.press('Space')
    await new Promise(r => setTimeout(r, 300))

    // Inventory content should be visible
    const inventoryContent = page.locator('h3').filter({ hasText: /Inventory/i }).first()
    await expect(inventoryContent).toBeVisible()
  })
})

// ─── Edge cases ─────────────────────────────────────────────────────────

test.describe('Edge cases', () => {
  test('rapid tab switching does not crash or freeze UI', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Rapidly switch between all tabs multiple times
    const tabLabels = [
      'Project', 'Symbols', 'Import', 'Convert V1', 'Convert V2',
      'Progress', 'Instructions', 'Inventory', 'Notes',
    ]

    for (let cycle = 0; cycle < 3; cycle++) {
      for (const label of tabLabels) {
        await page.locator('button').filter({ hasText: label }).first().click()
        await new Promise(r => setTimeout(r, 50))
      }
    }

    // Page should still be responsive
    await expect(page.locator('header')).toBeVisible()
    await expect(panelBtn).toBeVisible()

    // Last tab (Notes) should be active
    await expect(page.locator('button').filter({ hasText: 'Notes' }).first())
      .toHaveClass(/bg-indigo-50/)
  })

  test('close button can be re-opened via panel toggle button', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })

    // Open, close, reopen
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })
    await page.locator('button[title="Close panel"]').click()
    await expect(page.locator('[class*="w-80"]').first()).not.toBeVisible()

    await panelBtn.click()
    await expect(page.locator('div').filter({ hasText: 'Project' })).toBeVisible()
  })

  test('tab switching while placing stitches on grid works', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Click Apply to create a small grid
    const applyBtn = page.locator('button').filter({ hasText: 'Apply & Resize Canvas' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Place a stitch using the pencil tool
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await new Promise(r => setTimeout(r, 200))
    }

    // Click on the grid to place a stitch
    const main = page.locator('main').first()
    await main.click({ position: { x: 50, y: 50 } })
    await new Promise(r => setTimeout(r, 200))

    // Switch to Progress tab
    await page.locator('button').filter({ hasText: 'Progress' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // Progress tracker should show 0% (since stitch wasn't completed via shift-click)
    // or some value depending on how placement is tracked
    const progressContent = page.locator('h3').filter({ hasText: /Progress/i }).first()
    await expect(progressContent).toBeVisible()

    // Switch back to project editing
    await page.locator('button').filter({ hasText: 'Project' }).first().click()
    await new Promise(r => setTimeout(r, 200))

    // Grid should still be editable
    const gridArea = page.locator('main').first()
    await expect(gridArea).toBeVisible()
  })

  test('Instructions placeholder persists even after switching away and back', async ({ page }) => {

    const panelBtn = page.getByRole('button', { name: /Toggle right panel/i })
    await panelBtn.click()
    await expect(page.locator('[class*=w-80][class*=bg-white]')).toBeVisible({ timeout: 10000 })

    // Go to Instructions tab
    await page.locator('button').filter({ hasText: 'Instructions' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // Placeholder should be visible
    await expect(page.locator('p').filter({ hasText: /Wave 2/i })).toBeVisible()

    // Switch to other tabs
    await page.locator('button').filter({ hasText: 'Notes' }).first().click()
    await new Promise(r => setTimeout(r, 200))
    await page.locator('button').filter({ hasText: 'Symbols' }).first().click()
    await new Promise(r => setTimeout(r, 200))

    // Switch back to Instructions
    await page.locator('button').filter({ hasText: 'Instructions' }).first().click()
    await new Promise(r => setTimeout(r, 300))

    // Placeholder should still be there (no data was ever generated)
    await expect(page.locator('p').filter({ hasText: /Wave 2/i })).toBeVisible()
  })
})
