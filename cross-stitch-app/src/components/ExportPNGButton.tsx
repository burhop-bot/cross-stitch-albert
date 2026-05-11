import { useState, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import { getAllDMCColors } from '../utils/dmcColors'

const paletteHex = (colorIndex: number): string => {
  const dmc = getAllDMCColors()
  if (colorIndex >= 0 && colorIndex < dmc.length) return dmc[colorIndex].hex
  return '#ffffff'
}

export function ExportPNGButton() {
  const inProgress = useProjectStore((s) => s.exportPngInProgress)
  const setInProgress = useProjectStore((s) => s.setExportPngInProgress)
  const panels = useProjectStore((s) => s.panels)
  const palette = useProjectStore((s) => s.dmcPalette)
  const title = useProjectStore((s) => s.settings.title)
  const cellSize = 4 // px per stitch in PNG export

  const handleExport = useCallback(async () => {
    setInProgress(true)
    try {
      // Use the canvas renderer to generate a high-quality PNG
      const panel = panels[0]
      if (!panel) {
        setInProgress(false)
        return
      }

      const design = panel.design
      const rows = design.length
      const cols = design[0]?.length ?? 0
      const padding = 40
      const headerHeight = 50

      // Create canvas
      const canvas = document.createElement('canvas')
      const w = cols * cellSize + padding * 2
      const h = rows * cellSize + padding * 2 + headerHeight
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setInProgress(false)
        return
      }

      // Background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)

      // Header
      ctx.fillStyle = '#4f46e5'
      ctx.fillRect(0, 0, w, headerHeight)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(title || 'Pattern', padding, 32)
      ctx.font = '12px sans-serif'
      ctx.fillStyle = '#e0e7ff'
      ctx.fillText(`${cols}×${rows} stitches`, w - padding - 120, 32)

      // Grid cells
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const colorIdx = design[y][x]
          const hex = paletteHex(colorIdx)
          ctx.fillStyle = hex
          ctx.fillRect(
            padding + x * cellSize,
            padding + headerHeight + y * cellSize,
            cellSize,
            cellSize
          )
        }
      }

      // Grid lines (every 5/10)
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= cols; x++) {
        ctx.beginPath()
        ctx.moveTo(padding + x * cellSize, padding + headerHeight)
        ctx.lineTo(padding + x * cellSize, padding + headerHeight + rows * cellSize)
        ctx.stroke()
      }
      for (let y = 0; y <= rows; y++) {
        ctx.beginPath()
        ctx.moveTo(padding, padding + headerHeight + y * cellSize)
        ctx.lineTo(padding + cols * cellSize, padding + headerHeight + y * cellSize)
        ctx.stroke()
      }

      // Heavy lines every 10
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 1
      for (let x = 0; x <= cols; x += 10) {
        ctx.beginPath()
        ctx.moveTo(padding + x * cellSize, padding + headerHeight)
        ctx.lineTo(padding + x * cellSize, padding + headerHeight + rows * cellSize)
        ctx.stroke()
      }
      for (let y = 0; y <= rows; y += 10) {
        ctx.beginPath()
        ctx.moveTo(padding, padding + headerHeight + y * cellSize)
        ctx.lineTo(padding + cols * cellSize, padding + headerHeight + y * cellSize)
        ctx.stroke()
      }

      // Download
      const link = document.createElement('a')
      link.download = `${title || 'pattern'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setInProgress(false)
    }
  }, [panels, palette, title, cellSize, setInProgress])

  return (
    <button
      onClick={handleExport}
      disabled={inProgress}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
      title="Export pattern as PNG image"
    >
      {inProgress ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      ) : (
        <span className="text-lg">🖼️</span>
      )}
      <span>Export PNG</span>
    </button>
  )
}
