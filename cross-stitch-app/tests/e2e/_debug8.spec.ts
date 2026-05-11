import { test, expect } from '../fixtures/base'

test('render test with longer wait', async ({ page }) => {
  
  // Longer wait
  await await new Promise(r => setTimeout(r, 10000))
  
  // Check for any output from the page
  const pageConsole: string[] = []
  page.on('console', msg => {
    pageConsole.push(`${msg.type()}: ${msg.text()}`)
  })
  
  // Check the root
  const root = await page.evaluate(() => {
    const el = document.getElementById('root')
    return {
      html: el?.innerHTML?.substring(0, 500) || '(empty)',
      text: el?.textContent || '(empty)',
      children: el?.childElementCount || 0,
    }
  })
  
  console.log('Root:', JSON.stringify(root))
  console.log('Console output:', pageConsole)
  
  // Try to manually create a React root to see if it works
  const reactTest = await page.evaluate(() => {
    const rootEl = document.getElementById('root')
    try {
      // Try to check if ReactDOM is available
      const reactDom = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'react devtools' : 'no devtools'
      return reactDom
    } catch(e) {
      return String(e)
    }
  })
  console.log('React test:', reactTest)
  
  // Check the compiled main.tsx for errors
  const compiled = await page.evaluate(() => {
    // Check if there's an eval or inline script error
    const hasErrorElement = document.querySelector('[class*="error"], [class*="Error"]')
    return !!hasErrorElement
  })
  console.log('Has error element:', compiled)
  
  // List all elements on the page with their attributes
  const allTags = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      id: el.id,
      class: el.className?.toString()?.substring(0, 50),
      children: el.childElementCount,
    }))
  })
  console.log('All elements:', JSON.stringify(allTags))
  
  expect(true).toBe(true)
})
