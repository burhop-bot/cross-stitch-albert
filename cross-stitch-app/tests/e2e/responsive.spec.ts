/**
 * TC-09: Responsive Layout
 * Tests for layout at different viewport sizes.
 */
import { test, expect } from '../fixtures/base'

test.describe('Responsive Layout', () => {
  test('desktop viewport (1280x720): header and main content visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    // Header buttons should be visible
    await expect(page.locator('button').filter({ hasText: 'File' })).toBeVisible()
  })

  test('tablet viewport (768x720): header and main content visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('phone viewport (375x667): header and main content visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('theme toggle works at different viewport sizes', async ({ page }) => {
    const themeBtn = page.locator('header button[aria-label*="Switch to"]').first()
    await expect(themeBtn).toBeVisible()

    // Toggle at desktop size
    await page.setViewportSize({ width: 1280, height: 720 })
    await themeBtn.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(themeBtn).toBeVisible()

    // Toggle at mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await themeBtn.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(themeBtn).toBeVisible()
  })

  test('app loads without layout errors at all viewport sizes', async ({ page }) => {
    const sizes = [
      { w: 1920, h: 1080 },
      { w: 1280, h: 720 },
      { w: 768, h: 1024 },
      { w: 375, h: 667 },
      { w: 320, h: 568 },
    ]

    const consoleErrors: string[] = []

    // Collect console errors during the test
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    for (const size of sizes) {
      // Re-navigate for each size to ensure clean state
      await page.setViewportSize({ width: size.w, height: size.h })
      await page.waitForSelector('header', { timeout: 10000 })

      // Header should be visible and within viewport
      const headerBox = await page.locator('header').boundingBox()
      expect(headerBox).not.toBeNull()
      if (headerBox) {
        expect(headerBox.x).toBeGreaterThanOrEqual(0)
        expect(headerBox.y).toBeGreaterThanOrEqual(0)
      }

      // Main content area should exist
      const mainBox = await page.locator('main').boundingBox()
      expect(mainBox).not.toBeNull()
      if (mainBox) {
        expect(mainBox.width).toBeGreaterThan(0)
        expect(mainBox.height).toBeGreaterThan(0)
      }

      // No layout-related errors should appear
      expect(consoleErrors.length).toBe(0)
    }
  })
})
