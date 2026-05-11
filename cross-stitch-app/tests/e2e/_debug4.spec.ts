import { test, expect } from '../fixtures/base'

test('debug4', async ({ page }) => {
  
  const failedLoads: string[] = []
  page.on('response', async resp => {
    if (resp.status() >= 400) {
      failedLoads.push(`${resp.status()} ${resp.url()}`)
    }
  })
  
  await page.waitForLoadState('networkidle')
  await await new Promise(r => setTimeout(r, 2000))
  
  console.log(`Failed loads: ${failedLoads.length}`)
  for (const f of failedLoads.slice(0,20)) {
    console.log(`  ${f}`)
  }
  
  // Check if /src/main.tsx loaded
  const mainResp = page.waitForResponse(r => r.url().includes('main.tsx') && r.status() === 200, { timeout: 3000 }).catch(() => null)
  
  expect(true).toBe(true)
})
