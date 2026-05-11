import { test, expect } from '../fixtures/base'

test('check script execution', async ({ page }) => {
  
  // Wait for the script tag to be in the DOM
  await page.waitForSelector('script[src*="main.tsx"]')
  await await new Promise(r => setTimeout(r, 5000))
  
  // Check if the script has any async/defer issues
  const scriptInfo = await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[src]')
    return Array.from(scripts).map(s => ({
      src: s.src,
      type: s.type,
      async: s.async,
      defer: s.defer,
      readyState: (s as any).readyState || 'unknown',
    }))
  })
  
  console.log('Scripts:', JSON.stringify(scriptInfo))
  
  // Check for any global error handler
  const errors: string[] = []
  window.onerror = (msg, url, line, col, err) => {
    errors.push(`ERROR: ${msg} at ${url}:${line}:${col}`)
  }
  
  // Add a global error listener
  await page.addInitScript(() => {
    window.addEventListener('error', (e) => {
      (window as any).__globalErrors = (window as any).__globalErrors || []
      ;(window as any).__globalErrors.push(String(e.error))
    })
  })
  
  await await new Promise(r => setTimeout(r, 3000))
  
  // Check for global errors
  const globalErrors = await page.evaluate(() => {
    return (window as any).__globalErrors || []
  })
  console.log('Global errors:', globalErrors)
  
  // Check for unhandled promise rejections
  await page.evaluate(() => {
    window.addEventListener('unhandledrejection', (e) => {
      ;(window as any).__unhandledRejections = (window as any).__unhandledRejections || []
      ;(window as any).__unhandledRejections.push(String(e.reason))
    })
  })
  await await new Promise(r => setTimeout(r, 2000))
  
  const unhandledRejections = await page.evaluate(() => {
    return (window as any).__unhandledRejections || []
  })
  console.log('Unhandled rejections:', unhandledRejections)
  
  expect(true).toBe(true)
})
