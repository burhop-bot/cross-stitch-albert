import { test, expect } from '../fixtures/base'

test('prod build on 5558', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', err => errors.push(err))
  const msgs: string[] = []
  page.on('console', msg => {
    if (['error', 'warn'].includes(msg.type())) {
      msgs.push(`${msg.type()}: ${msg.text()}`)
    }
  })
  
  await page.goto('http://localhost:5558')
  await await new Promise(r => setTimeout(r, 5000))
  
  const result = await page.evaluate(() => {
    const root = document.getElementById('root')
    return {
      hasContent: root?.childElementCount > 0,
      rootHTML: root?.innerHTML?.substring(0, 500) || '(empty)',
      bodyContent: document.body.innerHTML.substring(0, 500),
    }
  })
  
  process.stdout.write(`Errors: ${errors.length > 0 ? errors.join(' | ') : 'none'}\n`)
  process.stdout.write(`Console msgs: ${msgs.length > 0 ? msgs.join('; ') : 'none'}\n`)
  process.stdout.write(`Result: ${JSON.stringify(result, null, 2)}\n`)
  
  expect(result.hasContent).toBe(true)
})
