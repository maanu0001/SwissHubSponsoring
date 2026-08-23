'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Media } from '@prisma/client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { MediaThumb } from '@/components/admin/MediaThumb'
import { formatDateTime, formatFileSize } from '@/lib/format'
import { MEDIA_SOURCE, MEDIA_TYPE } from '@/lib/labels'
import { ACCEPT_ATTRIBUTE, mediaUrl } from '@/lib/media'
import { IDLE } from '@/lib/result'
import {
  createExternalMediaAction,
  deleteMediaAction,
  updateMediaAction,
  uploadMediaAction,
} from '@/server/actions/media'

export interface MediaLibraryProps {
  media: Media[]
  current: { q: string; type: string; source: string }
  maxUploadMb: number
}

export function MediaLibrary({ media, current, maxUploadMb }: MediaLibraryProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [query, setQuery] = useState(current.q)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [detail, setDetail] = useState<Media | null>(null)
  const [deleting, setDeleting] = useState<Media | null>(null)
  const firstRender = useRef(true)

  function apply(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      if (query !== current.q) apply({ q: query })
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function runAction(action: (formData: FormData) => Promise<typeof IDLE>, formData: FormData, onDone: () => void) {
    startTransition(async () => {
      const result = await action(formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        onDone()
        router.refresh()
      } else {
        toast.error(result.message ?? 'Aktion fehlgeschlagen.')
      }
    })
  }

  return (
    <>
      <Card className="mt-1">
        <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <Input
              label="Suche"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Titel oder Alt-Text"
            />
          </div>
          <Select
            label="Typ"
            value={current.type}
            onChange={(event) => apply({ type: event.target.value })}
            wrapperClassName="w-full sm:w-44"
          >
            <option value="">Alle Typen</option>
            <option value="IMAGE">Bild</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Dokument</option>
          </Select>
          <Select
            label="Quelle"
            value={current.source}
            onChange={(event) => apply({ source: event.target.value })}
            wrapperClassName="w-full sm:w-44"
          >
            <option value="">Alle Quellen</option>
            <option value="UPLOAD">Upload</option>
            <option value="EXTERNAL">Externe URL</option>
          </Select>
          <div className="flex gap-2">
            <Button type="button" onClick={() => setUploadOpen(true)}>
              Dateien hochladen
            </Button>
            <Button type="button" variant="secondary" onClick={() => setUrlOpen(true)}>
              URL hinzufügen
            </Button>
          </div>
        </div>
      </Card>

      {media.length === 0 ? (
        <EmptyState
          className="mt-5"
          title={current.q || current.type || current.source ? 'Keine Medien gefunden' : 'Noch keine Medien'}
          description="Laden Sie Logos, Turnierbilder oder Dokumente hoch – oder hinterlegen Sie eine externe URL."
          action={
            <Button type="button" onClick={() => setUploadOpen(true)}>
              Dateien hochladen
            </Button>
          }
        />
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {media.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setDetail(item)}
                className="group w-full overflow-hidden rounded-card border border-line bg-surface text-left transition-colors hover:border-brand-accent/60"
              >
                <MediaThumb media={item} className="h-28 w-full rounded-none border-0" />
                <span className="block px-3 py-2.5">
                  <span className="block truncate text-[12.5px] font-medium text-fg">{item.title}</span>
                  <span className="mt-1 flex items-center gap-1.5">
                    <Badge tone={MEDIA_SOURCE[item.sourceType].tone}>{MEDIA_SOURCE[item.sourceType].label}</Badge>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Dateien hochladen" size="md" busy={isPending}>
        <form
          action={(formData) => runAction((data) => uploadMediaAction(IDLE, data), formData, () => setUploadOpen(false))}
          className="space-y-4"
        >
          <div>
            <label htmlFor="library-files" className="mb-1.5 block text-[13px] font-medium text-fg-muted">
              Dateien
            </label>
            <input
              id="library-files"
              type="file"
              name="files"
              multiple
              required
              accept={ACCEPT_ATTRIBUTE}
              className="w-full rounded-control border border-dashed border-line-strong bg-surface-raised px-3 py-6 text-[13px] text-fg-muted file:mr-3 file:rounded-control file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-brand-fg hover:border-brand-accent/60"
            />
            <p className="mt-1.5 text-[12px] leading-relaxed text-fg-subtle">
              Erlaubt: JPG, PNG, WebP, AVIF, GIF, SVG und PDF · maximal {maxUploadMb} MB pro Datei · bis zu 20 Dateien
              gleichzeitig.
            </p>
          </div>
          <Input label="Alt-Text für alle Dateien (optional)" name="altText" maxLength={300} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              Hochladen
            </Button>
          </div>
        </form>
      </Modal>

      {/* External URL */}
      <Modal open={urlOpen} onClose={() => setUrlOpen(false)} title="Externe URL hinzufügen" size="md" busy={isPending}>
        <form
          action={(formData) =>
            runAction((data) => createExternalMediaAction(IDLE, data), formData, () => setUrlOpen(false))
          }
          className="space-y-4"
        >
          <Input label="Titel" name="title" required maxLength={180} />
          <Input label="URL" name="url" required inputMode="url" placeholder="https://…" maxLength={600} />
          <Input label="Alt-Text" name="altText" maxLength={300} />
          <Select label="Typ" name="type" defaultValue="IMAGE">
            <option value="IMAGE">Bild</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Dokument</option>
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setUrlOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              Hinzufügen
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail */}
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Medium bearbeiten" size="lg" busy={isPending}>
        {detail ? (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-card border border-line bg-surface-raised">
              <MediaThumb media={detail} className="h-56 w-full rounded-none border-0" />
            </div>

            <dl className="grid gap-2 text-[12.5px] sm:grid-cols-2">
              <Detail label="Typ" value={MEDIA_TYPE[detail.type].label} />
              <Detail label="Quelle" value={MEDIA_SOURCE[detail.sourceType].label} />
              <Detail label="Format" value={detail.mimeType ?? '—'} />
              <Detail label="Grösse" value={formatFileSize(detail.fileSize)} />
              {detail.width && detail.height ? (
                <Detail label="Abmessungen" value={`${detail.width} × ${detail.height} px`} />
              ) : null}
              <Detail label="Hochgeladen" value={formatDateTime(detail.createdAt)} />
            </dl>

            {mediaUrl(detail) ? (
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-control border border-line bg-surface-raised px-3 py-2 font-mono text-[12px] text-fg-subtle">
                  {mediaUrl(detail)}
                </code>
                <CopyButton value={mediaUrl(detail) ?? ''} label="URL kopieren" size="sm" />
              </div>
            ) : null}

            <form
              action={(formData) => runAction((data) => updateMediaAction(IDLE, data), formData, () => setDetail(null))}
              className="space-y-4 border-t border-line pt-5"
            >
              <input type="hidden" name="id" value={detail.id} />
              <Input label="Titel" name="title" required defaultValue={detail.title} maxLength={180} />
              <Input
                label="Alt-Text"
                name="altText"
                defaultValue={detail.altText ?? ''}
                maxLength={300}
                hint="Wichtig für Screenreader und die Barrierefreiheit."
              />
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setDeleting(detail)
                    setDetail(null)
                  }}
                >
                  Löschen
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setDetail(null)}>
                    Schliessen
                  </Button>
                  <Button type="submit" loading={isPending}>
                    Speichern
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          const result = await deleteMediaAction(deleting.id)
          if (result.status === 'success') {
            toast.success(result.message ?? 'Gelöscht.')
            router.refresh()
          } else {
            toast.error(result.message ?? 'Löschen fehlgeschlagen.')
          }
        }}
        title="Medium löschen?"
        description={
          <>
            <p>
              „{deleting?.title}“ wird endgültig entfernt
              {deleting?.sourceType === 'UPLOAD' ? ' – inklusive der Datei auf dem Server' : ''}.
            </p>
            <p className="mt-2">
              Stellen, an denen dieses Medium verwendet wird, zeigen danach kein Bild mehr. Alle übrigen Daten bleiben
              unverändert.
            </p>
          </>
        }
        confirmLabel="Endgültig löschen"
      />
    </>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 rounded-control border border-line bg-surface-raised px-3 py-2">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="truncate text-fg-muted">{value}</dd>
    </div>
  )
}
