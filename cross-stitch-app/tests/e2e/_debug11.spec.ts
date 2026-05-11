import { test, expect } from '../fixtures/base'

test('production build test', async ({ page }) => {
  await page.goto('http://localhost:5556')
  await await new Promise(r => setTimeout(r, 5000))
  
  const root = await page.evaluate(() => {
    const el = document.getElementById('root')
    return {
      hasContent: el?.childElementCount > 0,
      html: el?.innerHTML?.substring(0, 300) || '(empty)',
      headerExists: !!document.querySelector('header'),
    }
  })
  
  console.log('Prod build result:', JSON.stringify(root))
  expect(root.hasContent).toBe(true)
})
