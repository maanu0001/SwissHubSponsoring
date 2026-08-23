import { cn } from '@/lib/cn'
import { mediaAlt, mediaUrl, type MediaRef } from '@/lib/media'

export interface MediaThumbProps {
  media: MediaRef | null | undefined
  className?: string
  /** Shown when no media is set. */
  fallback?: string
  contain?: boolean
}

/**
 * Uniform preview tile for the media library, pickers and list rows.
 * Non-image media get an icon instead of a broken image.
 */
export function MediaThumb({ media, className, fallback = 'Kein Bild', contain = true }: MediaThumbProps) {
  const url = mediaUrl(media)

  if (!url) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-control border border-dashed border-line-strong bg-surface-raised px-2 text-center text-[11px] leading-tight text-fg-subtle',
          className,
        )}
      >
        {fallback}
      </div>
    )
  }

  if (media?.type === 'DOCUMENT') {
    return (
      <div className={cn('flex items-center justify-center rounded-control border border-line bg-surface-raised text-fg-subtle', className)}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5" />
        </svg>
      </div>
    )
  }

  if (media?.type === 'VIDEO') {
    return (
      <div className={cn('flex items-center justify-center rounded-control border border-line bg-surface-raised text-fg-subtle', className)}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m10 9.5 5 2.5-5 2.5v-5Z" />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={mediaAlt(media)}
      loading="lazy"
      decoding="async"
      className={cn(
        'rounded-control border border-line bg-surface-raised',
        contain ? 'object-contain p-1.5' : 'object-cover',
        className,
      )}
    />
  )
}
