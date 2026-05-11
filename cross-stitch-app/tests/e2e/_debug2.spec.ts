import { test, expect } from '../fixtures/base'

test('debug', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 3000))
  
  const jsErrors: string[] = []
  page.on('pageerror', err => jsErrors.push(err))
  
  const consoleErrors: string[] = []
  page.on('console', msg => {
    if (['error', 'warn'].includes(msg.type())) {
      consoleErrors.push(`${msg.type()}: ${msg.text()}`)
    }
  })
  
  const bodyText = await page.locator('body').textContent()
  const rootHTML = await page.locator('#root').innerHTML()
  const rootText = await page.locator('#root').textContent()
  const allText = await page.locator('body').textContent()
  
  // Count all elements
  const allElements = await page.locator('*').count()
  
  console.log(`JS errors: ${jsErrors.length > 0 ? jsErrors.join(' | ') : 'none'}`)
  console.log(`Console errors/warn: ${consoleErrors.length} - ${consoleErrors.slice(0,5).join('; ')}`)
  console.log(`Body text length: ${bodyText?.length || 0}`)
  console.log(`Root innerHTML length: ${rootHTML?.length || 0}`)
  console.log(`Root text: "${rootText?.substring(0,200) || 'empty'}"`)
  console.log(`Total elements on page: ${allElements}`)
  
  // Check if there's an error overlay
  const errorOverlay = page.locator('[class*="error"], [class*="Error"], [class*="ErrorBoundary"]')
  console.log(`Error overlays: ${await errorOverlay.count()}`)
  
  // Check vite overlay
  const viteOverlay = page.locator('[class*="vite-error"]')
  console.log(`Vite errors: ${await viteOverlay.count()}`)
  
  // Check for loading state
  const loading = page.locator('[class*="loading"]')
  console.log(`Loading states: ${await loading.count()}`)
  
  // List top-level children of body
  const bodyChildren = await page.locator('body > *').count()
  console.log(`Body children: ${bodyChildren}`)
  for (let i = 0; i < bodyChildren; i++) {
    const tag = await page.locator('body > *').nth(i).evaluate(el => el.tagName)
    const cls = await page.locator('body > *').nth(i).getAttribute('class')
    console.log(`  Child ${i}: <${tag.toLowerCase()}> class="${cls?.substring(0,100)}"`)
  }
  
  expect(true).toBe(true)
})
