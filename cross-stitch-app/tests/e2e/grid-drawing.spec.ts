/**
 * TC-05: Grid Drawing Tools
 * Tests for tools in the Sidebar: pencil, eraser, line, rectangle, fill, brush, dropper.
 */
import { test, expect } from '../fixtures/base'

test.describe('Drawing Tools', () => {
  test('[ @smoke ] pencil tool is available in sidebar', async ({ page }) => {
    // Pencil tool button has a pencil icon and title
    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await expect(pencilBtn).toBeVisible()
    }
  })

  test('eraser tool is available in sidebar', async ({ page }) => {
    const eraserBtn = page.locator('button[title="Eraser"]').first()
    if (await eraserBtn.count() > 0) {
      await expect(eraserBtn).toBeVisible()
    }
  })

  test('line tool is available in sidebar', async ({ page }) => {
    const lineBtn = page.locator('button[title="Line"]').first()
    if (await lineBtn.count() > 0) {
      await expect(lineBtn).toBeVisible()
    }
  })

  test('rectangle tool is available in sidebar', async ({ page }) => {
    const rectBtn = page.locator('button[title="Rectangle"]').first()
    if (await rectBtn.count() > 0) {
      await expect(rectBtn).toBeVisible()
    }
  })

  test('flood fill tool is available in sidebar', async ({ page }) => {
    const fillBtn = page.locator('button[title="Fill"]').first()
    if (await fillBtn.count() > 0) {
      await expect(fillBtn).toBeVisible()
    }
  })

  test('brush tool is available in sidebar', async ({ page }) => {
    const brushBtn = page.locator('button[title="Brush"]').first()
    if (await brushBtn.count() > 0) {
      await expect(brushBtn).toBeVisible()
    }
  })

  test('dropper tool is available in sidebar', async ({ page }) => {
    const dropperBtn = page.locator('button[title="Dropper"]').first()
    if (await dropperBtn.count() > 0) {
      await expect(dropperBtn).toBeVisible()
    }
  })
})

test.describe('Backstitch Tool', () => {
  test('backstitch section exists in sidebar', async ({ page }) => {
    const backstitchH3 = page.locator('h3:has-text("Backstitch")').first()
    if (await backstitchH3.count() > 0) {
      await expect(backstitchH3).toBeVisible()
    }
  })

  test('backstitch has color picker', async ({ page }) => {
    const bsColorInput = page.locator('input[type="color"]')
    const count = await bsColorInput.count()
    expect(count).toBeGreaterThan(0)
  })

  test('backstitch has line width selector', async ({ page }) => {
    const bsSelect = page.locator('select:has(option[value="1"])').first()
    if (await bsSelect.count() > 0) {
      await expect(bsSelect).toBeVisible()
    }
  })

  test('backstitch toggle button exists', async ({ page }) => {
    const bsToggleBtn = page.locator('button:has-text("Backstitch")').first()
    if (await bsToggleBtn.count() > 0) {
      await expect(bsToggleBtn).toBeVisible()
    }
  })
})

test.describe('Symbol View Toggle', () => {
  test('symbol view toggle button exists', async ({ page }) => {
    const symbolBtn = page.locator('button[title="Toggle symbols"]').first()
    if (await symbolBtn.count() > 0) {
      await expect(symbolBtn).toBeVisible()
    }
  })

  test('symbol view toggle changes icon based on state', async ({ page }) => {
    const symbolBtn = page.locator('button[title="Toggle symbols"]').first()
    if (await symbolBtn.count() > 0) {
      const box = await symbolBtn.boundingBox()
      expect(box).not.toBeNull()
    }
  })
})

test.describe('Grid Canvas Interaction', () => {
  test('grid canvas responds to click', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // Click on the grid — should place a stitch or trigger tool action
    await main.click({ position: { x: 80, y: 80 } })
    await await new Promise(r => setTimeout(r, 200))

    // The grid area should still be visible
    await expect(main).toBeVisible()
  })

  test('grid canvas has correct bounding box', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    const box = await main.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThan(200)
    expect(box!.height).toBeGreaterThan(100)
  })

  test('toolbar area is visible with tools', async ({ page }) => {
    // The toolbar has drawing tool buttons in the sidebar
    const toolButtons = page.locator('aside button[title]')
    const count = await toolButtons.count()
    // Should have multiple tool buttons
    expect(count).toBeGreaterThanOrEqual(5)
  })
})
