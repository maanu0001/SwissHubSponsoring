'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SponsoringBenefit } from '@prisma/client'

import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SortHandle, SortableList } from '@/components/ui/SortableList'
import { useToast } from '@/components/ui/Toast'
import { BenefitSelector } from '@/components/admin/BenefitSelector'
import { cn } from '@/lib/cn'
import { IDLE } from '@/lib/result'
import { idSignature, useServerState } from '@/lib/use-server-state'
import {
  reorderPageBenefitsAction,
  setPageBenefitsAction,
  updatePageBenefitAction,
} from '@/server/actions/sponsor-pages'

import type { PageBenefitEntry } from '@/app/admin/(app)/sponsor-pages/[id]/SponsorPageEditor'

export interface PageBenefitsEditorProps {
  pageId: string
  entries: PageBenefitEntry[]
  allBenefits: SponsoringBenefit[]
}

/**
 * Manages which catalogue benefits appear on a page, in which order, and with
 * which page-specific wording.
 */
export function PageBenefitsEditor({ pageId, entries: initialEntries, allBenefits }: PageBenefitsEditorProps) {
  const router = useRouter()
  const toast = useToast()
  // Re-syncs after router.refresh() so the selection dialog's result shows up.
  const [entries, setEntries] = useServerState(initialEntries, idSignature)
  const [benefits, setBenefits] = useServerState(allBenefits, idSignature)
  const [selectOpen, setSelectOpen] = useState(false)
  const [selection, setSelection] = useServerState<string[]>(
    initialEntries.map((entry) => entry.benefitId),
    (ids) => ids.join('|'),
  )
  const [editing, setEditing] = useState<PageBenefitEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  function applySelection() {
    startTransition(async () => {
      const result = await setPageBenefitsAction(pageId, selection)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Leistungen aktualisiert.')
        setSelectOpen(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Aktualisierung fehlgeschlagen.')
      }
    })
  }

  function handleReorder(next: PageBenefitEntry[]) {
    const previous = entries
    setEntries(next)
    startTransition(async () => {
      const result = await reorderPageBenefitsAction(pageId, next.map((entry) => entry.id))
      if (result.status === 'error') {
        setEntries(previous)
        toast.error(result.message ?? 'Die Reihenfolge konnte nicht gespeichert werden.')
      } else {
        router.refresh()
      }
    })
  }

  function saveEntry(formData: FormData) {
    startTransition(async () => {
      const result = await updatePageBenefitAction(IDLE, formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        setEditing(null)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  function toggleVisible(entry: PageBenefitEntry) {
    const formData = new FormData()
    formData.set('id', entry.id)
    formData.set('customTitle', entry.customTitle)
    formData.set('customDescription', entry.customDescription)
    formData.set('visible', entry.visible ? 'false' : 'true')
    setEntries((current) =>
      current.map((item) => (item.id === entry.id ? { ...item, visible: !item.visible } : item)),
    )
    startTransition(async () => {
      const result = await updatePageBenefitAction(IDLE, formData)
      if (result.status === 'error') {
        toast.error(result.message ?? 'Änderung fehlgeschlagen.')
        router.refresh()
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Leistungen auf dieser Seite"
          description="Reihenfolge per Drag-and-Drop, individueller Text pro Leistung möglich."
          actions={
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelectOpen(true)}>
              Leistungen auswählen
            </Button>
          }
        />
        <CardBody>
          {entries.length === 0 ? (
            <EmptyState
              compact
              title="Noch keine Leistungen ausgewählt"
              description="Wählen Sie aus dem Katalog, welche Leistungen dieser Sponsor erhält."
              action={
                <Button type="button" size="sm" onClick={() => setSelectOpen(true)}>
                  Leistungen auswählen
                </Button>
              }
            />
          ) : (
            <SortableList
              items={entries}
              onReorder={handleReorder}
              renderItem={(entry, controls) => (
                <div
                  className={cn(
                    'flex items-start gap-2 rounded-control border border-line bg-surface-raised px-2 py-2',
                    !entry.visible && 'opacity-60',
                  )}
                >
                  <SortHandle controls={controls} className="mt-0.5" />
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate text-[13.5px] font-medium text-fg">
                      {entry.customTitle || entry.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-fg-subtle">
                      {entry.customDescription || entry.description || entry.category}
                    </p>
                    {entry.customTitle || entry.customDescription ? (
                      <p className="mt-1 text-[11.5px] text-brand-accent">Individueller Text</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleVisible(entry)}
                      aria-label={entry.visible ? 'Ausblenden' : 'Einblenden'}
                      title={entry.visible ? 'Ausblenden' : 'Einblenden'}
                      className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-surface-overlay hover:text-fg"
                    >
                      {entry.visible ? (
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                          <path d="M1.8 10S4.6 4.8 10 4.8 18.2 10 18.2 10 15.4 15.2 10 15.2 1.8 10 1.8 10Z" />
                          <circle cx="10" cy="10" r="2.4" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                          <path d="M4.2 4.2 15.8 15.8M8 5.2A7.6 7.6 0 0 1 10 5c5.4 0 8.2 5 8.2 5a13 13 0 0 1-2.6 3.1M5.6 6.9A13 13 0 0 0 1.8 10s2.8 5.2 8.2 5.2c.8 0 1.5-.1 2.2-.3" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(entry)}>
                      Text anpassen
                    </Button>
                  </div>
                </div>
              )}
            />
          )}
        </CardBody>
      </Card>

      <Modal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        title="Leistungen auswählen"
        description="Abwählen entfernt die Leistung inklusive individuellem Text von dieser Seite."
        size="xl"
        busy={isPending}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setSelectOpen(false)} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="button" onClick={applySelection} loading={isPending}>
              Auswahl übernehmen
            </Button>
          </>
        }
      >
        <BenefitSelector
          benefits={benefits}
          selected={selection}
          onChange={setSelection}
          onBenefitCreated={(benefit) => setBenefits((current) => [...current, benefit])}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Individueller Text"
        description="Leer lassen, um den Standardtext aus dem Leistungskatalog zu verwenden."
        size="md"
        busy={isPending}
      >
        {editing ? (
          <form action={saveEntry} className="space-y-4">
            <input type="hidden" name="id" value={editing.id} />
            <input type="hidden" name="visible" value={editing.visible ? 'true' : 'false'} />

            <div className="rounded-control border border-line bg-surface-raised px-3.5 py-3">
              <p className="text-[12px] uppercase tracking-wide text-fg-subtle">Standard</p>
              <p className="mt-1 text-[13.5px] text-fg">{editing.title}</p>
              {editing.description ? (
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-subtle">{editing.description}</p>
              ) : null}
            </div>

            <Input
              label="Individueller Titel"
              name="customTitle"
              defaultValue={editing.customTitle}
              maxLength={200}
              placeholder={editing.title}
            />
            <Textarea
              label="Individuelle Beschreibung"
              name="customDescription"
              rows={3}
              defaultValue={editing.customDescription}
              maxLength={1000}
              placeholder={editing.description || 'Beschreibung für diesen Sponsor'}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Abbrechen
              </Button>
              <Button type="submit" loading={isPending}>
                Speichern
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  )
}
