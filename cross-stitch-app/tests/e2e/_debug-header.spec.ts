import { test, expect } from '../fixtures/base'

test('header renders', async ({ page }) => {
  
  const errors: any[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(err.message))
  
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 3000))
  
  const header = page.locator('header')
  const count = await header.count()
  console.log(`Header elements found: ${count}`)
  
  const root = page.locator('#root')
  const rootContent = await root.textContent()
  console.log(`Root has header: ${await root.locator('header').count()}`)
  console.log(`Root content length: ${rootContent?.length || 0}`)
  console.log(`Errors: ${errors.length > 0 ? errors.join(' | ') : 'none'}`)
  
  // Check what's in the header tag
  const headerHTML = await header.locator('header').first().innerHTML()
  console.log(`First 200 chars of header innerHTML: ${headerHTML?.substring(0, 200) || 'empty'}`)
  
  await page.screenshot({ path: '/tmp/header-test.png', fullPage: true })
  expect(count).toBeGreaterThan(0)
})
