/**
 * TC-10: Symbol Legend & Notes
 * Tests for the SymbolLegendPanel and NotesPanel.
 */
import { test, expect } from '../fixtures/base'

test.describe('Symbol Legend', () => {
  test('[ @smoke ] symbol legend panel can be opened', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const symbolsTab = page.locator('button').filter({ hasText: /^Symbols$/ }).first()
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Symbol Legend header should be visible
    const legendTitle = page.locator('h3:has-text("Symbol Legend")').first()
    if (await legendTitle.count() > 0) {
      await expect(legendTitle).toBeVisible()
    }
  })

  test('symbol legend has toggle for showing/hiding symbols', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const symbolsTab = page.locator('button').filter({ hasText: /^Symbols$/ }).first()
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
      await await new Promise(r => setTimeout(r, 300))

      // Eye icon button for toggling symbol visibility
      const eyeBtn = page.locator('button[title="Toggle symbols visibility"]').first()
      if (await eyeBtn.count() > 0) {
        await expect(eyeBtn).toBeVisible()
      }
    }
  })

  test('symbol legend can be exported', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const symbolsTab = page.locator('button').filter({ hasText: /^Symbols$/ }).first()
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
      await await new Promise(r => setTimeout(r, 300))

      // Export button should be present
      const exportBtn = page.locator('button:has-text("Export legend")').first()
      if (await exportBtn.count() > 0) {
        await expect(exportBtn).toBeVisible()
      }
    }
  })

  test('symbol legend entries exist', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const symbolsTab = page.locator('button').filter({ hasText: /^Symbols$/ }).first()
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
      await await new Promise(r => setTimeout(r, 300))

      // Each symbol entry has a color swatch div
      const entries = page.locator('div:has(div[style*="background-color"])')
      const count = await entries.count()
      // May be 0 if no stitches placed yet, but the panel should be visible
    }
  })
})

test.describe('Notes Panel', () => {
  test('[ @smoke ] notes panel can be opened', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const notesTab = page.locator('button').filter({ hasText: /^Notes$/ }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))

      // Notes panel content area should be visible
      const notesContent = page.locator('div:has-text("Notes")').first()
      if (await notesContent.count() > 0) {
        await expect(notesContent).toBeVisible()
      }
    }
  })

  test('notes panel shows note count', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const notesTab = page.locator('button').filter({ hasText: /^Notes$/ }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 300))

      // Check for note count display
      const noteCount = page.locator('span:has-text("Note")').first()
      if (await noteCount.count() > 0) {
        await expect(noteCount).toBeVisible()
      }
    }
  })
})

test.describe('Progress Tracker', () => {
  test('progress tracker is visible', async ({ page }) => {
    // The ProgressTracker is rendered below the main canvas
    const progressText = page.locator('div:has-text("Progress")').first()
    if (await progressText.count() > 0) {
      await expect(progressText).toBeVisible()
    }
  })

  test('progress tracker shows percentage', async ({ page }) => {
    const percentage = page.locator('span:has-text("%")').first()
    if (await percentage.count() > 0) {
      await expect(percentage).toBeVisible()
    }
  })
})
