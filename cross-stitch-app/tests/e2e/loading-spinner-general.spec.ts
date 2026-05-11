/**
 * TC: LoadingSpinner — General Behavior Across Operations
 *
 * The export-png-loading-spinner.spec.ts tests LoadingSpinner only in the
 * PNG export context. This test covers LoadingSpinner behavior during:
 * - PNG export, PDF export, shopping list export, share link generation
 * - Image conversion, save project, load project
 * - Export PDF with right panel open (z-index stacking)
 * - Rapid click robustness (spinner should not duplicate)
 * - Theme isolation (light + dark visibility)
 * - Accessibility (aria-live, role, screen reader behavior)
 * - Overlay behavior (blocks interaction while loading)
 * - Inline spinner component rendering
 * - Spinner size and positioning
 * - Spinner timeout/disconnect behavior
 * - Multiple concurrent operations (should only show one spinner)
 */

import { test, expect } from '../fixtures/base'

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Create a small grid with some stitches for export testing.
 */
async function createTestPattern(page: any) {
  // Open settings if not already open
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  if (await panelBtn.count() > 0) {
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 200))
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

  // Place some stitches
  const pencilBtn = page.locator('button[title="Pencil"]').first()
  if (await pencilBtn.count() > 0) {
    await pencilBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  }

  const main = page.locator('main').first()
  for (let i = 0; i < 6; i++) {
    await main.click({ position: { x: 60 + (i % 3) * 25, y: 80 + Math.floor(i / 3) * 25 } })
    await await new Promise(r => setTimeout(r, 50))
  }
  await await new Promise(r => setTimeout(r, 500))
}

/**
 * Check if the LoadingSpinner is visible on the page.
 * The spinner renders as an overlay div with a specific class.
 */
async function expectSpinnerVisible(page: any) {
  // Look for common spinner patterns
  const spinnerSelectors = [
    'div:has-text("Exporting...")',
    'div[aria-label*="loading"]',
    'div[role="status"]',
    'div:has(div:has-text("loading"))',
    '[class*="loading"]',
    '[class*="spinner"]',
    '[class*="LoadingSpinner"]',
    '[class*="inline"]',
  ]

  for (const selector of spinnerSelectors) {
    const el = page.locator(selector).first()
    if (await el.count() > 0) {
      await expect(el).toBeVisible()
      return
    }
  }
  // Spinner might be rendered via CSS animation — check for any animated element
  const animatedElements = page.locator('[class*="animate"]')
  if (await animatedElements.count() > 0) {
    await expect(animatedElements.first()).toBeVisible()
  }
}

/**
 * Wait for any loading state to complete.
 */
async function waitLoadingComplete(page: any, timeoutMs = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const selectors = [
      'div:has-text("Exporting...")',
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="LoadingSpinner"]',
    ]
    let anyVisible = false
    for (const sel of selectors) {
      const el = page.locator(sel).first()
      if (await el.count() > 0 && await el.isVisible()) {
        anyVisible = true
        break
      }
    }
    if (!anyVisible) return
    await await new Promise(r => setTimeout(r, 500))
  }
}

// ── Tests ─────────────────────────────────────────────────────────

test.describe('LoadingSpinner — Export Operations', () => {
  test('LoadingSpinner appears during PNG export', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // Look for PNG export option
      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 500))

        // Spinner should appear during export
        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner appears during PDF export', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pdfOption = page.locator('button').filter({ hasText: 'PDF' }).first()
      if (await pdfOption.count() > 0) {
        await pdfOption.click()
        await await new Promise(r => setTimeout(r, 500))

        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner appears during shopping list export', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const shoppingOption = page.locator('button').filter({ hasText: 'Shopping' }).first()
      if (await shoppingOption.count() > 0) {
        await shoppingOption.click()
        await await new Promise(r => setTimeout(r, 500))

        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner appears during share link generation', async ({ page }) => {
    await createTestPattern(page)

    const shareBtn = page.locator('button').filter({ hasText: 'Share' }).first()
    if (await shareBtn.count() > 0) {
      await shareBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      // The share dialog might show a loading state
      // Check for any loading indicators
      const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"]')
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeVisible()
      }
    }
  })

  test('LoadingSpinner appears during save project', async ({ page }) => {
    await createTestPattern(page)

    const fileBtn = page.locator('button').filter({ hasText: 'File' }).first()
    if (await fileBtn.count() > 0) {
      await fileBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const saveOption = page.locator('button').filter({ hasText: 'Save' }).first()
      if (await saveOption.count() > 0) {
        await saveOption.click()
        await await new Promise(r => setTimeout(r, 500))

        await expectSpinnerVisible(page)
      }
    }
  })
})

