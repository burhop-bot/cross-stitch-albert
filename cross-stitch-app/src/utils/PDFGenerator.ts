import jsPDF from 'jspdf'
import { getDMCColor, getDMCHex, getDMCName, DMCColor } from './dmcColors'
import { GridData, BackstitchLine } from '../store/projectStore'
import { getCrossReferences } from './flossBrands'

/**
 * Symbol characters for cross-stitch charts
 */
const SYMBOLS = [
  '●', '■', '▲', '◆', '★', '×', '+', '○', '□', '△',
  '◇', '☆', '✕', '⊕', '⊗', '⬤', '◼', '▣', '⧫', '⯃',
  '◈', '◆', '⬡', '⯁', '⯂', '⬢', '▢', '⬟', '⯀', '⯐',
]

export interface PDFGenerationOptions {
  title: string
  author: string
  fabric: string
  grid: GridData
  dmcPalette: number[]
  dmcUsage: Map<number, number>
  showSymbols: boolean
  showColorBlocks: boolean
  
  // v2: backstitch lines
  backstitchLines?: BackstitchLine[]
  backstitchColor?: string
  
  // v2: multi-brand thread legend
  flossBrand?: 'dmc' | 'anchor' | 'madeira' | 'generic'
  
  // v2: row/col labels
  showLabels?: boolean
  labelInterval?: 1 | 5 | 10
  
  // v2: enhanced page size options
  pageSize?: 'a4' | 'a5' | 'letter' | 'legal' | 'custom'
  pageWidth?: number  // mm for custom
  pageHeight?: number // mm for custom
  
  // v2: page numbering
  showPageNumbers?: boolean
  
  // v2: watermark
  watermark?: string
  
  // v2: half-cross view mode
  showHalfCross?: boolean
  
  // v2: stitch count labels at intervals
  stitchLabelInterval?: 1 | 5 | 10
  
  // v2: scale reference (mm per stitch)
  stitchSize?: number
  
  // v2: QR code value to encode
  qrCode?: string
  
  // v2: notes & annotations
  notes?: Array<{ id: string; text: string; row: number; col: number; color?: string }>
}

export interface SymbolMap {
  [dmcNumber: number]: string
}

function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/.{2}/g)
  if (!match || match.length !== 3) return null
  return {
    r: parseInt(match[0], 16),
    g: parseInt(match[1], 16),
    b: parseInt(match[2], 16),
  }
}

export function assignSymbols(dmcPalette: number[]): SymbolMap {
  const symbolMap: SymbolMap = {}
  for (let i = 0; i < dmcPalette.length && i < SYMBOLS.length; i++) {
    symbolMap[dmcPalette[i]] = SYMBOLS[i]
  }
  return symbolMap
}

export function calculateThreadUsage(
  dmcUsage: Map<number, number>,
  stitchesPerSkein: number = 3500
): Map<number, { stitches: number; skeins: number; lengthCm: number }> {
  const usage = new Map<number, { stitches: number; skeins: number; lengthCm: number }>()
  const cmPerStitch = 0.5
  for (const [dmcNumber, stitchCount] of dmcUsage) {
    const lengthCm = stitchCount * cmPerStitch
    const skeins = Math.ceil(stitchCount / stitchesPerSkein)
    usage.set(dmcNumber, {
      stitches: stitchCount,
      skeins,
      lengthCm: Math.round(lengthCm * 10) / 10,
    })
  }
  return usage
}

/**
 * Page size definitions in mm
 */
const PAGE_SIZES: Record<string, { w: number; h: number }> = {
  a4:     { w: 297, h: 210 },
  a5:     { w: 210, h: 148 },
  letter: { w: 279.4, h: 215.9 },
  legal:  { w: 355.6, h: 215.9 },
}

/**
 * Generate a cross-stitch pattern PDF (v2 enhanced)
 * Supports: multi-page, QR codes, watermarks, page numbering, half-cross view, scale ref
 */
