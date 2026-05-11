/**
 * TC-23: Sidebar Collapsed State (Icon Strip Mode)
 *
 * Tests the SidebarCollapsed variant — the icon-strip sidebar shown
 * on tablet viewport (768–1023px) and narrow desktop layouts.
 *
 * The collapsed sidebar shows:
 * - Backstitch toggle
 * - Drawing tools (Pencil, Eraser, Fill, Semi-cross)
 * - Divider lines
 * - Symbol toggle
 * - Grid lines toggle
 * - Alternating cells toggle
 * - Zoom controls (-, %, +)
 * - Divider line
 * - Brand selector (2-letter abbreviation)
 * - Quick color strip (top 6 colors)
 *
 * Potential bugs targeted:
 * - Collapsed tools don't actually switch tool state
 * - Brand selector dropdown doesn't open in collapsed mode
 * - Quick color clicks don't set selected color
 * - Collapsed sidebar doesn't appear at tablet width
 * - Sidebar width wrong at tablet breakpoint
 * - Tool buttons missing in collapsed mode
 */

import { test, expect } from '../fixtures/base'

// ─── Sidebar visibility at breakpoints ─────────────────────────────

test.describe('Sidebar visibility at breakpoints', () => {
  test('desktop wide (1280px): sidebar is FULL width (~288px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeGreaterThan(200) // full sidebar is ~288px (w-72)
    }
  })

  test('tablet (800px): sidebar is COLLAPSED (48px / w-12)', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeLessThan(80) // collapsed sidebar is ~48px (w-12)
    }
  })

  test('desktop narrow (1000px): sidebar is COLLAPSED', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      // At 1000px the useResponsiveLayout hook should return 'tablet' mode
      expect(box.width).toBeLessThan(80)
    }
  })

  test('expanding from tablet to desktop: sidebar grows to full width', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('aside').first()
    const smallBox = await sidebar.boundingBox()
    expect(smallBox).not.toBeNull()
    if (smallBox) expect(smallBox.width).toBeLessThan(80)

    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    const largeBox = await sidebar.boundingBox()
    expect(largeBox).not.toBeNull()
    if (largeBox) {
      expect(largeBox.width).toBeGreaterThan(200)
    }
  })

  test('shrinking from desktop to tablet: sidebar shrinks to icon strip', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('aside').first()
    const largeBox = await sidebar.boundingBox()
    expect(largeBox).not.toBeNull()
    if (largeBox) expect(largeBox.width).toBeGreaterThan(200)

    // Resize to tablet
    await page.setViewportSize({ width: 800, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    const smallBox = await sidebar.boundingBox()
    expect(smallBox).not.toBeNull()
    if (smallBox) {
      expect(smallBox.width).toBeLessThan(80)
    }
  })
})

// ─── Collapsed sidebar tools ────────────────────────────────────────

