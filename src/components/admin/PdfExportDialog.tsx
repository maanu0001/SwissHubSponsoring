'use client'

import { useState } from 'react'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Field'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { PDF_MODE_LABELS, type PdfMode } from '@/lib/pdf-sections'

export interface PdfExportDialogProps {
  open: boolean
  onClose: () => void
  pageId: string
  /** Drafts have no public URL, so the QR code is off and locked. */
  published: boolean
  previewHref: (mode: PdfMode) => string
}

type Phase = 'idle' | 'working' | 'done' | 'error'

const MODES: PdfMode[] = ['short', 'full']

export function PdfExportDialog({ open, onClose, pageId, published, previewHref }: PdfExportDialogProps) {
  const toast = useToast()
  const [qr, setQr] = useState(true)
  const [pageNumbers, setPageNumbers] = useState(true)
  const [date, setDate] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeMode, setActiveMode] = useState<PdfMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; filename: string; pages: number } | null>(null)

  const busy = phase === 'working'

  function reset() {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setPhase('idle')
    setError(null)
    setActiveMode(null)
  }

  async function generate(mode: PdfMode) {
    if (busy) return
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
    setError(null)
    setActiveMode(mode)
    setPhase('working')

    try {
      const response = await fetch(`/api/admin/sponsor-pages/${pageId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, qr: qr && published, pageNumbers, date }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error ?? 'Das PDF konnte nicht erstellt werden.')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const match = /filename="([^"]+)"/.exec(disposition)
      const filename = match?.[1] ?? 'SwissHub_Sponsoring.pdf'
      const pages = Number.parseInt(response.headers.get('X-Pdf-Pages') ?? '0', 10) || 0
      const url = URL.createObjectURL(blob)

      setResult({ url, filename, pages })
      setPhase('done')

      // Start the download right away; the button below stays as a fallback
      // for browsers that block programmatic downloads.
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('PDF erfolgreich erstellt.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Das PDF konnte nicht erstellt werden.'
      setError(message)
      setPhase('error')
      toast.error(message)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (busy) return
        reset()
        onClose()
      }}
      title="Sponsoring-PDF exportieren"
      description="Beide Varianten verwenden dieselben Inhalte wie die Sponsorenseite – Änderungen sind sofort im nächsten Export enthalten."
      size="lg"
      busy={busy}
    >
      <div className="space-y-5">
        {!published ? (
          <Alert tone="info">
            Diese Seite ist noch nicht veröffentlicht. Der Export funktioniert trotzdem – der QR-Code zur
            öffentlichen Seite wird jedoch weggelassen, da der Link noch nicht erreichbar ist.
          </Alert>
        ) : null}

        {phase === 'error' && error ? <Alert tone="danger">{error}</Alert> : null}

        {phase === 'done' && result ? (
          <Alert tone="success" title="PDF erfolgreich erstellt">
            <p>
              {result.filename}
              {result.pages > 0 ? ` · ${result.pages} Seiten` : ''}
            </p>
            <p className="mt-2">
              <a
                href={result.url}
                download={result.filename}
                className="font-medium underline underline-offset-4"
              >
                Download erneut starten
              </a>
            </p>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => {
            const meta = PDF_MODE_LABELS[mode]
            const isActive = busy && activeMode === mode
            return (
              <div
                key={mode}
                className={cn(
                  'flex flex-col rounded-card border bg-surface-raised px-4 py-4 transition-colors',
                  isActive ? 'border-brand-accent' : 'border-line',
                )}
              >
                <p className="text-[14px] font-medium text-fg">{meta.label}</p>
                <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-fg-subtle">{meta.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" onClick={() => generate(mode)} disabled={busy} loading={isActive}>
                    {isActive ? 'PDF wird erstellt…' : 'PDF erstellen'}
                  </Button>
                  <a
                    href={previewHref(mode)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'inline-flex h-8 items-center rounded-control border border-line-strong px-3 text-[12.5px] font-medium text-fg-muted transition-colors hover:border-brand-accent/60 hover:text-fg',
                      busy && 'pointer-events-none opacity-50',
                    )}
                  >
                    Vorschau
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-3 rounded-card border border-line px-4 py-4">
          <p className="text-[13px] font-medium text-fg-muted">Optionen</p>
          <Toggle
            checked={qr && published}
            onChange={setQr}
            disabled={!published || busy}
            label="QR-Code anzeigen"
            description={
              published
                ? 'Auf der Abschlussseite, verweist auf die individuelle Sponsorenseite.'
                : 'Erst verfügbar, sobald die Seite veröffentlicht ist.'
            }
          />
          <Toggle
            checked={pageNumbers}
            onChange={setPageNumbers}
            disabled={busy}
            label="Seitenzahlen anzeigen"
            description="Im Dossier empfohlen. Das Titelblatt bleibt immer ohne Seitenzahl."
          />
          <Toggle
            checked={date}
            onChange={setDate}
            disabled={busy}
            label="Datum anzeigen"
            description="Wird beim Export automatisch auf den aktuellen Monat gesetzt."
          />
        </div>

        {busy ? (
          <p className="flex items-center gap-2.5 text-[13px] text-fg-muted" role="status" aria-live="polite">
            <Spinner className="h-4 w-4" />
            PDF wird erstellt… Das dauert je nach Umfang einige Sekunden.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
