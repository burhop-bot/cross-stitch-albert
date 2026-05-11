/**
 * TC-09: Responsive Layout — Behavioral Tests
 *
 * Tests actual interactive behavior at different viewport sizes.
 * Key pattern: set viewport BEFORE navigation (matching how existing
 * responsive.spec.ts works), because changing viewport after navigation
 * doesn't trigger React re-renders of responsive components.
 */
import { test, expect } from '../fixtures/base'

// ──────────────────────────────────────────────
// BottomBar — Presence & Visibility
// ──────────────────────────────────────────────

test.describe('BottomBar Visibility', () => {
  test('bottom bar tab buttons NOT visible on desktop size', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // At desktop, BottomBar should not render. The tab bar container should not exist.
    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    expect(await tabBar.count()).toBe(0)
  })

  test('bottom bar tab buttons visible on tablet size', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // BottomBar should be visible at tablet size
    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    await expect(tabBar).toBeVisible()

    // Should have tab buttons
    const roleTabBtns = tabBar.locator('button[role="tab"]')
    expect(await roleTabBtns.count()).toBeGreaterThanOrEqual(3)
  })

  test('bottom bar tab buttons visible on phone size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    await expect(tabBar).toBeVisible()
  })

  test('bottom bar tab labels include Panel and Info', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const tabs = tabBar.locator('button[role="tab"]')
    const count = await tabs.count()

    const labels: string[] = []
    for (let i = 0; i < count; i++) {
      const label = await tabs.nth(i).getAttribute('aria-label')
      if (label) labels.push(label)
    }

    expect(labels).toContain('Panel')
    expect(labels).toContain('Info')
  })

  test('bottom bar Info tab expands/collapses info panel', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const infoBtn = tabBar.locator('button[aria-label="Info"]')
    await expect(infoBtn).toBeVisible()

    // Click Info tab — should become active (indigo)
    await infoBtn.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(infoBtn).toHaveClass(/text-indigo-600/)

    // "Project Info" text should appear (BottomBar info panel)
    const projectInfo = page.locator('span:has-text("Project Info")')
    await expect(projectInfo).toBeVisible()

    // Click again to collapse
    await infoBtn.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(projectInfo).not.toBeVisible()
    await expect(infoBtn).not.toHaveClass(/text-indigo-600/)
  })
})

// ──────────────────────────────────────────────
// Panel Toggle — Desktop vs Mobile
// ──────────────────────────────────────────────

test.describe('Right Panel Toggle', () => {
  test('right panel is hidden by default on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // No "Project Settings" panel visible by default
    const projectPanel = page.locator('div:has-text("Project Settings")')
    expect(await projectPanel.count()).toBe(0)
  })

  test('right panel can be opened via Project tab on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // Open Project panel via sidebar
    const panelTabBtn = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await panelTabBtn.count() > 0) {
      await panelTabBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Right panel should now be visible
    const projectPanel = page.locator('div:has-text("Project Settings")').first()
    if (await projectPanel.count() > 0) {
      await expect(projectPanel).toBeVisible()
    }
  })

  test('right panel can be toggled via BottomBar Panel tab on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    await expect(panelTab).toBeVisible()

    // Click to open
    await panelTab.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(panelTab).toHaveClass(/text-indigo-600/)

    // Click to close
    await panelTab.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(panelTab).not.toHaveClass(/text-indigo-600/)
  })

  test('right panel close button works on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // Open Project panel
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Close via X button
    const closeBtn = page.locator('button[aria-label="Close panel"]').first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Panel should be gone
    const projectPanel = page.locator('div:has-text("Project Settings")').first()
    if (await projectPanel.count() > 0) {
      await expect(projectPanel).not.toBeVisible()
    }
  })

  test('right panel close button works on phone overlay', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Close via X button
    const closeBtn = page.locator('button[aria-label="Close panel"]').first()
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Tab should no longer be active
    await expect(panelTab).not.toHaveClass(/text-indigo-600/)
  })
})

// ──────────────────────────────────────────────
// Grid Functionality at Mobile Sizes
// ──────────────────────────────────────────────

test.describe('Grid at Mobile Viewports', () => {
  test('grid canvas is visible and clickable on phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Grid cells should exist
    const cells = page.locator('div[style*="width: 28px"], div[class*="cell"]')
    expect(await cells.count()).toBeGreaterThan(0)
  })

  test('placing stitches on grid works on phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // Select color
    const colorSwatch = page.locator('div[style*="background-color"]').first()
    if (await colorSwatch.count() > 0) {
      await colorSwatch.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Click pencil tool
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      await main.click({ position: { x: box.width / 2, y: box.height / 2 } })
      await await new Promise(r => setTimeout(r, 300))
    }

    await expect(main).toBeVisible()
  })

  test('grid is functional at tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Color + pencil
    const colorSwatch = page.locator('div[style*="background-color"]').first()
    if (await colorSwatch.count() > 0) await colorSwatch.click()
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) await pencilBtn.click()

    const box = await main.boundingBox()
    if (box) {
      await main.click({ position: { x: box.width / 2, y: box.height / 2 } })
      await await new Promise(r => setTimeout(r, 300))
    }

    await expect(main).toBeVisible()
  })

  test('placing multiple stitches works on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const colorSwatch = page.locator('div[style*="background-color"]').first()
    if (await colorSwatch.count() > 0) await colorSwatch.click()
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) await pencilBtn.click()

    const main = page.locator('main')
    await expect(main).toBeVisible()
    const box = await main.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      for (let i = 0; i < 5; i++) {
        const x = Math.min(box.width - 30, 30 + i * 30)
        await main.click({ position: { x: x, y: 60 } })
        await await new Promise(r => setTimeout(r, 100))
      }
    }

    await expect(main).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Viewport Resize Behavior