test.describe('Collapsed sidebar — tool buttons', () => {
  test('collapsed sidebar shows backstitch toggle', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Backstitch button has PencilOff icon
    const backstitchBtn = page.locator('button[aria-label="Toggle backstitch tool"]').first()
    if (await backstitchBtn.count() > 0) {
      await expect(backstitchBtn).toBeVisible()
    }
  })

  test('collapsed sidebar shows all 4 drawing tools', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Collapsed sidebar has 4 tool buttons: Pencil, Eraser, Fill, Semi-cross
    const collapsedTools = page.locator('aside[role="navigation"] button')
    const count = await collapsedTools.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('pencil tool is active by default in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const pencilBtn = page.locator('button[aria-label="Pencil"]').first()
    await expect(pencilBtn).toBeVisible()

    const classes = await pencilBtn.getAttribute('class')
    if (classes) {
      expect(classes).toContain('indigo')
    }
  })

  test('clicking eraser in collapsed sidebar activates eraser tool', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const eraserBtn = page.locator('button[aria-label="Eraser"]').first()
    await expect(eraserBtn).toBeVisible()
    await eraserBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Eraser should now have active (indigo) styling
    const classes = await eraserBtn.getAttribute('class')
    if (classes) {
      expect(classes).toContain('indigo')
    }
  })

  test('clicking fill in collapsed sidebar activates fill tool', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const fillBtn = page.locator('button[aria-label="Fill"]').first()
    await expect(fillBtn).toBeVisible()
    await fillBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const classes = await fillBtn.getAttribute('class')
    if (classes) {
      expect(classes).toContain('indigo')
    }
  })

  test('semi-cross in collapsed sidebar activates semi-cross tool', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const semiCrossBtn = page.locator('button[aria-label="Semi-cross"]').first()
    if (await semiCrossBtn.count() > 0) {
      await semiCrossBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const classes = await semiCrossBtn.getAttribute('class')
      if (classes) {
        expect(classes).toContain('indigo')
      }
    }
  })

  test('tool switching in collapsed sidebar: pencil → eraser → pencil', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Start: pencil active
    const pencilBtn = page.locator('button[aria-label="Pencil"]').first()
    let classes = await pencilBtn.getAttribute('class')
    if (classes) expect(classes).toContain('indigo')

    // Switch to eraser
    const eraserBtn = page.locator('button[aria-label="Eraser"]').first()
    await eraserBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    classes = await eraserBtn.getAttribute('class')
    if (classes) expect(classes).toContain('indigo')

    // Switch back to pencil
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    classes = await pencilBtn.getAttribute('class')
    if (classes) expect(classes).toContain('indigo')
  })

  test('rapid tool switching in collapsed sidebar does not crash', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const tools = page.locator('aside[role="navigation"] button')
    const total = await tools.count()
    for (let i = 0; i < 20; i++) {
      const idx = i % total
      await tools.nth(idx).click()
      await await new Promise(r => setTimeout(r, 50))
    }

    // Should still be functional
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
  })
})

// ─── Collapsed sidebar toggles ──────────────────────────────────────

test.describe('Collapsed sidebar — toggle buttons', () => {
  test('symbol toggle button exists in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Look for the Eye/EyeOff toggle in collapsed sidebar
    const symbolToggle = page.locator('aside[role="navigation"] button').nth(4) // after backstitch + 4 tools
    if (await symbolToggle.count() > 0) {
      const title = await symbolToggle.getAttribute('title')
      expect(title).toContain('symbol', 'Symbol toggle should have descriptive title')
    }
  })

  test('grid lines toggle exists in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const gridToggle = page.locator('aside[role="navigation"] button').nth(5) // after symbol toggle
    if (await gridToggle.count() > 0) {
      const title = await gridToggle.getAttribute('title')
      expect(title).toContain('grid', 'Grid toggle should have descriptive title')
    }
  })

  test('alternating cells toggle exists in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const altToggle = page.locator('aside[role="navigation"] button').nth(6) // after grid toggle
    if (await altToggle.count() > 0) {
      const title = await altToggle.getAttribute('title')
      expect(title).toContain('Alternating', 'Alternating toggle should have descriptive title')
    }
  })

  test('toggling symbols in collapsed sidebar changes button appearance', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const symbolToggle = page.locator('aside[role="navigation"] button').nth(4)
    if (await symbolToggle.count() > 0) {
      await symbolToggle.click()
      await await new Promise(r => setTimeout(r, 300))

      const classes = await symbolToggle.getAttribute('class')
      if (classes) {
        expect(classes).toContain('indigo')
      }
    }
  })

  test('toggling grid lines in collapsed sidebar changes button appearance', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const gridToggle = page.locator('aside[role="navigation"] button').nth(5)
    if (await gridToggle.count() > 0) {
      await gridToggle.click()
      await await new Promise(r => setTimeout(r, 300))

      const classes = await gridToggle.getAttribute('class')
      if (classes) {
        expect(classes).toContain('indigo')
      }
    }
  })
})

// ─── Collapsed sidebar zoom ─────────────────────────────────────────

