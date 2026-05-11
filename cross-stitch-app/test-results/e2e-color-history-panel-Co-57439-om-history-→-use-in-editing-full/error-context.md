# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/color-history-panel.spec.ts >> Color History Panel >> full workflow: select colors → view history → select from history → use in editing
- Location: tests/e2e/color-history-panel.spec.ts:528:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('div.rounded-lg.border').filter({ has: locator('h3').filter({ hasText: 'Recently Used Colors' }) }).first().locator('button[title^="DMC "]')
Expected: 3
Received: 6
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('div.rounded-lg.border').filter({ has: locator('h3').filter({ hasText: 'Recently Used Colors' }) }).first().locator('button[title^="DMC "]')
    9 × locator resolved to 6 elements
      - unexpected value "6"

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
              - button "22" [ref=e177]:
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
              - generic [ref=e190]: DMC 33
              - generic [ref=e191]: Light Gray
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
          - button "🎨 Recent" [active] [ref=e299]
          - generic [ref=e301]:
            - generic [ref=e302]:
              - heading "Recently Used Colors" [level=3] [ref=e303]
              - button "Close" [ref=e304]: ✕
            - generic [ref=e305]:
              - button "DMC 37" [ref=e306]:
                - generic [ref=e307]: DMC 37
              - button "DMC 33" [ref=e308]:
                - generic [ref=e309]: DMC 33
              - button "DMC 26" [ref=e310]:
                - generic [ref=e311]: DMC 26
              - button "DMC 25" [ref=e312]:
                - generic [ref=e313]: DMC 25
              - button "DMC 12" [ref=e314]:
                - generic [ref=e315]: DMC 12
              - button "DMC 15" [ref=e316]:
                - generic [ref=e317]: DMC 15
            - paragraph [ref=e318]: 6 recent colors
          - generic [ref=e319]:
            - button "−" [ref=e320]
            - generic [ref=e321]: 100%
            - button "+" [ref=e322]
          - generic [ref=e323]: 40×40
        - generic [ref=e326]:
          - generic [ref=e327]:
            - generic [ref=e328]: "1"
            - generic [ref=e329]: "2"
            - generic [ref=e330]: "3"
            - generic [ref=e331]: "4"
            - generic [ref=e332]: "5"
            - generic [ref=e333]: "6"
            - generic [ref=e334]: "7"
            - generic [ref=e335]: "8"
            - generic [ref=e336]: "9"
            - generic [ref=e337]: "10"
            - generic [ref=e338]: "11"
            - generic [ref=e339]: "12"
            - generic [ref=e340]: "13"
            - generic [ref=e341]: "14"
            - generic [ref=e342]: "15"
            - generic [ref=e343]: "16"
            - generic [ref=e344]: "17"
            - generic [ref=e345]: "18"
            - generic [ref=e346]: "19"
            - generic [ref=e347]: "20"
            - generic [ref=e348]: "21"
            - generic [ref=e349]: "22"
            - generic [ref=e350]: "23"
            - generic [ref=e351]: "24"
            - generic [ref=e352]: "25"
            - generic [ref=e353]: "26"
            - generic [ref=e354]: "27"
            - generic [ref=e355]: "28"
            - generic [ref=e356]: "29"
            - generic [ref=e357]: "30"
            - generic [ref=e358]: "31"
            - generic [ref=e359]: "32"
            - generic [ref=e360]: "33"
            - generic [ref=e361]: "34"
            - generic [ref=e362]: "35"
            - generic [ref=e363]: "36"
            - generic [ref=e364]: "37"
            - generic [ref=e365]: "38"
            - generic [ref=e366]: "39"
            - generic [ref=e367]: "40"
          - generic [ref=e368]:
            - generic [ref=e369]:
              - generic [ref=e370]: "1"
              - generic [ref=e371]: "2"
              - generic [ref=e372]: "3"
              - generic [ref=e373]: "4"
              - generic [ref=e374]: "5"
              - generic [ref=e375]: "6"
              - generic [ref=e376]: "7"
              - generic [ref=e377]: "8"
              - generic [ref=e378]: "9"
              - generic [ref=e379]: "10"
              - generic [ref=e380]: "11"
              - generic [ref=e381]: "12"
              - generic [ref=e382]: "13"
              - generic [ref=e383]: "14"
              - generic [ref=e384]: "15"
              - generic [ref=e385]: "16"
              - generic [ref=e386]: "17"
              - generic [ref=e387]: "18"
              - generic [ref=e388]: "19"
              - generic [ref=e389]: "20"
              - generic [ref=e390]: "21"
              - generic [ref=e391]: "22"
              - generic [ref=e392]: "23"
              - generic [ref=e393]: "24"
              - generic [ref=e394]: "25"
              - generic [ref=e395]: "26"
              - generic [ref=e396]: "27"
              - generic [ref=e397]: "28"
              - generic [ref=e398]: "29"
              - generic [ref=e399]: "30"
              - generic [ref=e400]: "31"
              - generic [ref=e401]: "32"
              - generic [ref=e402]: "33"
              - generic [ref=e403]: "34"
              - generic [ref=e404]: "35"
              - generic [ref=e405]: "36"
              - generic [ref=e406]: "37"
              - generic [ref=e407]: "38"
              - generic [ref=e408]: "39"
              - generic [ref=e409]: "40"
            - generic [ref=e2050]:
              - generic [ref=e2051]: "1"
              - generic [ref=e2052]: "2"
              - generic [ref=e2053]: "3"
              - generic [ref=e2054]: "4"
              - generic [ref=e2055]: "5"
              - generic [ref=e2056]: "6"
              - generic [ref=e2057]: "7"
              - generic [ref=e2058]: "8"
              - generic [ref=e2059]: "9"
              - generic [ref=e2060]: "10"
              - generic [ref=e2061]: "11"
              - generic [ref=e2062]: "12"
              - generic [ref=e2063]: "13"
              - generic [ref=e2064]: "14"
              - generic [ref=e2065]: "15"
              - generic [ref=e2066]: "16"
              - generic [ref=e2067]: "17"
              - generic [ref=e2068]: "18"
              - generic [ref=e2069]: "19"
              - generic [ref=e2070]: "20"
              - generic [ref=e2071]: "21"
              - generic [ref=e2072]: "22"
              - generic [ref=e2073]: "23"
              - generic [ref=e2074]: "24"
              - generic [ref=e2075]: "25"
              - generic [ref=e2076]: "26"
              - generic [ref=e2077]: "27"
              - generic [ref=e2078]: "28"
              - generic [ref=e2079]: "29"
              - generic [ref=e2080]: "30"
              - generic [ref=e2081]: "31"
              - generic [ref=e2082]: "32"
              - generic [ref=e2083]: "33"
              - generic [ref=e2084]: "34"
              - generic [ref=e2085]: "35"
              - generic [ref=e2086]: "36"
              - generic [ref=e2087]: "37"
              - generic [ref=e2088]: "38"
              - generic [ref=e2089]: "39"
              - generic [ref=e2090]: "40"
      - button "Pattern Repeat" [ref=e2091]:
        - img [ref=e2092]
        - generic [ref=e2096]: Pattern Repeat
