/**
 * TC-NEW: 3D Visualizer Dead Code — Pattern3D & Scene3D
 *
 * The 3D visualizer components exist in src/visualizer/ but are NEVER imported or
 * rendered in the app. This test documents the dead code by verifying:
 * 1. The Header "Toggle 3D View" button is NOT rendered (because App.tsx
 *    never passes the onToggle3D prop)
 * 2. No 3D canvas or Three.js overlay appears anywhere in the app
 * 3. The visualizer components have no visible effect on the grid
 * 4. Three.js is not loaded in the browser
 */
import { test, expect } from '../fixtures/base'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

test.describe('3D Visualizer Dead Code: Pattern3D & Scene3D', () => {
  test('[ @smoke ] Header does NOT have Toggle 3D View button', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await delay(500)

    // The 3D button should NOT be visible because App.tsx never passes onToggle3D
    const header3dBtn = page.locator('button').filter({ hasText: /3D View/i }).first()
    const count = await header3dBtn.count()
    expect(count).toBe(0, '3D View button should not be visible — onToggle3D not passed')
  })

  test('[ @smoke ] No WebGL contexts exist in the page', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await delay(300)

    const webglCanvasCount = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      let webglCount = 0
      canvases.forEach(canvas => {
        const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (ctx) webglCount++
      })
      return webglCount
    })
    expect(webglCanvasCount).toBe(0,
      'No WebGL contexts should exist since Pattern3D is never rendered')
  })

  test('Three.js module not loaded in browser', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await delay(300)

    const threeLoaded = await page.evaluate(() => {
      return typeof (window as any).THREE !== 'undefined'
    })
    expect(threeLoaded).toBe(false,
      'Three.js should not be loaded since Pattern3D is never rendered')
  })

  test('No three.js elements in DOM', async ({ page }) => {
    await delay(200)

    const has3DElements = await page.evaluate(() => {
      const allText = document.body.innerText
      return allText.includes('Three.js') || allText.includes('WebGL')
    })
    expect(has3DElements).toBe(false)
  })

  test('App has multiple header buttons (sanity check)', async ({ page }) => {
    await page.waitForSelector('header', { timeout: 10000 })
    await delay(300)

    const headerButtons = page.locator('header button')
    const count = await headerButtons.count()
    expect(count).toBeGreaterThan(5, 'Header should have multiple buttons')
  })
})