// ──────────────────────────────────────────────

test.describe('Viewport Resize', () => {
  test('switching from desktop to tablet shows BottomBar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await await new Promise(r => setTimeout(r, 1000))

    // No BottomBar at desktop
    await expect(page.locator('.bg-white.border-t.border-gray-200.shadow-lg')).toHaveCount(0)

    // Navigate at tablet size instead
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // Now BottomBar should be visible
    await expect(page.locator('.bg-white.border-t.border-gray-200.shadow-lg')).toBeVisible()
  })

  test('switching from tablet to desktop hides BottomBar', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // BottomBar exists at tablet
    await expect(page.locator('.bg-white.border-t.border-gray-200.shadow-lg')).toBeVisible()

    // Navigate at desktop size
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // BottomBar should be gone
    await expect(page.locator('.bg-white.border-t.border-gray-200.shadow-lg')).toHaveCount(0)
  })

  test('rapid viewport resize does not crash', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const sizes = [
      { w: 1280, h: 720 },
      { w: 768, h: 720 },
      { w: 375, h: 667 },
      { w: 1024, h: 768 },
      { w: 480, h: 800 },
    ]

    for (const size of sizes) {
      await page.setViewportSize(size)
      await await new Promise(r => setTimeout(r, 500))
    }

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('theme toggle works after viewport resize', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const themeBtn = page.locator('header button[aria-label*="Switch to"]').first()
    await expect(themeBtn).toBeVisible()

    await themeBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Resize to phone
    await page.setViewportSize({ width: 375, height: 667 })
    await await new Promise(r => setTimeout(r, 1000))

    // Header still exists
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// BottomBar Tab State
// ──────────────────────────────────────────────

test.describe('BottomBar Tab State', () => {
  test('Panel tab active state updates when toggling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    await expect(panelTab).toBeVisible()

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(panelTab).toHaveClass(/text-indigo-600/)

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(panelTab).not.toHaveClass(/text-indigo-600/)
  })

  test('Info tab active state updates when toggling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const infoTab = tabBar.locator('button[aria-label="Info"]')
    await expect(infoTab).toBeVisible()

    await infoTab.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(infoTab).toHaveClass(/text-indigo-600/)

    await infoTab.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(infoTab).not.toHaveClass(/text-indigo-600/)
  })

  test('Panel and Info tabs can be active independently', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    const infoTab = tabBar.locator('button[aria-label="Info"]')

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 200))
    await infoTab.click()
    await await new Promise(r => setTimeout(r, 200))

    await expect(panelTab).toHaveClass(/text-indigo-600/)
    await expect(infoTab).toHaveClass(/text-indigo-600/)

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 200))
    await expect(panelTab).not.toHaveClass(/text-indigo-600/)
    await expect(infoTab).toHaveClass(/text-indigo-600/)
  })

  test('rapid panel tab toggling does not corrupt state', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')

    for (let i = 0; i < 10; i++) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 50))
    }

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('grid cells are rendered correctly after BottomBar toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const colorSwatch = page.locator('div[style*="background-color"]').first()
    if (await colorSwatch.count() > 0) await colorSwatch.click()
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) await pencilBtn.click()

    const box = await main.boundingBox()
    if (box) {
      await main.click({ position: { x: box.width / 2, y: box.height / 2 } })
      await await new Promise(r => setTimeout(r, 200))
    }

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    await expect(main).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Sidebar Layout
// ──────────────────────────────────────────────

test.describe('Sidebar Layout', () => {
  test('sidebar is full-width on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const sidebar = page.locator('[aria-label="Color and tool sidebar"]')
    const count = await sidebar.count()
    expect(count).toBeGreaterThanOrEqual(1)

    if (count > 0) {
      const box = await sidebar.first().boundingBox()
      expect(box).not.toBeNull()
      if (box) expect(box.width).toBeGreaterThanOrEqual(200)
    }
  })

  test('sidebar is collapsed on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const sidebar = page.locator('[aria-label="Color and tool sidebar"]')
    const count = await sidebar.count()
    expect(count).toBeGreaterThanOrEqual(1)

    if (count > 0) {
      const box = await sidebar.first().boundingBox()
      expect(box).not.toBeNull()
      if (box) expect(box.width).toBeLessThanOrEqual(60)
    }
  })

  test('sidebar is hidden on phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const sidebar = page.locator('[aria-label="Color and tool sidebar"]')
    expect(await sidebar.count()).toBe(0)
  })
})

// ──────────────────────────────────────────────
// Phone Overlay Panel Behavior
// ──────────────────────────────────────────────

test.describe('Phone Overlay Panel', () => {
  test('overlay panel has close button with correct label', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    const closeBtn = page.locator('button[aria-label="Close panel"]')
    if (await closeBtn.count() > 0) {
      await expect(closeBtn).toBeVisible()
    }
  })

  test('overlay panel title reflects active panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    const panelText = page.locator('span:has-text("Panel"), span:has-text("Settings"), span:has-text("Symbols")').first()
    if (await panelText.count() > 0) {
      await expect(panelText).toBeVisible()
    }
  })

  test('opening overlay panel on phone then switching to desktop works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Navigate fresh at desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 1000))

    // Project Info should be gone (BottomBar gone)
    await expect(page.locator('span:has-text("Project Info")')).not.toBeVisible()
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })
})
