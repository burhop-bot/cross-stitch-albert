import { chromium } from '@playwright/test'

const chromiumPath =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  '/opt/pw-browsers/chromium-1217/chrome-linux/chrome'

/**
 * Global setup: ensure Playwright browsers are installed.
 * The Vite preview server must be started manually before running tests.
 */
export default async function globalSetup() {
  const browser = await chromium.launch({
    executablePath: chromiumPath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
  await browser.close()
}