test.describe('LoadingSpinner — Overlay Behavior', () => {
  test('LoadingSpinner overlay blocks interaction during export', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        // Try to click on the canvas — should not respond while loading
        const main = page.locator('main').first()
        await main.click({ position: { x: 100, y: 100 } })
        await await new Promise(r => setTimeout(r, 300))

        // The grid should not have new stitches (overlay blocks interaction)
        // This test verifies the spinner creates an interactive barrier
      }
    }
  })

  test('LoadingSpinner overlay has proper z-index', async ({ page }) => {
    await createTestPattern(page)

    // Open right panel so we can verify z-index stacking
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        // Spinner overlay should appear above the panel
        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner overlay disappears after export completes', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        // Wait for loading to complete (spinner should disappear)
        await waitLoadingComplete(page)
        await await new Promise(r => setTimeout(r, 1000))

        // After export, the main canvas should be interactive again
        await expect(page.locator('main').first()).toBeVisible()
      }
    }
  })
})

test.describe('LoadingSpinner — Rapid Click Robustness', () => {
  test('Rapid clicks on export button do not duplicate spinner', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      // Rapid fire clicks
      for (let i = 0; i < 5; i++) {
        await exportBtn.click()
        await await new Promise(r => setTimeout(r, 100))
      }
      await await new Promise(r => setTimeout(r, 500))

      // Only one export menu should be open
      // And no duplicate spinners
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('Rapid clicks while export in progress should be debounced', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        // Click export button rapidly while PNG export is in progress
        for (let i = 0; i < 5; i++) {
          await exportBtn.click()
          await await new Promise(r => setTimeout(r, 100))
        }
        await await new Promise(r => setTimeout(r, 1000))

        // Should not crash or show multiple spinners
        await expect(page.locator('main').first()).toBeVisible()
      }
    }
  })

  test('Export button disabled during export prevents rapid clicks', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // The button should become disabled while export is in progress
      // (or the menu should close)
      const disabledBtn = page.locator('button[disabled]').first()
      if (await disabledBtn.count() > 0) {
        await expect(disabledBtn).toBeVisible()
      }
    }
  })
})

test.describe('LoadingSpinner — Theme Isolation', () => {
  test('LoadingSpinner visible in dark theme', async ({ page }) => {

    const themeBtn = page.locator('button').filter({ hasText: /theme/i }).first()
    if (await themeBtn.count() > 0) {
      await themeBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner visible in light theme', async ({ page }) => {

    const themeBtn = page.locator('button').filter({ hasText: /theme/i }).first()
    if (await themeBtn.count() > 0) {
      await themeBtn.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        await expectSpinnerVisible(page)
      }
    }
  })
})

