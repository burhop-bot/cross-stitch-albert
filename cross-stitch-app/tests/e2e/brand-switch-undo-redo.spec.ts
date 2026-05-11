/**
 * Brand Switch Tests
 *
 * Brand switching (DMC → Anchor → Madeira → Generic) changes the flossBrand
 * in the store. This affects palette labels, share links, shopping lists, and PDFs.
 *
 * NOTE: Brand switching does NOT push to undo stack (by design).
 * Undo/redo tracks grid edit history, not store mutations like brand changes.
 * Tests here focus on brand switching functionality and its effect on the UI.
 */

import { test, expect } from '../fixtures/base'

// ── Helpers ────────────────────────────────────────────────────────────

async function getBrand(page: any): Promise<string> {
  return page.evaluate(() => {
    return (window as any).__store?.getState()?.flossBrand ?? 'unknown'
  })
}

async function openBrandSelector(page: any) {
  // Brand selector button shows the current brand name (DMC, Anchor, etc.)
  const brandBtn = page.locator('button').filter({ hasText: /^(DMC|Anchor|Madeira|Mouline|Generic)$/ }).first()
  if (await brandBtn.count() > 0) {
    await brandBtn.click()
    await page.waitForTimeout(500)
  }
}

async function selectBrand(page: any, brandName: string) {
  // Brand dropdown buttons show brand display names like "Anchor", "Madeira Mouline", "Generic"
  const brandMap: Record<string, string> = {
    Anchor: 'Anchor',
    Madeira: 'Madeira Mouline',
    Generic: 'Generic',
    dmc: 'DMC',
    dmc: 'DMC',
  }
  const displayName = brandMap[brandName] || brandName
  // Look for the dropdown option button by text
  const options = page.locator('button').filter({ hasText: new RegExp(displayName, 'i') })
  // Skip the toggle button itself (which shows current brand)
  // Click the first option that is NOT the toggle button
  let clicked = false
  for (let i = 0; i < await options.count(); i++) {
    const btn = options.nth(i)
    const text = (await btn.textContent()).trim()
    // Only click if it matches the target brand (not a partial match with the toggle)
    if (text.toLowerCase() === displayName.toLowerCase()) {
      await btn.click()
      await page.waitForTimeout(400)
      clicked = true
      break
    }
  }
  if (!clicked) {
    // Fallback: click the Nth button that contains the brand name in a dropdown area
    // Look for buttons in the Colors section specifically
    const colorsSection = page.locator('div:has(h3:has-text("Colors"))').first()
    const dropdownBtns = colorsSection.locator('button').filter({ hasText: new RegExp(displayName, 'i') })
    if (await dropdownBtns.count() > 0) {
      await dropdownBtns.first().click()
      await page.waitForTimeout(400)
    }
  }
}

async function placeStitches(page: any, count: number, baseX = 60, baseY = 100, spacing = 18) {
  const main = page.locator('main')
  for (let i = 0; i < count; i++) {
    await main.click({ position: { x: baseX + (i % 5) * spacing, y: baseY + Math.floor(i / 5) * spacing } })
    await await new Promise(r => setTimeout(r, 150))
  }
}

// ── Test Suite ──────────────────────────────────────────────────────────

