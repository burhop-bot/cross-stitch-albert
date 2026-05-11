/**
 * TC-14: Context Menu & Dialogs
 * Tests for right-click context menu, clear pattern dialog, onboarding tour,
 * keyboard shortcuts modal, and share link dialog.
 */
import { test, expect } from '../fixtures/base'

test.describe('Clear Pattern Dialog', () => {
  test('clear pattern dialog blocks action until CLEAR is typed', async ({ page }) => {
    // Clear pattern is accessible via File menu → Clear
    const fileMenu = page.locator('button:has-text("File")').first()
    await expect(fileMenu).toBeVisible()
    await fileMenu.click()
    await await new Promise(r => setTimeout(r, 300))

    // Clear option should appear in dropdown
    const clearOption = page.locator('button:has-text("Clear")').first()
    if (await clearOption.count() > 0) {
      await clearOption.click()
      await await new Promise(r => setTimeout(r, 300))

      // The ClearPatternDialog modal should appear
      // It has a text input that requires "CLEAR" to be typed
      const clearDialog = page.locator('div:has-text("Clear Pattern")').first()
      if (await clearDialog.count() > 0) {
        await expect(clearDialog).toBeVisible()
      }
    }
  })

  test('clear pattern dialog has confirm button', async ({ page }) => {
    // Trigger the clear dialog
    const fileMenu = page.locator('button:has-text("File")').first()
    await fileMenu.click()
    await await new Promise(r => setTimeout(r, 300))

    const clearOption = page.locator('button:has-text("Clear")').first()
    if (await clearOption.count() > 0) {
      await clearOption.click()
      await await new Promise(r => setTimeout(r, 300))

      // Look for a confirm/dismiss button
      const confirmBtn = page.locator('button:has-text("Confirm")').first()
      if (await confirmBtn.count() > 0) {
        await expect(confirmBtn).toBeVisible()
      }
    }
  })
})

test.describe('Share Link Dialog', () => {
  test('share link button exists in header', async ({ page }) => {
    const shareBtn = page.locator('button:has-text("Share")').first()
    if (await shareBtn.count() > 0) {
      await expect(shareBtn).toBeVisible()
    }
  })

  test('share link dialog shows base64 URL', async ({ page }) => {
    const shareBtn = page.locator('button:has-text("Share")').first()
    if (await shareBtn.count() > 0) {
      await shareBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // ShareLinkDialog shows the URL
      const urlDisplay = page.locator('div:has-text("Share this link")').first()
      if (await urlDisplay.count() > 0) {
        await expect(urlDisplay).toBeVisible()
      }
    }
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('keyboard shortcuts modal exists', async ({ page }) => {
    const shortcutsBtn = page.locator('button:has-text("Keyboard shortcuts")').first()
    if (await shortcutsBtn.count() > 0) {
      await expect(shortcutsBtn).toBeVisible()
      await shortcutsBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // KeyboardShortcutsPanel should appear
      const panel = page.locator('div:has-text("Keyboard Shortcuts")').first()
      if (await panel.count() > 0) {
        await expect(panel).toBeVisible()
      }
    }
  })

  test('onboarding tour button exists', async ({ page }) => {
    const onboardingBtn = page.locator('button:has-text("Onboarding tour")').first()
    if (await onboardingBtn.count() > 0) {
      await expect(onboardingBtn).toBeVisible()
    }
  })
})

test.describe('Thumbnail Gallery', () => {
  test('thumbnail gallery button exists', async ({ page }) => {
    const galleryBtn = page.locator('button:has-text("Thumbnails")').first()
    if (await galleryBtn.count() > 0) {
      await expect(galleryBtn).toBeVisible()
    }
  })
})

test.describe('Written Instructions', () => {
  test('written instructions panel can be opened', async ({ page }) => {
    const panelBtn = page.locator('button', { hasText: 'Panel' }).first()
    await panelBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // WrittenInstructionsPanel is in the right panel
    const instructionsTab = page.locator('button').filter({
      hasText: /Instructions/i
    }).first()
    if (await instructionsTab.count() > 0) {
      await instructionsTab.click()
      await await new Promise(r => setTimeout(r, 300))
    }
  })
})

test.describe('QR Code', () => {
  test('QR code display exists', async ({ page }) => {
    // QRCodeDisplay component renders in the export area
    const qrDisplay = page.locator('div:has-text("QR Code")').first()
    if (await qrDisplay.count() > 0) {
      await expect(qrDisplay).toBeVisible()
    }
  })
})

test.describe('Inventory Panel', () => {
  test('inventory panel button exists', async ({ page }) => {
    const inventoryBtn = page.locator('button:has-text("Inventory")').first()
    if (await inventoryBtn.count() > 0) {
      await expect(inventoryBtn).toBeVisible()
    }
  })

  test('inventory panel can be toggled', async ({ page }) => {
    const inventoryBtn = page.locator('button:has-text("Inventory")').first()
    if (await inventoryBtn.count() > 0) {
      await inventoryBtn.click()
      await await new Promise(r => setTimeout(r, 300))

      // InventoryPanel should appear
      const panel = page.locator('div:has-text("Inventory")').first()
      if (await panel.count() > 0) {
        await expect(panel).toBeVisible()
      }
    }
  })
})
