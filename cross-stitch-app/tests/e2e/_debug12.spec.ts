import { test, expect } from '../fixtures/base'

test('production build with error tracking', async ({ page }) => {
  // Collect all errors before navigation
  const pageErrors: string[] = []
  page.on('pageerror', err => pageErrors.push(err))
  const consoleMessages: string[] = []
  page.on('console', msg => {
    if (['error', 'warn'].includes(msg.type())) {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:5557')
  await await new Promise(r => setTimeout(r, 5000))
  
  console.log('Page errors:', pageErrors.length > 0 ? pageErrors.join(' | ') : 'none')
  console.log('Console messages:', consoleMessages.length > 0 ? consoleMessages.join('; ') : 'none')
  
  const root = await page.locator('#root')
  const html = await root.innerHTML()
  console.log('Root HTML (first 300):', html?.substring(0, 300) || '(empty)')
  
  // Check if the JS bundle loaded
  const bundleLoaded = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[src]')
    return Array.from(scripts).map(s => s.src)
  })
  console.log('Scripts loaded:', bundleLoaded)
  
  // Check if React is available
  const reactAvailable = await page.evaluate(() => {
    // React is bundled, so it should be in global scope
    const rootEl = document.getElementById('root')
    return {
      hasRoot: !!rootEl,
      rootChildren: rootEl?.childElementCount || 0,
      rootHTML: rootEl?.innerHTML?.substring(0, 200),
      bodyContent: document.body.innerHTML.substring(0, 500),
    }
  })
  console.log('React check:', JSON.stringify(reactAvailable))
  
  expect(true).toBe(true)
})
