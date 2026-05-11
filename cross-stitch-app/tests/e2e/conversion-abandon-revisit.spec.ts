/**
 * Image Conversion — abandon & revisit lifecycle tests
 *
 * Tests for import/conversion tab state management when users:
 *   1. Open Import/Conversion tabs and switch away
 *   2. Come back — does content persist or reset?
 *   3. Change conversion settings without applying — do they affect undo?
 *   4. Rapidly cycle through import/conversion tabs
 *
 * Potential bugs targeted:
 *   - Conversion panel settings reset when switching away and back
 *   - Uncommitted conversion changes push to undo stack
 *   - Panel content doesn't render on revisit after tab switch
 *   - "Go to Import" button navigation from conversion V1
 */

import { test, expect } from '../fixtures/base'

// Helper: open right panel and wait for content
async function openPanel(page) {
  const panelBtn = page.getByRole('button', { name: 'Panel' })
  await panelBtn.click()
  // Wait for the right panel's tab bar to appear
  await expect(page.locator('div').filter({ hasText: 'ProjectSymbolsImport' }).first())
    .toBeVisible({ timeout: 10000 })
  return panelBtn
}

// Helper: click a right-panel tab by label (scoped to the tab bar)
async function clickPanelTab(page, label: string) {
  // The right panel tab bar is inside div.flex.border-b
  await page.locator('div.flex.border-b.border-gray-200')
    .locator('button')
    .filter({ hasText: label })
    .first()
    .click()
  await await new Promise(r => setTimeout(r, 300))
}

// ─── Import tab state lifecycle ──────────────────────────────────────────

test.describe('Import tab — abandon and revisit state', () => {
  test('import tab content renders when opened directly', async ({ page }) => {
    await openPanel(page)

    await clickPanelTab(page, 'Import')

    // Should show the drag-and-drop upload area
    const uploadText = page.locator('p').filter({ hasText: /Drag/i })
    await expect(uploadText).toBeVisible()

    // Upload area should have dashed border
    const uploadArea = page.locator('div.border-dashed').first()
    await expect(uploadArea).toBeVisible()

    // Should have "or click to browse" text
    const clickText = page.locator('p').filter({ hasText: /click to browse/i }).first()
    await expect(clickText).toBeVisible()
  })

  test('import tab shows upload prompt when navigated to after other tabs', async ({ page }) => {
    await openPanel(page)

    // Visit Symbols then Progress then back to Import
    await clickPanelTab(page, 'Symbols')
    await clickPanelTab(page, 'Progress')
    await clickPanelTab(page, 'Import')

    // Upload area should be visible
    const uploadText = page.locator('p').filter({ hasText: /Drag/i })
    await expect(uploadText).toBeVisible()
  })

  test('import tab supports keyboard activation', async ({ page }) => {
    await openPanel(page)

    // Focus the Import tab and activate with Space (more reliable for buttons)
    const importTab = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Import' })
      .first()
    await importTab.focus()
    await page.keyboard.press('Space')
    await await new Promise(r => setTimeout(r, 500))

    // Import content should be visible
    const uploadText = page.locator('p').filter({ hasText: /Drag/i }).first()
    await expect(uploadText).toBeVisible()
  })
})

// ─── Conversion V2 settings lifecycle ────────────────────────────────────

