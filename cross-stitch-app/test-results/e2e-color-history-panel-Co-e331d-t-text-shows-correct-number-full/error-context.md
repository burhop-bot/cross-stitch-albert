# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/color-history-panel.spec.ts >> Color History Panel >> color history count text shows correct number
- Location: tests/e2e/color-history-panel.spec.ts:139:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "1"
Received string:    "2 recent colors"
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
              - generic [ref=e190]: DMC 15
              - generic [ref=e191]: Gold
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
              - button "DMC 12" [ref=e306]:
                - generic [ref=e307]: DMC 12
              - button "DMC 15" [ref=e308]:
                - generic [ref=e309]: DMC 15
            - paragraph [ref=e310]: 2 recent colors
          - generic [ref=e311]:
            - button "−" [ref=e312]
            - generic [ref=e313]: 100%
            - button "+" [ref=e314]
          - generic [ref=e315]: 40×40
        - generic [ref=e318]:
          - generic [ref=e319]:
            - generic [ref=e320]: "1"
            - generic [ref=e321]: "2"
            - generic [ref=e322]: "3"
            - generic [ref=e323]: "4"
            - generic [ref=e324]: "5"
            - generic [ref=e325]: "6"
            - generic [ref=e326]: "7"
            - generic [ref=e327]: "8"
            - generic [ref=e328]: "9"
            - generic [ref=e329]: "10"
            - generic [ref=e330]: "11"
            - generic [ref=e331]: "12"
            - generic [ref=e332]: "13"
            - generic [ref=e333]: "14"
            - generic [ref=e334]: "15"
            - generic [ref=e335]: "16"
            - generic [ref=e336]: "17"
            - generic [ref=e337]: "18"
            - generic [ref=e338]: "19"
            - generic [ref=e339]: "20"
            - generic [ref=e340]: "21"
            - generic [ref=e341]: "22"
            - generic [ref=e342]: "23"
            - generic [ref=e343]: "24"
            - generic [ref=e344]: "25"
            - generic [ref=e345]: "26"
            - generic [ref=e346]: "27"
            - generic [ref=e347]: "28"
            - generic [ref=e348]: "29"
            - generic [ref=e349]: "30"
            - generic [ref=e350]: "31"
            - generic [ref=e351]: "32"
            - generic [ref=e352]: "33"
            - generic [ref=e353]: "34"
            - generic [ref=e354]: "35"
            - generic [ref=e355]: "36"
            - generic [ref=e356]: "37"
            - generic [ref=e357]: "38"
            - generic [ref=e358]: "39"
            - generic [ref=e359]: "40"
          - generic [ref=e360]:
            - generic [ref=e361]:
              - generic [ref=e362]: "1"
              - generic [ref=e363]: "2"
              - generic [ref=e364]: "3"
              - generic [ref=e365]: "4"
              - generic [ref=e366]: "5"
              - generic [ref=e367]: "6"
              - generic [ref=e368]: "7"
              - generic [ref=e369]: "8"
              - generic [ref=e370]: "9"
              - generic [ref=e371]: "10"
              - generic [ref=e372]: "11"
              - generic [ref=e373]: "12"
              - generic [ref=e374]: "13"
              - generic [ref=e375]: "14"
              - generic [ref=e376]: "15"
              - generic [ref=e377]: "16"
              - generic [ref=e378]: "17"
              - generic [ref=e379]: "18"
              - generic [ref=e380]: "19"
              - generic [ref=e381]: "20"
              - generic [ref=e382]: "21"
              - generic [ref=e383]: "22"
              - generic [ref=e384]: "23"
              - generic [ref=e385]: "24"
              - generic [ref=e386]: "25"
              - generic [ref=e387]: "26"
              - generic [ref=e388]: "27"
              - generic [ref=e389]: "28"
              - generic [ref=e390]: "29"
              - generic [ref=e391]: "30"
              - generic [ref=e392]: "31"
              - generic [ref=e393]: "32"
              - generic [ref=e394]: "33"
              - generic [ref=e395]: "34"
              - generic [ref=e396]: "35"
              - generic [ref=e397]: "36"
              - generic [ref=e398]: "37"
              - generic [ref=e399]: "38"
              - generic [ref=e400]: "39"
              - generic [ref=e401]: "40"
            - generic [ref=e2042]:
              - generic [ref=e2043]: "1"
              - generic [ref=e2044]: "2"
              - generic [ref=e2045]: "3"
              - generic [ref=e2046]: "4"
              - generic [ref=e2047]: "5"
              - generic [ref=e2048]: "6"
              - generic [ref=e2049]: "7"
              - generic [ref=e2050]: "8"
              - generic [ref=e2051]: "9"
              - generic [ref=e2052]: "10"
              - generic [ref=e2053]: "11"
              - generic [ref=e2054]: "12"
              - generic [ref=e2055]: "13"
              - generic [ref=e2056]: "14"
              - generic [ref=e2057]: "15"
              - generic [ref=e2058]: "16"
              - generic [ref=e2059]: "17"
              - generic [ref=e2060]: "18"
              - generic [ref=e2061]: "19"
              - generic [ref=e2062]: "20"
              - generic [ref=e2063]: "21"
              - generic [ref=e2064]: "22"
              - generic [ref=e2065]: "23"
              - generic [ref=e2066]: "24"
              - generic [ref=e2067]: "25"
              - generic [ref=e2068]: "26"
              - generic [ref=e2069]: "27"
              - generic [ref=e2070]: "28"
              - generic [ref=e2071]: "29"
              - generic [ref=e2072]: "30"
              - generic [ref=e2073]: "31"
              - generic [ref=e2074]: "32"
              - generic [ref=e2075]: "33"
              - generic [ref=e2076]: "34"
              - generic [ref=e2077]: "35"
              - generic [ref=e2078]: "36"
              - generic [ref=e2079]: "37"
              - generic [ref=e2080]: "38"
              - generic [ref=e2081]: "39"
              - generic [ref=e2082]: "40"
      - button "Pattern Repeat" [ref=e2083]:
        - img [ref=e2084]
        - generic [ref=e2088]: Pattern Repeat
