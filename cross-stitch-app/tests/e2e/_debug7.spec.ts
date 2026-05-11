import { test, expect } from '../fixtures/base'

test('render test', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 4000))
  
  // Check rendering
  const result = await page.evaluate(() => {
    const root = document.getElementById('root')
    return {
      hasContent: root?.childElementCount > 0,
      rootChildren: root?.childElementCount || 0,
      rootHTML: root?.innerHTML?.substring(0, 300),
      headerExists: !!document.querySelector('header'),
      bodyText: document.body.textContent?.substring(0, 100),
    }
  })
  
  console.log('Render result:', JSON.stringify(result, null, 2))
  
  if (!result.hasContent) {
    // Try to find what's wrong
    const scriptSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
    })
    console.log('Script sources:', scriptSrcs)
    
    // Check if there's a CSP or similar issue
    const metaCSP = await page.evaluate(() => {
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      return csp ? csp.getAttribute('content') : 'none'
    })
    console.log('CSP:', metaCSP)
    
    // Try to execute a simple script to see if JS works
    const jsWorks = await page.evaluate(() => {
      try {
        document.getElementById('root')!.innerHTML = 'HELLO'
        return true
      } catch (e) {
        return false
      }
    })
    console.log('JS execution works:', jsWorks)
  }
  
  expect(result.hasContent).toBe(true)
})
