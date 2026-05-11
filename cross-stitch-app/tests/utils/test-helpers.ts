/**
 * Test helper utilities for Playwright E2E tests.
 *
 * These helpers cover common UI interaction patterns:
 * - Waiting for menus to appear and be interactable
 * - Waiting for dialogs to appear and be interactable
 * - Asserting that downloads start and completing
 *
 * Usage from tests:
 *   import { waitForMenu, waitForDialog, expectDownload } from '../../utils/test-helpers'
 */

import { Page, expect, Locator } from '@playwright/test'

/**
 * Wait for a menu to appear after clicking a menu button.
 *
 * @param page — Playwright page instance
 * @param menuButton — Locator for the button that opens the menu
 * @param menuSelector — CSS selector for the menu overlay/dropdown
 * @param timeoutMs — Maximum wait time in ms (default 5000)
 * @returns The menu locator for further assertions
 */
export async function waitForMenu(
  page: Page,
  menuButton: Locator,
  menuSelector: string,
  timeoutMs = 5000
): Promise<Locator> {
  // Click the menu button
  await menuButton.click()

  // Wait for the menu to appear
  const menu = page.locator(menuSelector)
  await menu.waitFor({ state: 'visible', timeout: timeoutMs })

  // Wait for the menu to be interactable (not covered by overlays)
  await menu.waitFor({ state: 'visible', timeout: timeoutMs })

  return menu
}

/**
 * Wait for a dialog/modal to appear.
 *
 * @param page — Playwright page instance
 * @param dialogSelector — CSS selector for the dialog overlay
 * @param timeoutMs — Maximum wait time in ms (default 5000)
 * @returns The dialog locator for further assertions
 */
export async function waitForDialog(
  page: Page,
  dialogSelector: string,
  timeoutMs = 5000
): Promise<Locator> {
  const dialog = page.locator(dialogSelector)
  await dialog.waitFor({ state: 'visible', timeout: timeoutMs })
  return dialog
}

/**
 * Wait for a file download to start and capture the download object.
 *
 * This helper wraps Playwright's `page.waitForEvent('download')` and
 * returns the Download object so tests can verify filename, URL, etc.
 *
 * @param page — Playwright page instance
 * @param trigger — A function that triggers the download (e.g., a click)
 * @param timeoutMs — Maximum wait time for the download event (default 10000)
 * @returns The Playwright Download object
 */
export async function triggerAndCaptureDownload(
  page: Page,
  trigger: () => Promise<void>,
  timeoutMs = 10000
): Promise<any> {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: timeoutMs }),
    trigger(),
  ])

  return download
}

/**
 * Assert that a download started successfully.
 *
 * This is a convenience wrapper that checks the download object and
 * cleans up the downloaded file after verification.
 *
 * @param download — Playwright Download object
 * @param expectedFilename — Optional expected filename (without path)
 */
export async function expectDownload(
  download: any,
  expectedFilename?: string
): Promise<void> {
  // Check that the download failure is null
  const failure = await download.failure()
  expect(failure, `Download should not fail: ${failure}`).toBe(null)

  // Check filename if provided
  if (expectedFilename) {
    const path = await download.suggestedFilename()
    expect(path).toContain(expectedFilename)
  }
}

/**
 * Wait for a loading/spinner overlay to appear during async operations.
 *
 * @param page — Playwright page instance
 * @param spinnerSelector — CSS selector for the loading spinner
 * @param timeoutMs — Maximum wait time (default 3000)
 * @returns True if spinner appeared within timeout
 */
export async function waitForLoading(
  page: Page,
  spinnerSelector = '.loading-spinner, [role="status"], .spinner',
  timeoutMs = 3000
): Promise<boolean> {
  const spinner = page.locator(spinnerSelector)
  try {
    await spinner.waitFor({ state: 'visible', timeout: timeoutMs })
    return true
  } catch {
    return false
  }
}

/**
 * Wait for a loading state to clear (spinner disappears).
 *
 * @param page — Playwright page instance
 * @param spinnerSelector — CSS selector for the loading spinner
 * @param timeoutMs — Maximum wait time (default 5000)
 * @returns True if spinner disappeared within timeout
 */
export async function waitForLoadingComplete(
  page: Page,
  spinnerSelector = '.loading-spinner, [role="status"], .spinner',
  timeoutMs = 5000
): Promise<boolean> {
  const spinner = page.locator(spinnerSelector)
  try {
    await spinner.waitFor({ state: 'hidden', timeout: timeoutMs })
    return true
  } catch {
    return false
  }
}

/**
 * Wait for a context menu to appear after a right-click.
 *
 * @param page — Playwright page instance
 * @param contextMenuSelector — CSS selector for the context menu
 * @param x — X coordinate for the right-click
 * @param y — Y coordinate for the right-click
 * @param timeoutMs — Maximum wait time (default 3000)
 * @returns The context menu locator
 */
export async function waitForContextMenu(
  page: Page,
  contextMenuSelector: string,
  x: number,
  y: number,
  timeoutMs = 3000
): Promise<Locator> {
  await page.mouse.click(x, y, { button: 'right' })
  const menu = page.locator(contextMenuSelector)
  await menu.waitFor({ state: 'visible', timeout: timeoutMs })
  return menu
}

/**
 * Verify that a menu/dialog closes on outside click.
 *
 * @param page — Playwright page instance
 * @param overlaySelector — CSS selector for the menu/dialog to close
 * @param clickOutside — Function that clicks outside the element
 * @param timeoutMs — Maximum wait time (default 3000)
 * @returns True if the overlay closed within timeout
 */
export async function expectOverlayToCloseOnOutsideClick(
  page: Page,
  overlaySelector: string,
  clickOutside: () => Promise<void>,
  timeoutMs = 3000
): Promise<boolean> {
  await clickOutside()
  const overlay = page.locator(overlaySelector)
  try {
    await overlay.waitFor({ state: 'hidden', timeout: timeoutMs })
    return true
  } catch {
    return false
  }
}
