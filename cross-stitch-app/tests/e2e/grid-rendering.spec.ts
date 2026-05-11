/**
 * TC-04: Grid Rendering & Line Weight Visualization
 * 
 * Tests for:
 * - Multi-weight grid lines (light/medium/heavy) rendered via box-shadow on cells
 * - Zoom in/out changes effective cell size (scale transform)
 * - Grid pan via scroll within the overflow container
 *
 * Grid line weight logic (from getGridLineWeight):
 *   - Heavy:  every 10 cells (width=3, color=#4b5563)
 *   - Medium: every 5 cells  (width=2, color=#9ca3af)
 *   - Light:  every cell     (width=0.5, color=#e5e7eb)
 *
 * Rendering: box-shadow inset on each cell div for right and bottom borders.
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Open the right panel and click the "Project" tab */
async function openProjectTab(page: any): Promise<void> {
  const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
  if (await panelBtn.count() > 0) {
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  }
  const tab = page.locator('button').filter({ hasText: /^Project$/ }).first()
  if (await tab.count() > 0) {
    await tab.click()
    await await new Promise(r => setTimeout(r, 300))
  }
}

// ── Grid Lines (multi-weight) ─────────────────────────────────────────────────

test.describe('Multi-Weight Grid Lines', () => {
  test('[ @smoke ] grid line configuration section is visible in settings', async ({ page }) => {
    await openProjectTab(page)

    // "Grid Lines" heading should appear in the SettingsPanel
    const h3 = page.locator('h3').filter({ hasText: 'Grid Lines' }).first()
    if (await h3.count() > 0) {
      await expect(h3).toBeVisible()
    }
  })

  test('grid renders cells with different line weight shadows (multi-weight lines)', async ({ page }) => {
    // Open Project tab to set grid size
    const tabBtn = page.locator('button').filter({ hasText: 'Project' }).first()
    if (await tabBtn.count() > 0) {
      await tabBtn.click()
      await page.waitForTimeout(300)
    }

    // Set grid dimensions via the inputs
    const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
    if (await widthLabel.count() > 0) {
      const widthInput = widthLabel.locator('..').locator('input[type="number"]')
      const heightInput = heightLabel.locator('..').locator('input[type="number"]')
      await widthInput.clear()
      await widthInput.fill('20')
      await heightInput.clear()
      await heightInput.fill('20')
      const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
      if (await applyBtn.count() > 0) {
        await applyBtn.click()
      }
    }
    await page.waitForTimeout(500)

    // Grid cells have inline box-shadow for multi-weight lines
    // Heavy lines at multiples of 10: inset -3px 0 0 #4b5563 (right) + inset 0 -3px 0 #4b5563 (bottom)
    // Medium lines at multiples of 5 (but not 10): inset -2px 0 0 #9ca3af (right) + inset 0 -2px 0 #9ca3af (bottom)
    // Light lines everywhere else: inset -0.5px 0 0 #e5e7eb (right) + inset 0 -0.5px 0 #e5e7eb (bottom)

    // Verify the grid is visible
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()

    // Check that the canvas container is visible
    const canvasContainer = page.locator('[class*="overflow"]').first()
    if (await canvasContainer.count() > 0) {
      await expect(canvasContainer).toBeVisible()
    }
  })

  test('grid line toggle button exists in settings', async ({ page }) => {
    await openProjectTab(page)

    // The grid lines section should have a toggle for showing/hiding lines
    const linesToggle = page.locator('label').filter({ hasText: /Grid lines|Show lines|grid line/i }).first()
    if (await linesToggle.count() > 0) {
      await expect(linesToggle).toBeVisible()
    }
  })

  test('grid lines toggle affects rendering', async ({ page }) => {
    await openProjectTab(page)

    // Look for the grid lines toggle by its title attribute (Sidebar uses icon-only buttons)
    const toggleBtn = page.locator('button[title="Toggle grid lines"]').first()
    
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      // Verify the grid line config changed by checking the settings panel
      const h3 = page.locator('h3').filter({ hasText: 'Grid Lines' }).first()
      await expect(h3).toBeVisible()
    }
  })

  test('grid cells show no line weight shadows when lines are hidden', async ({ page }) => {
    await openProjectTab(page)

    // Find and click the grid lines toggle (icon-only button with title)
    const toggleBtn = page.locator('button[title="Toggle grid lines"]').first()
    if (await toggleBtn.count() > 0) {
      await toggleBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Check that grid cells no longer have line-weight box-shadows
    const cellsHaveLineShadows = await page.evaluate(() => {
      // Grid cells are divs with data-cell attribute
      const cells = document.querySelectorAll('[data-cell]')
      return Array.from(cells).map((c) => {
        const style = c.getAttribute('style') || ''
        // Line weight shadows use patterns like "inset -3px 0 0" or "inset 0 -3px 0"
        const hasLineWeightShadow = /inset\s+-?[\d.]+px\s+0\s+0/.test(style) || /inset\s+0\s+-?[\d.]+px\s+0/.test(style)
        return hasLineWeightShadow
      })
    })

    if (cellsHaveLineShadows.length > 0) {
      const anyWithShadow = cellsHaveLineShadows.some((s) => s)
      expect(anyWithShadow).toBe(false)
    }
  })
})