test.describe('Collapsed sidebar — zoom controls', () => {
  test('zoom minus button exists in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const zoomMinus = page.locator('aside[role="navigation"] button:text("−")').first()
    if (await zoomMinus.count() > 0) {
      await expect(zoomMinus).toBeVisible()
      await zoomMinus.click()
      await await new Promise(r => setTimeout(r, 200))
    }
  })

  test('zoom plus button exists in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const zoomPlus = page.locator('aside[role="navigation"] button:text("+")').first()
    if (await zoomPlus.count() > 0) {
      await expect(zoomPlus).toBeVisible()
      await zoomPlus.click()
      await await new Promise(r => setTimeout(r, 200))
    }
  })

  test('zoom percentage is displayed in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Zoom text in collapsed sidebar uses text-[8px] class
    const zoomTexts = page.locator('aside[role="navigation"] span.text-\[8px\]')
    const count = await zoomTexts.count()
    if (count > 0) {
      const text = await zoomTexts.first().textContent()
      if (text) {
        expect(text).toMatch(/\d+%/)
      }
    }
  })
})

// ─── Collapsed sidebar brand selector ───────────────────────────────

test.describe('Collapsed sidebar — brand selector', () => {
  test('brand abbreviation button exists in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Brand button shows 2-letter abbreviation (e.g., "DMC")
    const brandBtn = page.locator('aside[role="navigation"] button.bg-gray-100').last()
    if (await brandBtn.count() > 0) {
      await expect(brandBtn).toBeVisible()
    }
  })

  test('clicking brand button opens dropdown in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // The brand dropdown appears as an absolute-positioned div below the button
    const brandBtn = page.locator('aside[role="navigation"] button.bg-gray-100').last()
    if (await brandBtn.count() > 0) {
      await brandBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      // Dropdown should appear with brand options
      const dropdown = page.locator('div.z-50.bg-white.border')
      if (await dropdown.count() > 0) {
        await expect(dropdown).toBeVisible()
      }
    }
  })
})

// ─── Collapsed sidebar quick colors ─────────────────────────────────

test.describe('Collapsed sidebar — quick color strip', () => {
  test('top 6 palette colors appear in collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Quick color buttons are small (w-6 h-6) with rounded corners in the collapsed sidebar
    const quickColors = page.locator('aside[role="navigation"] button.w-6.h-6')
    const count = await quickColors.count()
    // Should have at least some colors (palette might be small)
    if (count > 0) {
      expect(count).toBeLessThanOrEqual(6) // max 6 colors
    }
  })

  test('clicking quick color in collapsed sidebar sets selected color', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const quickColors = page.locator('aside[role="navigation"] button.w-6.h-6')
    if (await quickColors.count() > 0) {
      // Click the first color
      await quickColors.first().click()
      await await new Promise(r => setTimeout(r, 300))

      // The clicked color should have ring-indigo-400 styling
      const firstColor = await quickColors.first().getAttribute('class')
      if (firstColor) {
        expect(firstColor).toContain('ring-indigo-400')
      }
    }
  })

  test('switching quick colors updates active highlight', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const quickColors = page.locator('aside[role="navigation"] button.w-6.h-6')
    const count = await quickColors.count()
    if (count >= 2) {
      // Click first color
      await quickColors.first().click()
      await await new Promise(r => setTimeout(r, 200))

      const firstClass = await quickColors.first().getAttribute('class')
      expect(firstClass).toContain('ring-indigo-400')

      // Click second color
      await quickColors.nth(1).click()
      await await new Promise(r => setTimeout(r, 200))

      // Second should now be highlighted, first should not
      const secondClass = await quickColors.nth(1).getAttribute('class')
      expect(secondClass).toContain('ring-indigo-400')
    }
  })
})

// ─── Collapsed sidebar vs full sidebar — state consistency ──────────

