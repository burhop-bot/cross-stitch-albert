import { test, expect } from '../fixtures/base'

test('check script loading', async ({ page }) => {
  
  // Use all() instead of waitForSelector to get hidden elements
  const scripts = await page.locator('script').all()
  console.log(`Found ${scripts.length} scripts`)
  for (const s of scripts) {
    const src = await s.getAttribute('src')
    const type = await s.getAttribute('type')
    console.log(`  script: src="${src}", type="${type}"`)
  }
  
  // Wait longer and check if any content appears
  await await new Promise(r => setTimeout(r, 15000))
  
  const root = await page.locator('#root')
  const html = await root.innerHTML()
  console.log('Root innerHTML after 15s:', html?.substring(0, 300) || '(empty)')
  
  // Check if main.tsx loaded
  const mainLoaded = await page.evaluate(() => {
    const script = Array.from(document.querySelectorAll('script[src]'))
      .find(s => s.src.includes('main.tsx'))
    return {
      found: !!script,
      src: script?.src || 'none',
    }
  })
  console.log('Main script:', JSON.stringify(mainLoaded))
  
  // Check for any render output in the page
  const bodyContent = await page.evaluate(() => document.body.innerHTML.substring(0, 500))
  console.log('Body HTML:', bodyContent)
  
  // Check if the Vite client is working
  const viteClient = await page.evaluate(() => {
    const viteScript = Array.from(document.querySelectorAll('script[src]'))
      .find(s => s.src.includes('@vite/client'))
    return !!viteScript
  })
  console.log('Vite client loaded:', viteClient)
  
  expect(true).toBe(true)
})