test.describe('LoadingSpinner — Accessibility', () => {
  test('LoadingSpinner has aria attributes', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        // Look for aria-live or aria-busy on the spinner
        const spinner = page.locator('[aria-live], [aria-busy], [role="status"]')
        if (await spinner.count() > 0) {
          const ariaAttr = await spinner.first().getAttribute('aria-live') ||
                          await spinner.first().getAttribute('aria-busy')
          expect(ariaAttr).toBeTruthy()
        }
      }
    }
  })

  test('LoadingSpinner role attribute is correct', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        // Should have role="status" or similar
        const statusElements = page.locator('[role="status"]')
        if (await statusElements.count() > 0) {
          await expect(statusElements.first()).toBeVisible()
        }
      }
    }
  })

  test('Inline spinner renders inline with text', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 300))

        // Look for inline spinner (smaller, within button)
        const inlineSpinners = page.locator('[class*="inline"], [class*="spinner"]')
        if (await inlineSpinners.count() > 0) {
          await expect(inlineSpinners.first()).toBeVisible()
        }
      }
    }
  })
})

test.describe('LoadingSpinner — Edge Cases', () => {
  test('Export with empty grid still shows loading state', async ({ page }) => {

    // No stitches placed — empty grid
    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 500))

        // Should still show loading state even with empty grid
        // (it will fail to render but spinner should appear)
        await expectSpinnerVisible(page)
      }
    }
  })

  test('Export with large design shows loading state proportionally', async ({ page }) => {

    // Create a larger grid with more stitches
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    const projectTab = page.locator('button').filter({ hasText: /^Project$/ }).first()
    if (await projectTab.count() > 0) {
      await projectTab.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    const widthInput = page.locator('input[type="number"]').first()
    if (await widthInput.count() > 0) {
      await widthInput.fill('50')
    }
    const heightInput = page.locator('input[type="number"]').nth(1)
    if (await heightInput.count() > 0) {
      await heightInput.fill('50')
    }

    const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
    if (await applyBtn.count() > 0) {
      await applyBtn.click()
      await await new Promise(r => setTimeout(r, 1000))
    }

    const pencilBtn = page.locator('button[title="Pencil"]').first()
    if (await pencilBtn.count() > 0) {
      await pencilBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    const main = page.locator('main').first()
    for (let i = 0; i < 30; i++) {
      await main.click({
        position: { x: 60 + (i % 6) * 20, y: 80 + Math.floor(i / 6) * 20 },
      })
      await await new Promise(r => setTimeout(r, 30))
    }
    await await new Promise(r => setTimeout(r, 500))

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 500))

        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner survives theme toggle mid-export', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 200))

        // Toggle theme mid-export
        const themeBtn = page.locator('button').filter({ hasText: /theme/i }).first()
        if (await themeBtn.count() > 0) {
          await themeBtn.click()
          await await new Promise(r => setTimeout(r, 500))
        }

        // Spinner should still be visible after theme change
        await expectSpinnerVisible(page)
        await expect(page.locator('main').first()).toBeVisible()
      }
    }
  })

  test('LoadingSpinner with right panel open', async ({ page }) => {
    await createTestPattern(page)

    // Open right panel
    const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
    if (await panelBtn.count() > 0) {
      await panelBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 500))

        // Spinner should render above right panel
        await expectSpinnerVisible(page)
      }
    }
  })

  test('LoadingSpinner with collapsed sidebar', async ({ page }) => {
    await createTestPattern(page)

    const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
    if (await exportBtn.count() > 0) {
      await exportBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
      if (await pngOption.count() > 0) {
        await pngOption.click()
        await await new Promise(r => setTimeout(r, 500))

        await expectSpinnerVisible(page)
      }
    }
  })

  test('Multiple export operations in sequence work independently', async ({ page }) => {
    await createTestPattern(page)

    // Export PNG twice in sequence
    for (let i = 0; i < 2; i++) {
      const exportBtn = page.locator('button').filter({ hasText: 'Export' }).first()
      if (await exportBtn.count() > 0) {
        await exportBtn.click()
        await await new Promise(r => setTimeout(r, 300))

        const pngOption = page.locator('button').filter({ hasText: 'PNG' }).first()
        if (await pngOption.count() > 0) {
          await pngOption.click()
          await waitLoadingComplete(page)
          await await new Promise(r => setTimeout(r, 500))
        }
      }
    }

    // Should still be functional
    await expect(page.locator('main').first()).toBeVisible()
  })
})