export async function generatePatternPDF(options: PDFGenerationOptions): Promise<Blob> {
  const {
    title, author, fabric, grid, dmcPalette, dmcUsage, showSymbols, showColorBlocks,
    backstitchLines = [],
    backstitchColor = '#1C1C1C',
    flossBrand = 'dmc',
    showLabels = true,
    labelInterval = 10,
    pageSize = 'a4',
    pageWidth: optW,
    pageHeight: optH,
    showPageNumbers = true,
    watermark,
    showHalfCross = false,
    stitchLabelInterval = 10,
    stitchSize = 2,
    qrCode,
    notes = [],
  } = options

  // Determine page dimensions
  const pageSizeDef = PAGE_SIZES[pageSize] || PAGE_SIZES['a4']
  const w = optW || pageSizeDef.w
  const h = optH || pageSizeDef.h

  const doc = new jsPDF({
    orientation: w > h ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [w, h],
  })

  const margin = 10
  const gridCols = grid[0]?.length || 1
  const gridRows = grid.length
  
  // Calculate cell size to fit on page
  const maxGridWidth = w - margin * 3
  const maxGridHeight = h - margin * 4 - 30
  const cellSize = Math.min(
    maxGridWidth / gridCols,
    maxGridHeight / gridRows,
    stitchSize * 2
  )
  
  const gridStartX = margin
  const gridStartY = 30

  // Brand display name
  const brandNames: Record<string, string> = {
    dmc: 'DMC', anchor: 'Anchor', madeira: 'Madeira', generic: 'Thread'
  }
  const brandName = brandNames[flossBrand] || 'DMC'

  // === TITLE ===
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, w / 2, 10, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Author: ${author || 'Unknown'}`, margin, 16)
  doc.text(`Fabric: ${fabric}`, margin, 21)
  doc.text(
    `${brandName}  |  Size: ${gridRows}×${gridCols} stitches  |  ${Math.round(gridRows * stitchSize)}×${Math.round(gridCols * stitchSize)} mm`,
    w - margin, 16, { align: 'right' }
  )

  // === WATERMARK ===
  if (watermark) {
    doc.setFontSize(8)
    doc.setTextColor(200)
    for (let yPos = -50; yPos < h + 50; yPos += 60) {
      doc.text(watermark, w / 2, yPos, { align: 'center', angle: -30 })
    }
    doc.setTextColor(0)
  }

  // === SYMBOL MAP ===
  const symbolMap = assignSymbols(dmcPalette)

  // === ROW/COL LABELS ===
  if (showLabels) {
    doc.setFontSize(5)
    doc.setTextColor(100)
    doc.setFont('helvetica', 'normal')
    
    // Row labels (right side)
    for (let row = 0; row < grid.length; row++) {
      const rowLabel = row + 1
      if (rowLabel % labelInterval === 0 || labelInterval === 1) {
        const y = gridStartY + row * cellSize + cellSize / 2
        doc.text(rowLabel.toString(),
          gridStartX + gridCols * cellSize + 2, y,
          { align: 'right', baseline: 'middle' })
      }
    }
    
    // Column labels (top)
    for (let col = 0; col < grid[0].length; col++) {
      const colLabel = col + 1
      if (colLabel % labelInterval === 0 || labelInterval === 1) {
        const x = gridStartX + col * cellSize + cellSize / 2
        doc.text(colLabel.toString(),
          x, gridStartY - 1,
          { align: 'center', baseline: 'bottom' })
      }
    }
  }

  // === DRAW GRID CELLS ===
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const dmcNumber = grid[row][col]
      const x = gridStartX + col * cellSize
      const y = gridStartY + row * cellSize

      if (dmcNumber !== 0) {
        const hexColor = getDMCHex(dmcNumber)
        doc.setFillColor(hexColor)
        doc.rect(x, y, cellSize, cellSize, 'F')

        if (showSymbols && symbolMap[dmcNumber]) {
          doc.setFontSize(Math.max(3, cellSize * 0.3))
          doc.setTextColor(0)
          doc.text(symbolMap[dmcNumber], x + cellSize / 2, y + cellSize / 2, {
            align: 'center', baseline: 'middle',
          })
        }

        // Half-cross view: diagonal line
        if (showHalfCross && cellSize >= 2) {
          doc.setDrawColor(0)
          doc.setLineWidth(0.1)
          doc.line(x, y, x + cellSize, y + cellSize)
        }
      } else if (showColorBlocks) {
        doc.setDrawColor(200)
        doc.setLineWidth(0.1)
        doc.rect(x, y, cellSize, cellSize)
      }

      // Stitch count labels at intervals
      if (showLabels && dmcNumber > 0 &&
          (row + 1) % stitchLabelInterval === 0 &&
          (col + 1) % stitchLabelInterval === 0) {
        doc.setFontSize(3)
        doc.setTextColor(150)
        doc.text(`${dmcNumber}`, x + cellSize / 2, y + cellSize / 2, {
          align: 'center', baseline: 'middle',
        })
      }
    }
  }

  // === BACKSTITCH LINES ===
  if (backstitchLines && backstitchLines.length > 0) {
    const bsColor = hexToRGB(backstitchColor)
    if (bsColor) {
      doc.setDrawColor(bsColor.r, bsColor.g, bsColor.b)
      for (const line of backstitchLines) {
        doc.setLineWidth(0.3 * line.lineWidth)
        doc.line(
          gridStartX + line.x1 * cellSize, gridStartY + line.y1 * cellSize,
          gridStartX + line.x2 * cellSize, gridStartY + line.y2 * cellSize
        )
      }
    }
  }

  // Grid border
  doc.setLineWidth(0.5)
  doc.setDrawColor(0)
  doc.rect(gridStartX, gridStartY, gridCols * cellSize, gridRows * cellSize)

  // === QR CODE ===
  if (qrCode) {
    // QR code box in top-right corner
    const qrSize = 12
    const qrX = w - margin - qrSize
    const qrY = margin
    doc.setFillColor("#ffffff")
    doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 'F')
    doc.setFontSize(5)
    doc.setTextColor(120)
    doc.text('QR', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' })
    // Note: actual QR image requires async generation + addImage
    // In production: const dataUrl = await generateQRCodeDataUrl({ value: qrCode })
    //                doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  }

  // === THREAD LEGEND ===
  const threadUsage = calculateThreadUsage(dmcUsage)
  let legendY = gridStartY + gridRows * cellSize + 8

  // Check if legend fits on current page
  const neededLegendSpace = dmcPalette.length * 5 + 20
  if (legendY + neededLegendSpace > h - margin) {
    doc.addPage()
    legendY = margin + 5
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`${brandName} Thread Legend`, margin, legendY)
  legendY += 4

  // Headers
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Symbol', margin, legendY)
  doc.text(brandName, margin + 12, legendY)
  doc.text('Color Name', margin + 30, legendY)
  
  const stitchesColX = w - margin - 25
  const skeinsColX = w - margin - 5
  doc.text('Stitches', stitchesColX, legendY, { align: 'right' })
  doc.text('Skeins', skeinsColX, legendY, { align: 'right' })
  
  if (flossBrand !== 'dmc') {
    doc.text('Other Brand', flossBrand === 'anchor' ? 55 : 50, legendY)
  }
  
  legendY += 2
  doc.setLineWidth(0.3)
  doc.line(margin, legendY - 1, w - margin, legendY - 1)

  // Legend entries
  doc.setFontSize(7)
  for (const dmcNumber of dmcPalette) {
    const color = getDMCColor(dmcNumber)
    const usage = threadUsage.get(dmcNumber)
    if (!color) continue
    
    const hexColor = getDMCHex(dmcNumber)
    doc.text(symbolMap[dmcNumber] || '—', margin, legendY)
    
    // Swatch
    doc.setFillColor(hexColor)
    doc.rect(stitchesColX - 30, legendY - 3, 6, 3, 'F')
    
    doc.text(`${brandName} ${dmcNumber}`, margin + 12, legendY)
    
    const name = color.name.length > 18 ? color.name.slice(0, 15) + '...' : color.name
    doc.text(name, margin + 30, legendY)
    
    // Cross-brand reference
    if (flossBrand !== 'dmc') {
      const refs = getCrossReferences(dmcNumber.toString())
      if (refs) {
        const refNum = flossBrand === 'anchor' ? refs.anchor?.number : refs.madeira?.number
        if (refNum) {
          doc.setTextColor(80)
          doc.text(refNum, margin + 55, legendY)
          doc.setTextColor(0)
        } else {
          doc.setTextColor(180)
          doc.text('—', margin + 55, legendY)
          doc.setTextColor(0)
        }
      }
    }
    
    doc.text((usage?.stitches || 0).toString(), stitchesColX, legendY, { align: 'right' })
    doc.text((usage?.skeins || 0).toString(), skeinsColX, legendY, { align: 'right' })
    
    legendY += 4.5
    
    // Page break for legend
    if (legendY > h - 20) {
      doc.addPage()
      legendY = margin + 5
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`${brandName} Thread Legend (cont.)`, margin, legendY)
      legendY += 4
      doc.setFontSize(7)
    }
  }

  // === SCALE REFERENCE ===
  if (stitchSize && stitchSize > 0) {
    let scaleY = h - margin
    if (legendY > scaleY) {
      doc.addPage()
      scaleY = margin + 5
    }
    doc.setFontSize(6)
    doc.setTextColor(100)
    doc.text(`Stitch size: ${stitchSize}mm | ${Math.round(stitchSize * 10) / 10}cm per stitch`, margin, scaleY)
    // Draw scale bar
    const barWidth = stitchSize * 10
    doc.setDrawColor(0)
    doc.setLineWidth(0.3)
    doc.line(w - margin - barWidth, scaleY - 2, w - margin, scaleY - 2)
    doc.line(w - margin - barWidth, scaleY - 3, w - margin - barWidth, scaleY - 1)
    doc.line(w - margin, scaleY - 3, w - margin, scaleY - 1)
  }

  // === PAGE NUMBERING ===
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    if (showPageNumbers) {
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`Page ${i} of ${pageCount}`, w / 2, h - 5, { align: 'center' })
    }
    doc.setFontSize(6)
    doc.setTextColor(180)
    doc.text(
      `Cross-Stitch Pattern Studio - ${new Date().toLocaleDateString()}`,
      w / 2, h - 2, { align: 'center' }
    )
  }

  // Notes & annotations section
  if (notes && notes.length > 0) {
    doc.addPage()
    const w = doc.internal.pageSize.getWidth()
    const h = doc.internal.pageSize.getHeight()
    let y = 20

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(51)
    doc.text('Notes & Annotations', w / 2, y, { align: 'center' })
    y += 12

    doc.setDrawColor(200)
    doc.setLineWidth(0.5)
    doc.line(20, y, w - 20, y)
    y += 10

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    notes.forEach((note) => {
      if (y > h - 30) {
        doc.addPage()
        y = 20
      }
      const posLabel = `R${note.row} C${note.col}`
      const truncatedText = note.text.length > 120 ? note.text.substring(0, 120) + '...' : note.text
      doc.setTextColor(120)
      doc.text(posLabel, 25, y)
      doc.setTextColor(51)
      doc.text(truncatedText, 50, y)
      y += 6
    })

    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Cross-Stitch Pattern Studio - ${new Date().toLocaleDateString()}`, w / 2, h - 5, { align: 'center' })
  }

  return doc.output('blob')
}

