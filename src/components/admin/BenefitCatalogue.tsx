'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input, Textarea, Toggle } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SortHandle, SortableList } from '@/components/ui/SortableList'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { IDLE } from '@/lib/result'
import { idSignature, useServerState } from '@/lib/use-server-state'
import {
  createBenefitAction,
  deleteBenefitAction,
  reorderBenefitsAction,
  toggleBenefitActiveAction,
  updateBenefitAction,
} from '@/server/actions/benefits'

export interface CatalogueBenefit {
  id: string
  title: string
  description: string
  category: string
  icon: string
  active: boolean
  defaultBenefit: boolean
  usageCount: number
}

export function BenefitCatalogue({ benefits: initial }: { benefits: CatalogueBenefit[] }) {
  const router = useRouter()
  const toast = useToast()
  // Re-syncs after router.refresh() so newly created benefits appear at once.
  const [benefits, setBenefits] = useServerState(initial, idSignature)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<CatalogueBenefit | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<CatalogueBenefit | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return benefits
    return benefits.filter(
      (benefit) =>
        benefit.title.toLowerCase().includes(needle) ||
        benefit.description.toLowerCase().includes(needle) ||
        benefit.category.toLowerCase().includes(needle),
    )
  }, [benefits, query])

  const categories = useMemo(
    () => [...new Set(benefits.map((benefit) => benefit.category))].sort((a, b) => a.localeCompare(b, 'de')),
    [benefits],
  )

  function handleReorder(next: CatalogueBenefit[]) {
    const previous = benefits
    setBenefits(next)
    startTransition(async () => {
      const result = await reorderBenefitsAction(next.map((benefit) => benefit.id))
      if (result.status === 'error') {
        setBenefits(previous)
        toast.error(result.message ?? 'Die Reihenfolge konnte nicht gespeichert werden.')
      } else {
        router.refresh()
      }
    })
  }

  function toggleActive(benefit: CatalogueBenefit) {
    const next = !benefit.active
    setBenefits((current) => current.map((entry) => (entry.id === benefit.id ? { ...entry, active: next } : entry)))
    startTransition(async () => {
      const result = await toggleBenefitActiveAction(benefit.id, next)
      if (result.status === 'error') {
        toast.error(result.message ?? 'Änderung fehlgeschlagen.')
        router.refresh()
      }
    })
  }

  function submit(formData: FormData, mode: 'create' | 'update') {
    startTransition(async () => {
      const result = mode === 'create'
        ? await createBenefitAction(IDLE, formData)
        : await updateBenefitAction(IDLE, formData)

      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        setCreateOpen(false)
        setEditing(null)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Leistungen"
          description="Ziehen Sie am Griff oder nutzen Sie die Pfeile, um die Reihenfolge im Katalog zu ändern."
          actions={
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              Leistung hinzufügen
            </Button>
          }
        />
        <CardBody className="space-y-4">
          <Input
            label="Suche"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titel, Beschreibung oder Kategorie"
            wrapperClassName="max-w-md"
          />

          {query ? (
            <div className="space-y-2">
              {filtered.map((benefit) => (
                <BenefitRow
                  key={benefit.id}
                  benefit={benefit}
                  onEdit={() => setEditing(benefit)}
                  onToggle={() => toggleActive(benefit)}
                  onDelete={() => setDeleting(benefit)}
                />
              ))}
              {filtered.length === 0 ? (
                <p className="rounded-control border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-fg-subtle">
                  Keine Leistungen gefunden.
                </p>
              ) : null}
            </div>
          ) : (
            <SortableList
              items={benefits}
              onReorder={handleReorder}
              renderItem={(benefit, controls) => (
                <BenefitRow
                  benefit={benefit}
                  controls={controls}
                  onEdit={() => setEditing(benefit)}
                  onToggle={() => toggleActive(benefit)}
                  onDelete={() => setDeleting(benefit)}
                />
              )}
            />
          )}
        </CardBody>
      </Card>

      <BenefitDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(formData) => submit(formData, 'create')}
        busy={isPending}
        categories={categories}
        title="Leistung hinzufügen"
      />

      <BenefitDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSubmit={(formData) => submit(formData, 'update')}
        busy={isPending}
        categories={categories}
        benefit={editing}
        title="Leistung bearbeiten"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          const result = await deleteBenefitAction(deleting.id)
          if (result.status === 'success') {
            toast.success(result.message ?? 'Gelöscht.')
            setBenefits((current) => current.filter((entry) => entry.id !== deleting.id))
            router.refresh()
          } else {
            toast.error(result.message ?? 'Löschen fehlgeschlagen.')
          }
        }}
        title="Leistung löschen?"
        description={
          deleting?.usageCount
            ? `Diese Leistung wird auf ${deleting.usageCount} Sponsorenseite(n) verwendet und kann nicht gelöscht werden. Deaktivieren Sie sie stattdessen.`
            : `„${deleting?.title}“ wird endgültig aus dem Katalog entfernt.`
        }
        confirmLabel="Löschen"
      />
    </>
  )
}