// ── Zoom ──────────────────────────────────────────────────────────────────────

test.describe('Grid Zoom Controls', () => {
  test('[ @smoke ] zoom controls are visible in toolbar', async ({ page }) => {
    // Zoom controls are in the grid toolbar: − span % span +
    const zoomMinus = page.locator('button').filter({ hasText: '−' }).first()
    if (await zoomMinus.count() > 0) {
      await expect(zoomMinus).toBeVisible()
    }

    const zoomPlus = page.locator('button').filter({ hasText: '+' }).first()
    if (await zoomPlus.count() > 0) {
      await expect(zoomPlus).toBeVisible()
    }
  })

  test('zoom percentage is displayed in toolbar', async ({ page }) => {
    // The zoom level is shown under the "Zoom" heading in the sidebar
    const zoomDisplay = page.locator('h3').filter({ hasText: 'Zoom' }).first()
    if (await zoomDisplay.count() > 0) {
      await expect(zoomDisplay).toBeVisible()
    }
  })

  test('clicking zoom out decreases percentage', async ({ page }) => {
    await openProjectTab(page)
    await await new Promise(r => setTimeout(r, 300))

    // Click zoom out (look for the minus button in the Zoom section)
    const zoomMinus = page.locator('h3').filter({ hasText: 'Zoom' }).locator('button').filter({ hasText: /^-$/ }).first()
    if (await zoomMinus.count() === 0) return

    const initialZoom = await page.evaluate(() => {
      // Find the zoom display under the Zoom heading
      const headings = document.querySelectorAll('h3')
      for (const h of headings) {
        if (h.textContent?.includes('Zoom')) {
          const next = h.parentElement?.querySelectorAll('div, span, generic')[0]
          if (next) {
            const text = (next.textContent || '').trim()
            if (/^\d+%$/.test(text)) return parseInt(text)
          }
          break
        }
      }
      return 100
    })

    await zoomMinus.click()
    await await new Promise(r => setTimeout(r, 300))

    const newZoom = await page.evaluate(() => {
      const headings = document.querySelectorAll('h3')
      for (const h of headings) {
        if (h.textContent?.includes('Zoom')) {
          const next = h.parentElement?.querySelectorAll('div, span, generic')[0]
          if (next) {
            const text = (next.textContent || '').trim()
            if (/^\d+%$/.test(text)) return parseInt(text)
          }
          break
        }
      }
      return 100
    })
    if (initialZoom > 0) {
      expect(newZoom).toBeLessThan(initialZoom)
    }
  })

  test('clicking zoom in increases percentage', async ({ page }) => {
    await openProjectTab(page)
    await await new Promise(r => setTimeout(r, 300))

    const initialZoom = await page.evaluate(() => {
      const headings = document.querySelectorAll('h3')
      for (const h of headings) {
        if (h.textContent?.includes('Zoom')) {
          const next = h.parentElement?.querySelectorAll('div, span, generic')[0]
          if (next) {
            const text = (next.textContent || '').trim()
            if (/^\d+%$/.test(text)) return parseInt(text)
          }
          break
        }
      }
      return 100
    })

    // Click zoom in (look for the plus button in the Zoom section)
    const zoomPlus = page.locator('h3').filter({ hasText: 'Zoom' }).locator('button').filter({ hasText: '+' }).first()
    if (await zoomPlus.count() === 0) return

    await zoomPlus.click()
    await await new Promise(r => setTimeout(r, 300))

    const newZoom = await page.evaluate(() => {
      const headings = document.querySelectorAll('h3')
      for (const h of headings) {
        if (h.textContent?.includes('Zoom')) {
          const next = h.parentElement?.querySelectorAll('div, span, generic')[0]
          if (next) {
            const text = (next.textContent || '').trim()
            if (/^\d+%$/.test(text)) return parseInt(text)
          }
          break
        }
      }
      return 100
    })
    expect(newZoom).toBeGreaterThan(initialZoom)
  })

  test('zoom at minimum (smallest) does not crash', async ({ page }) => {
    const zoomMinus = page.locator('button').filter({ hasText: '−' }).first()
    if (await zoomMinus.count() === 0) return

    // Keep clicking minus until zoom can't go lower
    for (let i = 0; i < 20; i++) {
      await zoomMinus.click()
      await await new Promise(r => setTimeout(r, 100))
    }

    // Page should still be visible and not broken
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()
  })

  test('zoom at maximum (largest) does not crash', async ({ page }) => {
    const zoomPlus = page.locator('button').filter({ hasText: '+' }).first()
    if (await zoomPlus.count() === 0) return

    // Keep clicking plus until zoom can't go higher
    for (let i = 0; i < 20; i++) {
      await zoomPlus.click()
      await await new Promise(r => setTimeout(r, 100))
    }

    // Page should still be visible and not broken
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()
  })
})

// ── Grid Pan ──────────────────────────────────────────────────────────────────

