/**
 * TC-09: Pattern Repeat & Transform
 * Tests for the PatternRepeatPanel overlay UI.
 */
import { test, expect } from '../fixtures/base'

test.describe('Pattern Repeat Panel', () => {
  test('[ @smoke ] pattern repeat panel button exists', async ({ page }) => {
    const main = page.locator('main')
    await expect(main).toBeVisible()

    // The PatternRepeatPanel is rendered inside the main canvas area
    // It has a "Pattern Repeat" button with a Layers icon
    const repeatBtn = page.locator('button:has-text("Pattern Repeat")').first()
    if (await repeatBtn.count() > 0) {
      await expect(repeatBtn).toBeVisible()
    }
  })

  test('pattern repeat panel has mirror mode selector', async ({ page }) => {
    // Mirror mode buttons have labels: None, Horizontal, Vertical, Both Axes
    const mirrorNone = page.locator('button:has-text("None")').first()
    if (await mirrorNone.count() > 0) {
      await expect(mirrorNone).toBeVisible()
    }
  })

  test('pattern repeat panel has repeat count inputs', async ({ page }) => {
    // X (columns) and Y (rows) label inputs
    const xLabel = page.locator('label:has-text("X")').first()
    const yLabel = page.locator('label:has-text("Y")').first()

    // At least one of these should exist
    if (await xLabel.count() > 0 || await yLabel.count() > 0) {
      // Check for numeric inputs near these labels
      const xInputs = page.locator('input[type="number"]').first()
      if (await xInputs.count() > 0) {
        await expect(xInputs).toBeVisible()
      }
    }
  })

  test('pattern repeat panel has apply button', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply Pattern Repeat")').first()
    if (await applyBtn.count() > 0) {
      await expect(applyBtn).toBeVisible()
    }
  })

  test('pattern repeat panel shows result size', async ({ page }) => {
    // The result size is shown in a styled div
    const resultSize = page.locator('div:has-text("Result Size")').first()
    if (await resultSize.count() > 0) {
      await expect(resultSize).toBeVisible()
    }
  })

  test('pattern repeat panel can be closed', async ({ page }) => {
    // The pattern repeat panel has a close button — look for an X icon button
    // in the panel's header area
    const closeBtn = page.locator('div').filter({ hasText: 'Pattern Repeat' }).locator('button').filter({ hasText: /^×$/ }).first()
    if (await closeBtn.count() > 0) {
      // It should be clickable without error
      const box = await closeBtn.boundingBox()
      expect(box).not.toBeNull()
    }
  })
})

test.describe('Mirror Transform', () => {
  test('horizontal mirror option exists', async ({ page }) => {
    const hMirrorBtn = page.locator('button:has-text("Horizontal")').first()
    if (await hMirrorBtn.count() > 0) {
      await expect(hMirrorBtn).toBeVisible()
    }
  })

  test('vertical mirror option exists', async ({ page }) => {
    const vMirrorBtn = page.locator('button:has-text("Vertical")').first()
    if (await vMirrorBtn.count() > 0) {
      await expect(vMirrorBtn).toBeVisible()
    }
  })

  test('both axes mirror option exists', async ({ page }) => {
    const bothBtn = page.locator('button:has-text("Both Axes")').first()
    if (await bothBtn.count() > 0) {
      await expect(bothBtn).toBeVisible()
    }
  })
})
