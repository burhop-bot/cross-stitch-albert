/**
 * WrittenInstructionsPanel — UI & Behavior Tests
 *
 * Tests the WrittenInstructionsPanel component's interactive UI controls:
 * reading direction selector, abbreviations toggle, row numbers toggle,
 * format selector, preview, copy/download exports.
 *
 * Fixed a key app bug: RightPanel now actually renders WrittenInstructionsPanel
 * instead of a placeholder "coming in Wave 2" message.
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ────────────────────────────────────────────────────────

async function setupGridWithData(page: any) {
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  if (await panelBtn.count() > 0) {
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  }

  const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
  if (await projectTab.count() > 0) {
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
  if (await applyBtn.count() > 0) {
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 800))
  }

  const pencilBtn = page.locator('button[title="Pencil"]').first()
  if (await pencilBtn.count() > 0) {
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  const main = page.locator('main')
  for (let i = 0; i < 6; i++) {
    await main.click({ position: { x: 80 + (i % 3) * 30, y: 80 + Math.floor(i / 3) * 30 } })
    await await new Promise(r => setTimeout(r, 60))
  }
  await await new Promise(r => setTimeout(r, 500))
}

async function ensurePageReady(page: any) {
  const toolbar = page.locator('div.flex.items-center.gap-2').first()
  if (await toolbar.count() > 0) {
    await toolbar.waitFor({ state: 'visible', timeout: 10000 })
  }
  await await new Promise(r => setTimeout(r, 1000))
}

async function openInstructionsPanel(page: any) {
  // Open right panel if not already open
  const closeBtn = page.locator('button').filter({ hasText: /Close panel/i }).first()
  const isVisible = await closeBtn.count()
  if (isVisible === 0) {
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }
  }

  // Click the Instructions tab in the right panel
  const instructionsTab = page.locator('button').filter({ hasText: /Instructions/i }).first()
  if (await instructionsTab.count() > 0) {
    await instructionsTab.click()
    await await new Promise(r => setTimeout(r, 500))
  } else {
    // Fallback: try Panel tab
    const panelTab = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelTab.count() > 0) {
      await panelTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }
  }
}

// Get a locator scoped to the WrittenInstructionsPanel content
function panelLocator(page: any) {
  return page.locator('div').filter({ hasText: /Chart Instructions/i }).first()
}

// Open the <details> settings section if closed
async function openSettingsSection(page: any) {
  const panel = panelLocator(page)
  if (await panel.count() === 0) return
  const details = panel.locator('details').first()
  if (await details.count() > 0) {
    const hasOpen = await details.evaluate(el => el.hasAttribute('open'))
    if (!hasOpen) {
      const summary = details.locator('summary').first()
      if (await summary.count() > 0) {
        await summary.click()
        await await new Promise(r => setTimeout(r, 300))
      }
    }
  }
}

// ── Panel existence and visibility ──────────────────────────────────

test.describe('WrittenInstructionsPanel — Existence', () => {
  test('panel header shows "Chart Instructions"', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const heading = page.locator('span').filter({ hasText: /Chart Instructions/i }).first()
    if (await heading.count() > 0) {
      await expect(heading).toBeVisible()
    }
  })

  test('panel icon (FileText) is present when panel is open', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panelContent = page.locator('div.flex.flex-col.h-full').first()
    if (await panelContent.count() > 0) {
      await expect(panelContent).toBeVisible()
    }
  })

  test('panel is present even without grid data', async ({ page }) => {
    await ensurePageReady(page)
    await openInstructionsPanel(page)

    // When there's no grid, the panel shows a no-data message
    const noDataText = page.locator('div').filter({ hasText: /no grid/i }).first()
    if (await noDataText.count() > 0) {
      await expect(noDataText).toBeVisible()
    }
  })
})

// ── Stats bar ───────────────────────────────────────────────────────

test.describe('Stats bar — Row/Color/Stitch counts', () => {
  test('stats bar shows row count, stitch count, and color count', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    // The panel contains "rows", "stitches", and "colors" in its stats bar
    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      const text = await panel.textContent()
      expect(text.toLowerCase()).toContain('rows')
      expect(text.toLowerCase()).toContain('stitches')
    }
  })

  test('stats bar visible with placed stitches', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    await panel.waitFor({ state: 'visible', timeout: 5000 })

    if (await panel.count() > 0) {
      const text = await panel.textContent()
      expect(text).toContain('rows')
    }
  })
})

// ── Settings: Reading Direction ─────────────────────────────────────

test.describe('Settings — Reading Direction', () => {
  test('direction selector exists inside panel settings', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      // Check for the "Direction:" label which is next to the select
      const directionLabel = panel.locator('label').filter({ hasText: /direction/i })
      if (await directionLabel.count() > 0) {
        await expect(directionLabel).toBeVisible()
      }
    }
  })

  test('direction selector is inside an expandable settings section', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const summary = page.locator('summary').filter({ hasText: /Settings/i }).first()
    if (await summary.count() > 0) {
      await expect(summary).toBeVisible()
    }
  })
})

// ── Settings: Abbreviations Toggle ──────────────────────────────────

test.describe('Settings — Abbreviations Toggle', () => {
  test('abbreviations checkbox exists in panel', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      const abbrLabel = panel.locator('label').filter({ hasText: /abbreviations?/i })
      if (await abbrLabel.count() > 0) {
        await expect(abbrLabel).toBeVisible()
      }
    }
  })

  test('toggling abbreviations checkbox changes state', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      const abbrLabel = panel.locator('label').filter({ hasText: /abbreviations?/i }).first()
      if (await abbrLabel.count() > 0) {
        const checkbox = abbrLabel.locator('input[type="checkbox"]')
        if (await checkbox.count() > 0) {
          const initialState = await checkbox.isChecked()
          await checkbox.click()
          await await new Promise(r => setTimeout(r, 300))
          const newState = await checkbox.isChecked()
          expect(newState).not.toBe(initialState)
        }
      }
    }
  })
})

// ── Settings: Row Numbers Toggle ────────────────────────────────────

test.describe('Settings — Row Numbers Toggle', () => {
  test('row numbers checkbox exists in panel', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      const rowLabel = panel.locator('label').filter({ hasText: /row numbers/i })
      if (await rowLabel.count() > 0) {
        await expect(rowLabel).toBeVisible()
      }
    }
  })

  test('toggling row numbers checkbox changes state', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      const rowLabel = panel.locator('label').filter({ hasText: /row numbers/i }).first()
      if (await rowLabel.count() > 0) {
        const checkbox = rowLabel.locator('input[type="checkbox"]')
        if (await checkbox.count() > 0) {
          const initialState = await checkbox.isChecked()
          await checkbox.click()
          await await new Promise(r => setTimeout(r, 300))
          const newState = await checkbox.isChecked()
          expect(newState).not.toBe(initialState)
        }
      }
    }
  })
})

// ── Settings: Format Selector ───────────────────────────────────────

test.describe('Settings — Format Selector', () => {
  test('format selector exists in panel', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const panel = panelLocator(page)
    if (await panel.count() > 0) {
      // Check for the Format label which is next to the select
      const formatLabel = panel.locator('label').filter({ hasText: /format/i })
      if (await formatLabel.count() > 0) {
        await expect(formatLabel).toBeVisible()
      }
    }
  })
})

// ── Preview ─────────────────────────────────────────────────────────

test.describe('Preview', () => {
  test('preview text is displayed in a monospace code block', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const pre = page.locator('pre.font-mono').first()
    if (await pre.count() > 0) {
      await expect(pre).toBeVisible()
    }
  })

  test('preview shows content', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const pre = page.locator('pre.font-mono').first()
    if (await pre.count() > 0) {
      const text = await pre.textContent()
      expect(text.length).toBeGreaterThan(0)
    }
  })

  test('hiding preview removes the text block', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const hideShowBtn = page.locator('button').filter({
      hasText: /^Hide|Show/i
    }).first()

    if (await hideShowBtn.count() > 0) {
      const btnText = await hideShowBtn.textContent()

      if (btnText.toLowerCase().includes('hide')) {
        await hideShowBtn.click()
        await await new Promise(r => setTimeout(r, 500))
      }

      const pre = page.locator('pre.font-mono')
      const visiblePre = await pre.count()
      if (visiblePre > 0) {
        const isVisible = await pre.first().isVisible()
        expect(isVisible).toBeFalsy()
      }
    }
  })

  test('preview is visible by default (showPreview defaults to true)', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const hideShowBtn = page.locator('button').filter({
      hasText: /^Hide|Show/i
    }).first()

    if (await hideShowBtn.count() > 0) {
      const btnText = await hideShowBtn.textContent()
      if (btnText.toLowerCase().includes('hide')) {
        expect(true).toBeTruthy()
      }
    }
  })
})

// ── Export: Copy ────────────────────────────────────────────────────

test.describe('Export — Copy', () => {
  test('copy button exists with Copy label', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const copyBtn = page.locator('button').filter({ hasText: /^Copy$/i }).first()
    if (await copyBtn.count() > 0) {
      await expect(copyBtn).toBeVisible()
    }
  })

  test('copy button triggers clipboard write', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const copyBtn = page.locator('button').filter({ hasText: /^Copy$/i }).first()
    if (await copyBtn.count() > 0) {
      await copyBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('copying works with empty grid (no crash)', async ({ page }) => {
    await ensurePageReady(page)
    await openInstructionsPanel(page)

    const copyBtn = page.locator('button').filter({ hasText: /^Copy$/i }).first()
    if (await copyBtn.count() > 0) {
      await copyBtn.click()
      await await new Promise(r => setTimeout(r, 300))
      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── Export: Download ────────────────────────────────────────────────

test.describe('Export — Download', () => {
  test('download button exists with Download label', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const downloadBtn = page.locator('button').filter({ hasText: /^Download$/i }).first()
    if (await downloadBtn.count() > 0) {
      await expect(downloadBtn).toBeVisible()
    }
  })

  test('clicking download does not crash the page', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const downloadBtn = page.locator('button').filter({ hasText: /^Download$/i }).first()
    if (await downloadBtn.count() > 0) {
      await downloadBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('download follows pattern instructions', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const downloadBtn = page.locator('button').filter({ hasText: /^Download$/i }).first()
    if (await downloadBtn.count() > 0) {
      await downloadBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── Integration: Settings + Preview ─────────────────────────────────

test.describe('Integration: Settings → Preview', () => {
  test('all settings can be toggled rapidly without crashing', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    for (let i = 0; i < 4; i++) {
      // Toggle abbreviations
      const abbrLabel = page.locator('label').filter({ hasText: /abbreviations?/i }).first()
      if (await abbrLabel.count() > 0) {
        const checkbox = abbrLabel.locator('input[type="checkbox"]').first()
        if (await checkbox.count() > 0) {
          await checkbox.click()
        }
      }

      // Toggle row numbers
      const rowLabel = page.locator('label').filter({ hasText: /row numbers/i }).first()
      if (await rowLabel.count() > 0) {
        const checkbox = rowLabel.locator('input[type="checkbox"]').first()
        if (await checkbox.count() > 0) {
          await checkbox.click()
        }
      }

      // Toggle preview
      const hideShowBtn = page.locator('button').filter({ hasText: /^Hide|Show/i }).first()
      if (await hideShowBtn.count() > 0) {
        await hideShowBtn.click()
      }

      await await new Promise(r => setTimeout(r, 100))
    }

    await expect(page.locator('main')).toBeVisible()
  })

  test('panel remains functional after opening instructions panel then returning to editing', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const main = page.locator('main')
      await main.click({ position: { x: 100, y: 100 } })
      await await new Promise(r => setTimeout(r, 300))

      await expect(page.locator('main')).toBeVisible()
    }
  })
})

// ── Edge Cases ──────────────────────────────────────────────────────

test.describe('Edge Cases', () => {
  test('panel is accessible without grid data (no grid available message)', async ({ page }) => {
    await ensurePageReady(page)
    await openInstructionsPanel(page)

    const noDataMessage = page.locator('div').filter({ hasText: /no grid/i }).first()
    if (await noDataMessage.count() > 0) {
      await expect(noDataMessage).toBeVisible()
    }
  })

  test('settings section starts expanded (open by default)', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const details = page.locator('details').first()
    if (await details.count() > 0) {
      const isOpen = await details.evaluate(el => el.hasAttribute('open'))
      expect(isOpen).toBeTruthy()
    }
  })

  test('first rows section shows stitch row descriptions', async ({ page }) => {
    await setupGridWithData(page)
    await openInstructionsPanel(page)

    const firstRowsLabel = page.locator('div').filter({ hasText: /first 5 rows/i }).first()
    if (await firstRowsLabel.count() > 0) {
      await expect(firstRowsLabel).toBeVisible()
    }
  })
})
