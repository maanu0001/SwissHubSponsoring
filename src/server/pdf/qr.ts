import 'server-only'

import QRCode from 'qrcode'

/**
 * QR codes are generated locally as inline SVG – no external API, no network
 * access and no tracking. SVG keeps the code razor sharp at any print size.
 */
export async function qrSvg(value: string, options: { size?: number; dark?: string; light?: string } = {}) {
  const { size = 256, dark = '#0E1013', light = '#FFFFFF' } = options
  try {
    const svg = await QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: { dark, light },
    })
    // The generated root tag carries width/height; strip them so CSS controls size.
    return svg.replace(/<svg([^>]*?)width="[^"]*"\s*height="[^"]*"/, '<svg$1')
  } catch (error) {
    console.error('[pdf] QR generation failed', error)
    return null
  }
}
