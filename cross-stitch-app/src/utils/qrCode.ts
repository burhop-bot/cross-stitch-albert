/**
 * QR Code generation utility
 * Generates QR codes for pattern sharing, progress tracking, and phone viewing
 */
import QRCode from 'qrcode'

export interface QRCodeOptions {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  bgColor?: string
  fgColor?: string
}

/**
 * Generate a QR code as a data URL (PNG)
 * Uses the qrcode library to generate, then captures to PNG
 */
export async function generateQRCodeDataUrl(
  options: QRCodeOptions
): Promise<string> {
  const {
    value,
    size = 128,
    level = 'M',
    bgColor = '#ffffff',
    fgColor = '#000000',
  } = options

  return QRCode.toDataURL(value, {
    width: size,
    margin: 1,
    color: {
      dark: fgColor,
      light: bgColor,
    },
    errorCorrectionLevel: level,
  })
}

/**
 * Generate a URL-encoded pattern share link
 * Creates a compact URL that can be scanned with a phone
 */
export function generatePatternShareUrl(
  title: string,
  gridData: number[][]
): string {
  // Compress: base64 encode the grid data
  const payload = JSON.stringify({ t: title, g: gridData })
  const encoded = btoa(unescape(encodeURIComponent(payload)))
  // Use a short URL format
  return `cross-stitch://pattern/${encoded.slice(0, 200)}` // Limit length for QR
}

/**
 * Parse a pattern share URL back to data
 */
export function parsePatternShareUrl(url: string): { title: string; grid: number[][] } | null {
  const match = url.match(/cross-stitch:\/\/pattern\/(.+)/)
  if (!match) return null
  
  try {
    const encoded = match[1]
    const decoded = decodeURIComponent(escape(atob(encoded)))
    const parsed = JSON.parse(decoded)
    if (parsed.t && parsed.g) {
      return { title: parsed.t, grid: parsed.g }
    }
  } catch {
    return null
  }
  return null
}
