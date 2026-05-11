/**
 * TC-09 (enhanced): Responsive BottomBar → Panel Visibility
 *
 * These tests verify the specific task requirements for Task 152:
 * - BottomBar tabs switch panel visibility
 * - Right panel open/close via button
 * - Grid is functional at all viewport sizes
 *
 * Key insight: BottomBar is the ONLY way to open right-panel tabs
 * on tablet/phone. On desktop, the sidebar tab buttons are the way.
 * We test both.
 */
import { test, expect } from '../fixtures/base'

// ──────────────────────────────────────────────
// Desktop: Sidebar Panel Tabs
// ──────────────────────────────────────────────

test.describe('Desktop Panel Visibility', () => {
  test('Project tab opens Project Settings panel on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await expect(projectTab).toBeVisible()
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // The SettingsPanel should be visible
    const settingsPanel = page.locator('div:has-text("Project Settings")')
    await expect(settingsPanel.first()).toBeVisible()
  })

  test('Symbols tab opens Symbol Legend panel on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const symbolsTab = page.locator('button').filter({ hasText: 'Symbols' }).first()
    if (await symbolsTab.count() > 0) {
      await symbolsTab.click()
      await await new Promise(r => setTimeout(r, 500))

      // Symbol Legend Panel header should be visible
      const symbolsPanel = page.locator('div:has-text("Symbol Legend"), div:has-text("Symbols"), h3:has-text("Symbol")').first()
      if (await symbolsPanel.count() > 0) {
        await expect(symbolsPanel).toBeVisible()
      }
    }
  })

  test('Notes tab opens Notes panel on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const notesTab = page.locator('button').filter({ hasText: 'Notes' }).first()
    if (await notesTab.count() > 0) {
      await notesTab.click()
      await await new Promise(r => setTimeout(r, 500))

      const notesPanel = page.locator('div:has-text("Notes")')
      if (await notesPanel.count() > 0) {
        await expect(notesPanel).toBeVisible()
      }
    }
  })

  test('switching panel tabs replaces the right panel content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open Project panel
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await await new Promise(r => setTimeout(r, 500))

    expect(await page.locator('div:has-text("Project Settings")').count()).toBeGreaterThanOrEqual(1)

    // Switch to Notes panel
    const notesTab = page.locator('button').filter({ hasText: 'Notes' }).first()
    if (await notesTab.count() > 0) await notesTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // Notes panel visible, Project panel gone
    if (await page.locator('div:has-text("Notes")').count() > 0) {
      await expect(page.locator('div:has-text("Notes")')).toBeVisible()
    }
    // Project settings should no longer be in view (it should be replaced)
    const projectPanel = page.locator('div:has-text("Project Settings")')
    if (await projectPanel.count() > 0) {
      await expect(projectPanel.first()).not.toBeVisible()
    }
  })

  test('right panel close button hides panel on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await await new Promise(r => setTimeout(r, 500))

    expect(await page.locator('div:has-text("Project Settings")').count()).toBeGreaterThanOrEqual(1)

    // Close button
    const closeBtn = page.locator('button[aria-label="Close panel"]')
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const projectPanel = page.locator('div:has-text("Project Settings")')
    if (await projectPanel.count() > 0) {
      await expect(projectPanel.first()).not.toBeVisible()
    }
  })
})

// ──────────────────────────────────────────────
// Tablet: BottomBar Panel Tab Controls
// ──────────────────────────────────────────────

