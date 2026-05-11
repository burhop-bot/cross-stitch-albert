/**
 * QR Code display component using qrcode.react
 */
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'

export interface QRCodeDisplayProps {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  svgSize?: number
  style?: React.CSSProperties
}

/**
 * SVG-based QR code (scalable, good for print)
 */
export function QRCodeSVGDisplay({ value, size = 128, level = 'M', svgSize }: QRCodeDisplayProps) {
  return (
    <QRCodeSVG
      value={value}
      size={svgSize || size}
      level={level}
      bgColor="#ffffff"
      fgColor="#000000"
      includeMargin={true}
    />
  )
}

/**
 * Canvas-based QR code (faster for large displays)
 */
export function QRCodeCanvasDisplay({ value, size = 128, level = 'M' }: QRCodeDisplayProps) {
  return (
    <QRCodeCanvas
      value={value}
      size={size}
      level={level}
      bgColor="#ffffff"
      fgColor="#000000"
      includeMargin={true}
    />
  )
}
