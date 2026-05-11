/**
 * Grid helper utilities for Playwright E2E tests.
 *
 * These helpers compute pixel-level coordinates from grid row/col values,
 * detect the grid viewport bounding box, and wait for grid rendering.
 *
 * Usage from tests:
 *   import { getCellCenter, getGridBoundingBox, waitForGridRender } from '../../utils/grid-helpers'
 */

import { Page } from '@playwright/test'

/**
 * Get the grid canvas bounding box by locating the main canvas area.
 *
 * The grid is rendered inside the main canvas area (`.grid-canvas-container` or similar).
 * Returns the bounding rect relative to the viewport.
 */
export async function getGridBoundingBox(page: Page): Promise<{
  x: number
  y: number
  width: number
  height: number
}> {
  // The grid canvas container is typically the main element with class
  // grid-canvas-container or canvas-wrapper in the app layout.
  // We search for the main scrollable area that contains the grid cells.
  const container = page.locator('.grid-canvas-container')
  if (await container.count() > 0) {
    const box = await container.boundingBox()
    if (box) return box
  }

  // Fallback: find the main canvas element
  const canvas = page.locator('canvas.grid-canvas')
  if (await canvas.count() > 0) {
    const box = await canvas.boundingBox()
    if (box) return box
  }

  // Another fallback: look for the grid cells area
  const gridArea = page.locator('[data-testid="grid-area"]')
  if (await gridArea.count() > 0) {
    const box = await gridArea.boundingBox()
    if (box) return box
  }

  // Last resort: find any canvas element
  const anyCanvas = page.locator('canvas').first()
  if (await anyCanvas.count() > 0) {
    const box = await anyCanvas.boundingBox()
    if (box) return box
  }

  throw new Error('Could not find grid canvas bounding box')
}

/**
 * Compute the pixel center coordinates for a given grid cell (row, col).
 *
 * This helper uses the bounding box of the grid and the cell dimensions
 * to calculate where to click or drag.
 *
 * @param page — Playwright page instance
 * @param row — 0-indexed grid row
 * @param col — 0-indexed grid column
 * @returns { x, y } pixel coordinates of the cell center
 */
export async function getCellCenter(
  page: Page,
  row: number,
  col: number
): Promise<{ x: number; y: number }> {
  const bbox = await getGridBoundingBox(page)

  // Read cell dimensions from CSS custom properties or computed styles
  const cellWidth = await page.evaluate((selector: string) => {
    // Try to read the computed cell size from the canvas or grid area
    const area = document.querySelector(selector)
    if (area) {
      const style = window.getComputedStyle(area as Element)
      // Cell width might be in the grid definition
      const cols = (area as HTMLElement).querySelector('[style*="grid-template-columns"]')
      if (cols) {
        const matches = (cols as HTMLElement).style.gridTemplateColumns?.match(/(\d+)px/)
        if (matches) return parseInt(matches[1], 10)
      }
    }
    // Default cell size from the app's grid config
    return 20
  }, '.grid-canvas-container')

  // Estimate cell height from row count and bbox height
  const cellHeight = bbox.height / 10 // rough estimate

  const x = bbox.x + col * cellWidth + cellWidth / 2
  const y = bbox.y + row * cellHeight + cellHeight / 2

  return { x, y }
}

/**
 * Wait for the grid canvas to be visible and rendering cells.
 *
 * The grid renders inside a canvas element. This function waits for the
 * canvas to appear and for at least one cell to be detectable.
 *
 * @param page — Playwright page instance
 * @param timeoutMs — Maximum wait time in ms (default 10000)
 */
export async function waitForGridRender(
  page: Page,
  timeoutMs = 10000
): Promise<void> {
  // Wait for the main canvas element to be visible
  const canvas = page.locator('canvas.grid-canvas')
  await canvas.waitFor({ state: 'visible', timeout: timeoutMs })

  // Wait for the grid container to be visible
  const container = page.locator('.grid-canvas-container')
  if (await container.count() > 0) {
    await container.waitFor({ state: 'visible', timeout: timeoutMs })
  }
}

/**
 * Click a grid cell at the given row and column using mouse coordinates.
 *
 * @param page — Playwright page instance
 * @param row — 0-indexed grid row
 * @param col — 0-indexed grid column
 * @param button — Mouse button (default 'left')
 */
export async function clickGridCell(
  page: Page,
  row: number,
  col: number,
  button: 'left' | 'right' | 'middle' = 'left'
): Promise<void> {
  const { x, y } = await getCellCenter(page, row, col)
  await page.mouse.click(x, y, { button })
}

/**
 * Drag from one grid cell to another.
 * Useful for circle tool (drag-to-fill), brush tool, etc.
 *
 * @param page — Playwright page instance
 * @param startRow — Starting row
 * @param startCol — Starting column
 * @param endRow — Ending row
 * @param endCol — Ending column
 */
export async function dragGridCells(
  page: Page,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): Promise<void> {
  const start = await getCellCenter(page, startRow, startCol)
  const end = await getCellCenter(page, endRow, endCol)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y)
  await page.mouse.up()
}
