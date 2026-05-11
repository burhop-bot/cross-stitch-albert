import { useState, useCallback } from 'react'
import { useProjectStore } from '../store/projectStore'
import {
  Search,
  Grid3X3,
  Star,
  Download,
  Upload,
  X,
  Filter,
  Tag,
  BookmarkPlus,
  Eye,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react'
import {
  PATTERN_CATEGORIES,
  DIFFICULTY_LEVELS,
  type PatternItem,
  type PatternReview,
} from '../types/patternLibrary'
import {
  generatePatternId,
  generateThumbnail,
  filterPatterns,
  createPatternExport,
  downloadPatternJSON,
  parsePatternJSON,
  generateShareURL,
} from '../utils/patternLibrary'

// ─── Star Rating Display ───────────────────────────────────────────────────────

function StarRating({ rating, size = 14, interactive = false, onRate }: {
  rating: number
  size?: number
  interactive?: boolean
  onRate?: (stars: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = interactive ? star <= (hover || rating) : star <= Math.round(rating)
        const empty = interactive ? star > (hover || rating) : star > Math.ceil(rating)
        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={`${
                filled
                  ? 'text-amber-400 fill-amber-400'
                  : empty
                    ? 'text-gray-300'
                    : 'text-amber-300 fill-amber-300'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Review Item ───────────────────────────────────────────────────────────────

function PreviewGrid({ grid }: { grid: number[][] }) {
  const w = grid[0]?.length ?? 0
  const h = grid.length
  if (w === 0 || h === 0) return null
  const scale = Math.min(60 / Math.max(w, h), 1)
  const tw = Math.max(1, Math.round(w * scale))
  const th = Math.max(1, Math.round(h * scale))
  const colors = ['#ff9999','#99ccff','#ccff99','#ffcc99','#cc99ff','#ffff99','#99ffcc','#ff99ff','#cccccc','#999999']
  return (
    <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${tw}, 1fr)`, gridTemplateRows: `repeat(${th}, 1fr)`, width: `${tw}px`, height: `${th}px` }}>
      {Array.from({ length: th }, (_, y) =>
        Array.from({ length: tw }, (_, x) => {
          const gy = Math.min(Math.floor((y + 0.5) / th * h), h - 1)
          const gx = Math.min(Math.floor((x + 0.5) / tw * w), w - 1)
          const colorIdx = Math.min(Math.abs(grid[gy]?.[gx] ?? 0), colors.length - 1)
          return <div key={`${x}-${y}`} style={{ backgroundColor: colors[colorIdx] }} className="w-full h-full" />
        })
      )}
    </div>
  )
}

function ReviewItem({ review, onHelpful }: {
  review: PatternReview
  onHelpful?: (reviewId: string) => void
}) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <div className="flex items-start justify-between">
        <div>
          <span className="font-medium text-sm text-gray-900">{review.author}</span>
          <StarRating rating={review.rating} size={12} />
        </div>
        <span className="text-[10px] text-gray-400">
          {new Date(review.date).toLocaleDateString()}
        </span>
      </div>
      <p className="text-xs text-gray-700 mt-1">{review.comment}</p>
      {review.design && (
        <div className="mt-2">
          <div className="max-w-[60px] max-h-[60px] rounded border overflow-hidden bg-gray-50">
            <PreviewGrid grid={review.design} />
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onHelpful?.(review.id)}
          className="text-[10px] text-gray-400 hover:text-indigo-600 flex items-center gap-1"
        >
          <ThumbsUp size={10} />
          {review.helpful > 0 && review.helpful} helpful
        </button>
      </div>
    </div>
  )
}

// ─── Review Form ───────────────────────────────────────────────────────────────

function ReviewForm({ onSubmit }: { onSubmit: (review: Omit<PatternReview, 'id' | 'date' | 'helpful'>) => void }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (rating === 0) { setError('Please select a star rating'); return }
    if (comment.trim().length < 5) { setError('Comment must be at least 5 characters'); return }
    if (!name.trim()) { setError('Please enter your name'); return }
    onSubmit({ author: name.trim(), rating, comment: comment.trim() })
    setRating(0)
    setComment('')
    setName('')
    setError('')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Your rating:</span>
        <StarRating rating={rating} interactive onRate={setRating} />
      </div>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <textarea
        placeholder="Share your experience stitching this pattern…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-xs border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
      />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
      >
        Submit Review
      </button>
    </div>
  )
}

// ─── Upload Panel ──────────────────────────────────────────────────────────────