```

# Test source

```ts
  445 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  446 |     }
  447 |     paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  448 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  449 |       const text = await paletteButtons.nth(i).textContent()
  450 |       if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  451 |     }
  452 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  453 |     await btn.click()
  454 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  455 |     // Switch to eraser tool
  456 |     const eraserBtn = page.locator('button').filter({ hasText: 'Eraser' }).first()
  457 |     if (await eraserBtn.count() > 0) await eraserBtn.click()
  458 |     await page.waitForTimeout(200)
  459 |     // Reopen color history — should still show 2 entries
  460 |     await btn.click()
  461 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  462 |     const swatches = getSwatches(page)
  463 |     await expect(swatches).toHaveCount(2)
  464 |   })
  465 | 
  466 |   // --- Edge cases ---
  467 | 
  468 |   test('rapid open/close cycles do not crash the panel', async ({ page }) => {
  469 |     // Select a color first
  470 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  471 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  472 |       const text = await paletteButtons.nth(i).textContent()
  473 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  474 |     }
  475 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  476 |     for (let i = 0; i < 10; i++) {
  477 |       await btn.click()
  478 |       await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  479 |       const closeBtn = page.locator('button').filter({ hasText: '✕' }).first()
  480 |       if (await closeBtn.count() > 0) await closeBtn.click()
  481 |       await page.waitForTimeout(50)
  482 |     }
  483 |     await btn.click()
  484 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  485 |   })
  486 | 
  487 |   test('color history panel does not overlap other UI elements inappropriately', async ({ page }) => {
  488 |     // Select a color
  489 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  490 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  491 |       const text = await paletteButtons.nth(i).textContent()
  492 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  493 |     }
  494 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  495 |     await btn.click()
  496 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  497 |     const panel = page.locator('div.rounded-lg.border')
  498 |       .filter({ has: page.locator('h3') }).first()
  499 |     await expect(panel).toBeVisible()
  500 |     const box = await panel.boundingBox()
  501 |     expect(box).not.toBeNull()
  502 |     if (box) {
  503 |       expect(box.width).toBeGreaterThan(50)
  504 |       expect(box.height).toBeGreaterThan(20)
  505 |     }
  506 |   })
  507 | 
  508 |   test('swatch hover tooltip shows DMC number and hex color', async ({ page }) => {
  509 |     // Select a color
  510 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  511 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  512 |       const text = await paletteButtons.nth(i).textContent()
  513 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  514 |     }
  515 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  516 |     await btn.click()
  517 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  518 |     const swatches = getSwatches(page)
  519 |     const firstSwatch = swatches.first()
  520 |     await firstSwatch.hover()
  521 |     const title = await firstSwatch.getAttribute('title')
  522 |     expect(title).toBeTruthy()
  523 |     expect(title!).toContain('15')
  524 |   })
  525 | 
  526 |   // --- Full workflow ---
  527 | 
  528 |   test('full workflow: select colors → view history → select from history → use in editing', async ({ page }) => {
  529 |     // Select 3 colors
  530 |     for (const num of [15, 25, 33]) {
  531 |       const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  532 |       for (let i = 0; i < await paletteButtons.count(); i++) {
  533 |         const text = await paletteButtons.nth(i).textContent()
  534 |         if (text && text.includes(String(num))) {
  535 |           await paletteButtons.nth(i).click()
  536 |           await page.waitForTimeout(300)
  537 |           break
  538 |         }
  539 |       }
  540 |     }
  541 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  542 |     await btn.click()
  543 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  544 |     const swatches = getSwatches(page)
> 545 |     await expect(swatches).toHaveCount(3)
      |                            ^ Error: expect(locator).toHaveCount(expected) failed
  546 |     // Close
  547 |     await page.locator('button').filter({ hasText: '✕' }).first().click()
  548 |     await page.waitForTimeout(200)
  549 |     // Reopen and click second swatch (25)
  550 |     await btn.click()
  551 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  552 |     const secondSwatch = await (getSwatches(page)).filter({ hasText: '25' }).first()
  553 |     await secondSwatch.click()
  554 |     await page.waitForTimeout(200)
  555 |     // Reopen — 25 should be first
  556 |     await btn.click()
  557 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  558 |     const newFirstSwatch = await (getSwatches(page)).filter({ hasText: '25' }).first()
  559 |     await expect(newFirstSwatch).toBeVisible()
  560 |   })
  561 | })
  562 | 
```