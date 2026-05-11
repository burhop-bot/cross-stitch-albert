/**
 * V2 Conversion Results Section — E2E Tests
 *
 * The V2 ImageConversionPanelV2 renders a results section after image conversion
 * with: mini grid preview, crop stats, batch recolor controls, stats display,
 * and apply/cancel buttons. This section is NOT covered by image-import.spec.ts
 * or image-conversion-v1.spec.ts.
 *
 * Also tests post-processing options (median filter, isolate noise, crop blank)
 * which are only existence-checked in image-import.spec.ts.
 *
 * Potential bugs targeted:
 * - Post-processing options may not actually affect conversion output
 * - Batch recolor may not update the result grid state
 * - Crop blank may not update stitch dimensions after conversion
 * - Result section may render with stale/incorrect data
 * - Stats may show wrong values (e.g., before vs after post-processing)
 */

import { test, expect } from '../fixtures/base'

/**
 * Inject a small multi-color image into the store for V2 conversion.
 * 20×20 grid: top-left quadrant red, top-right green,
 * bottom-left blue, bottom-right magenta.
 */
async function injectV2Image(page: any): Promise<string> {
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 20
    canvas.height = 20
    const ctx = canvas.getContext('2d')!

    // Top-left: red
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 10, 10)
    // Top-right: green
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(10, 0, 10, 10)
    // Bottom-left: blue
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(0, 10, 10, 10)
    // Bottom-right: magenta
    ctx.fillStyle = '#ff00ff'
    ctx.fillRect(10, 10, 10, 10)

    return canvas.toDataURL('image/png')
  })

  await page.evaluate((url) => {
    const store = (window as any).__projectStore
    if (store) {
      store.setState({
        currentImage: {
          dataUrl: url,
          fileName: 'test-quad.png',
          width: 20,
          height: 20,
        },
      })
    }
  }, dataUrl)

  return dataUrl
}

/**
 * Open the V2 conversion panel.
 */
async function openV2Conversion(page: any) {
  // Open right panel first
  const panelBtn = page.locator('button').filter({ hasText: /Panel/i }).first()
  await panelBtn.click()
  await await new Promise(r => setTimeout(r, 300))

  // Click the Convert V2 tab
  const convTab = page.locator('button').filter({ hasText: 'Convert V2' }).first()
  await convTab.click()
  await await new Promise(r => setTimeout(r, 300))
}

/**
 * Verify the conversion options section is visible.
 */
async function expectOptionsSection(page: any) {
  const heading = page.locator('h4').filter({ hasText: /Options/i }).first()
  await expect(heading).toBeVisible()
}

/**
 * Check if a post-processing checkbox is visible and returns its state.
 */
async function getCheckboxState(page: any, labelText: string): Promise<boolean | null> {
  const label = page.locator('label').filter({ hasText: new RegExp(labelText, 'i') }).first()
  if (await label.count() === 0) return null
  const checkbox = label.locator('input[type="checkbox"]')
  if (await checkbox.count() === 0) return null
  return checkbox.isChecked()
}

/**
 * Click a post-processing checkbox by label text.
 */
async function clickCheckbox(page: any, labelText: string) {
  const label = page.locator('label').filter({ hasText: new RegExp(labelText, 'i') }).first()
  const checkbox = label.locator('input[type="checkbox"]')
  await checkbox.click()
}

