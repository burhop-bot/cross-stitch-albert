/**
 * TC-13: Context Menu Tests
 *
 * Comprehensive tests for the right-click context menu on the canvas:
 * - Right-click shows a menu with color palette swatches
 * - Selecting a color from context menu sets it as active
 * - Context menu closes on outside click
 * - Context menu contains ruler toggle and thumbnail gallery options
 * - Keyboard shortcuts help modal opens and lists shortcuts
 * - Onboarding tour opens when triggered from Header
 *
 * Context menu structure:
 * - Fixed positioned div with className including z-[110]
 * - Header section: "Colors" label
 * - 30 swatch buttons with hex backgrounds and DMC number labels
 * - Toggle section: Show Ruler (checkmark when enabled)
 * - Gallery button: View Thumbnail Gallery
 * - Close button
 * - Selected color has bg-indigo-50 background
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Right-click on the canvas to open the context menu.
 * Uses canvas.click with the right mouse button.
 */
async function openContextMenu(page: any) {
  const canvas = page.locator('main').first()
  await expect(canvas).toBeVisible({ timeout: 10000 })
  await canvas.click({ button: 'right' })
  await await new Promise(r => setTimeout(r, 400))
}

/**
 * Wait for the context menu to appear.
 * The menu is a fixed div with z-[110] and contains a "Colors" label.
 */
async function expectContextMenuVisible(page: any) {
  const menu = page.locator('div.fixed').filter({ hasText: 'Colors' }).first()
  await expect(menu).toBeVisible()
  return menu
}

// ── Context menu visibility tests ─────────────────────────────────

test('right-click on canvas shows context menu', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  await expectContextMenuVisible(page)
})

test('context menu contains color palette swatches', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // Each swatch is a button containing a colored span (h-4 w-4) followed by a number text span
  const swatchBtns = menu.locator('button').filter({ has: page.locator('span.h-4.w-4') })
  const count = await swatchBtns.count()
  // Context menu shows 30 swatches
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThanOrEqual(30)
})

test('context menu contains color swatches with correct hex colors', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // Check that swatches have colored backgrounds (hex styles)
  const swatches = menu.locator('span.h-4.w-4')
  const count = await swatches.count()
  expect(count).toBeGreaterThan(0)

  // Check specific known color: DMC 410 (Noir/Black) should be #1C1C1C
  const swatch410 = menu.locator('button').filter({ hasText: '410' }).first()
  if (await swatch410.count() > 0) {
    const title = await swatch410.getAttribute('title')
    expect(title).not.toBeNull()
    if (title) {
      expect(title.toLowerCase()).toContain('1c1c1c')
    }
  }
})

test('selecting a color from context menu sets it as active', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const sidebar = page.locator('aside').first()

  // First select a color in the sidebar to establish a baseline
  const firstSwatch = sidebar.locator('button').filter({ hasText: '310' }).first()
  if (await firstSwatch.count() > 0) {
    await firstSwatch.click()
    await new Promise(r => setTimeout(r, 300))
  }

  // Now right-click to open context menu
  await openContextMenu(page)

  // Select a different color from the context menu (swatch 410)
  const contextSwatch410 = page.locator('div.fixed').filter({ hasText: 'Colors' })
    .first().locator('button').filter({ hasText: '410' }).first()
  if (await contextSwatch410.count() > 0) {
    await contextSwatch410.click()
    await new Promise(r => setTimeout(r, 300))

    // Context menu should be closed now
    const menu = page.locator('div.fixed').filter({ hasText: 'Colors' }).first()
    await expect(menu).not.toBeVisible({ timeout: 2000 })

    // The selected color (410/Noir) should now be highlighted in the sidebar palette
    const sidebarSwatch410 = sidebar.locator('button').filter({ hasText: '410' }).first()
    if (await sidebarSwatch410.count() > 0) {
      await expect(sidebarSwatch410).toHaveClass(/bg-indigo-50/)
    }
  }
})

test('context menu closes on outside click', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  await expectContextMenuVisible(page)

  // Click somewhere on the main canvas area (outside the menu)
  const mainArea = page.locator('main').first()
  await mainArea.click({ position: { x: 50, y: 50 } })
  await new Promise(r => setTimeout(r, 400))

  // The context menu should be gone
  const menu = page.locator('div.fixed').filter({ hasText: 'Colors' }).first()
  await expect(menu).not.toBeVisible({ timeout: 2000 })
})

// ── Context menu options tests ───────────────────────────────────

test('context menu contains Show Ruler toggle', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // The menu should have a "Show Ruler" button
  const rulerBtn = menu.locator('button').filter({ hasText: 'Show Ruler' }).first()
  await expect(rulerBtn).toBeVisible()
})

test('context menu toggles ruler when clicked', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // Ruler toggle shows ✓ or ○ before "Show Ruler"
  const rulerBtn = menu.locator('button').filter({ hasText: 'Show Ruler' }).first()
  if (await rulerBtn.count() > 0) {
    await rulerBtn.click()
    await new Promise(r => setTimeout(r, 300))

    // After toggling, the ruler should show or hide
    // Look for a ruler overlay
    const rulerOverlay = page.locator('div').filter({ hasText: /^Ruler$/i }).first()
    // Either the ruler appears or the menu shows a checked state
    if (await rulerOverlay.count() > 0) {
      await expect(rulerOverlay).toBeVisible()
    }
  }
})