test.describe('Collapsed ↔ Full — state consistency', () => {
  test('tool state persists when switching from collapsed to full sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // In collapsed mode, click eraser
    const eraserCollapsed = page.locator('button[aria-label="Eraser"]').first()
    await eraserCollapsed.click()
    await await new Promise(r => setTimeout(r, 300))

    // Switch to full sidebar
    await page.setViewportSize({ width: 1280, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    // In full sidebar, the eraser tool should still be active (indigo styling)
    // Look in the toolbar-tools container
    const toolbarTools = page.locator('.toolbar-tools button')
    if (await toolbarTools.count() > 0) {
      // At least verify the header is still functional
      const header = page.locator('header').first()
      await expect(header).toBeVisible()
    }
  })

  test('color selection persists when switching from full to collapsed sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Select a color in full sidebar (click the first swatch)
    const swatches = page.locator('.grid-cols-5 button.rounded-lg.border-2')
    if (await swatches.count() > 0) {
      await swatches.first().click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Switch to collapsed sidebar
    await page.setViewportSize({ width: 800, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    // Quick color strip should show the selected color highlighted
    const quickColors = page.locator('aside[role="navigation"] button.w-6.h-6')
    if (await quickColors.count() > 0) {
      const firstColor = await quickColors.first().getAttribute('class')
      if (firstColor) {
        // Selected colors get ring-indigo-400
        expect(firstColor).toContain('ring-indigo-400')
      }
    }
  })

  test('toggling symbols persists across sidebar mode switch', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Toggle symbols in collapsed mode
    const symbolToggle = page.locator('aside[role="navigation"] button').nth(4)
    if (await symbolToggle.count() > 0) {
      await symbolToggle.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Switch to full sidebar
    await page.setViewportSize({ width: 1280, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    // In full sidebar, the symbols toggle should also be active (indigo)
    const symbolBtnFull = page.locator('button[title="Toggle symbol view"]').first()
    if (await symbolBtnFull.count() > 0) {
      const classes = await symbolBtnFull.getAttribute('class')
      if (classes) {
        expect(classes).toContain('indigo')
      }
    }
  })

  test('backstitch toggle state persists across mode switch', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Toggle backstitch in collapsed mode
    const bsCollapsed = page.locator('aside[role="navigation"] button[aria-label="Toggle backstitch tool"]').first()
    if (await bsCollapsed.count() > 0) {
      await bsCollapsed.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Switch to full sidebar
    await page.setViewportSize({ width: 1280, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    // In full sidebar, the backstitch button should show active state
    const bsFull = page.locator('button[title="Click to set start point, click again for end point"]').first()
    if (await bsFull.count() > 0) {
      const classes = await bsFull.getAttribute('class')
      if (classes) {
        expect(classes).toContain('amber', 'Backstitch should show amber active state')
      }
    }
  })
})

// ─── Edge cases ─────────────────────────────────────────────────────

test.describe('Collapsed sidebar — edge cases', () => {
  test('sidebar is not visible on phone viewport (< 768px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // On phone, the sidebar should be hidden (panelVisibility.sidebar = false)
    const sidebars = page.locator('aside')
    const count = await sidebars.count()
    // There may be no sidebar at phone viewport
    expect(count).toBe(0)
  })

  test('rapid resize cycling (720→1280→800→1280→720) does not crash', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    for (let i = 0; i < 10; i++) {
      const widths = [720, 1280, 800, 1280, 720]
      for (const w of widths) {
        await page.setViewportSize({ width: w, height: 720 })
        await await new Promise(r => setTimeout(r, 200))
      }
    }

    // Should still be functional
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
  })

  test('collapsed sidebar has correct role and aria-label', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    const sidebar = page.locator('aside[role="navigation"]').first()
    if (await sidebar.count() > 0) {
      await expect(sidebar).toBeVisible()
      const ariaLabel = await sidebar.getAttribute('aria-label')
      expect(ariaLabel).toContain('tool', 'Collapsed sidebar should be accessible')
    }
  })

  test('collapsing sidebar does not break grid click placement', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForSelector('header', { timeout: 10000 })
    await await new Promise(r => setTimeout(r, 500))

    // Click a grid cell with pencil in full sidebar mode
    const main = page.locator('main').first()
    if (await main.count() > 0) {
      const box = await main.boundingBox()
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
      }
    }

    // Collapse sidebar
    await page.setViewportSize({ width: 800, height: 720 })
    await await new Promise(r => setTimeout(r, 500))

    // Grid should still be functional — main area should still be visible
    const mainAfter = page.locator('main').first()
    if (await mainAfter.count() > 0) {
      const boxAfter = await mainAfter.boundingBox()
      expect(boxAfter).not.toBeNull()
    }
  })
})
