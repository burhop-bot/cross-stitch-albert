import { useState, useRef } from 'react'
import { useProjectStore } from '../store/projectStore'
import { Settings, Upload, Package, X, Target, FileText, Palette, StickyNote, Grid3X3 } from 'lucide-react'
import { SettingsPanel } from './SettingsPanel'
import { ImageConversionPanel } from './ImageConversionPanel'
import { ImageConversionPanelV2 } from './ImageConversionPanelV2'
import { InventoryPanel } from './InventoryPanel'
import { ProgressTracker } from './ProgressTracker'
import { SymbolLegendPanel } from './SymbolLegendPanel'
import { NotesPanel } from './NotesPanel'
import { WrittenInstructionsPanel } from './WrittenInstructionsPanel'
import { PatternLibrary } from './PatternLibrary'

type TabId = 'settings' | 'import' | 'conversion' | 'conversion-v2' | 'inventory' | 'progress' | 'instructions' | 'symbols' | 'notes' | 'library'

const tabs: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: 'settings', label: 'Project', icon: Settings },
  { id: 'symbols', label: 'Symbols', icon: Palette },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'conversion', label: 'Convert V1', icon: Upload },
  { id: 'conversion-v2', label: 'Convert V2', icon: Upload },
  { id: 'progress', label: 'Progress', icon: Target },
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'library', label: 'Library', icon: Grid3X3 },
]

export function RightPanel({ activeTab, onClose }: { activeTab: TabId; onClose: () => void }) {
  const currentImage = useProjectStore((state) => state.currentImage)

  const renderPanel = () => {
    switch (activeTab) {
      case 'settings':
        return <SettingsPanel />
      case 'import':
        return <ImageUploader onDone={() => {}} />
      case 'conversion':
        if (!currentImage) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
              <Upload className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm text-center">
                Import an image first, then return here to convert it.
              </p>
              <button
                onClick={() => {
                  const { setActiveRightPanel } = useProjectStore.getState()
                  setActiveRightPanel('import')
                }}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
              >
                Go to Import
              </button>
            </div>
          )
        }
        return <ImageConversionPanel />
      case 'conversion-v2':
        return (
          <ImageConversionPanelV2
            onApply={(result) => {
              const s = useProjectStore.getState()
              // Update grid settings
              s.setGridDimensions(result.stitchWidth, result.stitchHeight)
              s.setGrid(result.grid)
              s.setActiveRightPanel(null)
            }}
            onCancel={() => {
              useProjectStore.getState().setActiveRightPanel(null)
            }}
          />
        )
      case 'progress':
        return <ProgressTracker />
      case 'instructions':
        return <WrittenInstructionsPanel />
      case 'inventory':
        return <InventoryPanel />
      case 'symbols':
        return <SymbolLegendPanel />
      case 'notes':
        return <NotesPanel />
      case 'library':
        return <PatternLibrary />
      default:
        return null
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              const { setActiveRightPanel } = useProjectStore.getState()
              setActiveRightPanel(tab.id)
            }}
            className={`flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Close button */}
      <div className="flex justify-end p-2">
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderPanel()}
      </div>
    </div>
  )
}

function ImageUploader({ onDone }: { onDone: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setImage, clearImage } = useProjectStore()

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG or PNG)')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        setImage(result, file.name, img.width, img.height)
        setPreviewUrl(result)
        setFileName(file.name)
        const { setActiveRightPanel } = useProjectStore.getState()
        setActiveRightPanel('conversion')
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClear = () => {
    setPreviewUrl(null)
    setFileName('')
    clearImage()
  }

  return (
    <div className="p-4">
      {!previewUrl ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
          />
          <Upload className="mx-auto text-gray-400 mb-3" size={40} />
          <p className="text-sm font-medium text-gray-600">
            Drag & drop an image here
          </p>
          <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-2">Supports JPG, PNG, GIF, WebP</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-contain bg-gray-100 rounded-lg border"
            />
            <button
              onClick={handleClear}
              className="absolute top-1 right-1 p-1 bg-white rounded-full shadow text-gray-500 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
          <div className="text-sm text-gray-600 truncate">{fileName}</div>
          <button
            onClick={() => {
              const { setActiveRightPanel } = useProjectStore.getState()
              setActiveRightPanel('conversion')
            }}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Continue to Conversion
          </button>
        </div>
      )}
    </div>
  )
}
