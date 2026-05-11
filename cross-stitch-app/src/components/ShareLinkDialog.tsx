import { useState } from 'react'
import { useProjectStore } from '../store/projectStore'
import { Copy, Check, Link as LinkIcon } from 'lucide-react'

export function ShareLinkDialog({ onClose }: { onClose: () => void }) {
  const generateUrl = useProjectStore((s) => s.generateShareUrl)
  const shareUrl = useProjectStore((s) => s.shareUrl)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = () => {
    try {
      const url = generateUrl()
      if (!url) {
        setError('Failed to generate share link.')
      } else {
        setError(null)
      }
    } catch (e) {
      setError('An error occurred: ' + (e as Error).message)
    }
  }

  const handleCopy = () => {
    const url = shareUrl || ''
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      setError('Failed to copy to clipboard.')
    })
  }

  const handleOpen = () => {
    const url = shareUrl || ''
    if (url) window.open(url, '_blank')
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <LinkIcon className="h-5 w-5 text-indigo-500" />
          Share Pattern Link
        </h2>

        {!shareUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate a shareable link that includes your pattern data. The URL encodes your pattern as base64.
            </p>
            <button
              onClick={handleGenerate}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Generate Link
            </button>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Your Share Link</p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 overflow-hidden text-ellipsis text-xs text-indigo-600">
                  {shareUrl.length > 80 ? shareUrl.slice(0, 80) + '…' : shareUrl}
                </code>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 rounded-md p-1.5 text-gray-500 transition hover:bg-gray-200 ${
                    copied ? 'text-green-600' : ''
                  }`}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpen}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                Open in New Tab
              </button>
              <button
                onClick={handleGenerate}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Regenerate
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Anyone with the link can open your pattern in Cross-Stitch Studio.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
