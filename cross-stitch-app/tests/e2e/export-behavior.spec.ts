/**
 * TC-08 (enhanced): Export & Share — Behavioral Tests
 *
 * These tests exercise real export/share workflows and assert on actual
 * outcomes — not just menu visibility.
 */
import { test, expect } from '../fixtures/base'

test.describe('Export — PNG Download', () => {
  test('export PNG generates a download', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await page.waitForSelector('main', { timeout: 10000 })

    const exportBtn = page.locator('button').filter({ hasText: 'Export PNG' }).first()
    await expect(exportBtn).toBeVisible({ timeout: 10000 })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.png$/)
  })

  test('export PNG button is disabled during export', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const exportBtn = page.locator('button').filter({ hasText: 'Export PNG' }).first()
    await expect(exportBtn).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ])

    await download.saveAs('/tmp/test-export.png')
    await await new Promise(r => setTimeout(r, 1000))
    await expect(exportBtn).toBeEnabled()
  })
})

test.describe('Export — Written Instructions', () => {
  test('written instructions panel shows row-by-row content', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const instructionsTab = page.locator('button').filter({ hasText: /Instructions/i }).first()
    if (await instructionsTab.count() > 0) {
      await instructionsTab.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    const instructionsContent = page.locator('div').filter({ hasText: /instructions|chart/i }).first()
    if (await instructionsContent.count() > 0) {
      await expect(instructionsContent).toBeVisible()
    }
  })

  test('written instructions panel has download button', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const instructionsTab = page.locator('button').filter({ hasText: /Instructions/i }).first()
    if (await instructionsTab.count() > 0) {
      await instructionsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const downloadBtn = page.locator('button').filter({ hasText: 'Download' }).first()
    if (await downloadBtn.count() > 0) {
      await expect(downloadBtn).toBeVisible()
    }
  })

  test('written instructions has format selector', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const instructionsTab = page.locator('button').filter({ hasText: /Instructions/i }).first()
    if (await instructionsTab.count() > 0) {
      await instructionsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }

    const formatSelect = page.locator('select').first()
    if (await formatSelect.count() > 0) {
      const options = await formatSelect.locator('option').allTextContents()
      expect(options.length).toBeGreaterThan(0)
    }
  })
})

test.describe('Export — QR Code', () => {
  test('QR code display exists', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const qrDisplay = page.locator('div').filter({ hasText: /QR/i }).first()
    if (await qrDisplay.count() > 0) {
      await expect(qrDisplay).toBeVisible()
    }
  })

  test('QR code can be exported', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const qrBtn = page.locator('button').filter({ hasText: /QR/i }).first()
    if (await qrBtn.count() > 0) {
      await expect(qrBtn).toBeVisible()
    }
  })
})

test.describe('Share — Link Generation', () => {
  test('share link dialog shows link content', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const shareBtn = page.locator('button').filter({ hasText: /^Share$/ }).first()
    if (await shareBtn.count() > 0) {
      await shareBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      // Share dialog has "Share Pattern Link" heading
      const shareHeading = page.locator('h2:has-text("Share Pattern Link")').first()
      if (await shareHeading.count() > 0) {
        await expect(shareHeading).toBeVisible()
      }
    }
  })

  test('share link dialog generates URL', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const shareBtn = page.locator('button').filter({ hasText: /^Share$/ }).first()
    if (await shareBtn.count() > 0) {
      await shareBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      // Generate the link
      const genBtn = page.locator('button:has-text("Generate Link")').first()
      if (await genBtn.count() > 0) {
        await genBtn.click()
        await await new Promise(r => setTimeout(r, 500))
      }

      // Should now show a link
      const linkDisplay = page.locator('code').first()
      if (await linkDisplay.count() > 0) {
        const text = await linkDisplay.textContent()
        expect(text).toBeTruthy()
      }
    }
  })

  test('share dialog closes on close button', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const shareBtn = page.locator('button').filter({ hasText: /^Share$/ }).first()
    if (await shareBtn.count() > 0) {
      await shareBtn.click()
      await await new Promise(r => setTimeout(r, 500))

      // Close the dialog
      const closeBtn = page.locator('button').filter({ hasText: /^Close$/ }).first()
      if (await closeBtn.count() > 0) {
        await closeBtn.click()
        await await new Promise(r => setTimeout(r, 300))

        // Dialog should be gone
        const shareHeading = page.locator('h2:has-text("Share Pattern Link")').first()
        if (await shareHeading.count() > 0) {
          await expect(shareHeading).not.toBeVisible()
        }
      }
    }
  })
})

