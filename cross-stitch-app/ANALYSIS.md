# Cross-Stitch Studio v2 — Competitive Analysis & Spec

## What We Have vs. What Stitchers Need

### Current App (v1) — What's Good
- ✅ Basic 2D grid editor with pencil/eraser/fill
- ✅ Symbol mode with auto-assigned symbols
- ✅ Image-to-chart conversion (basic nearest-neighbor)
- ✅ PDF export with symbols + legend + shopping list
- ✅ Multi-panel support (rectangle, pentagon, hexagon)
- ✅ 3D visualization (Quaker Balls)
- ✅ Project save/load (JSON)
- ✅ DMC color palette
- ✅ Basic inventory tracking
- ✅ Alternating cell shading (counting aid)
- ✅ Undo/redo

### What We're Missing (The Deal-Breakers)

#### ⚠️ THE #1 PRIORITY: Grid Line Rendering

**This is not just a "nice to have" — it's the foundation of the entire UI.**

The current app renders grid cells with all lines at the same thin weight. At 40×40 stitches, this is a sea of identical cells. Stitchers count by eye, looking for visual anchors. Competitors provide:

- **Light grid lines** — every cell (0.5px, subtle gray)
- **Medium grid lines** — every 5 stitches (2px, visible, creates counting blocks)
- **Heavy grid lines** — every 10 stitches (3px, dark, major divisions)
- **Number labels** that change style at heavy line boundaries (bolder, larger)
- **Label interval** adapts to zoom (at low zoom, only show labels at every 10)

Without this, the grid is exhausting to navigate. With it, stitchers can instantly find their row/column.

#### Other Missing Features

| Missing Feature | Why Stitchers Care | Competitor |
|---|---|---|
| **Backstitch layer** | Essential for outlines, facial features, text | Stitches Plus |
| **K-Means color quantization** | Current "nearest pixel" gives muddy, ugly results | Stitch Fiddle |
| **Dithering (FS/Sierra)** | Photos need dithering for smooth gradients | Stitch Fiddle |
| **Multi-brand floss library** | Stitchers use Anchor, Madeira, not just DMC | Stitch Fiddle |
| **Written chart instructions** | "Row 1: 3×BL, 5×RD, 2×BL..." — stitchers read while they stitch | Stitch Fiddle |
| **Progress tracking** | Mark rows as done, see % complete | Stitch Fiddle |
| **QR code for phone** | Scan to view pattern while stitching in your chair | Stitch Fiddle |
| **Line/Shape tools** | Draw rectangles, circles, lines — not just individual stitches | Stitches Plus |
| **Dropper/Eyedropper** | Pick color from canvas | Stitches Plus |
| **Mirror/Flip** | Common in quilts, seasonal designs, mirrored motifs | Stitches Plus |
| **Enhanced symbols** | Custom symbols, styles, colors per-color | (nobody does this well) |
| **Pattern repeats** | Tile patterns for borders, blocks | Stitches Plus |
| **Brush tool** | Multi-stroke brush for speed | Stitches Plus |
| **Semi-cross stitches** | Quarter-stitches for diagonal details | (nobody does this) |
| **Pattern library** | Browse/download/share patterns | Stitch Fiddle |

### What FlossCross Does (and Our Edge)
FlossCross is a very basic online designer. It's simpler than our app in almost every way. We're already ahead — we just need to fill the specific gaps that professional stitchers need.

### What Stitch Fiddle Does Well (and How We Beat Them)
Stitch Fiddle is popular because it's free and has a community library. But:
- Their image-to-chart is basic (no k-means, no dithering)
- No backstitch tool
- No shape tools
- No brush tool
- No mirror/flip
- No semi-cross stitches
- No written instructions (they have them but very basic)
- Their mobile app is limited
- Their UI feels dated
- Limited print options