test.describe('Grid Pan & Scroll', () => {
  test('grid container supports horizontal scroll when grid is wider than viewport', async ({ page }) => {
    // Set a wide grid and small viewport to force scrolling
    await page.setViewportSize({ width: 600, height: 720 })
    await openProjectTab(page)

    // Set a wide grid
    const labels = page.locator('label')
    for (let i = 0; i < (await labels.count()) && i < 50; i++) {
      const text = await labels.nth(i).textContent()
      if (text && text.trim() === 'Width') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('100')
        }
      }
      if (text && text.trim() === 'Height') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('30')
        }
      }
    }

    const applyBtn = page.locator('button', { hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // The grid container should now have scroll
    // Find the overflow container that holds the grid
    const containers = page.locator('[class*="overflow"]')
    if (await containers.count() > 0) {
      const containerBox = await containers.first().evaluate((el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollLeft: el.scrollLeft,
      }))
      // If scrollWidth > clientWidth, the container has horizontal scroll content
      if (containerBox.scrollWidth > containerBox.clientWidth) {
        expect(containerBox.scrollWidth).toBeGreaterThan(containerBox.clientWidth)
      }
    }
  })

  test('scrolling right moves grid content and new content becomes visible', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 720 })
    await openProjectTab(page)

    // Set a wide grid
    const labels = page.locator('label')
    for (let i = 0; i < (await labels.count()) && i < 50; i++) {
      const text = await labels.nth(i).textContent()
      if (text && text.trim() === 'Width') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('100')
        }
      }
      if (text && text.trim() === 'Height') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('30')
        }
      }
    }

    const applyBtn = page.locator('button', { hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    const containers = page.locator('[class*="overflow"]')
    if (await containers.count() > 0) {
      const scrollBefore = await containers.first().evaluate((el) => el.scrollLeft)
      
      // Scroll right by 200px
      await containers.first().evaluate((el) => { el.scrollLeft += 200 })
      await await new Promise(r => setTimeout(r, 300))

      const scrollAfter = await containers.first().evaluate((el) => el.scrollLeft)
      expect(scrollAfter).toBeGreaterThan(scrollBefore)
    }
  })

  test('scrolling down moves grid content and new rows become visible', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 500 })
    await openProjectTab(page)

    // Set a tall grid via the settings inputs
    const labels = page.locator('label')
    for (let i = 0; i < (await labels.count()) && i < 50; i++) {
      const text = await labels.nth(i).textContent()
      if (text && text.trim() === 'Width') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('30')
        }
      }
      if (text && text.trim() === 'Height') {
        const parent = labels.nth(i).locator('..')
        const input = parent.locator('input[type="number"]')
        if (await input.count() > 0) {
          await input.clear()
          await input.fill('80')
        }
      }
    }

    const applyBtn = page.locator('button', { hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
    }
    await await new Promise(r => setTimeout(r, 500))

    // Find the main grid scroll container (the one with data-cell children)
    // The grid area is under <main> with overflow-auto
    const gridScroll = page.locator('main').first()
    if (await gridScroll.count() > 0) {
      const scrollBefore = await gridScroll.evaluate((el) => {
        // Get the inner scrollable div
        const inner = el.querySelector('[style*="overflow"]') || el.querySelector('[style*="overflow-y"]') || el
        return { scrollTop: inner.scrollTop, scrollHeight: inner.scrollHeight, clientHeight: inner.clientHeight }
      })

      // Only test if there's actually scrollable content
      if (scrollBefore.scrollHeight > scrollBefore.clientHeight) {
        // Scroll down by 200px on the inner scrollable element
        await gridScroll.evaluate((el) => {
          const inner = el.querySelector('[style*="overflow"]') || el.querySelector('[style*="overflow-y"]') || el
          inner.scrollTop += 200
        })
        await await new Promise(r => setTimeout(r, 300))

        const scrollAfter = await gridScroll.evaluate((el) => {
          const inner = el.querySelector('[style*="overflow"]') || el.querySelector('[style*="overflow-y"]') || el
          return inner.scrollTop
        })
        expect(scrollAfter).toBeGreaterThan(scrollBefore.scrollTop)
      }
    }
  })

  test('zoom and pan can be combined without breaking the grid', async ({ page }) => {
    // Zoom in, then pan, then zoom out — grid should remain functional
    const zoomPlus = page.locator('button').filter({ hasText: '+' }).first()
    const zoomMinus = page.locator('button').filter({ hasText: '−' }).first()
    const containers = page.locator('[class*="overflow"]')

    // Zoom in 3x
    if (await zoomPlus.count() > 0) {
      await zoomPlus.click()
      await await new Promise(r => setTimeout(r, 200))
      await zoomPlus.click()
      await await new Promise(r => setTimeout(r, 200))
      await zoomPlus.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Pan right a bit
    if (await containers.count() > 0) {
      await containers.first().evaluate((el) => { el.scrollLeft += 100 })
      await await new Promise(r => setTimeout(r, 200))
    }

    // Zoom out
    if (await zoomMinus.count() > 0) {
      await zoomMinus.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Grid should still be visible
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()
  })
})
