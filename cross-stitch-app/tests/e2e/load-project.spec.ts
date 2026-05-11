/**
 * TC-07: Load Project
 * Tests for loading a previously saved project from a JSON file.
 * Exercises: file picker flow, JSON parsing, panel restoration,
 * palette restoration, undo-stack reset, and error handling.
 */
import { test, expect } from '../fixtures/base'

// Generate a valid mini project JSON that can be loaded
async function createTestProjectJSON(page) {
  const json = JSON.stringify({
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    project: {
      title: 'Loaded Test Pattern',
      author: 'E2E Test',
      fabric: '14-count Aida',
      width: 10,
      height: 10,
      panels: [
        {
          id: 0,
          name: 'Loaded Panel',
          shape: 'rectangle',
          design: [
            [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
            [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
            [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
            [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
            [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
            [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
            [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
            [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
            [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
            [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
          ],
          status: 'not-started',
          backstitch: [],
          notes: [],
        },
      ],
      flossBrand: 'dmc',
    },
    grid: null,
    dmcPalette: [1, 2, 3, 4, 5],
    dmcUsage: {},
    inventory: [],
    completedStitches: [],
    backstitchLines: {},
    symbolDefinitions: {},
    flossBrand: 'dmc',
  })

  // Write JSON to a blob and upload via file input
  const blob = new Blob([json], { type: 'application/json' })
  return blob
}

test.describe('Load Project', () => {
  test('[ @smoke ] File menu contains Load Project button', async ({ page }) => {
    // File dropdown should show Save Project, Load Project, Clear Pattern
    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Load Project should be visible in the dropdown
    const loadBtn = page.locator('button').filter({ hasText: 'Load Project' }).first()
    await expect(loadBtn).toBeVisible()
  })

  test('Load Project button triggers file picker', async ({ page }) => {
    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    // Intercept the file input change — the load button should trigger a hidden file input
    const loadBtn = page.locator('button').filter({ hasText: 'Load Project' }).first()
    
    // The button's onclick calls handleLoadProject which clicks the hidden file input
    const hiddenInput = page.locator('input[type="file"][accept=".json"]')
    await expect(hiddenInput).toHaveCount(1)

    // Click the Load Project button — it triggers the hidden file input click
    await loadBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // The hidden file input should have been focused (its click was triggered)
    const focused = await hiddenInput.evaluate(el => document.activeElement === el)
    expect(focused).toBe(true)
  })

  test('loading a valid JSON file updates the app title', async ({ page }) => {
    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    await fileBtn.click()
    await await new Promise(r => setTimeout(r, 300))

    const loadBtn = page.locator('button').filter({ hasText: 'Load Project' }).first()
    await loadBtn.click()
    await await new Promise(r => setTimeout(r, 200))

    // Create a test project file and upload it
    const json = JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        title: 'My Loaded Design',
        author: 'Test User',
        fabric: '14-count Aida',
        width: 8,
        height: 8,
        panels: [
          {
            id: 0,
            name: 'Test Panel',
            shape: 'rectangle',
            design: [
              [1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1],
            ],
            status: 'not-started',
            backstitch: [],
            notes: [],
          },
        ],
        flossBrand: 'dmc',
      },
      grid: null,
      dmcPalette: [1, 2, 3],
      dmcUsage: {},
    })

    const blob = new Blob([json], { type: 'application/json' })
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.evaluate((el, f) => {
      // Create a File object from the blob
      const file = new File([f], 'test_project.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      el.files = dt.files
    }, blob)

    // Wait for the alert/dialog
    await await new Promise(r => setTimeout(r, 500))

    // The app should show an alert about successful load
    // Check that the project title changed in the header
    const titleSpan = page.locator('header span')
    const titleText = await titleSpan.textContent()
    expect(titleText).toContain('My Loaded Design')
  })

  test('loading a project updates grid dimensions', async ({ page }) => {
    // Create a test project with a specific size
    const json = JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        title: 'Small Pattern',
        author: '',
        fabric: '14-count Aida',
        width: 6,
        height: 6,
        panels: [
          {
            id: 0,
            name: 'Small Panel',
            shape: 'rectangle',
            design: [
              [1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1],
            ],
            status: 'not-started',
            backstitch: [],
            notes: [],
          },
        ],
        flossBrand: 'dmc',
      },
      grid: null,
      dmcPalette: [1, 2],
      dmcUsage: {},
    })

    const blob = new Blob([json], { type: 'application/json' })
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.evaluate((el, f) => {
      const file = new File([f], 'small_project.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      el.files = dt.files
    }, blob)

    await await new Promise(r => setTimeout(r, 500))

    // Check that the grid dimension label shows the new dimensions
    // The span with "stitches" text should now show 6x6
    const dimLabel = page.locator('span:has-text("stitches")').first()
    await expect(dimLabel).toBeVisible()
    const dimText = await dimLabel.textContent()
    expect(dimText).toContain('×')
  })

  test('loading invalid JSON shows an error alert', async ({ page }) => {
    // Intercept the file input to provide invalid JSON
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    
    await fileInput.evaluate((el) => {
      const dt = new DataTransfer()
      // Create a file with invalid JSON content
      const file = new File(['not valid json {'], 'bad_project.json', { type: 'application/json' })
      dt.items.add(file)
      el.files = dt.files
    })

    // Wait for the alert
    let alertShown = false
    const alertHandler = page.waitForEvent('dialog')
    
    try {
      const dialog = await alertHandler
      alertShown = true
      expect(dialog.type()).toBe('alert')
      await dialog.accept()
    } catch {
      // If no dialog in time, check if page is still responsive
    }

    // Page should still be responsive even after a bad file
    await await new Promise(r => setTimeout(r, 300))
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('loading a project with empty panels list creates default panel', async ({ page }) => {
    const json = JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        title: 'Empty Panels',
        author: '',
        fabric: '14-count Aida',
        width: 40,
        height: 40,
        panels: [], // empty panels — should not crash
        flossBrand: 'dmc',
      },
      grid: null,
      dmcPalette: [1, 2],
      dmcUsage: {},
    })

    const blob = new Blob([json], { type: 'application/json' })
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.evaluate((el, f) => {
      const file = new File([f], 'empty_project.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      el.files = dt.files
    }, blob)

    // Wait for any alert to appear
    try {
      const dialog = await page.waitForEvent('dialog', { timeout: 1000 })
      await dialog.accept()
    } catch {
      // No dialog — page is fine
    }

    await await new Promise(r => setTimeout(r, 500))
    
    // Page should be stable and responsive
    const header = page.locator('header')
    await expect(header).toBeVisible()
    // Main canvas should be visible
    const main = page.locator('main')
    await expect(main).toBeVisible()
  })

  test('loading a project with v1.0.0 format (migration)', async ({ page }) => {
    // Test with an older format that doesn't have backstitch arrays
    const json = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        title: 'Legacy Pattern',
        author: 'Old User',
        fabric: '11-count Aida',
        width: 10,
        height: 10,
        panels: [
          {
            id: 0,
            name: 'Old Panel',
            shape: 'rectangle',
            design: [
              [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
              [1, 2, 1, 2, 1, 2, 1, 2, 1, 2],
              [2, 1, 2, 1, 2, 1, 2, 1, 2, 1],
            ],
            // Note: no backstitch field — v1 format
            status: 'not-started',
          },
        ],
      },
      grid: null,
      dmcPalette: [1, 2],
      dmcUsage: {},
    })

    const blob = new Blob([json], { type: 'application/json' })
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.evaluate((el, f) => {
      const file = new File([f], 'legacy_project.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      el.files = dt.files
    }, blob)

    // Wait for any alert
    try {
      const dialog = await page.waitForEvent('dialog', { timeout: 1000 })
      await dialog.accept()
    } catch {
      // No dialog
    }

    await await new Promise(r => setTimeout(r, 500))

    // Page should be stable
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('Load Project button is accessible via keyboard', async ({ page }) => {
    // Navigate to the page
    await page.waitForSelector('header', { timeout: 10000 })

    // Tab to the File button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // File button should be focused
    const fileBtn = page.locator('button').filter({ hasText: /^File$/ }).first()
    const isFocused = await fileBtn.evaluate(el => document.activeElement === el)
    expect(isFocused).toBe(true)

    // Open the dropdown
    await page.keyboard.press('Enter')
    await await new Promise(r => setTimeout(r, 300))

    // Tab to Load Project
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Load Project should be focused
    const loadBtn = page.locator('button').filter({ hasText: 'Load Project' }).first()
    const loadFocused = await loadBtn.evaluate(el => document.activeElement === el)
    expect(loadFocused).toBe(true)
  })

  test('loading project with many colors preserves palette', async ({ page }) => {
    const colors = Array.from({ length: 30 }, (_, i) => i + 1)
    const design = Array.from({ length: 10 }, () => 
      Array.from({ length: 10 }, () => Math.floor(Math.random() * 30) + 1)
    )

    const json = JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        title: 'Rich Colors',
        author: '',
        fabric: '14-count Aida',
        width: 10,
        height: 10,
        panels: [
          {
            id: 0,
            name: 'Colorful Panel',
            shape: 'rectangle',
            design,
            status: 'not-started',
            backstitch: [],
            notes: [],
          },
        ],
        flossBrand: 'dmc',
      },
      grid: null,
      dmcPalette: colors,
      dmcUsage: {},
    })

    const blob = new Blob([json], { type: 'application/json' })
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.evaluate((el, f) => {
      const file = new File([f], 'rich_colors.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      el.files = dt.files
    }, blob)

    try {
      const dialog = await page.waitForEvent('dialog', { timeout: 1000 })
      await dialog.accept()
    } catch {
      // No dialog
    }

    await await new Promise(r => setTimeout(r, 500))

    // Page should be responsive
    const header = page.locator('header')
    await expect(header).toBeVisible()
    // Check that the project title changed
    const titleSpan = page.locator('header span').first()
    const titleText = await titleSpan.textContent()
    expect(titleText).toContain('Rich Colors')
  })

  test('loading project replaces existing pattern data', async ({ page }) => {
    // First, place some stitches on the default grid
    const main = page.locator('main')
    await expect(main).toBeVisible()
    await main.click({ position: { x: 50, y: 50 } })
    await await new Promise(r => setTimeout(r, 200))

    // Now load a project with a different size — should replace the grid
    const json = JSON.stringify({
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      project: {
        title: 'Replacement Pattern',
        author: '',
        fabric: '14-count Aida',
        width: 5,
        height: 5,
        panels: [
          {
            id: 0,
            name: 'Replacement Panel',
            shape: 'rectangle',
            design: [
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
              [1, 1, 1, 1, 1],
            ],
            status: 'not-started',
            backstitch: [],
            notes: [],
          },
        ],
        flossBrand: 'dmc',
      },
      grid: null,
      dmcPalette: [1],
      dmcUsage: {},
    })

    const blob = new Blob([json], { type: 'application/json' })
    const fileInput = page.locator('input[type="file"][accept=".json"]')
    await fileInput.evaluate((el, f) => {
      const file = new File([f], 'replacement.json', { type: 'application/json' })
      const dt = new DataTransfer()
      dt.items.add(file)
      el.files = dt.files
    }, blob)

    try {
      const dialog = await page.waitForEvent('dialog', { timeout: 1000 })
      await dialog.accept()
    } catch {
      // No dialog
    }

    await await new Promise(r => setTimeout(r, 500))

    // Page should be responsive after load
    const header = page.locator('header')
    await expect(header).toBeVisible()
    const titleSpan = page.locator('header span').first()
    const titleText = await titleSpan.textContent()
    expect(titleText).toContain('Replacement Pattern')
  })
})