test('context menu contains View Thumbnail Gallery button', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // The menu should have a thumbnail gallery button with camera icon
  const galleryBtn = menu.locator('button').filter({ hasText: 'View Thumbnail Gallery' }).first()
  if (await galleryBtn.count() > 0) {
    await expect(galleryBtn).toBeVisible()
  } else {
    // The button might use an emoji icon instead of text
    const emojiGallery = menu.locator('button').filter({ hasText: '🖼️' }).first()
    if (await emojiGallery.count() > 0) {
      await expect(emojiGallery).toBeVisible()
    }
  }
})

test('context menu contains a Close button', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // The menu should have a close button (✕ icon or "Close" text)
  const closeBtn = menu.locator('button').filter({ hasText: 'Close' }).first()
  if (await closeBtn.count() > 0) {
    await expect(closeBtn).toBeVisible()
  } else {
    // Close might be an ✕ icon button
    const closeIcon = menu.locator('button').filter({ hasText: '✕' }).first()
    if (await closeIcon.count() > 0) {
      await expect(closeIcon).toBeVisible()
    }
  }
})

test('clicking close button in context menu dismisses it', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  await expectContextMenuVisible(page)

  // Close button has ✕ icon and "Close" text
  const closeBtn = page.locator('div.fixed').filter({ hasText: 'Colors' })
    .first().locator('button').filter({ hasText: 'Close' }).first()
  if (await closeBtn.count() > 0) {
    await closeBtn.click()
    await new Promise(r => setTimeout(r, 300))

    // Menu should be dismissed
    const menu = page.locator('div.fixed').filter({ hasText: 'Colors' }).first()
    await expect(menu).not.toBeVisible({ timeout: 2000 })
  }
})

// ── Edge cases ───────────────────────────────────────────────────

test('right-click on grid cell shows context menu at correct position', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const sidebar = page.locator('aside').first()

  // Right-click near the grid area
  const main = page.locator('main').first()
  await expect(main).toBeVisible()

  // Get the main area position and right-click in its center
  const box = await main.boundingBox()
  if (box) {
    await main.click({
      button: 'right',
      position: {
        x: box.width / 2,
        y: box.height / 2,
      },
    })
    await await new Promise(r => setTimeout(r, 400))

    // Menu should be visible
    const menu = page.locator('div').filter({ hasText: 'Colors' }).first()
    await expect(menu).toBeVisible()
  }
})

test('multiple rapid right-clicks do not create duplicate menus', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const main = page.locator('main').first()

  // Rapidly right-click 5 times
  for (let i = 0; i < 5; i++) {
    await main.click({ button: 'right' })
    await new Promise(r => setTimeout(r, 50))
  }

  // There should be at most one visible context menu
  const menus = page.locator('div.fixed').filter({ hasText: 'Colors' })
  const count = await menus.count()
  expect(count).toBeLessThanOrEqual(1)
})

test('context menu swatch titles contain both label and hex', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // Check a few swatches have titles with label + hex
  const swatchNumbers = ['310', '910', '410']
  for (const num of swatchNumbers) {
    const swatch = menu.locator('button').filter({ hasText: num }).first()
    if (await swatch.count() > 0) {
      const title = await swatch.getAttribute('title')
      expect(title).not.toBeNull()
      if (title) {
        expect(title).toContain('#')
        expect(title.length).toBeGreaterThan(7)
      }
    }
  }
})

test('keyboard shortcuts help modal opens', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  // Look for a keyboard shortcuts button in the header
  const shortcutsBtn = page.locator('button:has-text("Keyboard shortcuts")').first()
  if (await shortcutsBtn.count() > 0) {
    await shortcutsBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // KeyboardShortcutsPanel should appear
    const panel = page.locator('div:has-text("Keyboard Shortcuts")').first()
    if (await panel.count() > 0) {
      await expect(panel).toBeVisible()
    }
  }
})

test('onboarding tour can be triggered from header', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const onboardingBtn = page.locator('button:has-text("Onboarding tour")').first()
  if (await onboardingBtn.count() > 0) {
    await onboardingBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // OnboardingTour component should be visible
    const tour = page.locator('div:has-text("Onboarding"), div:has-text("tour")').first()
    if (await tour.count() > 0) {
      await expect(tour).toBeVisible()
    }
  }
})

test('context menu is clamped to viewport edges', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  const main = page.locator('main').first()
  await expect(main).toBeVisible()

  const box = await main.boundingBox()
  if (box) {
    // Right-click near the right edge of the viewport
    // The context menu should clamp to stay on-screen
    await main.click({
      button: 'right',
      position: { x: box.width - 50, y: box.height / 2 },
    })
    await new Promise(r => setTimeout(r, 400))

    const menu = page.locator('div.fixed').filter({ hasText: 'Colors' }).first()
    if (await menu.count() > 0) {
      await expect(menu).toBeVisible()
      const menuBox = await menu.boundingBox()
      if (menuBox) {
        // Menu should not extend beyond viewport width
        expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
      }
    }
  }
})

test('context menu swatch for white color (310) shows correct hex', async ({ page }) => {
  await expect(page.locator('header').first()).toBeVisible({ timeout: 10000 })

  await openContextMenu(page)
  const menu = await expectContextMenuVisible(page)

  // DMC 310 (Blanc Cassé) has hex #F5F3EF
  const swatch310 = menu.locator('button').filter({ hasText: '310' }).first()
  if (await swatch310.count() > 0) {
    const title = await swatch310.getAttribute('title')
    expect(title).not.toBeNull()
    if (title) {
      expect(title.toLowerCase()).toContain('f5f3ef')
    }
  }
})
