'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import type { Media } from '@prisma/client'

import { cn } from '@/lib/cn'
import { ACCEPT_ATTRIBUTE } from '@/lib/media'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { createExternalMediaAction, searchMediaAction, uploadMediaAction } from '@/server/actions/media'
import { IDLE } from '@/lib/result'

import { MediaThumb } from './MediaThumb'

export interface MediaPickerProps {
  /** Currently selected media id, or empty for none. */
  value: string
  onChange: (mediaId: string, media: Media | null) => void
  /** Rendered into a hidden input so the picker works inside plain forms. */
  name?: string
  label?: string
  hint?: string
  /** Restrict the library listing to one media type. */
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  className?: string
  /** Preview of the currently selected item, avoids a fetch on first render. */
  initialMedia?: Media | null
  allowClear?: boolean
}

/**
 * Combined library browser, uploader and URL registrar.
 * Every place in the admin that references an image goes through this one
 * component so the behaviour stays identical everywhere.
 */
export function MediaPicker({
  value,
  onChange,
  name,
  label = 'Bild',
  hint,
  type = 'IMAGE',
  className,
  initialMedia = null,
  allowClear = true,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Media | null>(initialMedia)

  useEffect(() => {
    if (!value) setSelected(null)
    else if (initialMedia && initialMedia.id === value) setSelected(initialMedia)
  }, [value, initialMedia])

  function handleSelect(media: Media | null) {
    setSelected(media)
    onChange(media?.id ?? '', media)
    setOpen(false)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {label ? <span className="block text-[13px] font-medium text-fg-muted">{label}</span> : null}

      <div className="flex items-center gap-3">
        <MediaThumb media={selected} className="h-16 w-16 shrink-0" fallback="Kein Bild" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
              {value ? 'Ändern' : 'Auswählen'}
            </Button>
            {value && allowClear ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => handleSelect(null)}>
                Entfernen
              </Button>
            ) : null}
          </div>
          {selected ? (
            <p className="truncate text-[12px] text-fg-subtle" title={selected.title}>
              {selected.title}
            </p>
          ) : hint ? (
            <p className="text-[12px] leading-relaxed text-fg-subtle">{hint}</p>
          ) : null}
        </div>
      </div>

      <MediaLibraryDialog open={open} onClose={() => setOpen(false)} onSelect={handleSelect} type={type} />
    </div>
  )
}

type Tab = 'library' | 'upload' | 'url'

export function MediaLibraryDialog({
  open,
  onClose,
  onSelect,
  type,
}: {
  open: boolean
  onClose: () => void
  onSelect: (media: Media | null) => void
  type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
}) {
  const [tab, setTab] = useState<Tab>('library')
  const [items, setItems] = useState<Media[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const load = useCallback(
    (search: string) => {
      setLoading(true)
      searchMediaAction(search, type)
        .then((result) => setItems(result as Media[]))
        .catch(() => toast.error('Die Medienbibliothek konnte nicht geladen werden.'))
        .finally(() => setLoading(false))
    },
    [type, toast],
  )

  useEffect(() => {
    if (!open) return
    setTab('library')
    load('')
  }, [open, load])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => load(query), 250)
    return () => clearTimeout(timer)
  }, [query, open, load])

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      const result = await uploadMediaAction(IDLE, formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Hochgeladen.')
        const id = result.data?.mediaId
        const refreshed = (await searchMediaAction('', type)) as Media[]
        setItems(refreshed)
        const created = refreshed.find((item) => item.id === id)
        if (created) onSelect(created)
        else setTab('library')
      } else {
        toast.error(result.message ?? 'Upload fehlgeschlagen.')
      }
    })
  }

  function handleExternal(formData: FormData) {
    startTransition(async () => {
      const result = await createExternalMediaAction(IDLE, formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Hinzugefügt.')
        const refreshed = (await searchMediaAction('', type)) as Media[]
        setItems(refreshed)
        const created = refreshed.find((item) => item.id === result.data?.mediaId)
        if (created) onSelect(created)
        else setTab('library')
      } else {
        toast.error(result.message ?? 'Konnte nicht hinzugefügt werden.')
      }
    })
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'library', label: 'Bibliothek' },
    { id: 'upload', label: 'Hochladen' },
    { id: 'url', label: 'Externe URL' },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Medium auswählen" size="lg" busy={isPending}>
      <div className="mb-5 flex gap-1 rounded-control border border-line bg-surface-raised p-1">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              'flex-1 rounded-[7px] px-3 py-1.5 text-[13px] font-medium transition-colors',
              tab === entry.id ? 'bg-surface-overlay text-fg' : 'text-fg-subtle hover:text-fg',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'library' ? (
        <div className="space-y-4">
          <Input
            placeholder="Medien durchsuchen…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Medien durchsuchen"
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6 text-fg-subtle" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              compact
              title={query ? 'Keine Treffer' : 'Noch keine Medien'}
              description={
                query
                  ? 'Passen Sie die Suche an oder laden Sie eine neue Datei hoch.'
                  : 'Laden Sie eine Datei hoch oder hinterlegen Sie eine externe URL.'
              }
              action={
                <Button type="button" size="sm" onClick={() => setTab('upload')}>
                  Datei hochladen
                </Button>
              }
            />
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {items.map((media) => (
                <li key={media.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(media)}
                    className="group w-full overflow-hidden rounded-control border border-line bg-surface-raised text-left transition-colors hover:border-brand-accent"
                  >
                    <MediaThumb media={media} className="h-24 w-full rounded-none border-0" />
                    <span className="block truncate px-2 py-1.5 text-[11.5px] text-fg-subtle group-hover:text-fg">
                      {media.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'upload' ? (
        <form action={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="picker-files" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
              Dateien auswählen
            </label>
            <input
              id="picker-files"
              type="file"
              name="files"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              required
              className="w-full rounded-control border border-dashed border-line-strong bg-surface-raised px-3 py-6 text-[13px] text-fg-muted file:mr-3 file:rounded-control file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-brand-fg hover:border-brand-accent/60"
            />
            <p className="mt-1.5 text-[12px] text-fg-subtle">
              Erlaubt sind JPG, PNG, WebP, AVIF, GIF, SVG und PDF.
            </p>
          </div>
          <Input label="Alt-Text (optional)" name="altText" placeholder="Beschreibung für Screenreader" />
          <Button type="submit" loading={isPending}>
            Hochladen
          </Button>
        </form>
      ) : null}

      {tab === 'url' ? (
        <form action={handleExternal} className="space-y-4">
          <Input label="Titel" name="title" required placeholder="z. B. Sponsorlogo Digitec" />
          <Input label="URL" name="url" required placeholder="https://…" inputMode="url" />
          <Input label="Alt-Text (optional)" name="altText" placeholder="Beschreibung für Screenreader" />
          <input type="hidden" name="type" value={type ?? 'IMAGE'} />
          <Button type="submit" loading={isPending}>
            Hinzufügen
          </Button>
        </form>
      ) : null}
    </Modal>
  )
}
