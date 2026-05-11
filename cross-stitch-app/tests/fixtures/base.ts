import { test as base, expect } from '@playwright/test'

/**
 * Base fixture with project setup helpers.
 * All helpers work with the actual component structure:
 * - Header has File/Export/Import/Share buttons
 * - Right panel has tabs: Project, Symbols, Import, Convert V1, Convert V2, Progress, etc.
 * - SettingsPanel has labeled inputs (Width, Height) + "Apply & Resize Canvas" button
 * - GridCanvas renders cells inside the main area
 */
export const test = base.extend<{
  /** Open the right panel tab by its visible label text */
  openPanelTab: (label: string) => Promise<void>
  /** Set canvas dimensions and apply */
  setupCanvas: (width: number, height: number) => Promise<void>
  /** Click a grid cell at row,col (0-indexed) */
  clickGridCell: (row: number, col: number) => Promise<void>
  /** Wait for the grid canvas area to appear */
  waitForGrid: () => Promise<void>
  /** Get the grid's visible dimension label (e.g. "40×30 stitches") */
  getGridDimensions: () => Promise<string>
}>({
  page: async ({ page }, use) => {
    await page.goto('/')
    await page.waitForSelector('header', { timeout: 10000 })
    // Wait for the main header buttons to be rendered (File, Import, Share, Export)
    await page.locator('button').filter({ hasText: 'File' }).first().waitFor({ state: 'visible', timeout: 10000 })
    await use(page)
  },

  openPanelTab: async ({ page }, use) => {
    await use(async (label: string) => {
      // The right panel tab bar is rendered only when activeRightPanel is set.
      // First ensure the right panel is open by checking for the close button.
      // If the panel is closed, click the "Panel" toggle button (opens to 'settings').
      const closeBtn = page.locator('button[title="Close panel"]')
      const panelOpen = await closeBtn.isVisible({ timeout: 300 }).catch(() => false)

      if (!panelOpen) {
        // Click "Panel" toggle in the header to open the right panel
        const panelToggle = page.locator('button').filter({ hasText: 'Panel' }).first()
        if (await panelToggle.count() > 0) {
          await panelToggle.click()
        }
        // Wait for the right panel tab bar to render
        await closeBtn.waitFor({ state: 'visible', timeout: 5000 })
      }

      // Now click the tab button within the right panel tab bar
      const tabBtn = page.locator('button').filter({ hasText: label }).first()
      if (await tabBtn.count() > 0) {
        await tabBtn.click()
        await page.waitForTimeout(300)
      }
    })
  },

  setupCanvas: async ({ page }, use) => {
    await use(async (width: number, height: number) => {
      // Open Project tab in right panel
      const tabBtn = page.locator('button').filter({ hasText: 'Project' }).first()
      if (await tabBtn.count() > 0) {
        await tabBtn.click()
        await page.waitForTimeout(300)
      }

      // Find width and height number inputs
      const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
      const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()

      if (await widthLabel.count() > 0) {
        // The input is the sibling after the label
        const widthInput = widthLabel.locator('..').locator('input[type="number"]')
        const heightInput = heightLabel.locator('..').locator('input[type="number"]')
        await widthInput.clear()
        await widthInput.fill(String(width))
        await heightInput.clear()
        await heightInput.fill(String(height))
      }

      // Click Apply button
      const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
      if (await applyBtn.count() > 0) {
        await applyBtn.click()
      }

      await page.waitForTimeout(500)
    })
  },

  clickGridCell: async ({ page }, use) => {
    await use(async (row: number, col: number) => {
      // Grid cells might be DOM elements or canvas-based
      // Try DOM cells first
      const cells = page.locator('[class*="cell"], [class*="Cell"], .grid-cell')
      if (await cells.count() > 0) {
        const target = cells.nth(row * 40 + col) // approximate index
        await target.click()
      } else {
        // Canvas-based: find the canvas and compute position
        const canvas = page.locator('canvas').first()
        if (await canvas.count() > 0) {
          const box = await canvas.boundingBox()
          if (box) {
            // Get grid dimensions from the label
            const dimText = await page.locator('[class*="stitches"]').first().textContent().catch(() => '40x30')
            const match = dimText?.match(/(\d+)×(\d+)/)
            const gw = match ? parseInt(match[1]) : 40
            const gh = match ? parseInt(match[2]) : 30
            const cellW = box.width / gw
            const cellH = box.height / gh
            await page.mouse.click(box.x + col * cellW + cellW / 2, box.y + row * cellH + cellH / 2)
          }
        }
      }
    })
  },

  waitForGrid: async ({ page }, use) => {
    await page.waitForSelector('main', { state: 'visible', timeout: 10000 })
    await use()
  },

  getGridDimensions: async ({ page }, use) => {
    await use(async () => {
      return await page.locator('[class*="stitches"]').first().textContent().catch(() => '')
    })
  },
})

export { expect }