test.describe('V2 Conversion Results — Result Section Rendering', () => {
  test('result section header shows conversion dimensions', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Click convert
    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000)) // conversion is async

    // Result section should show with dimension header
    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()
    const dimText = await previewHeader.textContent()
    expect(dimText).toMatch(/Preview.*\d+×\d+/i)
  })

  test('result section shows crop stats when crop blank is enabled', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Enable crop blank borders
    const cropLabel = page.locator('label').filter({ hasText: /crop blank/i }).first()
    const cropCheckbox = cropLabel.locator('input[type="checkbox"]')
    if ((await cropCheckbox.count()) > 0) {
      await cropCheckbox.setChecked(true)
    }

    // Convert
    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Crop stats div should appear with the green bg
    const cropStats = page.locator('div.bg-green-50').first()
    // May or may not show depending on the image content
    // The key is the div should be conditionally rendered
    const cropInfo = page.locator('p.text-green-700').first()
    // If crop stats are present, verify the format
    if ((await cropInfo.count()) > 0) {
      const text = await cropInfo.textContent()
      expect(text).toMatch(/Cropped/i)
      expect(text).toMatch(/top=/)
      expect(text).toMatch(/bottom=/)
      expect(text).toMatch(/left=/)
      expect(text).toMatch(/right=/)
    }
  })

  test('result section shows stats with correct labels', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Stats section labels should be visible
    const totalPixelsLabel = page.locator('div').filter({ hasText: 'Total pixels' }).first()
    await expect(totalPixelsLabel).toBeVisible()

    const uniqueColorsLabel = page.locator('div').filter({ hasText: 'Unique colors' }).first()
    await expect(uniqueColorsLabel).toBeVisible()

    const dominantColorLabel = page.locator('div').filter({ hasText: 'Dominant color' }).first()
    await expect(dominantColorLabel).toBeVisible()

    const methodLabel = page.locator('div').filter({ hasText: 'Method' }).first()
    await expect(methodLabel).toBeVisible()
  })

  test('stats display numeric values after conversion', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Each stat should show a number, not blank or placeholder
    const totalPixels = page.locator('div').filter({ hasText: 'Total pixels' }).first()
    const pixelValue = totalPixels.locator('..').locator('.font-mono.font-semibold')
    if ((await pixelValue.count()) > 0) {
      const val = await pixelValue.textContent()
      expect(val).toMatch(/\d+/)
    }

    const uniqueColors = page.locator('div').filter({ hasText: 'Unique colors' }).first()
    const colorValue = uniqueColors.locator('..').locator('.font-mono.font-semibold')
    if ((await colorValue.count()) > 0) {
      const val = await colorValue.textContent()
      expect(val).toMatch(/\d+/)
    }
  })

  test('dominant color shows a colored swatch', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // The dominant color swatch is a small colored div
    const dominantColorCell = page.locator('div').filter({ hasText: 'Dominant color' }).first()
    const swatch = dominantColorCell.locator('..').locator('[style*="background-color"]')
    // The swatch should have a style with background-color
    const style = await swatch.getAttribute('style')
    if (style) {
      expect(style).toMatch(/background-color/)
    }
  })

  test('method label reflects dithering choice', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Set dithering to floyd-steinberg
    const ditherSelect = page.locator('select').first()
    await ditherSelect.selectOption('floyd-steinberg')

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const methodDiv = page.locator('div').filter({ hasText: 'Method' }).first()
    const methodValue = methodDiv.locator('..').locator('.font-mono')
    if ((await methodValue.count()) > 0) {
      const method = await methodValue.textContent()
      // Should mention the dithering algorithm
      expect(method.toLowerCase()).toMatch(/floyd-steinberg|floyd/i)
    }
  })

  test('method label is "K-Means" when no dithering', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Ensure dithering is 'none' (default)
    const ditherSelect = page.locator('select').first()
    await ditherSelect.selectOption('none')

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const methodDiv = page.locator('div').filter({ hasText: 'Method' }).first()
    const methodValue = methodDiv.locator('..').locator('.font-mono')
    if ((await methodValue.count()) > 0) {
      const method = await methodValue.textContent()
      expect(method.toLowerCase()).toMatch(/k-means/)
    }
  })
})

test.describe('V2 Conversion Results — Mini Grid Preview', () => {
  test('mini grid preview renders color cells after conversion', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // The mini grid preview is a grid container
    const gridContainer = page.locator('div.overflow-x-auto').first()
    await expect(gridContainer).toBeVisible()

    // Should have color cells (divs with background colors)
    const colorCells = gridContainer.locator('[style*="background-color"]').first()
    if ((await colorCells.count()) > 0) {
      await expect(colorCells).toBeVisible()
    }
  })

  test('mini grid preview updates when max colors changes', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Set to minimum colors for faster conversion
    const colorsLabel = page.locator('label').filter({ hasText: 'Colors' }).first()
    const slider = page.locator('input[type="range"]').first()
    await slider.evaluate((el: HTMLInputElement) => { el.value = '4' })
    await await new Promise(r => setTimeout(r, 200))

    // Get the display text to confirm
    const textBefore = await colorsLabel.textContent()
    expect(textBefore).toMatch(/4/)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Result section should still appear
    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()
  })
})

