import type { Media } from '@prisma/client'

import { mediaAlt, mediaUrl } from '@/lib/media'
import type { GalleryItem } from '@/lib/section-data'
import { Reveal } from '../Reveal'

export function Gallery({ items, media }: { items: GalleryItem[]; media: Media[] }) {
  const byId = new Map(media.map((entry) => [entry.id, entry]))
  const resolved = items
    .map((item) => ({ item, media: byId.get(item.mediaId) }))
    .filter((entry): entry is { item: GalleryItem; media: Media } => Boolean(entry.media))

  if (resolved.length === 0) return null

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {resolved.map(({ item, media: image }, index) => {
        const url = mediaUrl(image)
        if (!url) return null
        return (
          <Reveal as="li" key={`${image.id}-${index}`} delay={index * 55}>
            <figure className="overflow-hidden rounded-card border border-line bg-surface">
              <img
                src={url}
                alt={mediaAlt(image, item.caption)}
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
              {item.caption ? (
                <figcaption className="px-4 py-2.5 text-[12.5px] leading-relaxed text-fg-subtle">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </Reveal>
        )
      })}
    </ul>
  )
}