function BenefitRow({
  benefit,
  controls,
  onEdit,
  onToggle,
  onDelete,
}: {
  benefit: CatalogueBenefit
  controls?: Parameters<typeof SortHandle>[0]['controls']
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-control border border-line bg-surface-raised px-2 py-2',
        !benefit.active && 'opacity-60',
      )}
    >
      {controls ? <SortHandle controls={controls} className="mt-0.5" /> : <span className="w-2" />}

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13.5px] font-medium text-fg">{benefit.title}</p>
          <Badge tone="neutral">{benefit.category}</Badge>
          {benefit.defaultBenefit ? <Badge tone="brand">Standard</Badge> : null}
          {!benefit.active ? <Badge tone="warning">Inaktiv</Badge> : null}
        </div>
        {benefit.description ? (
          <p className="mt-1 text-[12.5px] leading-relaxed text-fg-subtle">{benefit.description}</p>
        ) : null}
        {benefit.usageCount > 0 ? (
          <p className="mt-1 text-[11.5px] text-fg-subtle">Auf {benefit.usageCount} Seite(n) im Einsatz</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onToggle}>
          {benefit.active ? 'Deaktivieren' : 'Aktivieren'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Bearbeiten
        </Button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Leistung löschen"
          className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-danger/12 hover:text-danger"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m1.5 0-.5 9.5A1.5 1.5 0 0 1 11.5 17h-3A1.5 1.5 0 0 1 7 15.5L6.5 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function BenefitDialog({
  open,
  onClose,
  onSubmit,
  busy,
  categories,
  benefit,
  title,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (formData: FormData) => void
  busy: boolean
  categories: string[]
  benefit?: CatalogueBenefit | null
  title: string
}) {
  const [active, setActive] = useState(benefit?.active ?? true)
  const [isDefault, setIsDefault] = useState(benefit?.defaultBenefit ?? false)

  return (
    <Modal open={open} onClose={onClose} title={title} size="md" busy={busy}>
      <form action={onSubmit} className="space-y-4" key={benefit?.id ?? 'new'}>
        {benefit ? <input type="hidden" name="id" value={benefit.id} /> : null}

        <Input label="Titel" name="title" required defaultValue={benefit?.title ?? ''} maxLength={200} />
        <Textarea
          label="Beschreibung"
          name="description"
          rows={3}
          defaultValue={benefit?.description ?? ''}
          maxLength={1000}
          hint="Wird auf der Sponsorenseite unter dem Titel angezeigt."
        />
        <Input
          label="Kategorie"
          name="category"
          defaultValue={benefit?.category ?? 'Allgemein'}
          maxLength={80}
          list="benefit-categories"
        />
        <datalist id="benefit-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>

        <Toggle name="active" checked={active} onChange={setActive} label="Aktiv" description="Inaktive Leistungen stehen bei neuen Seiten nicht zur Auswahl." />
        <Toggle
          name="defaultBenefit"
          checked={isDefault}
          onChange={setIsDefault}
          label="Standardleistung"
          description="Wird in Übersichten als Standardangebot hervorgehoben."
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" loading={busy}>
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  )
}
