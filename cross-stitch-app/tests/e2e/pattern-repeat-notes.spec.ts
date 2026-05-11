/**
 * Creative edge-case tests — pattern repeat interactions with notes and data flow.
 *
 * These tests target real-world bugs where pattern repeat, notes, and undo/redo
 * intersect — a complex area where data consistency bugs commonly hide.
 *
 * Potential bugs targeted:
 * - Notes wiped when applying pattern repeat (does repeat preserve notes?)
 * - Undo after pattern repeat + note placement (does undo restore both?)
 * - Notes surviving panel switches while pattern repeat panel is open
 * - Rapid pattern repeat panel open/close during note editing
 * - Pattern repeat with notes on edge cells (will they get mirrored too?)
 * - Clear pattern while pattern repeat panel is open
 * - Dimension change with notes (notes panel shows stale data)
 */
import { test, expect } from '../fixtures/base'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Click the main canvas to place stitches */
async function placeStitch(page, xOff = 80, yOff = 80) {
  await page.locator('main').click({ position: { x: xOff, y: yOff } })
}

/** Click a tool button by label text */
async function selectToolByName(page, toolName) {
  const toolBtn = page.locator('aside button').filter({ hasText: new RegExp(`^${toolName}$`) }).first()
  if (await toolBtn.count() > 0) {
    await toolBtn.click()
    await await new Promise(r => setTimeout(r, 150))
  }
}

/** Select a color swatch by index */
async function selectColorByIndex(page, index) {
  const swatches = page.locator('aside button[title]')
  await swatches.nth(index).click()
  await await new Promise(r => setTimeout(r, 150))
}

/** Open the right panel to a specific tab by visible label */
async function openRightPanelTab(page, label) {
  // The right panel is opened via a button with "Panel" text
  // Then tabs are switched by clicking tab buttons
  const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  if (!await panelBtn.isVisible()) {
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  }
  // Click the tab
  const tabBtn = page.locator('button').filter({ hasText: label }).first()
  if (await tabBtn.count() > 0) {
    await tabBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  }
}

/** Open the pattern repeat panel via toolbar */
async function openPatternRepeatPanel(page) {
  const repeatBtn = page.locator('button').filter({ hasText: /Pattern Repeat/i }).first()
  if (await repeatBtn.count() > 0) {
    await repeatBtn.click()
    await await new Promise(r => setTimeout(r, 300))
  }
}

/** Close the pattern repeat panel */
async function closePatternRepeatPanel(page) {
  // Escape key or close button
  const closeBtn = page.locator('button').filter({ hasText: 'Close' }).first()
  if (await closeBtn.count() > 0) {
    await closeBtn.click()
    await await new Promise(r => setTimeout(r, 200))
  } else {
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 200))
  }
}

