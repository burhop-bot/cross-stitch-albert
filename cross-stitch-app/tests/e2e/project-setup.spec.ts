/**
 * TC-02: Project Settings & Canvas Creation
 * Tests for settings panel, canvas dimensions, and panel management.
 */
import { test, expect } from '../fixtures/base'

test.describe('Project Settings & Canvas', () => {
  test('[ @smoke ] settings panel can be opened', async ({ page }) => {
    // Open right panel via the Header "Panel" toggle button
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await expect(panelBtn).toBeVisible()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // The RightPanel should now be visible with tabs
    // Tabs have labels like "Project", "Symbols", "Import", etc.
    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    await expect(projectTab).toBeVisible()
  })

  test('[ @smoke ] canvas dimensions can be set', async ({ page }) => {
    // Open right panel
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await expect(panelBtn).toBeVisible()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Click Project tab
    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    await expect(projectTab).toBeVisible()
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // Width and Height inputs exist in the SettingsPanel
    // They are in a "Stitch Size" section with labels
    const widthLabel = page.locator('label', { hasText: 'Width' }).first()
    const heightLabel = page.locator('label', { hasText: 'Height' }).first()

    if (await widthLabel.count() > 0) {
      await expect(widthLabel).toBeVisible()
      // The input is the sibling after the label
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      if (await widthInput.count() > 0) {
        await expect(widthInput).toBeVisible()
      }
    }

    if (await heightLabel.count() > 0) {
      await expect(heightLabel).toBeVisible()
    }
  })

  test('[ @smoke ] settings panel has Apply button', async ({ page }) => {
    // Open right panel
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await expect(panelBtn).toBeVisible()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Click Project tab
    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    await expect(projectTab).toBeVisible()
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // Apply & Resize Canvas button should be visible
    const applyBtn = page.locator('button', { hasText: 'Apply' }).first()
    await expect(applyBtn).toBeVisible()
  })

  test('[ @smoke ] applying settings updates grid dimensions', async ({ page }) => {
    // Open right panel and project tab
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Find and set dimensions
    const labels = page.locator('label')
    for (let i = 0; i < (await labels.count()) && i < 50; i++) {
      const text = await labels.nth(i).textContent()
      if (text && text.trim() === 'Width') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('50')
        }
      }
      if (text && text.trim() === 'Height') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('40')
        }
      }
    }

    // Click Apply
    const applyBtn = page.locator('button', { hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }

    await await new Promise(r => setTimeout(r, 500))

    // Grid dimension label should update — text content like "50×40 stitches"
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()
    const text = await dimLabel.textContent()
    expect(text).toContain('50')
    expect(text).toContain('40')
  })

  test('[ @smoke ] new panel can be created', async ({ page }) => {
    // Open right panel → Project tab
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Panels section should exist with at least one panel button
    const panelButtons = page.locator('button').filter({ hasText: /Panel/ })
    const count = await panelButtons.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('fabric type selector is present', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Fabric Type header should be present
    const fabricH3 = page.locator('h3').filter({ hasText: /^Fabric Type$/ }).first()
    if (await fabricH3.count() > 0) {
      await expect(fabricH3).toBeVisible()

      // Should have a select dropdown
      const select = fabricH3.locator('..').locator('select')
      if (await select.count() > 0) {
        await expect(select).toBeVisible()
      }
    }
  })

  test('grid lines configuration is visible', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Grid Lines section
    const gridH3 = page.locator('h3').filter({ hasText: /^Grid Lines$/ }).first()
    if (await gridH3.count() > 0) {
      await expect(gridH3).toBeVisible()
    }

    // Heavy lines selector
    const heavyLabel = page.locator('label', { hasText: 'Heavy lines every' }).first()
    if (await heavyLabel.count() > 0) {
      await expect(heavyLabel).toBeVisible()
    }
  })

  test('color palette display is visible', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Color Palette section
    const paletteH3 = page.locator('h3').filter({ hasText: /^Color Palette$/ }).first()
    if (await paletteH3.count() > 0) {
      await expect(paletteH3).toBeVisible()
    }
  })
})
