# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/mirror-transforms.spec.ts >> Full-Grid Mirror — Vertical >> vertical mirror reverses row order (data-level)
- Location: tests/e2e/mirror-transforms.spec.ts:282:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5556/
Call log:
  - navigating to "http://localhost:5556/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1   | import { test as base, expect } from '@playwright/test'
  2   | 
  3   | /**
  4   |  * Base fixture with project setup helpers.
  5   |  * All helpers work with the actual component structure:
  6   |  * - Header has File/Export/Import/Share buttons
  7   |  * - Right panel has tabs: Project, Symbols, Import, Convert V1, Convert V2, Progress, etc.
  8   |  * - SettingsPanel has labeled inputs (Width, Height) + "Apply & Resize Canvas" button
  9   |  * - GridCanvas renders cells inside the main area
  10  |  */
  11  | export const test = base.extend<{
  12  |   /** Open the right panel tab by its visible label text */
  13  |   openPanelTab: (label: string) => Promise<void>
  14  |   /** Set canvas dimensions and apply */
  15  |   setupCanvas: (width: number, height: number) => Promise<void>
  16  |   /** Click a grid cell at row,col (0-indexed) */
  17  |   clickGridCell: (row: number, col: number) => Promise<void>
  18  |   /** Wait for the grid canvas area to appear */
  19  |   waitForGrid: () => Promise<void>
  20  |   /** Get the grid's visible dimension label (e.g. "40×30 stitches") */
  21  |   getGridDimensions: () => Promise<string>
  22  | }>({
  23  |   page: async ({ page }, use) => {
> 24  |     await page.goto('/')
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5556/
  25  |     await page.waitForSelector('header', { timeout: 10000 })
  26  |     // Wait for the main header buttons to be rendered (File, Import, Share, Export)
  27  |     await page.locator('button').filter({ hasText: 'File' }).first().waitFor({ state: 'visible', timeout: 10000 })
  28  |     await use(page)
  29  |   },
  30  | 
  31  |   openPanelTab: async ({ page }, use) => {
  32  |     await use(async (label: string) => {
  33  |       // The right panel tab bar is rendered only when activeRightPanel is set.
  34  |       // First ensure the right panel is open by checking for the close button.
  35  |       // If the panel is closed, click the "Panel" toggle button (opens to 'settings').
  36  |       const closeBtn = page.locator('button[title="Close panel"]')
  37  |       const panelOpen = await closeBtn.isVisible({ timeout: 300 }).catch(() => false)
  38  | 
  39  |       if (!panelOpen) {
  40  |         // Click "Panel" toggle in the header to open the right panel
  41  |         const panelToggle = page.locator('button').filter({ hasText: 'Panel' }).first()
  42  |         if (await panelToggle.count() > 0) {
  43  |           await panelToggle.click()
  44  |         }
  45  |         // Wait for the right panel tab bar to render
  46  |         await closeBtn.waitFor({ state: 'visible', timeout: 5000 })
  47  |       }
  48  | 
  49  |       // Now click the tab button within the right panel tab bar
  50  |       const tabBtn = page.locator('button').filter({ hasText: label }).first()
  51  |       if (await tabBtn.count() > 0) {
  52  |         await tabBtn.click()
  53  |         await page.waitForTimeout(300)
  54  |       }
  55  |     })
  56  |   },
  57  | 
  58  |   setupCanvas: async ({ page }, use) => {
  59  |     await use(async (width: number, height: number) => {
  60  |       // Open Project tab in right panel
  61  |       const tabBtn = page.locator('button').filter({ hasText: 'Project' }).first()
  62  |       if (await tabBtn.count() > 0) {
  63  |         await tabBtn.click()
  64  |         await page.waitForTimeout(300)
  65  |       }
  66  | 
  67  |       // Find width and height number inputs
  68  |       const widthLabel = page.locator('label').filter({ hasText: /^Width$/ }).first()
  69  |       const heightLabel = page.locator('label').filter({ hasText: /^Height$/ }).first()
  70  | 
  71  |       if (await widthLabel.count() > 0) {
  72  |         // The input is the sibling after the label
  73  |         const widthInput = widthLabel.locator('..').locator('input[type="number"]')
  74  |         const heightInput = heightLabel.locator('..').locator('input[type="number"]')
  75  |         await widthInput.clear()
  76  |         await widthInput.fill(String(width))
  77  |         await heightInput.clear()
  78  |         await heightInput.fill(String(height))
  79  |       }
  80  | 
  81  |       // Click Apply button
  82  |       const applyBtn = page.locator('button').filter({ hasText: 'Apply' }).first()
  83  |       if (await applyBtn.count() > 0) {
  84  |         await applyBtn.click()
  85  |       }
  86  | 
  87  |       await page.waitForTimeout(500)
  88  |     })
  89  |   },
  90  | 
  91  |   clickGridCell: async ({ page }, use) => {
  92  |     await use(async (row: number, col: number) => {
  93  |       // Grid cells might be DOM elements or canvas-based
  94  |       // Try DOM cells first
  95  |       const cells = page.locator('[class*="cell"], [class*="Cell"], .grid-cell')
  96  |       if (await cells.count() > 0) {
  97  |         const target = cells.nth(row * 40 + col) // approximate index
  98  |         await target.click()
  99  |       } else {
  100 |         // Canvas-based: find the canvas and compute position
  101 |         const canvas = page.locator('canvas').first()
  102 |         if (await canvas.count() > 0) {
  103 |           const box = await canvas.boundingBox()
  104 |           if (box) {
  105 |             // Get grid dimensions from the label
  106 |             const dimText = await page.locator('[class*="stitches"]').first().textContent().catch(() => '40x30')
  107 |             const match = dimText?.match(/(\d+)×(\d+)/)
  108 |             const gw = match ? parseInt(match[1]) : 40
  109 |             const gh = match ? parseInt(match[2]) : 30
  110 |             const cellW = box.width / gw
  111 |             const cellH = box.height / gh
  112 |             await page.mouse.click(box.x + col * cellW + cellW / 2, box.y + row * cellH + cellH / 2)
  113 |           }
  114 |         }
  115 |       }
  116 |     })
  117 |   },
  118 | 
  119 |   waitForGrid: async ({ page }, use) => {
  120 |     await page.waitForSelector('main', { state: 'visible', timeout: 10000 })
  121 |     await use()
  122 |   },
  123 | 
  124 |   getGridDimensions: async ({ page }, use) => {
```