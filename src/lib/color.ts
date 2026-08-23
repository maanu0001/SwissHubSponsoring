/**
 * Pure colour helpers.
 * Deliberately free of any server-only import so client components (the colour
 * picker) and server components (the theme injection) can share them.
 */

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim())
}

/** "#83060A" -> "131 6 10" for use in `rgb(var(--c-brand) / <alpha>)`. */
export function hexToRgbChannels(hex: string, fallback = '131 6 10'): string {
  const value = hex.trim()
  if (!HEX.test(value)) return fallback
  let raw = value.slice(1)
  if (raw.length === 3) {
    raw = raw.split('').map((char) => char + char).join('')
  }
  const int = Number.parseInt(raw, 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

/** Relative luminance based foreground colour so text on the brand stays readable. */
export function readableForeground(hex: string): string {
  const [r = 0, g = 0, b = 0] = hexToRgbChannels(hex).split(' ').map(Number)
  const toLinear = (channel: number) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return luminance > 0.45 ? '12 12 14' : '255 255 255'
}

/** Expand a shorthand hex ("#abc") so `<input type="color">` accepts it. */
export function expandHex(hex: string): string {
  const value = hex.trim()
  if (!HEX.test(value)) return value
  if (value.length !== 4) return value
  return `#${value.slice(1).split('').map((char) => char + char).join('')}`
}
