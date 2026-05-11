import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:5556'
// Use available chromium binary
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1217/chrome-linux/chrome'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullTimeout: 120_000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,
  reporter: process.env.NO_HTML_REPORT ? [['list'], ['json', { outputFile: 'test-results.json' }]] : [
    ['list'],
    ['json', { outputFile: 'test-results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 3_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'smoke',
      grep: /@smoke/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: chromiumPath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--disable-gpu-compositing',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-hang-monitor',
            '--enable-automation',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
          ],
        },
      },
    },
    {
      name: 'full',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath: chromiumPath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer',
            '--disable-gpu-compositing',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-hang-monitor',
            '--enable-automation',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--metrics-recording-only',
          ],
        },
      },
    },
  ],
  // globalSetup: './tests/global-setup.ts',
})