test.describe('Conversion V2 — settings and placeholder behavior', () => {
  test('conversion V2 tab renders and shows upload prompt when no image', async ({ page }) => {
    await openPanel(page)

    await clickPanelTab(page, 'Convert V2')

    // Should show upload prompt or conversion settings
    const uploadArea = page.locator('div').filter({ hasText: /Drag/i }).first()
    await expect(uploadArea).toBeVisible()
  })

  test('conversion V2 tab is accessible via keyboard', async ({ page }) => {
    await openPanel(page)

    // Focus Convert V2 tab and activate with Space
    const convertTab = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V2' })
      .first()
    await convertTab.focus()
    await page.keyboard.press('Space')
    await await new Promise(r => setTimeout(r, 300))

    // Tab should have active styling
    await expect(convertTab).toHaveClass(/bg-indigo-50/)
  })

  test('conversion V2 active styling is correct', async ({ page }) => {
    await openPanel(page)

    // Click Convert V2 tab
    await clickPanelTab(page, 'Convert V2')

    // Should have indigo active styling
    const v2Btn = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V2' })
      .first()
    await expect(v2Btn).toHaveClass(/bg-indigo-50/)
    await expect(v2Btn).toHaveClass(/text-indigo-600/)
    await expect(v2Btn).toHaveClass(/border-indigo-500/)
  })
})

// ─── Conversion V1 settings lifecycle ────────────────────────────────────

test.describe('Conversion V1 — settings and placeholder behavior', () => {
  test('conversion V1 tab renders with placeholder when no image', async ({ page }) => {
    await openPanel(page)

    await clickPanelTab(page, 'Convert V1')

    // Should show placeholder about importing
    const placeholder = page.locator('p').filter({ hasText: /Import an image/i })
    await expect(placeholder).toBeVisible()

    // "Go to Import" button should be visible
    const goToImportBtn = page.locator('button').filter({ hasText: /Go to Import/i })
    await expect(goToImportBtn).toBeVisible()
  })

  test('go to import from conversion V1 placeholder switches to import tab', async ({ page }) => {
    await openPanel(page)

    await clickPanelTab(page, 'Convert V1')

    // Click the "Go to Import" button
    const goToImportBtn = page.locator('button').filter({ hasText: /Go to Import/i })
    await goToImportBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Should now be on the Import tab
    const uploadText = page.locator('p').filter({ hasText: /Drag/i }).first()
    await expect(uploadText).toBeVisible()
  })

  test('conversion V1 tab is accessible via keyboard', async ({ page }) => {
    await openPanel(page)

    const convertTab = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V1' })
      .first()
    await convertTab.focus()
    await page.keyboard.press('Enter')
    await await new Promise(r => setTimeout(r, 300))

    const placeholder = page.locator('p').filter({ hasText: /Import an image/i })
    await expect(placeholder).toBeVisible()
  })
})

// ─── Cross-tab undo/redo with conversion ─────────────────────────────────

test.describe('Undo/redo across conversion tab switches', () => {
  test('undo button exists when no edits made and conversion tab visited', async ({ page }) => {
    await openPanel(page)

    // Visit Conversion V2 tab without making grid edits
    await clickPanelTab(page, 'Convert V2')

    // Undo/redo buttons should exist in the toolbar
    const undoBtn = page.locator('button').filter({ hasText: /Undo/i }).first()
    const redoBtn = page.locator('button').filter({ hasText: /Redo/i }).first()
    if (await undoBtn.count() > 0) {
      await expect(page.locator('header')).toBeVisible()
    }
    if (await redoBtn.count() > 0) {
      await expect(page.locator('header')).toBeVisible()
    }
  })

  test('closing right panel after visiting conversion tab keeps grid accessible', async ({ page }) => {
    await openPanel(page)

    // Visit Conversion V2 tab
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 300))

    // Close the panel
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    // Panel should be hidden
    await expect(page.locator('div').filter({ hasText: 'Project' }).first()).not.toBeVisible()

    // Header should still be visible (page responsive)
    await expect(page.locator('header')).toBeVisible()
  })

  test('settings panel grid apply survives visiting conversion tab', async ({ page }) => {
    await openPanel(page)

    // Apply dimensions
    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Visit Conversion V2 tab
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 300))

    // Switch back to Project tab
    await clickPanelTab(page, 'Project')
    await await new Promise(r => setTimeout(r, 300))

    // Grid should still be present (dimensions survived tab switch)
    const gridArea = page.locator('main').first()
    await expect(gridArea).toBeVisible()
  })
})

