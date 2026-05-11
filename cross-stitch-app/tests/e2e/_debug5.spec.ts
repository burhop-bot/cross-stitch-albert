import { test, expect } from '../fixtures/base'

test('debug5', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 4000))
  
  // Evaluate JS in the page context
  const result = await page.evaluate(() => {
    return {
      root: document.getElementById('root'),
      rootInnerHTML: document.getElementById('root')?.innerHTML?.substring(0, 200),
      rootTextContent: document.getElementById('root')?.textContent,
      bodyChildren: Array.from(document.body.children).map(el => ({
        tag: el.tagName,
        id: el.id,
        class: el.className,
        childNodes: el.childNodes.length,
      })),
      reactPresent: typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
      reactRootPresent: typeof (window as any).__reactRootContainer !== 'undefined',
      viteClientLoaded: typeof (window as any).__vite_plugin_react_preamble_installed__ !== 'undefined',
    }
  })
  
  console.log('Result:', JSON.stringify(result, null, 2))
  
  // Check for any React rendering
  const hasReactElements = await page.evaluate(() => {
    const root = document.getElementById('root')
    if (!root) return false
    // React creates comments like <!-- react-text --> etc
    const comments = Array.from(root.childNodes).filter(n => n.nodeType === Node.COMMENT_NODE)
    return comments.length > 0
  })
  console.log('Has React comments:', hasReactElements)
  
  // Get the page source to see if scripts are there
  const scriptTags = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => ({
      src: s.src,
      type: s.type,
      text: s.textContent?.substring(0, 100),
    }))
  })
  console.log('Script tags:', JSON.stringify(scriptTags, null, 2))
  
  expect(true).toBe(true)
})
