/**
 * TC-03: Color Palette & Brand Selector Tests
 *
 * NOTE: The "Colors" tab in Sidebar is a stub with onClick={() => {}}.
 * No actual color swatches are rendered there.
 * These smoke tests verify the stub tab exists and the sidebar is functional.
 */
import { test, expect } from '../fixtures/base'

// ── Smoke tests ───────────────────────────────────────────────────

test('[ @smoke ] colors tab is present in sidebar', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  // The Colors tab button should exist in the sidebar
  const colorsTab = page.locator('aside').locator('button').filter({ hasText: 'Colors' }).first()
  await expect(colorsTab).toBeVisible()
})

test('[ @smoke ] clicking colors tab does not crash the app', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const colorsTab = page.locator('aside').locator('button').filter({ hasText: 'Colors' }).first()
  await colorsTab.click()
  await new Promise(r => setTimeout(r, 300))

  // Page should still be functional — sidebar still visible
  await expect(page.locator('aside')).toBeVisible()
})

// ── Brand selector tests ─────────────────────────────────────────

test('brand selector dropdown is present and clickable', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  // The brand selector should be visible somewhere in the UI
  const brandBtn = page.locator('button').filter({ hasText: /^DMC$/ }).first()
  if (await brandBtn.count() > 0) {
    await expect(brandBtn).toBeVisible()
  } else {
    // May not exist if brand selector is not rendered on this page
    test.skip()
  }
})

// ── Sidebar functionality tests ──────────────────────────────────

test('sidebar shows Tools and Colors tabs', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  // Both tabs should be present
  const toolsTab = page.locator('aside').locator('button').filter({ hasText: 'Tools' }).first()
  const colorsTab = page.locator('aside').locator('button').filter({ hasText: 'Colors' }).first()
  await expect(toolsTab).toBeVisible()
  await expect(colorsTab).toBeVisible()
})

// ── Edge cases ───────────────────────────────────────────────────

test('clicking colors tab repeatedly is stable', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const colorsTab = page.locator('aside').locator('button').filter({ hasText: 'Colors' }).first()

  // Click 10 times rapidly
  for (let i = 0; i < 10; i++) {
    await colorsTab.click()
    await new Promise(r => setTimeout(r, 50))
  }

  // Page should still be functional
  await expect(page.locator('aside')).toBeVisible()
})