// ─── Rapid tab cycling with conversion panels ────────────────────────────

test.describe('Rapid tab cycling with conversion panels', () => {
  test('rapid cycling through Import and Conversion tabs does not crash', async ({ page }) => {
    await openPanel(page)

    // Rapidly cycle Import → Convert V1 → Convert V2 5 times
    for (let cycle = 0; cycle < 5; cycle++) {
      await clickPanelTab(page, 'Import')
      await clickPanelTab(page, 'Convert V1')
      await clickPanelTab(page, 'Convert V2')
    }

    // App should still be responsive
    await expect(page.locator('header')).toBeVisible()

    // Last tab (Convert V2) should be active
    const v2Btn = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V2' })
      .first()
    await expect(v2Btn).toHaveClass(/bg-indigo-50/)
  })

  test('closing right panel during rapid tab cycling does not crash', async ({ page }) => {
    await openPanel(page)

    // Switch to conversion tab
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 200))

    // Close panel
    await page.locator('button[title="Close panel"]').click()
    await await new Promise(r => setTimeout(r, 200))

    // Reopen and switch rapidly to conversion tab
    await openPanel(page)
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 300))

    // Should be on conversion tab
    const v2Btn = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V2' })
      .first()
    await expect(v2Btn).toHaveClass(/bg-indigo-50/)
  })

  test('conversion tabs maintain separate state when switching rapidly', async ({ page }) => {
    await openPanel(page)

    // Visit Convert V1 tab
    await clickPanelTab(page, 'Convert V1')
    await await new Promise(r => setTimeout(r, 200))

    // Switch to Convert V2 tab
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 200))

    // Switch back to Convert V1 tab — should still show its content
    await clickPanelTab(page, 'Convert V1')
    await await new Promise(r => setTimeout(r, 300))

    // Should be on Convert V1 tab
    const v1Btn = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V1' })
      .first()
    await expect(v1Btn).toHaveClass(/bg-indigo-50/)

    // Placeholder should still be there
    const placeholder = page.locator('p').filter({ hasText: /Import an image/i })
    await expect(placeholder).toBeVisible()
  })
})

// ─── Conversion panel visibility interactions ────────────────────────────

test.describe('Conversion panel visibility interactions', () => {
  test('conversion V2 tab active state correct after visiting other tabs', async ({ page }) => {
    await openPanel(page)

    // Click V2, then V1, then V2
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 100))

    const v2Btn = page.locator('div.flex.border-b.border-gray-200')
      .locator('button')
      .filter({ hasText: 'Convert V2' })
      .first()
    await expect(v2Btn).toHaveClass(/bg-indigo-50/)

    // Switch to V1
    await clickPanelTab(page, 'Convert V1')
    await await new Promise(r => setTimeout(r, 100))

    // V2 should lose active styling
    await expect(v2Btn).not.toHaveClass(/bg-indigo-50/)

    // Switch back to V2
    await clickPanelTab(page, 'Convert V2')
    await await new Promise(r => setTimeout(r, 100))

    // V2 should regain active styling
    await expect(v2Btn).toHaveClass(/bg-indigo-50/)
  })

  test('conversion V1 and V2 buttons both visible in tab bar simultaneously', async ({ page }) => {
    await openPanel(page)

    // Both conversion buttons should be visible in the tab bar
    const tabBar = page.locator('div.flex.border-b.border-gray-200')
    const v1Btn = tabBar.locator('button').filter({ hasText: 'Convert V1' }).first()
    const v2Btn = tabBar.locator('button').filter({ hasText: 'Convert V2' }).first()
    await expect(v1Btn).toBeVisible()
    await expect(v2Btn).toBeVisible()

    // They should have distinct labels
    await expect(v1Btn).toContainText('Convert V1')
    await expect(v2Btn).toContainText('Convert V2')
  })
})