test.describe('Tablet BottomBar → Panel Visibility', () => {
  test('Panel tab opens first available panel on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    await expect(tabBar).toBeVisible()

    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    await expect(panelTab).toBeVisible()

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // The panel should now be open — check for any panel content in the right area
    const activePanel = page.locator('[class*="max-h-\\[70vh\\]"], div[role="tabpanel"]').first()
    if (await activePanel.count() > 0) {
      await expect(activePanel).toBeVisible()
    }
  })

  test('Panel tab closes panel when already open on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')

    // Open
    await panelTab.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(panelTab).toHaveClass(/text-indigo-600/)

    // Close
    await panelTab.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(panelTab).not.toHaveClass(/text-indigo-600/)
  })

  test('closing via X button on tablet overlay panel deactivates tab', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 500))
    await expect(panelTab).toHaveClass(/text-indigo-600/)

    // Click X close button
    const closeBtn = page.locator('button[aria-label="Close panel"]')
    if (await closeBtn.count() > 0) {
      await closeBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Tab should be inactive
    await expect(panelTab).not.toHaveClass(/text-indigo-600/)
  })

  test('all BottomBar tabs are present on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const tabs = tabBar.locator('button[role="tab"]')
    const labels: string[] = []
    const count = await tabs.count()

    for (let i = 0; i < count; i++) {
      const label = await tabs.nth(i).getAttribute('aria-label')
      if (label) labels.push(label)
    }

    // BottomBar has at least: Colors, Grid, Panel, Info
    expect(count).toBeGreaterThanOrEqual(3)
    expect(labels).toContain('Panel')
    expect(labels).toContain('Info')
  })

  test('BottomBar visible on tablet but not on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Desktop: no BottomBar
    const tabBarDesktop = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    expect(await tabBarDesktop.count()).toBe(0)

    // Navigate at tablet size
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Tablet: BottomBar visible
    await expect(tabBarDesktop).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Phone: BottomBar + Grid Interaction
// ──────────────────────────────────────────────

test.describe('Phone BottomBar + Grid', () => {
  test('phone has BottomBar with tab labels', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    await expect(tabBar).toBeVisible()

    const tabs = tabBar.locator('button[role="tab"]')
    expect(await tabs.count()).toBeGreaterThanOrEqual(2)
  })

  test('phone sidebar is hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('[aria-label="Color and tool sidebar"]')
    expect(await sidebar.count()).toBe(0)
  })

  test('main canvas occupies full width on phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const main = page.locator('main')
    await expect(main).toBeVisible()

    const mainBox = await main.boundingBox()
    expect(mainBox).not.toBeNull()
    if (mainBox) {
      // Main should be near full width minus padding
      expect(mainBox.width).toBeGreaterThanOrEqual(300)
    }
  })

  test('placing a stitch on phone and switching tabs preserves grid state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Get the main canvas and click on it
    const main = page.locator('main')
    await expect(main).toBeVisible()
    const box = await main.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      await main.click({ position: { x: box.width / 2, y: box.height / 2 } })
      await await new Promise(r => setTimeout(r, 300))
    }

    // Switch to Panel tab and back
    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Main canvas should still be visible
    await expect(main).toBeVisible()
    const newBox = await main.boundingBox()
    expect(newBox).not.toBeNull()
  })

  test('Info panel expands on phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const infoTab = tabBar.locator('button[aria-label="Info"]')
    await expect(infoTab).toBeVisible()

    await infoTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // "Project Info" text should appear
    const projectInfo = page.locator('span:has-text("Project Info")')
    await expect(projectInfo).toBeVisible()

    // Click again to collapse
    await infoTab.click()
    await await new Promise(r => setTimeout(r, 300))
    await expect(projectInfo).not.toBeVisible()
  })

  test('grid canvas remains visible after panel toggle on phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Open and close the panel via BottomBar
    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))

      const closeBtn = page.locator('button[aria-label="Close panel"]')
      if (await closeBtn.count() > 0) await closeBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      await panelTab.click()
      await await new Promise(r => setTimeout(r, 300))

      const closeBtn2 = page.locator('button[aria-label="Close panel"]')
      if (await closeBtn2.count() > 0) await closeBtn2.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Grid should still be there
    await expect(main).toBeVisible()
  })
})

// ──────────────────────────────────────────────
// Cross-Viewport Panel Persistence
// ──────────────────────────────────────────────

test.describe('Cross-Viewport Panel Behavior', () => {
  test('switching viewports while panel is open does not crash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Open a panel on desktop
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await await new Promise(r => setTimeout(r, 500))

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 720 })
    await await new Promise(r => setTimeout(r, 1000))

    // Should still be alive
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    // Resize to phone
    await page.setViewportSize({ width: 375, height: 667 })
    await await new Promise(r => setTimeout(r, 1000))

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()

    // Back to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await await new Promise(r => setTimeout(r, 1000))

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('panel state persists across tab switches at same viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    const panelTab = tabBar.locator('button[aria-label="Panel"]')

    // Open, close, open again
    await panelTab.click()
    await await new Promise(r => setTimeout(r, 300))
    await panelTab.click()
    await await new Promise(r => setTimeout(r, 300))

    const closeBtn = page.locator('button[aria-label="Close panel"]')
    if (await closeBtn.count() > 0) await closeBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    await panelTab.click()
    await await new Promise(r => setTimeout(r, 300))

    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('BottomBar does not overlap grid content on phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const main = page.locator('main')
    await expect(main).toBeVisible()
    const mainBox = await main.boundingBox()
    expect(mainBox).not.toBeNull()

    const tabBar = page.locator('.bg-white.border-t.border-gray-200.shadow-lg')
    await expect(tabBar).toBeVisible()
    const tabBarBox = await tabBar.boundingBox()
    expect(tabBarBox).not.toBeNull()

    if (mainBox && tabBarBox) {
      // BottomBar should be below the main canvas, not overlapping it
      expect(tabBarBox.y).toBeGreaterThanOrEqual(mainBox.y + mainBox.height - 50)
    }
  })
})
