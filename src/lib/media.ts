import type { Media } from '@prisma/client'

export type MediaRef = Pick<Media, 'id' | 'title' | 'altText' | 'sourceType' | 'filePath' | 'externalUrl' | 'type'>

/**
 * Public URL for a media record. Uploads are streamed through /api/media so
 * that the storage directory can live on a persistent volume outside the app.
 */
export function mediaUrl(media: MediaRef | null | undefined): string | null {
  if (!media) return null
  if (media.sourceType === 'EXTERNAL') {
    return media.externalUrl && isSafeExternalUrl(media.externalUrl) ? media.externalUrl : null
  }
  if (!media.filePath) return null
  return `/api/media/${media.filePath.split('/').map(encodeURIComponent).join('/')}`
}

export function mediaAlt(media: MediaRef | null | undefined, fallback = ''): string {
  return media?.altText?.trim() || media?.title?.trim() || fallback
}

/** Only http(s) URLs are ever rendered into src/href attributes. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Normalise user supplied links – adds https:// when the scheme is missing. */
export function normaliseUrl(input: string | null | undefined): string | null {
  const value = input?.trim()
  if (!value) return null
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return isSafeExternalUrl(withScheme) ? withScheme : null
}

/** Strip the scheme for display purposes ("https://digitec.ch/" -> "digitec.ch"). */
export function displayUrl(url: string | null | undefined): string {
  if (!url) return ''
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

export const ALLOWED_UPLOAD_TYPES: Record<string, { ext: string; kind: 'IMAGE' | 'DOCUMENT' }> = {
  'image/jpeg': { ext: 'jpg', kind: 'IMAGE' },
  'image/png': { ext: 'png', kind: 'IMAGE' },
  'image/webp': { ext: 'webp', kind: 'IMAGE' },
  'image/gif': { ext: 'gif', kind: 'IMAGE' },
  'image/avif': { ext: 'avif', kind: 'IMAGE' },
  'image/svg+xml': { ext: 'svg', kind: 'IMAGE' },
  'application/pdf': { ext: 'pdf', kind: 'DOCUMENT' },
}

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_UPLOAD_TYPES).join(',')

/** Turn a Twitch/YouTube URL into an embeddable player URL where possible. */
export function embedUrl(url: string, parentHost?: string): string | null {
  if (!isSafeExternalUrl(url)) return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^www\./, '')

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = parsed.searchParams.get('v')
    if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
    if (parsed.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com${parsed.pathname}`
  }
  if (host === 'youtu.be') {
    const id = parsed.pathname.replace(/^\//, '')
    if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
  }
  if (host === 'twitch.tv') {
    const parent = parentHost ?? 'localhost'
    const segments = parsed.pathname.split('/').filter(Boolean)
    if (segments[0] === 'videos' && segments[1]) {
      return `https://player.twitch.tv/?video=${encodeURIComponent(segments[1])}&parent=${encodeURIComponent(parent)}&autoplay=false`
    }
    if (segments[0]) {
      return `https://player.twitch.tv/?channel=${encodeURIComponent(segments[0])}&parent=${encodeURIComponent(parent)}&autoplay=false`
    }
  }
  return null
}
