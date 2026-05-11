# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/color-history-panel.spec.ts >> Color History Panel >> oldest entry is evicted when history exceeds 20
- Location: tests/e2e/color-history-panel.spec.ts:332:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.textContent: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('aside button.aspect-square.rounded-lg').nth(21)

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - heading "Cross-Stitch Studio" [level=1] [ref=e6]
      - generic [ref=e7]: New Pattern
    - generic [ref=e8]:
      - button "File" [ref=e10]:
        - img [ref=e11]
        - text: File
      - button "Import Image" [ref=e15]:
        - img [ref=e16]
        - text: Import Image
      - button "Switch to dark mode" [ref=e19]:
        - img [ref=e20]
      - button "Toggle right panel" [ref=e22]:
        - img [ref=e23]
        - text: Panel
      - button "Undo" [disabled] [ref=e25]:
        - img [ref=e26]
      - button "Redo" [disabled] [ref=e29]:
        - img [ref=e30]
      - button "Show keyboard shortcuts" [ref=e33]:
        - img [ref=e34]
      - button "Start onboarding tour" [ref=e36]: 🧵 Tour
      - button "Show thumbnail gallery" [ref=e37]:
        - img [ref=e38]
      - button "Share pattern link" [ref=e42]:
        - img [ref=e43]
        - text: Share
      - button "🖼️ Export PNG" [ref=e49]:
        - generic [ref=e50]: 🖼️
        - generic [ref=e51]: Export PNG
      - button "Export" [ref=e53]:
        - img [ref=e54]
        - text: Export
  - generic [ref=e57]:
    - complementary "Color and tool sidebar" [ref=e58]:
      - complementary [ref=e59]:
        - generic [ref=e60]:
          - button "Tools" [ref=e61]:
            - img [ref=e62]
            - text: Tools
          - button "Colors" [ref=e65]:
            - img [ref=e66]
            - text: Colors
        - generic [ref=e72]:
          - generic [ref=e73]:
            - heading "Backstitch" [level=3] [ref=e74]
            - button [ref=e75]:
              - img [ref=e76]
          - button "Backstitch Tool" [ref=e78]:
            - img [ref=e79]
            - generic [ref=e84]: Backstitch Tool
        - generic [ref=e85]:
          - heading "Drawing Tools" [level=3] [ref=e86]
          - generic [ref=e87]:
            - button "Pencil" [ref=e88]:
              - img [ref=e89]
            - button "Eraser" [ref=e92]:
              - img [ref=e93]
            - button "Fill" [ref=e96]:
              - img [ref=e97]
          - generic [ref=e101]:
            - button "Symbols" [ref=e102]:
              - img [ref=e103]
              - generic [ref=e108]: Symbols
            - button "Toggle grid lines" [ref=e109]:
              - img [ref=e110]
        - generic [ref=e113]:
          - generic [ref=e114]:
            - generic [ref=e115]:
              - img [ref=e116]
              - text: Stitch Counter
            - button "Reset counter" [ref=e120]:
              - img [ref=e121]
          - generic [ref=e124]:
            - generic [ref=e125]: "0"
            - generic [ref=e126]: of 1,600 stitches (0%)
          - generic [ref=e127]:
            - button "Decrement (-1)" [ref=e128]:
              - img [ref=e129]
            - button "+1" [ref=e130]:
              - img [ref=e131]
              - generic [ref=e132]: "+1"
        - generic [ref=e133]:
          - heading "Zoom" [level=3] [ref=e134]
          - generic [ref=e135]:
            - button "−" [ref=e136]
            - generic [ref=e137]: 100%
            - button "+" [ref=e138]
            - button "Fit" [ref=e139]
        - generic [ref=e141] [cursor=pointer]:
          - checkbox "Alternating cells (counting aid)" [checked] [ref=e142]
          - text: Alternating cells (counting aid)
        - generic [ref=e144]:
          - heading "Edit Colors" [level=3] [ref=e145]
          - button "Swap two colors" [ref=e146]:
            - img [ref=e147]
        - generic [ref=e150]:
          - generic [ref=e152]:
            - heading "Colors" [level=3] [ref=e153]
            - button "Select DMC brand" [ref=e154]: DMC
          - generic [ref=e155]:
            - generic [ref=e156]:
              - button "1" [ref=e157]:
                - generic: "1"
              - button "15" [ref=e158]:
                - generic: "15"
              - button "16" [ref=e159]:
                - generic: "16"
              - button "20" [ref=e160]:
                - generic: "20"
              - button "21" [ref=e161]:
                - generic: "21"
              - button "30" [ref=e162]:
                - generic: "30"
              - button "32" [ref=e163]:
                - generic: "32"
              - button "4" [ref=e164]:
                - generic: "4"
              - button "5" [ref=e165]:
                - generic: "5"
              - button "7" [ref=e166]:
                - generic: "7"
              - button "8" [ref=e167]:
                - generic: "8"
              - button "9" [ref=e168]:
                - generic: "9"
              - button "10" [ref=e169]:
                - generic: "10"
              - button "11" [ref=e170]:
                - generic: "11"
              - button "12" [ref=e171]:
                - generic: "12"
              - button "13" [ref=e172]:
                - generic: "13"
              - button "14" [ref=e173]:
                - generic: "14"
              - button "17" [ref=e174]:
                - generic: "17"
              - button "18" [ref=e175]:
                - generic: "18"
              - button "19" [ref=e176]:
                - generic: "19"
              - button "22" [active] [ref=e177]:
                - generic: "22"
              - button "23" [ref=e178]:
                - generic: "23"
              - button "24" [ref=e179]:
                - generic: "24"
              - button "25" [ref=e180]:
                - generic: "25"
              - button "26" [ref=e181]:
                - generic: "26"
              - button "27" [ref=e182]:
                - generic: "27"
              - button "28" [ref=e183]:
                - generic: "28"
              - button "29" [ref=e184]:
                - generic: "29"
              - button "33" [ref=e185]:
                - generic: "33"
            - generic [ref=e189]:
              - generic [ref=e190]: DMC 22
              - generic [ref=e191]: Coral Red
    - main [ref=e193]:
      - generic [ref=e194]:
        - generic [ref=e195]: Panel 1
        - generic [ref=e196]: 40×40 stitches
      - generic [ref=e197]:
        - generic [ref=e198]:
          - generic [ref=e199]:
            - button "Pencil" [ref=e200]:
              - img [ref=e201]
            - button "Eraser" [ref=e204]:
              - img [ref=e205]
            - button "Fill" [ref=e208]:
              - img [ref=e209]
          - generic [ref=e213]:
            - button "Line (click start, click end)" [ref=e214]:
              - img [ref=e215]
            - button "Erase Line (click start, click end to clear cells along path)" [ref=e216]:
              - img [ref=e217]
            - button "Rectangle (drag to fill)" [ref=e220]:
              - img [ref=e221]
            - button "Circle (drag to fill)" [ref=e223]:
              - img [ref=e224]
            - button "Brush (drag to paint)" [ref=e226]:
              - img [ref=e227]
            - button "Dropper (click cell to pick color)" [ref=e230]:
              - img [ref=e231]
            - button "Select (drag to select)" [ref=e234]:
              - img [ref=e235]
            - button "Semi-Cross (click cell to set diagonal/half stitch)" [ref=e240]:
              - img [ref=e241]
          - generic [ref=e244]:
            - button "Mirror full pattern horizontally" [ref=e245]:
              - img [ref=e246]
            - button "Mirror full pattern vertically" [ref=e249]:
              - img [ref=e250]
            - button "Mirror selected region horizontally" [disabled] [ref=e253]:
              - img [ref=e254]
            - button "Mirror selected region vertically" [disabled] [ref=e257]:
              - img [ref=e258]
            - button "Copy selection" [disabled] [ref=e261]:
              - img [ref=e262]
            - button "Paste from clipboard" [disabled] [ref=e265]:
              - img [ref=e266]
          - button "Notes & Annotations" [ref=e272]:
            - img [ref=e273]
          - button "Pattern Repeat — tile and mirror patterns" [ref=e276]:
            - img [ref=e277]
          - button "Backstitch tool (click to set start, click again to end)" [ref=e281]:
            - img [ref=e282]
          - button "Clear pattern" [ref=e287]:
            - img [ref=e288]
          - button "Toggle grid snap" [ref=e291]:
            - img
            - generic [ref=e293]: Snap
          - button "Ruler" [ref=e294]:
            - img [ref=e295]
            - generic [ref=e298]: Ruler
          - button "🎨 Recent" [ref=e299]
          - generic [ref=e300]:
            - button "−" [ref=e301]
            - generic [ref=e302]: 100%
            - button "+" [ref=e303]
          - generic [ref=e304]: 40×40
        - generic [ref=e307]:
          - generic [ref=e308]:
            - generic [ref=e309]: "1"
            - generic [ref=e310]: "2"
            - generic [ref=e311]: "3"
            - generic [ref=e312]: "4"
            - generic [ref=e313]: "5"
            - generic [ref=e314]: "6"
            - generic [ref=e315]: "7"
            - generic [ref=e316]: "8"
            - generic [ref=e317]: "9"
            - generic [ref=e318]: "10"
            - generic [ref=e319]: "11"
            - generic [ref=e320]: "12"
            - generic [ref=e321]: "13"
            - generic [ref=e322]: "14"
            - generic [ref=e323]: "15"
            - generic [ref=e324]: "16"
            - generic [ref=e325]: "17"
            - generic [ref=e326]: "18"
            - generic [ref=e327]: "19"
            - generic [ref=e328]: "20"
            - generic [ref=e329]: "21"
            - generic [ref=e330]: "22"
            - generic [ref=e331]: "23"
            - generic [ref=e332]: "24"
            - generic [ref=e333]: "25"
            - generic [ref=e334]: "26"
            - generic [ref=e335]: "27"
            - generic [ref=e336]: "28"
            - generic [ref=e337]: "29"
            - generic [ref=e338]: "30"
            - generic [ref=e339]: "31"
            - generic [ref=e340]: "32"
            - generic [ref=e341]: "33"
            - generic [ref=e342]: "34"
            - generic [ref=e343]: "35"
            - generic [ref=e344]: "36"
            - generic [ref=e345]: "37"
            - generic [ref=e346]: "38"
            - generic [ref=e347]: "39"
            - generic [ref=e348]: "40"
          - generic [ref=e349]:
            - generic [ref=e350]:
              - generic [ref=e351]: "1"
              - generic [ref=e352]: "2"
              - generic [ref=e353]: "3"
              - generic [ref=e354]: "4"
              - generic [ref=e355]: "5"
              - generic [ref=e356]: "6"
              - generic [ref=e357]: "7"
              - generic [ref=e358]: "8"
              - generic [ref=e359]: "9"
              - generic [ref=e360]: "10"
              - generic [ref=e361]: "11"
              - generic [ref=e362]: "12"
              - generic [ref=e363]: "13"
              - generic [ref=e364]: "14"
              - generic [ref=e365]: "15"
              - generic [ref=e366]: "16"
              - generic [ref=e367]: "17"
              - generic [ref=e368]: "18"
              - generic [ref=e369]: "19"
              - generic [ref=e370]: "20"
              - generic [ref=e371]: "21"
              - generic [ref=e372]: "22"
              - generic [ref=e373]: "23"
              - generic [ref=e374]: "24"
              - generic [ref=e375]: "25"
              - generic [ref=e376]: "26"
              - generic [ref=e377]: "27"
              - generic [ref=e378]: "28"
              - generic [ref=e379]: "29"
              - generic [ref=e380]: "30"
              - generic [ref=e381]: "31"
              - generic [ref=e382]: "32"
              - generic [ref=e383]: "33"
              - generic [ref=e384]: "34"
              - generic [ref=e385]: "35"
              - generic [ref=e386]: "36"
              - generic [ref=e387]: "37"
              - generic [ref=e388]: "38"
              - generic [ref=e389]: "39"
              - generic [ref=e390]: "40"
            - generic [ref=e2031]:
              - generic [ref=e2032]: "1"
              - generic [ref=e2033]: "2"
              - generic [ref=e2034]: "3"
              - generic [ref=e2035]: "4"
              - generic [ref=e2036]: "5"
              - generic [ref=e2037]: "6"
              - generic [ref=e2038]: "7"
              - generic [ref=e2039]: "8"
              - generic [ref=e2040]: "9"
              - generic [ref=e2041]: "10"
              - generic [ref=e2042]: "11"
              - generic [ref=e2043]: "12"
              - generic [ref=e2044]: "13"
              - generic [ref=e2045]: "14"
              - generic [ref=e2046]: "15"
              - generic [ref=e2047]: "16"
              - generic [ref=e2048]: "17"
              - generic [ref=e2049]: "18"
              - generic [ref=e2050]: "19"
              - generic [ref=e2051]: "20"
              - generic [ref=e2052]: "21"
              - generic [ref=e2053]: "22"
              - generic [ref=e2054]: "23"
              - generic [ref=e2055]: "24"
              - generic [ref=e2056]: "25"
              - generic [ref=e2057]: "26"
              - generic [ref=e2058]: "27"
              - generic [ref=e2059]: "28"
              - generic [ref=e2060]: "29"
              - generic [ref=e2061]: "30"
              - generic [ref=e2062]: "31"
              - generic [ref=e2063]: "32"
              - generic [ref=e2064]: "33"
              - generic [ref=e2065]: "34"
              - generic [ref=e2066]: "35"
              - generic [ref=e2067]: "36"
              - generic [ref=e2068]: "37"
              - generic [ref=e2069]: "38"
              - generic [ref=e2070]: "39"
              - generic [ref=e2071]: "40"
      - button "Pattern Repeat" [ref=e2072]:
        - img [ref=e2073]
        - generic [ref=e2077]: Pattern Repeat