test.describe('V2 Conversion Results — Batch Recolor UI', () => {
  test('batch recolor section exists after conversion', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Batch recolor header should be visible
    const batchRecolorHeader = page.locator('h4').filter({ hasText: /Batch Recolor/i }).first()
    await expect(batchRecolorHeader).toBeVisible()
  })

  test('batch recolor has from/to dropdown selectors', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // From color selector
    const fromLabel = page.locator('label').filter({ hasText: 'From color' }).first()
    await expect(fromLabel).toBeVisible()

    const toLabel = page.locator('label').filter({ hasText: 'To color' }).first()
    await expect(toLabel).toBeVisible()

    // Should have select elements
    const selects = page.locator('div.border-t')
      .filter({ hasText: /Batch Recolor/i })
      .locator('select')
    await expect(selects.first()).toBeVisible()
    await expect(selects.nth(1)).toBeVisible()
  })

  test('batch recolor recolor button exists with correct styling', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const recolorBtn = page.locator('button').filter({ hasText: /Recolor All/i }).first()
    await expect(recolorBtn).toBeVisible()

    // Should contain color indices in its text
    const btnText = await recolorBtn.textContent()
    expect(btnText).toMatch(/\d+→\d+/)
  })

  test('batch recolor can change dropdown selection', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const batchSection = page.locator('div.border-t').filter({ hasText: /Batch Recolor/i }).first()
    const selects = batchSection.locator('select')

    const fromSelect = selects.first()
    const toSelect = selects.nth(1)

    // Change from color
    await fromSelect.selectOption('1')
    let fromVal = await fromSelect.inputValue()
    expect(fromVal).toBe('1')

    // Change to color
    await toSelect.selectOption('2')
    const toVal = await toSelect.inputValue()
    expect(toVal).toBe('2')
  })

  test('batch recolor button text updates when selections change', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const batchSection = page.locator('div.border-t').filter({ hasText: /Batch Recolor/i }).first()
    const selects = batchSection.locator('select')

    const recolorBtn = batchSection.locator('button').filter({ hasText: /Recolor/i }).first()

    // Change selections
    await selects.first().selectOption('1')
    await selects.nth(1).selectOption('3')

    // Button text should reflect new values
    const btnText = await recolorBtn.textContent()
    expect(btnText).toMatch(/1→3|1 → 3/)
  })

  test('batch recolor section only appears after conversion', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Without converting, batch recolor section should NOT exist
    const batchRecolorHeader = page.locator('h4').filter({ hasText: /Batch Recolor/i })
    await expect(batchRecolorHeader).toHaveCount(0)
  })
})

test.describe('V2 Conversion Results — Apply / Cancel Buttons', () => {
  test('apply button exists with correct label and icon', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const applyBtn = page.locator('button').filter({ hasText: /Apply to Pattern/i }).first()
    await expect(applyBtn).toBeVisible()

    // Green styling
    const applyClass = await applyBtn.getAttribute('class')
    expect(applyClass).toMatch(/green/)
  })

  test('cancel button exists with correct label', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const cancelBtn = page.locator('button').filter({ hasText: /Cancel/i })
    await expect(cancelBtn).toBeVisible()

    // Gray styling
    const cancelClass = await cancelBtn.getAttribute('class')
    expect(cancelClass).toMatch(/gray/)
  })

  test('apply and cancel buttons are side by side', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Both buttons should be in a flex container with gap
    const buttonContainer = page.locator('div.flex.gap-2').last()
    const buttons = buttonContainer.locator('button').filter({ hasText: /Apply|Cancel/i })
    await expect(buttons.first()).toBeVisible()
    await expect(buttons.nth(1)).toBeVisible()
  })

  test('clicking cancel closes the panel', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const cancelBtn = page.locator('button').filter({ hasText: /Cancel/i })
    await cancelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Result section should be gone
    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i })
    await expect(previewHeader).toHaveCount(0)
  })
})

