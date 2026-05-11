# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/color-history-panel.spec.ts >> Color History Panel >> clicking outside the panel closes it
- Location: tests/e2e/color-history-panel.spec.ts:250:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('h3').filter({ hasText: 'Recently Used Colors' })
Expected: 0
Received: 1
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('h3').filter({ hasText: 'Recently Used Colors' })
    9 × locator resolved to 1 element
      - unexpected value "1"

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
      - button "Undo" [ref=e25]:
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
            - text: "Last edited: Row 8, Col 17"
            - generic [ref=e134]: Panel 1 · 40×40
        - generic [ref=e135]:
          - heading "Zoom" [level=3] [ref=e136]
          - generic [ref=e137]:
            - button "−" [ref=e138]
            - generic [ref=e139]: 100%
            - button "+" [ref=e140]
            - button "Fit" [ref=e141]
        - generic [ref=e143] [cursor=pointer]:
          - checkbox "Alternating cells (counting aid)" [checked] [ref=e144]
          - text: Alternating cells (counting aid)
        - generic [ref=e146]:
          - heading "Edit Colors" [level=3] [ref=e147]
          - button "Swap two colors" [ref=e148]:
            - img [ref=e149]
        - generic [ref=e152]:
          - generic [ref=e154]:
            - heading "Colors" [level=3] [ref=e155]
            - button "Select DMC brand" [ref=e156]: DMC
          - generic [ref=e157]:
            - generic [ref=e158]:
              - button "1" [ref=e159]:
                - generic: "1"
              - button "15" [ref=e160]:
                - generic: "15"
              - button "16" [ref=e161]:
                - generic: "16"
              - button "20" [ref=e162]:
                - generic: "20"
              - button "21" [ref=e163]:
                - generic: "21"
              - button "30" [ref=e164]:
                - generic: "30"
              - button "32" [ref=e165]:
                - generic: "32"
              - button "4" [ref=e166]:
                - generic: "4"
              - button "5" [ref=e167]:
                - generic: "5"
              - button "7" [ref=e168]:
                - generic: "7"
              - button "8" [ref=e169]:
                - generic: "8"
              - button "9" [ref=e170]:
                - generic: "9"
              - button "10" [ref=e171]:
                - generic: "10"
              - button "11" [ref=e172]:
                - generic: "11"
              - button "12" [ref=e173]:
                - generic: "12"
              - button "13" [ref=e174]:
                - generic: "13"
              - button "14" [ref=e175]:
                - generic: "14"
              - button "17" [ref=e176]:
                - generic: "17"
              - button "18" [ref=e177]:
                - generic: "18"
              - button "19" [ref=e178]:
                - generic: "19"
              - button "22" [ref=e179]:
                - generic: "22"
              - button "23" [ref=e180]:
                - generic: "23"
              - button "24" [ref=e181]:
                - generic: "24"
              - button "25" [ref=e182]:
                - generic: "25"
              - button "26" [ref=e183]:
                - generic: "26"
              - button "27" [ref=e184]:
                - generic: "27"
              - button "28" [ref=e185]:
                - generic: "28"
              - button "29" [ref=e186]:
                - generic: "29"
              - button "33" [ref=e187]:
                - generic: "33"
            - generic [ref=e191]:
              - generic [ref=e192]: DMC 15
              - generic [ref=e193]: Gold
    - main [ref=e195]:
      - generic [ref=e196]:
        - generic [ref=e197]: Panel 1
        - generic [ref=e198]: 40×40 stitches
      - generic [ref=e199]:
        - generic [ref=e200]:
          - generic [ref=e201]:
            - button "Pencil" [ref=e202]:
              - img [ref=e203]
            - button "Eraser" [ref=e206]:
              - img [ref=e207]
            - button "Fill" [ref=e210]:
              - img [ref=e211]
          - generic [ref=e215]:
            - button "Line (click start, click end)" [ref=e216]:
              - img [ref=e217]
            - button "Erase Line (click start, click end to clear cells along path)" [ref=e218]:
              - img [ref=e219]
            - button "Rectangle (drag to fill)" [ref=e222]:
              - img [ref=e223]
            - button "Circle (drag to fill)" [ref=e225]:
              - img [ref=e226]
            - button "Brush (drag to paint)" [ref=e228]:
              - img [ref=e229]
            - button "Dropper (click cell to pick color)" [ref=e232]:
              - img [ref=e233]
            - button "Select (drag to select)" [ref=e236]:
              - img [ref=e237]
            - button "Semi-Cross (click cell to set diagonal/half stitch)" [ref=e242]:
              - img [ref=e243]
          - generic [ref=e246]:
            - button "Mirror full pattern horizontally" [ref=e247]:
              - img [ref=e248]
            - button "Mirror full pattern vertically" [ref=e251]:
              - img [ref=e252]
            - button "Mirror selected region horizontally" [disabled] [ref=e255]:
              - img [ref=e256]
            - button "Mirror selected region vertically" [disabled] [ref=e259]:
              - img [ref=e260]
            - button "Copy selection" [disabled] [ref=e263]:
              - img [ref=e264]
            - button "Paste from clipboard" [disabled] [ref=e267]:
              - img [ref=e268]
          - button "Notes & Annotations" [ref=e274]:
            - img [ref=e275]
          - button "Pattern Repeat — tile and mirror patterns" [ref=e278]:
            - img [ref=e279]
          - button "Backstitch tool (click to set start, click again to end)" [ref=e283]:
            - img [ref=e284]
          - button "Clear pattern" [ref=e289]:
            - img [ref=e290]
          - button "Toggle grid snap" [ref=e293]:
            - img
            - generic [ref=e295]: Snap
          - button "Ruler" [ref=e296]:
            - img [ref=e297]
            - generic [ref=e300]: Ruler
          - button "🎨 Recent" [ref=e301]
          - generic [ref=e303]:
            - generic [ref=e304]:
              - heading "Recently Used Colors" [level=3] [ref=e305]
              - button "Close" [ref=e306]: ✕
            - generic [ref=e307]:
              - button "DMC 12" [ref=e308]:
                - generic [ref=e309]: DMC 12
              - button "DMC 15" [ref=e310]:
                - generic [ref=e311]: DMC 15
            - paragraph [ref=e312]: 2 recent colors
          - generic [ref=e313]:
            - button "−" [ref=e314]
            - generic [ref=e315]: 100%
            - button "+" [ref=e316]
          - generic [ref=e317]: 40×40
        - generic [ref=e320]:
          - generic [ref=e321]:
            - generic [ref=e322]: "1"
            - generic [ref=e323]: "2"
            - generic [ref=e324]: "3"
            - generic [ref=e325]: "4"
            - generic [ref=e326]: "5"
            - generic [ref=e327]: "6"
            - generic [ref=e328]: "7"
            - generic [ref=e329]: "8"
            - generic [ref=e330]: "9"
            - generic [ref=e331]: "10"
            - generic [ref=e332]: "11"
            - generic [ref=e333]: "12"
            - generic [ref=e334]: "13"
            - generic [ref=e335]: "14"
            - generic [ref=e336]: "15"
            - generic [ref=e337]: "16"
            - generic [ref=e338]: "17"
            - generic [ref=e339]: "18"
            - generic [ref=e340]: "19"
            - generic [ref=e341]: "20"
            - generic [ref=e342]: "21"
            - generic [ref=e343]: "22"
            - generic [ref=e344]: "23"
            - generic [ref=e345]: "24"
            - generic [ref=e346]: "25"
            - generic [ref=e347]: "26"
            - generic [ref=e348]: "27"
            - generic [ref=e349]: "28"
            - generic [ref=e350]: "29"
            - generic [ref=e351]: "30"
            - generic [ref=e352]: "31"
            - generic [ref=e353]: "32"
            - generic [ref=e354]: "33"
            - generic [ref=e355]: "34"
            - generic [ref=e356]: "35"
            - generic [ref=e357]: "36"
            - generic [ref=e358]: "37"
            - generic [ref=e359]: "38"
            - generic [ref=e360]: "39"
            - generic [ref=e361]: "40"
          - generic [ref=e362]:
            - generic [ref=e363]:
              - generic [ref=e364]: "1"
              - generic [ref=e365]: "2"
              - generic [ref=e366]: "3"
              - generic [ref=e367]: "4"
              - generic [ref=e368]: "5"
              - generic [ref=e369]: "6"
              - generic [ref=e370]: "7"
              - generic [ref=e371]: "8"
              - generic [ref=e372]: "9"
              - generic [ref=e373]: "10"
              - generic [ref=e374]: "11"
              - generic [ref=e375]: "12"
              - generic [ref=e376]: "13"
              - generic [ref=e377]: "14"
              - generic [ref=e378]: "15"
              - generic [ref=e379]: "16"
              - generic [ref=e380]: "17"
              - generic [ref=e381]: "18"
              - generic [ref=e382]: "19"
              - generic [ref=e383]: "20"
              - generic [ref=e384]: "21"
              - generic [ref=e385]: "22"
              - generic [ref=e386]: "23"
              - generic [ref=e387]: "24"
              - generic [ref=e388]: "25"
              - generic [ref=e389]: "26"
              - generic [ref=e390]: "27"
              - generic [ref=e391]: "28"
              - generic [ref=e392]: "29"
              - generic [ref=e393]: "30"
              - generic [ref=e394]: "31"
              - generic [ref=e395]: "32"
              - generic [ref=e396]: "33"
              - generic [ref=e397]: "34"
              - generic [ref=e398]: "35"
              - generic [ref=e399]: "36"
              - generic [ref=e400]: "37"
              - generic [ref=e401]: "38"
              - generic [ref=e402]: "39"
              - generic [ref=e403]: "40"
            - generic [ref=e2044]:
              - generic [ref=e2045]: "1"
              - generic [ref=e2046]: "2"
              - generic [ref=e2047]: "3"
              - generic [ref=e2048]: "4"
              - generic [ref=e2049]: "5"
              - generic [ref=e2050]: "6"
              - generic [ref=e2051]: "7"
              - generic [ref=e2052]: "8"
              - generic [ref=e2053]: "9"
              - generic [ref=e2054]: "10"
              - generic [ref=e2055]: "11"
              - generic [ref=e2056]: "12"
              - generic [ref=e2057]: "13"
              - generic [ref=e2058]: "14"
              - generic [ref=e2059]: "15"
              - generic [ref=e2060]: "16"
              - generic [ref=e2061]: "17"
              - generic [ref=e2062]: "18"
              - generic [ref=e2063]: "19"
              - generic [ref=e2064]: "20"
              - generic [ref=e2065]: "21"
              - generic [ref=e2066]: "22"
              - generic [ref=e2067]: "23"
              - generic [ref=e2068]: "24"
              - generic [ref=e2069]: "25"
              - generic [ref=e2070]: "26"
              - generic [ref=e2071]: "27"
              - generic [ref=e2072]: "28"
              - generic [ref=e2073]: "29"
              - generic [ref=e2074]: "30"
              - generic [ref=e2075]: "31"
              - generic [ref=e2076]: "32"
              - generic [ref=e2077]: "33"
              - generic [ref=e2078]: "34"
              - generic [ref=e2079]: "35"
              - generic [ref=e2080]: "36"
              - generic [ref=e2081]: "37"
              - generic [ref=e2082]: "38"
              - generic [ref=e2083]: "39"
              - generic [ref=e2084]: "40"
      - button "Pattern Repeat" [ref=e2085]:
        - img [ref=e2086]
        - generic [ref=e2090]: Pattern Repeat
```

# Test source

```ts
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
  258 |     await btn.click()
  259 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toBeVisible({ timeout: 3000 })
  260 |     // Click on the main canvas to close
  261 |     await page.locator('main').first().click()
  262 |     await page.waitForTimeout(300)
> 263 |     await expect(page.locator('h3').filter({ hasText: 'Recently Used Colors' })).toHaveCount(0)
      |                                                                                  ^ Error: expect(locator).toHaveCount(expected) failed
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
  337 |         const text = await paletteButtons.nth(j).textContent()
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
```