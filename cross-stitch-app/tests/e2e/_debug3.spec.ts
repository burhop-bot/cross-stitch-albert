import { test, expect } from '../fixtures/base'

test('debug3', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 3000))
  
  // List ALL elements with their tags and classes
  const allElements = await page.locator('*').all()
  console.log(`\n=== All ${allElements.length} elements ===`)
  for (const el of allElements) {
    const tag = await el.evaluate(e => e.tagName)
    const cls = await el.getAttribute('class') || ''
    const id = await el.getAttribute('id') || ''
    const text = (await el.textContent() || '').substring(0,50)
    console.log(`  <${tag.toLowerCase()}> id="${id}" class="${cls.substring(0,80)}" text="${text}"`)
  }
  
  // Check the body child div
  const bodyDiv = page.locator('body > div')
  const divHTML = await bodyDiv.first().innerHTML()
  console.log(`\n=== Body div innerHTML (first 500) ===\n${divHTML.substring(0,500)}`)
  
  expect(true).toBe(true)
})
