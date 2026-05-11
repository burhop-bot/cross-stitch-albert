/**
 * TC-03: Grid & Drawing Tools + Color Palette
 */
import { test, expect } from '../fixtures/base'

test.describe('Grid & Drawing Tools', () => {
  test('[ @smoke ] grid is rendered on the canvas', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Grid dimension label shows text like "40×40 stitches"
    const dimLabel = page.locator('span:has-text("stitches")')
    await expect(dimLabel).toBeVisible()
  })

  test('grid renders with correct dimensions', async ({ page }) => {
    const dimLabel = page.locator('span:has-text("stitches")')
    await expect(dimLabel).toBeVisible()

    const text = await dimLabel.textContent()
    expect(text).toContain('×')
  })

  test('grid canvas area has proper size', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) expect(box.height).toBeGreaterThan(100)
  })
})

test.describe('Color Palette', () => {
  test('[ @smoke ] color info is displayed in settings', async ({ page }) => {
    // Open right panel to access SettingsPanel
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await expect(panelBtn).toBeVisible()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Click Project tab in the right panel
    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // SettingsPanel shows color count in a paragraph like "X colors in palette"
    const colorCount = page.locator('p').filter({ hasText: /colors? in palette/i }).first()
    await expect(colorCount).toBeVisible()
  })

  test('color swatches are visible', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Color swatches are colored divs
    const swatches = page.locator('div[style*="background-color"]')
    const count = await swatches.count()
    expect(count).toBeGreaterThan(0)
  })
})
