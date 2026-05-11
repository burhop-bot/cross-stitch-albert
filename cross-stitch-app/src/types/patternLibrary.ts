// Pattern Library types — Phase 18

export interface PatternMetadata {
  title: string
  author: string
  designer: string
  description: string
  tags: string[]
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  stitchCount: { width: number; height: number }
  fabric: string
  flossBrand: string
  colorCount: number
  estimatedHours: number
  created?: string
  modified?: string
  version: string
}

export interface PatternRating {
  average: number    // 0-5, 1 decimal
  totalReviews: number
}

export interface PatternReview {
  id: string
  author: string
  rating: number     // 1-5
  comment: string
  date: string
  helpful: number     // upvote count
  design?: number[][] // optional thumbnail (downsampled)
  colorPalette?: number[] // DMC numbers used
}

export interface PatternItem {
  id: string
  metadata: PatternMetadata
  grid: number[][]
  palette: number[]
  rating: PatternRating
  reviews: PatternReview[]
  downloadCount: number
  thumbnailUrl?: string // data URL for preview
  isPublished: boolean
}

export interface PatternExportData {
  metadata: PatternMetadata
  grid: number[][]
  palette: number[]
  version: string
  exportedAt: string
}

export const PATTERN_CATEGORIES = [
  'All',
  'Seasonal',
  'Floral',
  'Animals',
  'Quotes',
  'Landscapes',
  'Geometric',
  'Faces',
  'Cross-Stitch Basics',
  'Baby & Nursery',
  'Holiday',
  'Other',
]

export const DIFFICULTY_LEVELS: PatternMetadata['difficulty'][] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]