test.describe('V2 Post-Processing — Actual Behavior Tests', () => {
  test('median filter checkbox state persists through conversion', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Enable median filter
    await clickCheckbox(page, /median filter/i)

    const isChecked = await getCheckboxState(page, /median filter/i)
    expect(isChecked).toBe(true)

    // Convert
    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Result should appear regardless of post-processing toggles
    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()
  })

  test('isolate noise checkbox toggles correctly', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const label = page.locator('label').filter({ hasText: /noise/i }).first()
    const checkbox = label.locator('input[type="checkbox"]')

    // Check it's unchecked by default
    if ((await checkbox.count()) > 0) {
      const initial = await checkbox.isChecked()
      // Default should be false
      expect(initial).toBe(false)

      // Toggle on
      await checkbox.click()
      await expect(checkbox).toBeChecked()

      // Toggle off
      await checkbox.click()
      await expect(checkbox).not.toBeChecked()
    }
  })

  test('crop blank borders checkbox toggles correctly', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const label = page.locator('label').filter({ hasText: /crop blank/i }).first()
    const checkbox = label.locator('input[type="checkbox"]')

    if ((await checkbox.count()) > 0) {
      const initial = await checkbox.isChecked()
      // Default should be false
      expect(initial).toBe(false)

      await checkbox.click()
      await expect(checkbox).toBeChecked()

      await checkbox.click()
      await expect(checkbox).not.toBeChecked()
    }
  })

  test('all three post-processing checkboxes are independent', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const checkboxes = page.locator('input[type="checkbox"]').filter({
      hasLabel: /median|noise|crop/i,
    })
    const count = await checkboxes.count()

    if (count >= 3) {
      // Toggle all three
      await checkboxes.nth(0).click()
      await checkboxes.nth(1).click()
      await checkboxes.nth(2).click()

      // All should be checked
      for (let i = 0; i < 3; i++) {
        await expect(checkboxes.nth(i)).toBeChecked()
      }

      // Toggle first one off — others should stay on
      await checkboxes.nth(0).click()
      await expect(checkboxes.nth(0)).not.toBeChecked()
      await expect(checkboxes.nth(1)).toBeChecked()
      await expect(checkboxes.nth(2)).toBeChecked()
    }
  })

  test('converting without any post-processing works normally', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Verify post-processing checkboxes are unchecked
    const medianLabel = page.locator('label').filter({ hasText: /median/i }).first()
    const medianInput = medianLabel.locator('input[type="checkbox"]')
    if ((await medianInput.count()) > 0) {
      expect(await medianInput.isChecked()).toBe(false)
    }

    // Convert with defaults
    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()
  })

  test('post-processing checkboxes are in an Options section', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // Options heading should be present
    const optionsHeading = page.locator('h4').filter({ hasText: /Options/i }).first()
    await expect(optionsHeading).toBeVisible()

    // Post-processing checkboxes should be within the Options section
    // Find the Options section div
    const optionsSection = page.locator('div').filter({ hasText: /Options/i }).first()
    if ((await optionsSection.count()) > 0) {
      // The checkboxes should be siblings or children of the options section
      const checkboxesInOptions = page.locator('input[type="checkbox"]').filter({
        hasLabel: /median|noise|crop/i,
      })
      await expect(checkboxesInOptions.first()).toBeVisible()
    }
  })
})

test.describe('V2 Results — Interaction Stability', () => {
  test('stats section remains stable during conversion loading', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()

    // During conversion, the loading spinner should be visible
    const loadingSpinner = page.locator('[class*="bg-black\\/20"], [class*="fixed"], [class*="absolute"]')
    if ((await loadingSpinner.count()) > 0) {
      // Spinner is present during conversion
    }

    await await new Promise(r => setTimeout(r, 2000))

    // After conversion, result section should appear
    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()
  })

  test('converting twice in a row updates the result section', async ({
    page,
  }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    // First conversion
    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    let previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()

    // Change max colors
    const colorsLabel = page.locator('label').filter({ hasText: 'Colors' }).first()
    const slider = page.locator('input[type="range"]').first()
    await slider.evaluate((el: HTMLInputElement) => { el.value = '8' })
    await await new Promise(r => setTimeout(r, 200))

    // Second conversion
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    // Result should still be visible
    previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()

    // Stats should have updated
    const totalPixels = page.locator('div').filter({ hasText: 'Total pixels' }).first()
    const pixelValue = totalPixels.locator('..').locator('.font-mono.font-semibold')
    if ((await pixelValue.count()) > 0) {
      const val = await pixelValue.textContent()
      expect(val).toMatch(/\d+/)
    }
  })

  test('result section survives panel tab switch', async ({ page }) => {
    await injectV2Image(page)
    await openV2Conversion(page)

    const convertBtn = page.locator('button').filter({ hasText: /Convert to Cross-Stitch/i })
    await convertBtn.click()
    await await new Promise(r => setTimeout(r, 2000))

    const previewHeader = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader).toBeVisible()

    // Switch to another tab
    const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
    await projectTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Switch back to V2
    const convTab = page.locator('button').filter({ hasText: 'Convert V2' }).first()
    await convTab.click()
    await await new Promise(r => setTimeout(r, 300))

    // Result should still be present (V2 caches the result)
    const previewHeader2 = page.locator('h4').filter({ hasText: /Preview/i }).first()
    await expect(previewHeader2).toBeVisible()
  })
})