### What Stitches Plus Does Well (and How We Beat Them)
Stitches Plus is the premium option (~$30). It has:
- Backstitch ✓ (we need this)
- Shape tools ✓ (we need this)
- Layers ✓ (nice to have, v3)
- Image tracing (we'll do better with K-Means + dithering)
- Thread brand library ✓ (we need this)
- Written instructions ✓ (we need this)
- They charge $30/year

**Our opportunity:** We can build ALL of this + more for free, with better image-to-chart quality (K-Means + dithering), semi-cross stitches, progress tracking, QR codes, written instructions, pattern repeats, and a modern UI.

---

## The Four-Wave Implementation Plan

### Wave 1: MVP — "Actually Usable" (~38 hours)

**The minimum features that make stitchers say "wow, this is the real deal"**

1. **Multi-Brand Floss Library** (8h)
   - Full DMC, Anchor, Madeira databases
   - Cross-reference matching (DMC 824 → Anchor 1182)
   - Brand selector in sidebar
   - Mahalanobis distance color matching (better than nearest-neighbor)

2. **Advanced Image-to-Chart** (12h)
   - K-Means++ clustering for color reduction
   - Floyd-Steinberg dithering
   - Sierra 3-2-1 dithering
   - Post-conversion cleanup (smooth, reduce colors, isolate noise)
   - Crop blank borders
   - Image preview before applying

3. **Backstitch Layer** (10h)
   - Separate backstitch layer overlaying the grid
   - Bresenham line tool
   - Line width configurable (1, 1.5, 2, 3 stitch widths)
   - Toggle backstitch visible/hidden
   - Render in PDF as solid lines

4. **Enhanced Symbol System** (8h)
   - Manual symbol assignment (click color → pick symbol)
   - 8 symbol styles (circle, square, triangle, diamond, star, heart, cross, dot)
   - Symbol size + color override per-color
   - Symbol legend panel with reordering
   - Custom Unicode symbols

### Wave 2: "Stitcher-Ready" (~18 hours)

5. **Written Chart Instructions** (4h)
   - Row-by-row text: "Row 1: 3×BL, 5×RD, 2×BL, 8×WH"
   - Color abbreviation dictionary (customizable)
   - Group consecutive same-color stitches
   - Export as PDF/TXT/Markdown

6. **Progress Tracking** (8h)
   - Shift-click to mark stitches complete
   - Color-coded completed overlay
   - Progress bar per panel + overall %
   - Manual stitch counter
   - Auto-save progress state

7. **Enhanced Export** (6h)
   - QR code for patterns (embed in PDF)
   - Multi-page PDF splitting for large patterns
   - Stitch count labels at intervals (every 5/10)
   - Page numbering + continuity markers
   - Scale reference print element
   - Watermark option

### Wave 3: "Power User" (~22 hours)

8. **Advanced Tools** (16h)
   - Line tool (Bresenham)
   - Rectangle/Circle tools (filled + outline)
   - Dropper/Eyedropper
   - Select + Move
   - Copy/Paste
   - Mirror/Flip (full pattern + selection)
   - Brush tool (adjustable width)
   - Erase Line tool

9. **Pattern Repeats** (6h)
   - Define repeat block
   - Tile horizontally/vertically/both
   - Preview repeat
   - Export repeat as new pattern

### Wave 4: "Professional" (~40 hours)

10. **Performance** (20h)
    - Virtualized grid rendering (500×500+)
    - WebGL/Canvas rendering (not DOM cells)
    - IndexedDB persistence
    - Chunked undo history
    - Auto-save with debounce

11. **Semi-Cross Stitches** (8h)
    - Quarter-cell rendering
    - Semi-cross symbols in symbol mode
    - Semi-cross tool (select quadrant)
    - PDF export support

12. **Notes + Responsive + Polish** (12h)
    - Add notes to grid coordinates
    - Touch-friendly layout
    - Keyboard shortcuts
    - Dark theme
    - Onboarding tour

---

## Data Model Changes

The existing data model needs these additions:

```typescript
// New fields on Project
interface CrossStitchProject {
  // ... existing fields ...
  
  // NEW: floss brand
  flossBrand: 'dmc' | 'anchor' | 'madeira' | 'generic';
  
  // NEW: backstitch layer
  backstitch: BackstitchLine[];
  
  // NEW: completed stitches for progress tracking
  completedStitches: Set<string>; // "panelId:row:col"
  
  // NEW: notes
  notes: Note[];
  
  // NEW: symbol definitions per-color
  symbolDefinitions: Map<number, SymbolDefinition>;
  
  // NEW: written instructions
  writtenInstructions?: string[];
}

// NEW: backstitch line
interface BackstitchLine {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
  lineWidth: number; // in stitch widths
}

// NEW: semi-cross
type SemiCrossType = 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right';
interface Cell {
  colorIndex: number;
  semiCross?: SemiCrossType;
}

// NEW: symbol definition
interface SymbolDefinition {
  character: string;
  style: SymbolStyle;
  size: number;
  fill?: string;
  stroke?: string;
}
```

---

## Files to Create vs. Modify

### New Files (14)
```
src/utils/flossBrands.ts          — multi-brand color databases
src/utils/colorDistance.ts        — Mahalanobis distance matching
src/utils/kMeans.ts               — K-Means++ clustering
src/utils/dithering.ts            — FS + Sierra dithering
src/utils/bresenham.ts            — line drawing algorithm
src/utils/writtenInstructions.ts  — text description generation
src/utils/qrCode.ts               — QR code wrapper
src/utils/symbolSystem.ts         — symbol management
src/utils/repeat.ts               — pattern tiling
src/types/backstitch.ts           — backstitch types
src/types/project.ts              — modularized types
src/store/performance.ts          — IndexedDB persistence
src/utils/tools/line.ts           — line tool
src/utils/tools/shape.ts          — shape tools
```

### Modified Files (8)
```
src/utils/dmcColors.ts            → rename to flossLibrary.ts
src/utils/imageConverter.ts       — use K-Means + dithering
src/utils/PDFGenerator.ts         — enhanced export
src/utils/projectIO.ts            — new data model
src/store/projectStore.ts         — new state + actions
src/components/GridCanvas.tsx     — many additions
src/components/Sidebar.tsx        — new tools + brand selector
src/components/ImageConversionPanel.tsx — new options
```

### New UI Components (7)
```
src/components/FlossBrandSelector.tsx
src/components/BackstitchLayer.tsx
src/components/SymbolEditor.tsx
src/components/WrittenInstructionsPanel.tsx
src/components/ProgressTracker.tsx
src/components/RepeatPreview.tsx
src/components/PatternLibrary.tsx
```

---

## Priority Recommendations

### Do First (Wave 1) — These are the deal-breakers:
1. **Backstitch layer** — the #1 complaint from stitchers
2. **K-Means image-to-chart** — current conversion is visibly worse than competitors
3. **Multi-brand floss** — stitchers use more than just DMC
4. **Enhanced symbols** — customization users expect

### Do Second (Wave 2) — These make it a real tool:
5. **Written instructions** — unique selling point, nobody does it well
6. **Progress tracking** — essential for actual stitching workflow
7. **QR codes** — small feature, huge UX win

### Do Third (Wave 3) — Power user features:
8. **Advanced tools** (line, shape, dropper, mirror)
9. **Pattern repeats**

### Do Last (Wave 4) — Polish and scale:
10. **Performance** (virtualized rendering)
11. **Semi-cross** (unique feature, nobody else has it)
12. **Notes + responsive + dark theme**

---

## Notes

- The ATR cross-stitch research bundles are empty (directories created but no data)
- Stitch Fiddle was the main competitor analyzed via web_fetch
- No SearXNG instance available for deeper web research
- FlossCross is a very basic tool — we're already ahead of it
- Stitches Plus charges $30/year for features we can build for free