```

# Test source

```ts
  237 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  238 |       const text = await paletteButtons.nth(i).textContent()
  239 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  240 |     }
  241 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  242 |     await btn.click()
  243 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  244 |     const closeBtn = page.locator('button').filter({ hasText: '✕' }).first()
  245 |     await expect(closeBtn).toBeVisible()
  246 |     await closeBtn.click()
  247 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toHaveCount(0)
  248 |   })
  249 | 
  250 |   test('clicking outside the panel closes it', async ({ page }) => {
  251 |     // Select a color
  252 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  253 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  254 |       const text = await paletteButtons.nth(i).textContent()
  255 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  256 |     }
  257 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  258 |     await btn.click()
  259 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  260 |     // Click on the main canvas to close
  261 |     await page.locator('main').first().click()
  262 |     await page.waitForTimeout(300)
  263 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toHaveCount(0)
  264 |   })
  265 | 
  266 |   test('reopening "Recent" button shows the panel again', async ({ page }) => {
  267 |     // Select a color
  268 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  269 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  270 |       const text = await paletteButtons.nth(i).textContent()
  271 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  272 |     }
  273 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  274 |     await btn.click()
  275 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  276 |     // Close it
  277 |     await page.locator('button').filter({ hasText: '✕' }).first().click()
  278 |     await page.waitForTimeout(200)
  279 |     // Reopen
  280 |     await btn.click()
  281 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  282 |   })
  283 | 
  284 |   // --- LRU behavior ---
  285 | 
  286 |   test('re-selecting a color moves it to the front', async ({ page }) => {
  287 |     // Select 15, then 25, then 15 again
  288 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  289 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  290 |       const text = await paletteButtons.nth(i).textContent()
  291 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  292 |     }
  293 |     paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  294 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  295 |       const text = await paletteButtons.nth(i).textContent()
  296 |       if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  297 |     }
  298 |     paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  299 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  300 |       const text = await paletteButtons.nth(i).textContent()
  301 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  302 |     }
  303 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  304 |     await btn.click()
  305 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  306 |     // 15 should be first (most recently selected)
  307 |     const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
  308 |     await expect(firstSwatch).toBeVisible()
  309 |   })
  310 | 
  311 |   test('history preserves maximum 20 entries', async ({ page }) => {
  312 |     const validColors = [1,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]
  313 |     for (const num of validColors) {
  314 |       const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  315 |       for (let i = 0; i < await paletteButtons.count(); i++) {
  316 |         const text = await paletteButtons.nth(i).textContent()
  317 |         if (text && text.includes(String(num))) {
  318 |           await paletteButtons.nth(i).click()
  319 |           await page.waitForTimeout(200)
  320 |           break
  321 |         }
  322 |       }
  323 |     }
  324 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  325 |     await btn.click()
  326 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  327 |     const swatches = getSwatches(page)
  328 |     const count = await swatches.count()
  329 |     expect(count).toBeLessThanOrEqual(20)
  330 |   })
  331 | 
  332 |   test('oldest entry is evicted when history exceeds 20', async ({ page }) => {
  333 |     const validColors = [1,4,5,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]
  334 |     for (let i = 0; i < 20; i++) {
  335 |       const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  336 |       for (let j = 0; j < await paletteButtons.count(); j++) {
> 337 |         const text = await paletteButtons.nth(j).textContent()
      |                                                  ^ Error: locator.textContent: Test timeout of 30000ms exceeded.
  338 |         if (text && text.includes(String(validColors[i]))) {
  339 |           await paletteButtons.nth(j).click()
  340 |           await page.waitForTimeout(200)
  341 |           break
  342 |         }
  343 |       }
  344 |     }
  345 |     // Add 33 (should evict 1)
  346 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  347 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  348 |       const text = await paletteButtons.nth(i).textContent()
  349 |       if (text && text.includes('33')) {
  350 |         await paletteButtons.nth(i).click()
  351 |         await page.waitForTimeout(200)
  352 |         break
  353 |       }
  354 |     }
  355 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  356 |     await btn.click()
  357 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  358 |     const swatches = getSwatches(page)
  359 |     await expect(swatches).toHaveCount(20)
  360 |     // First should be 33, last should NOT be 1
  361 |     const lastSwatch = swatches.last()
  362 |     const lastTitle = await lastSwatch.getAttribute('title')
  363 |     expect(lastTitle).not.toContain('DMC 1 ')
  364 |   })
  365 | 
  366 |   // --- Interaction with other features ---
  367 | 
  368 |   test('color history survives right panel tab switching', async ({ page }) => {
  369 |     // Select color 15
  370 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  371 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  372 |       const text = await paletteButtons.nth(i).textContent()
  373 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  374 |     }
  375 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  376 |     await btn.click()
  377 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  378 |     // Switch panels
  379 |     const panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  380 |     if (await panelBtn.count() > 0) {
  381 |       await panelBtn.click()
  382 |       await page.waitForTimeout(300)
  383 |     }
  384 |     const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
  385 |     if (await projectTab.count() > 0) await projectTab.click()
  386 |     await page.waitForTimeout(200)
  387 |     // Reopen color history
  388 |     await btn.click()
  389 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  390 |     const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
  391 |     await expect(firstSwatch).toBeVisible()
  392 |   })
  393 | 
  394 |   test('placing a stitch adds the color to history automatically', async ({ page }) => {
  395 |     // Select color 15
  396 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  397 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  398 |       const text = await paletteButtons.nth(i).textContent()
  399 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  400 |     }
  401 |     // Click on grid cell to place a stitch
  402 |     const cells = page.locator('[data-cell]')
  403 |     if (await cells.count() > 0) {
  404 |       await cells.first().click()
  405 |       await page.waitForTimeout(200)
  406 |     }
  407 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  408 |     await btn.click()
  409 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  410 |     const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
  411 |     await expect(firstSwatch).toBeVisible()
  412 |   })
  413 | 
  414 |   // --- Brand switching compatibility ---
  415 | 
  416 |   test('color history swatches show correct hex for non-DMC brands', async ({ page }) => {
  417 |     // Select color 15
  418 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  419 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  420 |       const text = await paletteButtons.nth(i).textContent()
  421 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  422 |     }
  423 |     // Switch to different brand
  424 |     let panelBtn = page.locator('button').filter({ hasText: 'Panel' }).first()
  425 |     if (await panelBtn.count() > 0) await panelBtn.click()
  426 |     await page.waitForTimeout(300)
  427 |     const projectTab = page.locator('button').filter({ hasText: 'Project' }).first()
  428 |     if (await projectTab.count() > 0) await projectTab.click()
  429 |     await page.waitForTimeout(200)
  430 |     // Open color history
  431 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  432 |     await btn.click()
  433 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  434 |     const countText = getCountText(page)
  435 |     await expect(countText).toBeVisible()
  436 |   })
  437 | 
```