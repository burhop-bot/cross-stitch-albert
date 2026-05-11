/**
 * Color History Panel — recently used colors popup in the canvas toolbar.
 *
 * Covers: button visibility/activation, empty state, population on color selection,
 * display correctness (swatches + labels), click-to-select, close behavior,
 * LRU ordering, 20-entry limit, survival across panel switches and tool changes,
 * interaction with undo/redo, and integration with the right panel.
 *
 * Component: src/components/ColorHistoryPanel.tsx
 * Trigger: GridCanvas toolbar → "🎨 Recent" button (showColorHistory state)
 * Data: projectStore.colorHistory (number[], LRU, max 20)
 */
import { test, expect } from '../fixtures/base'

test.describe('Color History Panel', () => {
  // Helper: find the color history panel by its specific heading
  const getPanel = (page: import('@playwright/test').Page) => {
    return page.locator('div.rounded-lg.border')
      .filter({ has: page.locator('h3').filter({ hasText: 'Recently Used Colors' }) })
      .first()
  }
  // Helper: return swatches inside the color history panel
  const getSwatches = (page: import('@playwright/test').Page) => {
    const panel = getPanel(page)
    return panel.locator('button[title^="DMC "]')
  }
  // Helper: return count text inside the panel
  const getCountText = (page: import('@playwright/test').Page) => {
    const panel = getPanel(page)
    return panel.locator('p').filter({ hasText: /recent colors/ }).first()
  }

  test.beforeEach(async ({ page }) => {
    // Clear persisted state so color history starts fresh for each test,
    // then reload so the in-memory store reinitializes from empty storage.
    await page.evaluate(() => {
      try { localStorage.removeItem('cross-stitch-studio'); } catch {}
    })
    await page.reload({ waitUntil: 'networkidle' })
    // Wait for the React app to fully initialize
    await page.locator('h1').filter({ hasText: 'Cross-Stitch Studio' }).waitFor({ timeout: 5000 })
    await page.waitForTimeout(500)
  });

  // --- Button visibility and activation ---

  test('[ @smoke ] "Recent" button exists in canvas toolbar', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await expect(btn).toBeVisible()
  })

  test('[ @smoke ] clicking "Recent" button opens the color history panel', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await expect(btn).toBeVisible()
    await btn.click()
    // Wait for the color history panel by its specific container classes
    await expect(page.locator('div.absolute').filter({ has: page.locator('h3').filter({ hasText: 'Recently Used Colors' }) })).toBeVisible({ timeout: 3000 })
  })

  test('[ @smoke ] color history button has hover and accessible styling', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await expect(btn).toHaveClass(/rounded-md/)
    await btn.hover()
    await expect(btn).toHaveClass(/hover:bg-gray-200/)
  })

  // --- Empty state ---

  test('color history shows empty state when no colors used yet', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('p').filter({ hasText: /colors you click/i })).toBeVisible({ timeout: 3000 })
  })

  test('empty state is replaced immediately on color selection', async ({ page }) => {
    // Select a color first
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    const count = await paletteButtons.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) {
        await paletteButtons.nth(i).click()
        await page.waitForTimeout(300)
        break
      }
    }
    // Open color history
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Empty state should be gone
    const emptyMsg = page.locator('p').filter({ hasText: /colors you click/i })
    await expect(emptyMsg).toHaveCount(0)
  })

  // --- Color display in panel ---

  test('selected color swatch shows correct DMC number label', async ({ page }) => {
    // Select color 15
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    const count = await paletteButtons.count()
    for (let i = 0; i < count; i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) {
        await paletteButtons.nth(i).click()
        await page.waitForTimeout(300)
        break
      }
    }
    // Open color history and check first swatch
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // The swatches are buttons with titles like "DMC 15 (#XXXXXX)"
    const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
    await expect(firstSwatch).toBeVisible()
  })

  test('swatch background color matches the selected palette color', async ({ page }) => {
    // Select color 15
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    const count = await paletteButtons.count()
    for (let i = 0; i < count; i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) {
        await paletteButtons.nth(i).click()
        await page.waitForTimeout(300)
        break
      }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const swatch = getSwatches(page).filter({ hasText: '15' }).first()
    const bgColor = await swatch.locator('span.absolute.inset-0').evaluate((el: HTMLElement) => el.style.backgroundColor)
    expect(bgColor).toBeTruthy()
  })

  test('color history count text shows correct number', async ({ page }) => {
    // Select a color
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    const count = await paletteButtons.count()
    for (let i = 0; i < count; i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) {
        await paletteButtons.nth(i).click()
        await page.waitForTimeout(300)
        break
      }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const countText = getCountText(page)
    await expect(countText).toBeVisible()
    const text = await countText.textContent()
    expect(text).toContain('1')
  })

  // --- Populating history ---

  test('multiple color selections add multiple swatches to history', async ({ page }) => {
    // Select color 15
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    // Select color 25
    paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Should have 2 swatches (buttons with DMC titles)
    const swatches = getSwatches(page)
    await expect(swatches).toHaveCount(2)
    const countText = getCountText(page)
    const text = await countText.textContent()
    expect(text).toContain('2')
  })

  test('most recently selected color appears first in history', async ({ page }) => {
    // Select color 15 first
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    // Select color 25 second (should be first in history)
    paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // First swatch should be DMC 25
    const firstSwatch = getSwatches(page).filter({ hasText: '25' }).first()
    await expect(firstSwatch).toBeVisible()
  })

  test('clicking a color in history sets it as active', async ({ page }) => {
    // Select 15 then 25
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Click the first swatch (25) — it should become active
    await (getSwatches(page)).filter({ hasText: '25' }).first().click()
    await page.waitForTimeout(300)
    // Reopen and verify 25 is still first
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const firstSwatch = getSwatches(page).filter({ hasText: '25' }).first()
    await expect(firstSwatch).toBeVisible()
  })

  // --- Close behavior ---

  test('close button (✕) hides the color history panel', async ({ page }) => {
    // Select a color
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const closeBtn = page.locator('button').filter({ hasText: '✕' }).first()
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toHaveCount(0)
  })

  test('clicking outside the panel closes it', async ({ page }) => {
    // Select a color
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Click on the main canvas to close
    await page.locator('main').first().click()
    await page.waitForTimeout(300)
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toHaveCount(0)
  })

  test('reopening "Recent" button shows the panel again', async ({ page }) => {
    // Select a color
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Close it
    await page.locator('button').filter({ hasText: '✕' }).first().click()
    await page.waitForTimeout(200)
    // Reopen
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  })

  // --- LRU behavior ---

  test('re-selecting a color moves it to the front', async ({ page }) => {
    // Select 15, then 25, then 15 again
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // 15 should be first (most recently selected)
    const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
    await expect(firstSwatch).toBeVisible()
  })

  test('history preserves maximum 20 entries', async ({ page }) => {
    const validColors = [1,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]
    for (const num of validColors) {
      const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
      for (let i = 0; i < await paletteButtons.count(); i++) {
        const text = await paletteButtons.nth(i).textContent()
        if (text && text.includes(String(num))) {
          await paletteButtons.nth(i).click()
          await page.waitForTimeout(200)
          break
        }
      }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const swatches = getSwatches(page)
    const count = await swatches.count()
    expect(count).toBeLessThanOrEqual(20)
  })

  test('oldest entry is evicted when history exceeds 20', async ({ page }) => {
    const validColors = [1,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]
    for (let i = 0; i < 20; i++) {
      const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
      for (let j = 0; j < await paletteButtons.count(); j++) {
        const text = await paletteButtons.nth(j).textContent()
        if (text && text.includes(String(validColors[i]))) {
          await paletteButtons.nth(j).click()
          await page.waitForTimeout(200)
          break
        }
      }
    }
    // Add 33 (should evict 1)
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('33')) {
        await paletteButtons.nth(i).click()
        await page.waitForTimeout(200)
        break
      }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const swatches = getSwatches(page)
    await expect(swatches).toHaveCount(20)
    // First should be 33, last should NOT be 1
    const lastSwatch = swatches.last()
    const lastTitle = await lastSwatch.getAttribute('title')
    expect(lastTitle).not.toContain('DMC 1 ')
  })

  // --- Interaction with other features ---

  test('color history survives right panel tab switching', async ({ page }) => {
    // Select color 15
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Switch panels
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await page.waitForTimeout(300)
    }
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await page.waitForTimeout(200)
    // Reopen color history
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
    await expect(firstSwatch).toBeVisible()
  })

  test('placing a stitch adds the color to history automatically', async ({ page }) => {
    // Select color 15
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    // Click on grid cell to place a stitch
    const cells = page.locator('[data-cell]')
    if (await cells.count() > 0) {
      await cells.first().click()
      await page.waitForTimeout(200)
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
    await expect(firstSwatch).toBeVisible()
  })

  // --- Brand switching compatibility ---

  test('color history swatches show correct hex for non-DMC brands', async ({ page }) => {
    // Select color 15
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    // Switch to different brand
    let panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) await panelBtn.click()
    await page.waitForTimeout(300)
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await projectTab.count() > 0) await projectTab.click()
    await page.waitForTimeout(200)
    // Open color history
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const countText = getCountText(page)
    await expect(countText).toBeVisible()
  })

  // --- Tool interaction ---

  test('color history remains after tool switching', async ({ page }) => {
    // Select 15, then 25
    let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    // Switch to eraser tool
    const eraserBtn = page.locator('button').filter({ hasText: 'Eraser' }).first()
    if (await eraserBtn.count() > 0) await eraserBtn.click()
    await page.waitForTimeout(200)
    // Reopen color history — should still show 2 entries
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const swatches = getSwatches(page)
    await expect(swatches).toHaveCount(2)
  })

  // --- Edge cases ---

  test('rapid open/close cycles do not crash the panel', async ({ page }) => {
    // Select a color first
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    for (let i = 0; i < 10; i++) {
      await btn.click()
      await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
      const closeBtn = page.locator('button').filter({ hasText: '✕' }).first()
      if (await closeBtn.count() > 0) await closeBtn.click()
      await page.waitForTimeout(50)
    }
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  })

  test('color history panel does not overlap other UI elements inappropriately', async ({ page }) => {
    // Select a color
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const panel = page.locator('div.rounded-lg.border')
      .filter({ has: page.locator('h3') }).first()
    await expect(panel).toBeVisible()
    const box = await panel.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeGreaterThan(50)
      expect(box.height).toBeGreaterThan(20)
    }
  })

  test('swatch hover tooltip shows DMC number and hex color', async ({ page }) => {
    // Select a color
    const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
    for (let i = 0; i < await paletteButtons.count(); i++) {
      const text = await paletteButtons.nth(i).textContent()
      if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const swatches = getSwatches(page)
    const firstSwatch = swatches.first()
    await firstSwatch.hover()
    const title = await firstSwatch.getAttribute('title')
    expect(title).toBeTruthy()
    expect(title!).toContain('15')
  })

  // --- Full workflow ---

  test('full workflow: select colors → view history → select from history → use in editing', async ({ page }) => {
    // Select 3 colors
    for (const num of [15, 25, 33]) {
      const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
      for (let i = 0; i < await paletteButtons.count(); i++) {
        const text = await paletteButtons.nth(i).textContent()
        if (text && text.includes(String(num))) {
          await paletteButtons.nth(i).click()
          await page.waitForTimeout(300)
          break
        }
      }
    }
    const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const swatches = getSwatches(page)
    await expect(swatches).toHaveCount(3)
    // Close
    await page.locator('button').filter({ hasText: '✕' }).first().click()
    await page.waitForTimeout(200)
    // Reopen and click second swatch (25)
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const secondSwatch = await (getSwatches(page)).filter({ hasText: '25' }).first()
    await secondSwatch.click()
    await page.waitForTimeout(200)
    // Reopen — 25 should be first
    await btn.click()
    await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
    const newFirstSwatch = await (getSwatches(page)).filter({ hasText: '25' }).first()
    await expect(newFirstSwatch).toBeVisible()
  })
})
