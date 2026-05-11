import { test, expect } from '../fixtures/base'

test('debug6', async ({ page }) => {
  
  // Intercept the main.tsx response to check for errors
  let mainContent = ''
  await page.route('**/main.tsx', async route => {
    const resp = await route.fetch()
    mainContent = await resp.text()
    await route.continue()
  })
  
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 4000))
  
  // Now try to trigger the error by calling createRoot manually
  const error = await page.evaluate(() => {
    try {
      // Check if there's an existing error
      return window.__lastError || null
    } catch (e) {
      return String(e)
    }
  })
  
  // Check what the actual error is from the page console
  const allConsole: string[] = []
  page.on('console', msg => {
    allConsole.push(`${msg.type()}: ${msg.text()}`)
  })
  
  // Force a re-render check
  const hasContent = await page.evaluate(() => {
    const root = document.getElementById('root')
    return {
      children: root?.childElementCount || 0,
      textContent: root?.textContent?.length || 0,
      innerHTML: root?.innerHTML?.length || 0,
      parentElement: root?.parentElement?.tagName,
    }
  })
  
  console.log('Console messages:', allConsole)
  console.log('Has content:', JSON.stringify(hasContent))
  
  // Check if main.tsx failed to execute - look for specific error indicators
  const scriptError = await page.evaluate(() => {
    // Check for common error markers
    const scripts = document.querySelectorAll('script[src]')
    const errors: string[] = []
    scripts.forEach(s => {
      if (s.src.includes('main.tsx') && !s.dataset.ready) {
        errors.push('main.tsx not marked ready')
      }
    })
    return errors
  })
  
  console.log('Script errors:', scriptError)
  
  expect(true).toBe(true)
})