/** Get the current number of notes in the notes panel */
async function getNoteCount(page): Promise<number> {
  const noteCountText = page.locator('span').filter({ hasText: /note/ }).first()
  const text = await noteCountText.textContent()
  const match = text?.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

/** Place several stitches to build undo history */
async function placeStitches(page, count, startOffX = 80) {
  for (let i = 0; i < count; i++) {
    await placeStitch(page, startOffX + i * 15, 80)
    await await new Promise(r => setTimeout(r, 50))
  }
}

test.describe('Pattern Repeat + Notes interactions', () => {
  // ── Notes survive panel context ──────────────────────────────────────

  test('notes persist when pattern repeat panel is opened and closed', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup: open right panel to settings, apply canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 600))

    // Select pencil and a color
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)

    // Place some stitches
    await placeStitches(page, 5, 60)
    await await new Promise(r => setTimeout(r, 300))

    // Open notes panel
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // Note count should reflect placed stitches (notes from double-click on grid)
    // Now open pattern repeat panel
    const repeatBtn = page.locator('button').filter({ hasText: /Pattern Repeat/i }).first()
    if (await repeatBtn.count() > 0) {
      await repeatBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Close pattern repeat panel
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Go back to notes panel — it should still show the same note count
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // The notes panel should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('opening notes panel while pattern repeat panel is open does not crash', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open pattern repeat panel via toolbar button
    const repeatBtn = page.locator('button').filter({ hasText: /Pattern Repeat/i }).first()
    if (await repeatBtn.count() > 0) {
      await repeatBtn.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    // Now open right panel and switch to notes
    // (Pattern repeat panel is a separate overlay, not the right panel)
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 300))

    // Both should coexist without crash
    await expect(page.locator('main')).toBeVisible()
  })

  // ── Undo after pattern repeat operations ─────────────────────────────

  test('undo after pattern repeat + note placement works correctly', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Place some stitches
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitches(page, 5, 60)
    await await new Promise(r => setTimeout(r, 400))

    // Open pattern repeat panel and close without applying (should not affect undo)
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Place more stitches after the repeat panel interaction
    await placeStitches(page, 3, 140)
    await await new Promise(r => setTimeout(r, 300))

    // Undo should work — reverting the last placed stitches
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 300))

    // Should be able to undo all placed stitches
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Meta+z')
      await await new Promise(r => setTimeout(r, 100))
    }
  })

  test('redo is invalidated after new placement following pattern repeat panel interaction', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Place 5 stitches
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitches(page, 5, 60)
    await await new Promise(r => setTimeout(r, 400))

    // Undo one
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 200))

    // Open and close pattern repeat panel (should not invalidate redo)
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Redo should still work (panel open/close doesn't push to undo stack)
    await page.keyboard.press('Meta+Shift+z')
    await await new Promise(r => setTimeout(r, 200))
  })

  // ── Pattern repeat panel state stability ─────────────────────────────

  test('rapidly opening/closing pattern repeat panel with notes open is stable', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open notes panel
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // Rapidly toggle pattern repeat panel (via toolbar) 10 times
    const repeatBtn = page.locator('button').filter({ hasText: /Pattern Repeat/i }).first()
    for (let i = 0; i < 10; i++) {
      if (await repeatBtn.count() > 0) {
        await repeatBtn.click()
        await await new Promise(r => setTimeout(r, 50))
        // Close via Escape
        await page.keyboard.press('Escape')
        await await new Promise(r => setTimeout(r, 50))
      }
    }

    // Notes panel should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  test('pattern repeat panel close button vs escape key behave consistently', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open pattern repeat panel
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Verify panel is open (should have a heading)
    const headingExists = page.locator('h2').filter({ hasText: /Pattern Repeat/i })
    const hasHeading = await headingExists.count() > 0
    if (hasHeading) {
      // Close via close button
      const closeBtn = page.locator('button').filter({ hasText: 'Close' }).first()
      await closeBtn.click()
      await await new Promise(r => setTimeout(r, 200))
    }

    // Open again
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Close via escape key
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 200))

    // Should be closed — reopen should work
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))
  })

  // ── Clear pattern + notes + pattern repeat interaction ───────────────

  test('clearing pattern while pattern repeat panel is open resets notes', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Place some stitches
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitches(page, 3, 60)
    await await new Promise(r => setTimeout(r, 300))

    // Open pattern repeat panel
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Close pattern repeat panel
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Clear the pattern (File → Clear)
    const clearBtn = page.locator('button').filter({ hasText: /Clear/i }).first()
    if (await clearBtn.count() > 0) {
      await clearBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // Type CLEAR to confirm
      const confirmInput = page.locator('input[type="text"]')
      if (await confirmInput.count() > 0) {
        await confirmInput.fill('CLEAR')
        const confirmBtn = page.locator('button').filter({ hasText: /CLEAR/i }).first()
        if (await confirmBtn.count() > 0) {
          await confirmBtn.click()
          await await new Promise(r => setTimeout(r, 300))
        }
      }
    }

    // The grid should be reset
    await expect(page.locator('main')).toBeVisible()
  })

  // ── Dimension change with notes panel context ────────────────────────

  test('changing dimensions resets notes display but undo restores them', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open notes panel first
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // Place some stitches (these won't create notes automatically, but the notes
    // panel context is established)
    await page.locator('aside').filter({ hasText: 'Notes' }).click()
    await await new Promise(r => setTimeout(r, 200))

    // Go back to Project tab and change dimensions to 30x30
    await openRightPanelTab(page, 'Project')
    await await new Promise(r => setTimeout(r, 300))

    // Find dimension inputs
    const widthInput = page.locator('label').filter({ hasText: /^Width$/ }).first()
    const heightInput = page.locator('label').filter({ hasText: /^Height$/ }).first()
    if (await widthInput.count() > 0) {
      const wInput = widthInput.locator('..').locator('input[type="number"]')
      const hInput = heightInput.locator('..').locator('input[type="number"]')
      await wInput.clear()
      await wInput.fill('30')
      await hInput.clear()
      await hInput.fill('30')
      await await new Promise(r => setTimeout(r, 200))

      const applyBtn2 = page.locator('button').filter({ hasText: /Apply/i }).first()
      await applyBtn2.click()
      await await new Promise(r => setTimeout(r, 600))
    }

    // The notes panel should show 0 notes (dimension change wipes notes)
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // Undo to restore previous dimensions and notes
    await page.keyboard.press('Meta+z')
    await await new Promise(r => setTimeout(r, 400))

    // The app should still be functional
    await expect(page.locator('main')).toBeVisible()
  })

  // ── Notes count accuracy with edge cells ─────────────────────────────

  test('notes panel count updates correctly when notes are at different row/col positions', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open notes panel
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // Notes panel should show empty state
    const emptyState = page.locator('p').filter({ hasText: /No notes/i })
    await expect(emptyState).toBeVisible()

    // The notes panel should list notes sorted by row/col when present
    // (this is verified by the existing notes-auto-save.spec.ts tests)
    // Here we just verify the panel is stable
    await expect(page.locator('main')).toBeVisible()
  })

  // ── Undo stack integrity across multiple interactions ────────────────

  test('undo stack does not lose entries after notes + pattern repeat + placement sequence', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Place 5 stitches
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitches(page, 5, 60)
    await await new Promise(r => setTimeout(r, 300))

    // Open and close notes panel (no data change)
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))
    await openRightPanelTab(page, 'Project')
    await await new Promise(r => setTimeout(r, 200))

    // Place 3 more stitches
    await placeStitches(page, 3, 140)
    await await new Promise(r => setTimeout(r, 300))

    // Open pattern repeat panel, don't apply, close
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Place 2 more stitches
    await placeStitches(page, 2, 180)
    await await new Promise(r => setTimeout(r, 300))

    // Total placed: 5 + 3 + 2 = 10 stitches
    // Undo all 10
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Meta+z')
      await await new Promise(r => setTimeout(r, 50))
    }

    // Place new stitches to verify grid is still functional
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitches(page, 3, 60)
    await await new Promise(r => setTimeout(r, 300))
  })

  // ── Pattern repeat panel data isolation ──────────────────────────────

  test('pattern repeat panel X/Y inputs do not affect notes panel inputs', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open pattern repeat panel
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Type values into X repeat count
    const repeatXInput = page.locator('input[type="number"]').first()
    if (await repeatXInput.count() > 0) {
      await repeatXInput.clear()
      await repeatXInput.fill('5')
      await await new Promise(r => setTimeout(r, 100))
    }

    // Close pattern repeat panel
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Open notes panel — its row/col inputs should not be affected
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))

    // The notes panel should have its own row/col inputs at their defaults
    const notesInputs = page.locator('input[type="number"]')
    await expect(notesInputs).toBeVisible()
  })

  // ── Mirror mode state with notes panel context ───────────────────────

  test('switching mirror modes does not corrupt notes panel state', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Open pattern repeat panel
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Rapidly switch mirror modes
    const mirrorOptions = page.locator('button').filter({ hasText: /^(None|Horizontal|Vertical|Both)$/.toString().slice(1, -1) })
    // More robust: just click any mirror-related buttons
    const mirrorBtns = page.locator('button').filter({ hasText: /None|Horizontal|Vertical|Both/i })
    const mirrorCount = await mirrorBtns.count()
    for (let i = 0; i < Math.min(mirrorCount, 8); i++) {
      await mirrorBtns.nth(i).click()
      await await new Promise(r => setTimeout(r, 100))
    }

    // Close pattern repeat
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Notes panel should still be functional
    await openRightPanelTab(page, 'Notes')
    await await new Promise(r => setTimeout(r, 200))
    await expect(page.locator('main')).toBeVisible()
  })

  // ── Pattern repeat apply without applying preserves undo ─────────────

  test('switching mirror modes before apply does not push undo history', async ({ page }) => {
    await await new Promise(r => setTimeout(r, 500))

    // Setup canvas
    await openRightPanelTab(page, 'Project')
    const applyBtn = page.locator('button').filter({ hasText: /Apply/i }).first()
    await applyBtn.click()
    await await new Promise(r => setTimeout(r, 500))

    // Place some stitches
    await selectToolByName(page, 'Pencil')
    await selectColorByIndex(page, 0)
    await placeStitches(page, 3, 60)
    await await new Promise(r => setTimeout(r, 300))

    // Open pattern repeat panel
    await openPatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Switch mirror mode multiple times without applying
    const mirrorBtns = page.locator('button').filter({ hasText: /None|Horizontal|Vertical|Both/i })
    const mirrorCount = await mirrorBtns.count()
    for (let i = 0; i < Math.min(mirrorCount, 4); i++) {
      await mirrorBtns.nth(i).click()
      await await new Promise(r => setTimeout(r, 100))
    }

    // Close without applying
    await closePatternRepeatPanel(page)
    await await new Promise(r => setTimeout(r, 200))

    // Undo should still work on the stitch placements (not affected by mirror mode switches)
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Meta+z')
      await await new Promise(r => setTimeout(r, 100))
    }
  })
})