/**
 * Generate a shopping list PDF (with multi-brand support)
 */
export async function generateShoppingListPDF(
  dmcPalette: number[],
  dmcUsage: Map<number, number>,
  title: string,
  options?: { flossBrand?: 'dmc' | 'anchor' | 'madeira' | 'generic' }
): Promise<Blob> {
  const brandName = options?.flossBrand 
    ? (options.flossBrand === 'dmc' ? 'DMC' : options.flossBrand === 'anchor' ? 'Anchor' : options.flossBrand === 'madeira' ? 'Madeira' : 'Thread')
    : 'DMC'
    
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Shopping List', pageWidth / 2, margin + 10, { align: 'center' })
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(title, pageWidth / 2, margin + 18, { align: 'center' })

  const usage = calculateThreadUsage(dmcUsage)
  
  // Table headers
  let y = margin + 28
  doc.setFontSize(10)
  doc.text(`${brandName} #`, margin, y)
  doc.text('Color Name', margin + 40, y)
  doc.text('Stitches', pageWidth - margin - 40, y, { align: 'right' })
  doc.text('Skeins Needed', pageWidth - margin - 15, y, { align: 'right' })
  
  doc.setLineWidth(0.5)
  doc.line(margin, y + 2, pageWidth - margin, y + 2)
  y += 8

  // Entries
  for (const dmcNumber of dmcPalette) {
    const color = getDMCColor(dmcNumber)
    const u = usage.get(dmcNumber)
    if (!color || !u) continue
    
    doc.text('☐', margin - 5, y)
    doc.text(`${brandName} ${dmcNumber}`, margin, y)
    
    const hexColor = getDMCHex(dmcNumber)
    doc.setFillColor(hexColor)
    doc.rect(pageWidth - margin - 50, y - 5, 12, 6, 'F')
    doc.text(color.name, margin + 40, y)
    
    doc.text(u.stitches.toString(), pageWidth - margin - 40, y, { align: 'right' })
    doc.text(`${u.skeins} skein${u.skeins > 1 ? 's' : ''}`, pageWidth - margin - 15, y, { align: 'right' })

    // Show cross-brand alternatives
    if (options && options.flossBrand !== 'dmc') {
      const refs = getCrossReferences(dmcNumber.toString())
      if (refs) {
        const alt = options.flossBrand === 'anchor' ? refs.anchor : refs.madeira
        if (alt) {
          doc.setTextColor(120)
          doc.text(`(${brandName}: ${alt.number})`, margin + 40, y + 3)
          doc.setTextColor(0)
        }
      }
    }
    
    y += 10
    
    if (y > pageHeight - 25) {
      doc.addPage()
      y = margin + 15
    }
  }

  // Summary
  const totalSkeins = Array.from(usage.values()).reduce((sum, u) => sum + u.skeins, 0)
  y += 5
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text('Summary', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Total unique colors: ${dmcPalette.length}`, margin, y)
  doc.text(`Total skeins needed: ${totalSkeins}`, margin, y + 6)
  
  return doc.output('blob')
}