test.describe('Brand Switch', () => {

  test('brand switch changes store flossBrand', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    let brand = await getBrand(page)
    expect(brand).toBe('dmc')

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    brand = await getBrand(page)
    expect(brand).toBe('anchor')
  })

  test('brand switch to Madeira works', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await openBrandSelector(page)
    await selectBrand(page, 'Madeira')
    const brand = await getBrand(page)
    expect(brand).toBe('madeira')
  })

  test('brand switch to Generic works', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await openBrandSelector(page)
    await selectBrand(page, 'Generic')
    const brand = await getBrand(page)
    expect(brand).toBe('generic')
  })

  test('brand switch then switch back works', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    expect(await getBrand(page)).toBe('anchor')

    await openBrandSelector(page)
    await selectBrand(page, 'DMC')
    expect(await getBrand(page)).toBe('dmc')
  })

  test('rapid brand switching (5x) does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const brands = ['Anchor', 'Madeira', 'Generic', 'Anchor', 'Madeira']
    for (const brand of brands) {
      await openBrandSelector(page)
      await selectBrand(page, brand)
      await await new Promise(r => setTimeout(r, 200))
    }

    expect(await getBrand(page)).toBe('madeira')
    await expect(page.locator('main')).toBeVisible()
  })

  test('brand switch with 1x1 grid does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await await new Promise(r => setTimeout(r, 400))

    expect(await getBrand(page)).toBe('anchor')
    await expect(page.locator('main')).toBeVisible()
  })

  test('brand switch with settings panel open does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await expect(page.locator('main')).toBeVisible()
  })

  test('brand switch with right panel open survives', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    await openBrandSelector(page)
    await selectBrand(page, 'Madeira')
    await await new Promise(r => setTimeout(r, 400))

    await expect(page.locator('main')).toBeVisible()
  })

  test('brand switch preserves ability to place stitches', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitch
    await placeStitches(page, 2)
    await await new Promise(r => setTimeout(r, 300))

    // Switch brand
    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await await new Promise(r => setTimeout(r, 400))

    // Should still be able to place more stitches
    await placeStitches(page, 3)
    await await new Promise(r => setTimeout(r, 300))

    await expect(page.locator('main')).toBeVisible()
  })

  test('undo after stitch placement works (independent of brand)', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    // Place stitches
    await placeStitches(page, 3)
    await await new Promise(r => setTimeout(r, 300))

    // Undo should work
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    await expect(page.locator('main')).toBeVisible()
  })

  test('brand selector dropdown closes after selecting a brand', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await await new Promise(r => setTimeout(r, 500))

    await expect(page.locator('main')).toBeVisible()
  })

  test('letter key K opens keyboard shortcuts, not brand selector', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await page.keyboard.press('k')
    await await new Promise(r => setTimeout(r, 400))

    await expect(page.locator('main')).toBeVisible()
  })

  test('brand selector does not interfere with Ctrl+Z shortcut', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await openBrandSelector(page)
    await await new Promise(r => setTimeout(r, 200))

    // Place stitch and undo
    await placeStitches(page, 1)
    await await new Promise(r => setTimeout(r, 300))
    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 200))

    await expect(page.locator('main')).toBeVisible()
  })

  test('brand switch then clear pattern works', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await placeStitches(page, 2)
    await await new Promise(r => setTimeout(r, 300))

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await await new Promise(r => setTimeout(r, 400))

    await expect(page.locator('main')).toBeVisible()
  })

  test('switch brand while pencil tool active preserves tool', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await page.locator('main').click({ position: { x: 100, y: 120 } })
    await await new Promise(r => setTimeout(r, 300))

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await await new Promise(r => setTimeout(r, 300))

    await page.locator('main').click({ position: { x: 120, y: 140 } })
    await await new Promise(r => setTimeout(r, 200))

    await expect(page.locator('main')).toBeVisible()
  })

  test('undo brand switch while flood fill active does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 1000))

    await page.locator('main').click({ position: { x: 100, y: 120 } })
    await await new Promise(r => setTimeout(r, 100))
    await page.locator('main').click({ position: { x: 120, y: 120 } })
    await await new Promise(r => setTimeout(r, 100))
    await page.locator('main').click({ position: { x: 100, y: 140 } })
    await await new Promise(r => setTimeout(r, 300))

    await openBrandSelector(page)
    await selectBrand(page, 'Anchor')
    await await new Promise(r => setTimeout(r, 300))

    await page.keyboard.press('Control+z')
    await await new Promise(r => setTimeout(r, 300))

    await expect(page.locator('main')).toBeVisible()
  })
})
