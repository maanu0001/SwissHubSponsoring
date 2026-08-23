'use client'

import { useMemo, useState, useTransition } from 'react'
import type { SponsoringBenefit } from '@prisma/client'

import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { createBenefitAction } from '@/server/actions/benefits'
import { IDLE } from '@/lib/result'

export interface BenefitSelectorProps {
  benefits: SponsoringBenefit[]
  selected: string[]
  onChange: (ids: string[]) => void
  /** Emits hidden inputs so the selection works inside a plain form. */
  name?: string
  /** Called after a new benefit was created inline. */
  onBenefitCreated?: (benefit: SponsoringBenefit) => void
  className?: string
}

/**
 * Grouped checkbox catalogue with inline creation of new benefits, so a page
 * can always be finished without leaving the current screen.
 */
export function BenefitSelector({
  benefits,
  selected,
  onChange,
  name,
  onBenefitCreated,
  className,
}: BenefitSelectorProps) {
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const toast = useToast()

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const grouped = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const map = new Map<string, SponsoringBenefit[]>()
    for (const benefit of benefits) {
      if (!benefit.active && !selectedSet.has(benefit.id)) continue
      if (
        needle &&
        !benefit.title.toLowerCase().includes(needle) &&
        !(benefit.description ?? '').toLowerCase().includes(needle)
      ) {
        continue
      }
      const list = map.get(benefit.category) ?? []
      list.push(benefit)
      map.set(benefit.category, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'de'))
  }, [benefits, query, selectedSet])

  function toggle(id: string) {
    onChange(selectedSet.has(id) ? selected.filter((entry) => entry !== id) : [...selected, id])
  }

  function selectAllVisible() {
    const visible = grouped.flatMap(([, list]) => list.map((benefit) => benefit.id))
    const merged = new Set([...selected, ...visible])
    onChange([...merged])
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createBenefitAction(IDLE, formData)
      if (result.status === 'success' && result.data?.id) {
        toast.success(result.message ?? 'Leistung erstellt.')
        onChange([...selected, result.data.id])
        onBenefitCreated?.({
          id: result.data.id,
          title: result.data.title ?? '',
          description: result.data.description ?? null,
          category: result.data.category ?? 'Allgemein',
          icon: null,
          active: true,
          defaultBenefit: false,
          order: 9999,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        setDialogOpen(false)
      } else {
        toast.error(result.message ?? 'Die Leistung konnte nicht erstellt werden.')
      }
    })
  }

  return (
    <div className={cn('space-y-3', className)}>
      {name ? selected.map((id) => <input key={id} type="hidden" name={name} value={id} />) : null}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          wrapperClassName="min-w-[200px] flex-1"
          label="Leistungen durchsuchen"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="z. B. Logo, Stream, Giveaway"
        />
        <Button type="button" variant="secondary" onClick={() => setDialogOpen(true)}>
          Eigene Leistung hinzufügen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-fg-subtle">
        <span>
          {selected.length} von {benefits.filter((benefit) => benefit.active).length} ausgewählt
        </span>
        <button type="button" onClick={selectAllVisible} className="text-brand-accent transition-colors hover:text-fg">
          Alle sichtbaren auswählen
        </button>
        {selected.length > 0 ? (
          <button type="button" onClick={() => onChange([])} className="text-fg-subtle transition-colors hover:text-fg">
            Auswahl leeren
          </button>
        ) : null}
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-control border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-fg-subtle">
          Keine Leistungen gefunden.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([category, list]) => (
            <fieldset key={category}>
              <legend className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
                {category}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {list.map((benefit) => {
                  const checked = selectedSet.has(benefit.id)
                  return (
                    <label
                      key={benefit.id}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-control border px-3.5 py-3 transition-colors',
                        checked
                          ? 'border-brand-accent/60 bg-brand/10'
                          : 'border-line bg-surface-raised hover:border-line-strong',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(benefit.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line-strong bg-surface accent-[rgb(var(--c-brand))]"
                      />
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-medium text-fg">{benefit.title}</span>
                        {benefit.description ? (
                          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-fg-subtle">
                            {benefit.description}
                          </span>
                        ) : null}
                        {!benefit.active ? (
                          <span className="mt-1 inline-block text-[11.5px] text-warning">Im Katalog deaktiviert</span>
                        ) : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Eigene Leistung hinzufügen"
        description="Die Leistung wird in den Katalog aufgenommen und steht danach überall zur Verfügung."
        size="md"
        busy={isPending}
      >
        <form action={handleCreate} className="space-y-4">
          <Input label="Titel" name="title" required maxLength={200} placeholder="z. B. Logo auf dem Turniertrikot" />
          <Textarea
            label="Beschreibung"
            name="description"
            rows={3}
            maxLength={1000}
            placeholder="Kurze Erklärung der Leistung für den Sponsor"
          />
          <Input label="Kategorie" name="category" defaultValue="Allgemein" maxLength={80} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              Leistung erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
