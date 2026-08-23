'use client'

import { useState } from 'react'
import type { Media } from '@prisma/client'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SortHandle, SortableList } from '@/components/ui/SortableList'
import { MediaLibraryDialog } from '@/components/admin/MediaPicker'
import { MediaThumb } from '@/components/admin/MediaThumb'

export interface MediaGalleryPickerProps {
  value: string[]
  initialMedia: Media[]
  onChange: (ids: string[]) => void
  busy?: boolean
}

/** Ordered multi-image picker used for tournament galleries. */
export function MediaGalleryPicker({ value, initialMedia, onChange, busy }: MediaGalleryPickerProps) {
  const [known, setKnown] = useState<Record<string, Media>>(
    Object.fromEntries(initialMedia.map((media) => [media.id, media])),
  )
  const [pickerOpen, setPickerOpen] = useState(false)

  const items = value.map((id) => ({ id, media: known[id] ?? null }))

  function add(media: Media | null) {
    if (!media) {
      setPickerOpen(false)
      return
    }
    setKnown((current) => ({ ...current, [media.id]: media }))
    if (!value.includes(media.id)) onChange([...value, media.id])
    setPickerOpen(false)
  }

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState
          compact
          title="Noch keine Bilder"
          description="Fügen Sie Bilder aus der Medienbibliothek hinzu oder laden Sie neue hoch."
          action={
            <Button type="button" size="sm" onClick={() => setPickerOpen(true)} disabled={busy}>
              Bild hinzufügen
            </Button>
          }
        />
      ) : (
        <>
          <SortableList
            items={items}
            onReorder={(next) => onChange(next.map((entry) => entry.id))}
            disabled={busy}
            renderItem={(entry, controls) => (
              <div className="flex items-center gap-2 rounded-control border border-line bg-surface-raised px-2 py-2">
                <SortHandle controls={controls} />
                <MediaThumb media={entry.media} className="h-11 w-16 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-fg">
                  {entry.media?.title ?? 'Unbekanntes Medium'}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((id) => id !== entry.id))}
                  aria-label="Bild entfernen"
                  className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-danger/12 hover:text-danger"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)} disabled={busy}>
            Bild hinzufügen
          </Button>
        </>
      )}

      <MediaLibraryDialog open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={add} type="IMAGE" />
    </div>
  )
}