function UploadPanel({ onUpload, onClose }: { onUpload: (file: File) => void; onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useState<HTMLInputElement | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onUpload(file)
  }, [onUpload])

  return (
    <div className="p-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
        <p className="text-sm font-medium text-gray-700">Drop a Pattern JSON file here</p>
        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
        <input
          ref={(el) => { fileRef[0] = el }}
          type="file"
          accept=".json,application/json"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef[0]?.click()}
          className="mt-3 px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
        >
          Browse Files
        </button>
      </div>
      <button
        onClick={onClose}
        className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 py-1"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Pattern Detail View ───────────────────────────────────────────────────────

function PatternDetail({ pattern, onClose }: { pattern: PatternItem; onClose: () => void }) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviews, setReviews] = useState(pattern.reviews)

  const meta = pattern.metadata
  const { setGrid, setDMCUsage, setSelectedPanelId, setActiveRightPanel } = useProjectStore()

  const handleOpenInEditor = () => {
    setGrid(pattern.grid)
    setDMCUsage(new Map())
    setSelectedPanelId(0)
    setActiveRightPanel('settings')
    onClose()
  }

  const handleExportWithMetadata = () => {
    const exportData = createPatternExport(meta, pattern.grid, pattern.palette)
    downloadPatternJSON(exportData, meta.title)
  }

  const handleAddReview = (review: Omit<PatternReview, 'id' | 'date' | 'helpful'>) => {
    const newReview: PatternReview = {
      ...review,
      id: `review_${Date.now()}`,
      date: new Date().toISOString(),
      helpful: 0,
    }
    const updatedReviews = [...reviews, newReview]
    const totalReviews = pattern.rating.totalReviews + 1
    const newAverage =
      (pattern.rating.average * pattern.rating.totalReviews + review.rating) / totalReviews
    setReviews(updatedReviews)
  }

  const handleReviewHelpful = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
    )
  }

  const diffColor = {
    beginner: 'text-green-600 bg-green-50',
    intermediate: 'text-amber-600 bg-amber-50',
    advanced: 'text-orange-600 bg-orange-50',
    expert: 'text-red-600 bg-red-50',
  }[meta.difficulty]

  const shareURL = generateShareURL(pattern)

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInEditor}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
          >
            <Eye size={12} />
            Open in Editor
          </button>
          <button
            onClick={handleExportWithMetadata}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      {pattern.thumbnailUrl && (
        <div className="flex justify-center py-3 bg-gray-50">
          <img src={pattern.thumbnailUrl} alt={meta.title} className="max-w-[200px] rounded shadow-sm border" />
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-3 space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{meta.title}</h2>
          <p className="text-xs text-gray-500">by {meta.author || meta.designer || 'Anonymous'}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs">
          <StarRating rating={meta.difficulty === 'beginner' ? 4.5 : 4} size={14} />
          <span className="text-gray-500">({pattern.rating.totalReviews} reviews)</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{pattern.downloadCount} downloads</span>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Difficulty</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${diffColor}`}>
              {meta.difficulty}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Size</span>
            <span className="ml-1 text-gray-900">{meta.stitchCount.width}×{meta.stitchCount.height}</span>
          </div>
          <div>
            <span className="text-gray-500">Colors</span>
            <span className="ml-1 text-gray-900">{meta.colorCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Fabric</span>
            <span className="ml-1 text-gray-900">{meta.fabric}</span>
          </div>
          <div>
            <span className="text-gray-500">Brand</span>
            <span className="ml-1 text-gray-900">{meta.flossBrand}</span>
          </div>
          <div>
            <span className="text-gray-500">Est. Hours</span>
            <span className="ml-1 text-gray-900">{meta.estimatedHours || '—'}</span>
          </div>
        </div>

        {/* Tags */}
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {meta.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full flex items-center gap-0.5">
                <Tag size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {meta.description && (
          <p className="text-xs text-gray-700 leading-relaxed">{meta.description}</p>
        )}

        {/* Share */}
        <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-50 px-2 py-1.5 rounded">
          <span>Share:</span>
          <code className="flex-1 truncate">{shareURL}</code>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t mt-4">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1">
            <MessageSquare size={14} />
            Reviews ({reviews.length})
          </h3>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {showReviewForm && (
          <div className="px-4 pb-3">
            <ReviewForm onSubmit={handleAddReview} />
          </div>
        )}

        <div className="px-4 pb-4 space-y-3">
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <ReviewItem key={r.id} review={r} onHelpful={handleReviewHelpful} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pattern Card ──────────────────────────────────────────────────────────────

function PatternCard({ pattern, onClick }: { pattern: PatternItem; onClick: () => void }) {
  const meta = pattern.metadata
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden group"
    >
      {/* Thumbnail */}
      {pattern.thumbnailUrl ? (
        <div className="h-32 bg-gray-50 overflow-hidden">
          <img
            src={pattern.thumbnailUrl}
            alt={meta.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      ) : (
        <div className="h-32 bg-gray-100 flex items-center justify-center">
          <Grid3X3 size={32} className="text-gray-300" />
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{meta.title}</h3>
          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded shrink-0">
            {meta.stitchCount.width}×{meta.stitchCount.height}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">by {meta.author || 'Anonymous'}</p>
        <div className="flex items-center justify-between mt-2">
          <StarRating rating={meta.difficulty === 'beginner' ? 4.5 : 4} size={12} />
          <span className="text-[10px] text-gray-400">{pattern.downloadCount} dl</span>
        </div>
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-2">
            {meta.tags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.1 bg-indigo-50 text-indigo-600 text-[9px] rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Main PatternLibrary Component ─────────────────────────────────────────────

export function PatternLibrary() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'rating' | 'downloads'>('newest')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedPattern, setSelectedPattern] = useState<PatternItem | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [minColors, setMinColors] = useState<number>()
  const [maxColors, setMaxColors] = useState<number>()

  const { patternLibrary, setPatterns, loadPatternLibrary } = useProjectStore()
  const patterns = patternLibrary ?? []

  const filtered = filterPatterns(patterns, {
    search,
    category,
    difficulty: difficulty || undefined,
    minColors,
    maxColors,
    sortBy,
  })

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = parsePatternJSON(text)
      if (!parsed) {
        alert('Invalid pattern file. Must be a valid JSON with metadata, grid, and palette.')
        return
      }

      const newPattern: PatternItem = {
        id: generatePatternId(),
        metadata: {
          ...parsed.metadata,
          version: parsed.version ?? '1.0.0',
        },
        grid: parsed.grid,
        palette: parsed.palette,
        rating: { average: 0, totalReviews: 0 },
        reviews: [],
        downloadCount: 0,
        isPublished: true,
      }

      // Generate thumbnail from grid + palette
      newPattern.thumbnailUrl = generateThumbnail(parsed.grid, parsed.palette)

      const updated = [...patterns, newPattern]
      setPatterns(updated)
      loadPatternLibrary(updated)

      setShowUpload(false)
    } catch {
      alert('Failed to read pattern file.')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header bar */}
      <div className="px-4 py-3 border-b bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <BookmarkPlus size={18} className="text-indigo-600" />
            Pattern Library
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
            >
              <Upload size={12} />
              Upload
            </button>
            {selectedPattern && (
              <button
                onClick={() => setSelectedPattern(null)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
              >
                <ArrowLeft size={12} />
                Back
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patterns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
          >
            <Filter size={12} />
            Filters
            {showFilters ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            {PATTERN_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="newest">Newest</option>
            <option value="rating">Rating</option>
            <option value="title">Title</option>
            <option value="downloads">Downloads</option>
          </select>

          <span className="text-[10px] text-gray-400 ml-auto">
            {filtered.length} of {patterns.length} patterns
          </span>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t">
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-gray-500">Colors:</label>
              <input
                type="number"
                min="1"
                value={minColors ?? ''}
                onChange={(e) => setMinColors(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="min"
                className="w-12 px-1 py-0.5 text-xs border rounded"
              />
              <span className="text-[10px] text-gray-400">–</span>
              <input
                type="number"
                min="1"
                value={maxColors ?? ''}
                onChange={(e) => setMaxColors(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="max"
                className="w-12 px-1 py-0.5 text-xs border rounded"
              />
            </div>
            {(category !== 'All' || difficulty || minColors !== undefined || maxColors !== undefined) && (
              <button
                onClick={() => { setCategory('All'); setDifficulty(''); setMinColors(undefined); setMaxColors(undefined) }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {showUpload ? (
          <UploadPanel onUpload={handleUpload} onClose={() => setShowUpload(false)} />
        ) : selectedPattern ? (
          <PatternDetail pattern={selectedPattern} onClose={() => setSelectedPattern(null)} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Grid3X3 size={48} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">
              {patterns.length === 0 ? 'Your library is empty' : 'No patterns match your filters'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {patterns.length === 0 ? 'Upload a pattern JSON file to get started' : 'Try adjusting your search or filters'}
            </p>
            {patterns.length === 0 && (
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
              >
                Upload Pattern
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto h-full p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((p) => (
                <PatternCard key={p.id} pattern={p} onClick={() => setSelectedPattern(p)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