```

# Test source

```ts
  57  |     await expect(page.locator('div.absolute').filter({ has: page.locator('h3').filter({ hasText: 'Recently Used Colors' }) })).toBeVisible({ timeout: 3000 })
  58  |   })
  59  | 
  60  |   test('[ @smoke ] color history button has hover and accessible styling', async ({ page }) => {
  61  |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  62  |     await expect(btn).toHaveClass(/rounded-md/)
  63  |     await btn.hover()
  64  |     await expect(btn).toHaveClass(/hover:bg-gray-200/)
  65  |   })
  66  | 
  67  |   // --- Empty state ---
  68  | 
  69  |   test('color history shows empty state when no colors used yet', async ({ page }) => {
  70  |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  71  |     await btn.click()
  72  |     await expect(page.locator('p').filter({ hasText: /colors you click/i })).toBeVisible({ timeout: 3000 })
  73  |   })
  74  | 
  75  |   test('empty state is replaced immediately on color selection', async ({ page }) => {
  76  |     // Select a color first
  77  |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  78  |     const count = await paletteButtons.count()
  79  |     for (let i = 0; i < Math.min(count, 5); i++) {
  80  |       const text = await paletteButtons.nth(i).textContent()
  81  |       if (text && text.includes('15')) {
  82  |         await paletteButtons.nth(i).click()
  83  |         await page.waitForTimeout(300)
  84  |         break
  85  |       }
  86  |     }
  87  |     // Open color history
  88  |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  89  |     await btn.click()
  90  |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  91  |     // Empty state should be gone
  92  |     const emptyMsg = page.locator('p').filter({ hasText: /colors you click/i })
  93  |     await expect(emptyMsg).toHaveCount(0)
  94  |   })
  95  | 
  96  |   // --- Color display in panel ---
  97  | 
  98  |   test('selected color swatch shows correct DMC number label', async ({ page }) => {
  99  |     // Select color 15
  100 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  101 |     const count = await paletteButtons.count()
  102 |     for (let i = 0; i < count; i++) {
  103 |       const text = await paletteButtons.nth(i).textContent()
  104 |       if (text && text.includes('15')) {
  105 |         await paletteButtons.nth(i).click()
  106 |         await page.waitForTimeout(300)
  107 |         break
  108 |       }
  109 |     }
  110 |     // Open color history and check first swatch
  111 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  112 |     await btn.click()
  113 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  114 |     // The swatches are buttons with titles like "DMC 15 (#XXXXXX)"
  115 |     const firstSwatch = getSwatches(page).filter({ hasText: '15' }).first()
  116 |     await expect(firstSwatch).toBeVisible()
  117 |   })
  118 | 
  119 |   test('swatch background color matches the selected palette color', async ({ page }) => {
  120 |     // Select color 15
  121 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  122 |     const count = await paletteButtons.count()
  123 |     for (let i = 0; i < count; i++) {
  124 |       const text = await paletteButtons.nth(i).textContent()
  125 |       if (text && text.includes('15')) {
  126 |         await paletteButtons.nth(i).click()
  127 |         await page.waitForTimeout(300)
  128 |         break
  129 |       }
  130 |     }
  131 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  132 |     await btn.click()
  133 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  134 |     const swatch = getSwatches(page).filter({ hasText: '15' }).first()
  135 |     const bgColor = await swatch.locator('span.absolute.inset-0').evaluate((el: HTMLElement) => el.style.backgroundColor)
  136 |     expect(bgColor).toBeTruthy()
  137 |   })
  138 | 
  139 |   test('color history count text shows correct number', async ({ page }) => {
  140 |     // Select a color
  141 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  142 |     const count = await paletteButtons.count()
  143 |     for (let i = 0; i < count; i++) {
  144 |       const text = await paletteButtons.nth(i).textContent()
  145 |       if (text && text.includes('15')) {
  146 |         await paletteButtons.nth(i).click()
  147 |         await page.waitForTimeout(300)
  148 |         break
  149 |       }
  150 |     }
  151 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  152 |     await btn.click()
  153 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  154 |     const countText = getCountText(page)
  155 |     await expect(countText).toBeVisible()
  156 |     const text = await countText.textContent()
> 157 |     expect(text).toContain('1')
      |                  ^ Error: expect(received).toContain(expected) // indexOf
  158 |   })
  159 | 
  160 |   // --- Populating history ---
  161 | 
  162 |   test('multiple color selections add multiple swatches to history', async ({ page }) => {
  163 |     // Select color 15
  164 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  165 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  166 |       const text = await paletteButtons.nth(i).textContent()
  167 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  168 |     }
  169 |     // Select color 25
  170 |     paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  171 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  172 |       const text = await paletteButtons.nth(i).textContent()
  173 |       if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  174 |     }
  175 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  176 |     await btn.click()
  177 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  178 |     // Should have 2 swatches (buttons with DMC titles)
  179 |     const swatches = getSwatches(page)
  180 |     await expect(swatches).toHaveCount(2)
  181 |     const countText = getCountText(page)
  182 |     const text = await countText.textContent()
  183 |     expect(text).toContain('2')
  184 |   })
  185 | 
  186 |   test('most recently selected color appears first in history', async ({ page }) => {
  187 |     // Select color 15 first
  188 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  189 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  190 |       const text = await paletteButtons.nth(i).textContent()
  191 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  192 |     }
  193 |     // Select color 25 second (should be first in history)
  194 |     paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  195 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  196 |       const text = await paletteButtons.nth(i).textContent()
  197 |       if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  198 |     }
  199 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  200 |     await btn.click()
  201 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  202 |     // First swatch should be DMC 25
  203 |     const firstSwatch = getSwatches(page).filter({ hasText: '25' }).first()
  204 |     await expect(firstSwatch).toBeVisible()
  205 |   })
  206 | 
  207 |   test('clicking a color in history sets it as active', async ({ page }) => {
  208 |     // Select 15 then 25
  209 |     let paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  210 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  211 |       const text = await paletteButtons.nth(i).textContent()
  212 |       if (text && text.includes('15')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  213 |     }
  214 |     paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
  215 |     for (let i = 0; i < await paletteButtons.count(); i++) {
  216 |       const text = await paletteButtons.nth(i).textContent()
  217 |       if (text && text.includes('25')) { await paletteButtons.nth(i).click(); await page.waitForTimeout(300); break }
  218 |     }
  219 |     const btn = page.locator('button').filter({ hasText: '🎨 Recent' }).first()
  220 |     await btn.click()
  221 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  222 |     // Click the first swatch (25) — it should become active
  223 |     await (getSwatches(page)).filter({ hasText: '25' }).first().click()
  224 |     await page.waitForTimeout(300)
  225 |     // Reopen and verify 25 is still first
  226 |     await btn.click()
  227 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  228 |     const firstSwatch = getSwatches(page).filter({ hasText: '25' }).first()
  229 |     await expect(firstSwatch).toBeVisible()
  230 |   })
  231 | 
  232 |   // --- Close behavior ---
  233 | 
  234 |   test('close button (✕) hides the color history panel', async ({ page }) => {
  235 |     // Select a color
  236 |     const paletteButtons = page.locator('aside button.aspect-square.rounded-lg')
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
```