import { useState } from 'react'
import { useProjectStore } from '../store/projectStore'

interface Step {
  title: string
  description: string
  target: string
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Cross-Stitch Studio! 🧵',
    description: 'This is your professional-grade tool for creating cross-stitch patterns. Let us show you the essentials.',
    target: '',
  },
  {
    title: 'The Grid Editor',
    description:
      'The main canvas is your stitch grid. Use the tools in the toolbar above to draw, fill, and edit your pattern. Multi-weight grid lines (every 5/10 stitches) help you count easily.',
    target: '.grid-canvas-container',
  },
  {
    title: 'Color Palette',
    description:
      'Select colors from the sidebar palette. The panel shows the currently selected floss brand (DMC, Anchor, or Madeira). Click a swatch to pick a color.',
    target: '.sidebar-panel',
  },
  {
    title: 'Drawing Tools',
    description:
      'Pencil for single stitches, eraser to clear, flood-fill for regions. The Advanced tools group has line, rectangle, circle, brush, dropper, and select tools.',
    target: '.toolbar-tools',
  },
  {
    title: 'Image Conversion',
    description:
      'Import a photo and convert it to a cross-stitch chart using K-Means color quantization and dithering algorithms. Go to the right panel to try it.',
    target: '.right-panel',
  },
  {
    title: 'Export & Share',
    description:
      'Export your pattern as PDF (with thread legend, multi-page support, QR codes) or share via a web link. Use the Header menu for these options.',
    target: '.header-actions',
  },
  {
    title: "You're Ready! ✨",
    description: 'Start creating. Your work auto-saves to your browser. Happy stitching!',
    target: '',
  },
]

export function OnboardingTour({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0)
  const completed = useProjectStore((s) => s.onboardingCompleted)
  const setCompleted = useProjectStore((s) => s.setOnboardingCompleted)

  if (completed) return null

  const total = STEPS.length
  const current = STEPS[step]

  const handleNext = () => {
    if (step < total - 1) {
      setStep(step + 1)
    } else {
      setCompleted(true)
      onClose?.()
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleNext()
      }}
    >
      <div className="mx-4 max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === step ? 'bg-indigo-500' : i < step ? 'bg-indigo-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h2 className="mb-3 text-2xl font-bold text-gray-900">{current.title}</h2>
        <p className="mb-6 text-gray-600 leading-relaxed">{current.description}</p>

        {/* Pattern repeat / mirror visual hint for step 4 */}
        {step === 3 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
            <span>💡</span> Press <kbd className="rounded bg-white px-1.5 py-0.5 text-xs font-mono shadow">1</kbd>–<kbd className="rounded bg-white px-1.5 py-0.5 text-xs font-mono shadow">9</kbd> to select tools quickly
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 disabled:opacity-30"
          >
            Back
          </button>

          <span className="text-xs text-gray-400">
            {step + 1} / {total}
          </span>

          <button
            onClick={handleNext}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            {step === total - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
