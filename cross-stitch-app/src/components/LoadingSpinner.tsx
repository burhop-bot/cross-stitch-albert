/**
 * Loading spinner and progress overlay for image conversion and large operations.
 */

import { Loader2, Upload, CheckCircle2 } from 'lucide-react'

interface LoadingSpinnerProps {
  visible: boolean
  message?: string
  progress?: number // 0-100
  done?: boolean
}

export function LoadingSpinner({ visible, message = 'Processing...', progress, done }: LoadingSpinnerProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200">
        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-semibold text-gray-800">Complete!</p>
            <p className="text-sm text-gray-500">{message || 'Processing finished'}</p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
              {progress !== undefined && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span>
                </div>
              )}
            </div>
            <p className="text-sm font-medium text-gray-700">{message}</p>
            {progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Quick inline spinner for small contexts (no overlay).
 */
export function InlineSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-4 h-4 animate-spin ${className}`} />
}
