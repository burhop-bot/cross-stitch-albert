import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { useProjectStore } from '../store/projectStore'

interface ImageUploaderProps {
  onClose?: () => void
}

export function ImageUploader({ onClose }: ImageUploaderProps) {
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
    if (onClose) onClose()
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Import Image</h2>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {!previewUrl ? (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={handleButtonClick}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="hidden"
            />
            <Upload className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600 mb-2">
              Drag and drop an image here, or click to browse
            </p>
            <p className="text-sm text-gray-400">
              Supports JPG and PNG files
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-contain bg-gray-100 rounded-lg"
              />
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon size={16} />
              <span>{fileName}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClear}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Close the modal and trigger the conversion workflow
                  if (onClose) onClose()
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue to Conversion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
