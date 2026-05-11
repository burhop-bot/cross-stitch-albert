import { useProjectStore } from '../store/projectStore'
import { Upload, Download, FileText, Save, FolderOpen, Box, Package, QrCode, Type, Hash, Sun, Moon, Keyboard, Image, PanelRight, Undo2, Redo2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '../utils/theme'
import { generatePatternPDF, generateShoppingListPDF } from '../utils/PDFGenerator'
import { downloadProjectJSON, readFileAsText, importProjectJSON } from '../utils/projectIO'
import { emptyDesign } from '../store/projectStore'
import type { PDFGenerationOptions } from '../utils/PDFGenerator'
import { ExportPNGButton } from './ExportPNGButton'
import { ShareLinkDialog } from './ShareLinkDialog'
import { ThumbnailGallery } from './ThumbnailGallery'
import { ClearPatternDialog } from './ClearPatternDialog'


interface HeaderProps {
  onImport?: () => void
  onToggle3D?: () => void
  show3D?: boolean
  onToggleInventory?: () => void
  showInventory?: boolean
}

export function Header({ onImport, onToggle3D, show3D, onToggleInventory, showInventory }: HeaderProps) {
  const project = useProjectStore((state) => state.settings)
  const panels = useProjectStore((state) => state.panels)
  const currentGrid = useProjectStore((state) => state.currentGrid)
  const dmcPalette = useProjectStore((state) => state.dmcPalette)
  const dmcUsage = useProjectStore((state) => state.dmcUsage)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showAdvancedExport, setShowAdvancedExport] = useState(false)
  const [showShareLink, setShowShareLink] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const exportMenuRef2 = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const onboardingRef = useRef<HTMLButtonElement>(null)
  
  // Enhanced export options
  const [pageFormat, setPageFormat] = useState<'a4' | 'a5' | 'letter' | 'legal'>('a4')
  const [showSymbols, setShowSymbols] = useState(true)
  const [showHalfCross, setShowHalfCross] = useState(false)
  const [showWatermark, setShowWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState('')
  const [showQrCode, setShowQrCode] = useState(false)
  const [showStitchLabels, setShowStitchLabels] = useState(false)
  const [stitchLabelInterval, setStitchLabelInterval] = useState<1 | 5 | 10>(10)
  const [stitchSize, setStitchSize] = useState(2) // mm per stitch
  const completed = useProjectStore((s) => s.onboardingCompleted)
  const showClearPattern = useProjectStore((s) => s.showClearPatternDialog)
  const setShowClearPattern = useProjectStore((s) => s.setShowClearPatternDialog)
  const selectedPanelId = useProjectStore((s) => s.selectedPanelId)
  const undoStack = useProjectStore((s) => s.undoStack)
  const redoStack = useProjectStore((s) => s.redoStack)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportPattern = async (options?: Partial<PDFGenerationOptions>) => {
    if (!currentGrid || dmcPalette.length === 0) {
      alert('No pattern data to export. Import an image or create a design first.')
      return
    }

    const flossBrand = useProjectStore.getState().flossBrand || 'dmc'
    
    const pdfOptions: PDFGenerationOptions = {
      title: project.title,
      author: project.author || 'Anonymous',
      fabric: project.fabric,
      grid: currentGrid,
      dmcPalette,
      dmcUsage: dmcUsage || new Map(),
      showSymbols: showSymbols,
      showColorBlocks: true,
      flossBrand,
      pageSize: pageFormat,
      showHalfCross: showHalfCross,
      watermark: showWatermark ? watermarkText : undefined,
      qrCode: showQrCode ? `cross-stitch-studio.io/p/${project.title.replace(/\s+/g, '_')}` : undefined,
      stitchLabelInterval: showStitchLabels ? stitchLabelInterval : 10,
      stitchSize,
      showPageNumbers: true,
      showLabels: true,
      labelInterval: 10,
      ...options,
    }

    try {
      const blob = await generatePatternPDF(pdfOptions)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title.replace(/\s+/g, '_')}_pattern_${pageFormat}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. See console for details.')
    }
  }

  const handleExportShoppingList = async () => {
    if (dmcPalette.length === 0) {
      alert('No color palette to export.')
      return
    }

    const flossBrand = useProjectStore.getState().flossBrand || 'dmc'
    
    try {
      const blob = await generateShoppingListPDF(
        dmcPalette,
        dmcUsage || new Map(),
        project.title,
        { flossBrand }
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project.title.replace(/\s+/g, '_')}_shopping_list.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setShowExportMenu(false)
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate shopping list. See console for details.')
    }
  }

  const handleSaveProject = () => {
    const flossBrand = useProjectStore.getState().flossBrand || 'dmc'
    downloadProjectJSON(
      { ...project, panels, flossBrand },
      currentGrid,
      dmcPalette,
      dmcUsage || new Map()
    )
    setShowFileMenu(false)
  }

  const handleLoadProject = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const json = await readFileAsText(file)
      const imported = importProjectJSON(json)

      if (!imported) {
        alert('Failed to load project. Invalid file format.')
        return
      }

      // Update store with imported data
      const s = useProjectStore.getState()

      // Update project settings
      s.setProjectSettings({
        title: imported.project.title || 'Untitled',
        author: imported.project.author || '',
        fabric: imported.project.fabric || '14-count Aida',
      })

      // Update panels if present
      if (imported.project && imported.project.panels && imported.project.panels.length > 0) {
        const currentW = s.settings.width
        const currentH = s.settings.height
        const makeEmptyDesign = () =>
          Array(currentH).fill(null).map(() => Array(currentW).fill(0))
        useProjectStore.setState((state) => ({
          panels: imported.project.panels.map((p: any) => ({
            ...p,
            design: p.design || makeEmptyDesign(),
          })),
        }))
      }

      if (imported.grid) {
        s.setGrid(imported.grid)
      }

      if (imported.dmcPalette && imported.dmcPalette.length > 0) {
        const colors = imported.dmcPalette.map((num) => ({
          number: num,
          name: `DMC ${num}`,
          hex: '#000000',
        }))
        s.addDMCColors(colors)
      }

      if (imported.dmcUsage && typeof imported.dmcUsage === 'object') {
        const usageMap = new Map(Object.entries(imported.dmcUsage).map(([k, v]) => [parseInt(k), v]))
        s.setDMCUsage(usageMap)
      }

      alert(`Project "${imported.project.title}" loaded successfully!`)
      setShowFileMenu(false)
    } catch (error) {
      console.error('Failed to load project:', error)
      alert('Failed to load project file.')
    }

    // Reset input for re-loading same file
    event.target.value = ''
  }

  const handleToggle3D = () => {
    onToggle3D?.()
  }

  return (
    <header className="h-14 bg-indigo-600 text-white flex items-center justify-between px-4 shadow-md z-30">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold">Cross-Stitch Studio</h1>
        <span className="ml-4 text-sm opacity-80">{project.title}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          >
            <Save size={16} />
            File
          </button>
          
          {showFileMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={handleSaveProject}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
              >
                <Save size={16} className="text-indigo-600" />
                <span>Save Project</span>
              </button>
              <button
                onClick={handleLoadProject}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
              >
                <FolderOpen size={16} className="text-indigo-600" />
                <span>Load Project</span>
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => setShowClearPattern(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 transition-colors"
              >
                <Box size={16} className="text-red-500" />
                <span>Clear Pattern</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>
        
        <button
          onClick={onImport}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
        >
          <Upload size={16} />
          Import Image
        </button>
        
        {onToggle3D && (
          <button
            onClick={handleToggle3D}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              show3D 
                ? 'bg-indigo-800 text-white' 
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Toggle 3D View"
          >
            <Box size={16} />
            3D View
          </button>
        )}
        
        {onToggleInventory && (
          <button
            onClick={onToggleInventory}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
              showInventory 
                ? 'bg-indigo-800 text-white' 
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Toggle Inventory"
          >
            <Package size={16} />
            Inventory
          </button>
        )}
        
        {/* Theme toggle */}
        <ThemeToggle />
        
        {/* Panel toggle — opens right panel on desktop */}
        <button
          onClick={() => {
            const s = useProjectStore.getState()
            if (s.activeRightPanel) {
              s.setActiveRightPanel(null)
            } else {
              s.setActiveRightPanel('settings')
            }
          }}
          className="flex items-center gap-2 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          title="Toggle right panel"
          aria-label="Toggle right panel"
        >
          <PanelRight size={16} />
          Panel
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          title="Undo"
          aria-label="Undo"
          disabled={undoStack.length === 0}
        >
          <Undo2 size={16} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          title="Redo"
          aria-label="Redo"
          disabled={redoStack.length === 0}
        >
          <Redo2 size={16} />
        </button>

        {/* Keyboard shortcuts — dispatches event for App to handle */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('cross-stitch-shortcuts'))}
          className="flex items-center gap-2 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          title="Keyboard shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard size={16} />
        </button>

        {/* Onboarding */}
        {!completed && (
          <button
            ref={onboardingRef}
            onClick={() => window.dispatchEvent(new CustomEvent('cross-stitch-onboarding'))}
            className="flex items-center gap-2 px-2 py-1.5 bg-yellow-400/30 hover:bg-yellow-400/50 rounded-md transition-colors text-sm font-medium text-yellow-100"
            title="Onboarding tour"
            aria-label="Start onboarding tour"
          >
            🧵 Tour
          </button>
        )}

        {/* Thumbnail gallery */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('cross-stitch-thumbnails'))}
          className="flex items-center gap-2 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          title="Thumbnail gallery"
          aria-label="Show thumbnail gallery"
        >
          <Image size={16} />
        </button>

        {/* Share link */}
        <button
          onClick={() => setShowShareLink(true)}
          className="flex items-center gap-2 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          title="Share pattern link"
          aria-label="Share pattern link"
        >
          <QrCode size={16} />
          Share
        </button>

        {/* Export PNG */}
        <ExportPNGButton />
        
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
          >
            <Download size={16} />
            Export
          </button>
          
          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
              ref={exportMenuRef2}>
              {/* Pattern PDF Export */}
              <button
                onClick={() => {
                  handleExportPattern()
                  setShowExportMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
                title="Export Pattern PDF"
              >
                <FileText size={16} className="text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">Pattern PDF</div>
                  <div className="text-xs text-gray-500">Chart with symbols & legend</div>
                </div>
              </button>
              
              {/* Advanced export options */}
              <div className="px-4 py-2 border-t border-gray-100 space-y-3">
                <button
                  onClick={() => setShowAdvancedExport(!showAdvancedExport)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  {showAdvancedExport ? '▾' : '▸'} Export Options
                </button>
                
                {showAdvancedExport && (
                  <div className="space-y-3 pt-1 border-t border-gray-100">
                    {/* Page size */}
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Page Size</label>
                      <select
                        value={pageFormat}
                        onChange={(e) => setPageFormat(e.target.value as typeof pageFormat)}
                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                      >
                        <option value="a4">A4 (210×297mm)</option>
                        <option value="a5">A5 (148×210mm)</option>
                        <option value="letter">Letter (8.5×11")</option>
                        <option value="legal">Legal (8.5×14")</option>
                      </select>
                    </div>
                    
                    {/* Stitch size */}
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Stitch Size (mm)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.5"
                        value={stitchSize}
                        onChange={(e) => setStitchSize(parseFloat(e.target.value) || 2)}
                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                      />
                    </div>
                    
                    {/* Symbols toggle */}
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={showSymbols}
                        onChange={(e) => setShowSymbols(e.target.checked)}
                        className="rounded"
                      />
                      Show symbols
                    </label>
                    
                    {/* Half-cross view */}
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={showHalfCross}
                        onChange={(e) => setShowHalfCross(e.target.checked)}
                        className="rounded"
                      />
                      Half-cross print view
                    </label>
                    
                    {/* Stitch count labels */}
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={showStitchLabels}
                        onChange={(e) => setShowStitchLabels(e.target.checked)}
                        className="rounded"
                      />
                      Show stitch count labels
                    </label>
                    
                    {showStitchLabels && (
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Label Interval</label>
                        <select
                          value={stitchLabelInterval}
                          onChange={(e) => setStitchLabelInterval(e.target.value as unknown as 1 | 5 | 10)}
                          className="w-full px-2 py-1 text-xs border rounded bg-white"
                        >
                          <option value={1}>Every stitch</option>
                          <option value={5}>Every 5</option>
                          <option value={10}>Every 10</option>
                        </select>
                      </div>
                    )}
                    
                    {/* Watermark */}
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={showWatermark}
                        onChange={(e) => setShowWatermark(e.target.checked)}
                        className="rounded"
                      />
                      Add watermark
                    </label>
                    
                    {showWatermark && (
                      <input
                        type="text"
                        placeholder="Watermark text..."
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded bg-white"
                      />
                    )}
                    
                    {/* QR Code */}
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                        className="rounded"
                      />
                      Include QR code
                    </label>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-100 my-1"></div>
              
              {/* Shopping List */}
              <button
                onClick={handleExportShoppingList}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
              >
                <FileText size={16} className="text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">Shopping List</div>
                  <div className="text-xs text-gray-500">Thread checklist & estimates</div>
                </div>
              </button>
              
              {/* Written Instructions */}
              <button
                onClick={() => {
                  useProjectStore.getState().setActiveRightPanel('instructions')
                  setShowExportMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
              >
                <Type size={16} className="text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">Written Instructions</div>
                  <div className="text-xs text-gray-500">Row-by-row text description</div>
                </div>
              </button>
              
              {/* Progress */}
              <button
                onClick={() => {
                  useProjectStore.getState().setActiveRightPanel('progress')
                  setShowExportMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
              >
                <Hash size={16} className="text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">Progress Tracker</div>
                  <div className="text-xs text-gray-500">Mark stitches as complete</div>
                </div>
              </button>
              
              {/* QR Code Info */}
              <button
                onClick={async () => {
                  try {
                    const { generateQRCodeDataUrl } = await import('../utils/qrCode')
                    const dataUrl = await generateQRCodeDataUrl({
                      value: `cross-stitch-studio.io/p/${project.title.replace(/\s+/g, '_')}`,
                      size: 256,
                    })
                    // Open in new tab for download
                    const win = window.open()
                    if (win) {
                      win.document.write(`<img src="${dataUrl}" style="max-width:100%"/><p style="text-align:center;font-family:sans-serif;font-size:12px">Scan to view pattern online</p>`)
                    }
                  } catch (e) {
                    console.error('QR generation failed:', e)
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-indigo-50 transition-colors"
              >
                <QrCode size={16} className="text-indigo-600" />
                <div>
                  <div className="font-medium text-gray-900">QR Code</div>
                  <div className="text-xs text-gray-500">Download QR for phone viewing</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phase 20: Share link dialog */}
      {showShareLink && <ShareLinkDialog onClose={() => setShowShareLink(false)} />}

      {/* Phase 20: Thumbnail gallery */}
      <ThumbnailGallery onClose={() => useProjectStore.getState().setShowThumbnailGallery(false)} />

      {/* Phase 21: Clear pattern dialog */}
      {showClearPattern && (
        <ClearPatternDialog
          onClose={() => setShowClearPattern(false)}
          onClear={() => {
            const selId = useProjectStore.getState().selectedPanelId ?? 0
            useProjectStore.getState().clearCurrentPanel(selId)
          }}
          panelName={panels.find((p) => p.id === selectedPanelId)?.name || 'current panel'}
        />
      )}
    </header>
  )
}

// ─── Theme Toggle Button Component ───────────────────────────────────
function ThemeToggle() {
  const { mode, isDark, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-1.5 px-2 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