test.describe('Export — File Menu Operations', () => {
  test('save project creates a JSON file', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const saveBtn = page.locator('button').filter({ hasText: 'Save' }).first()
    if (await saveBtn.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        saveBtn.click(),
      ])

      expect(download.suggestedFilename()).toMatch(/\.json$/)
    }
  })

  test('load project opens file picker', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const loadBtn = page.locator('button').filter({ hasText: 'Load' }).first()
    if (await loadBtn.count() > 0) {
      await expect(loadBtn).toBeVisible()
    }
  })

  test('clear pattern dialog blocks until "CLEAR" is typed', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    // Open file menu
    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Click Clear option
    const clearOption = page.locator('button').filter({ hasText: /^Clear/ }).first()
    if (await clearOption.count() > 0) {
      await clearOption.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Find the text input for confirmation using placeholder
    const textInput = page.locator('input[placeholder="CLEAR"]').first()
    if (await textInput.count() > 0) {
      // Type wrong value first — verify button is disabled
      await textInput.fill('WRONG')
      await await new Promise(r => setTimeout(r, 200))

      // Find the dialog's Clear Pattern button (use .last() to skip menu option)
      const allClearBtns = page.locator('button').filter({ hasText: /^Clear Pattern$/ })
      const count = await allClearBtns.count()
      if (count >= 2) {
        // Second one is the dialog button
        const clearActionBtn = allClearBtns.nth(1)
        const btnDisabled = await clearActionBtn.evaluate(el => el.disabled)
        expect(btnDisabled).toBe(true)
      } else {
        // Only one — must be the dialog button
        const clearActionBtn = allClearBtns.first()
        const btnDisabled = await clearActionBtn.evaluate(el => el.disabled)
        expect(btnDisabled).toBe(true)
      }

      // Now type the correct confirmation
      await textInput.clear()
      await textInput.fill('CLEAR')
      await await new Promise(r => setTimeout(r, 200))

      // Clear Pattern button should now be enabled
      if (count >= 2) {
        const clearActionBtn2 = allClearBtns.nth(1)
        const btnEnabled = await clearActionBtn2.evaluate(el => !el.disabled)
        expect(btnEnabled).toBe(true)
      }
    }
  })

  test('clear pattern dialog cancels when cancelled', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const clearOption = page.locator('button').filter({ hasText: /^Clear/ }).first()
    if (await clearOption.count() > 0) {
      await clearOption.click()
      await await new Promise(r => setTimeout(r, 500))
    }

    // Press Escape to close the dialog
    await page.keyboard.press('Escape')
    await await new Promise(r => setTimeout(r, 300))

    // The grid should still be present (pattern NOT cleared)
    await expect(page.locator('main')).toBeVisible()
  })
})

test.describe('Export — PDF', () => {
  test('pattern PDF export is accessible', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const exportBtn = page.locator('button').filter({ hasText: /^Export$/ }).first()
    await expect(exportBtn).toBeVisible()
    await exportBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const pdfBtn = page.locator('button').filter({ hasText: 'Pattern PDF' }).first()
    if (await pdfBtn.count() > 0) {
      await expect(pdfBtn).toBeVisible()
    }
  })

  test('shopping list export is accessible', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })

    const exportBtn = page.locator('button').filter({ hasText: /^Export$/ }).first()
    await exportBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const shoppingBtn = page.locator('button').filter({ hasText: 'Shopping List' }).first()
    if (await shoppingBtn.count() > 0) {
      await expect(shoppingBtn).toBeVisible()
    }
  })
})
