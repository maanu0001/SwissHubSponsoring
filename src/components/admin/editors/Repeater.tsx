'use client'

import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { SortHandle, SortableList, type SortableControls } from '@/components/ui/SortableList'
import { cn } from '@/lib/cn'

export interface RepeaterProps<T> {
  label: string
  hint?: string
  items: T[]
  onChange: (items: T[]) => void
  /** Factory for a new, empty entry. */
  create: () => T
  renderFields: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode
  /** Short summary shown in the collapsed row header. */
  summary?: (item: T, index: number) => string
  addLabel?: string
  max?: number
  className?: string
}

/**
 * Generic list editor with drag & drop plus up/down buttons.
 * Used for stats, bullets, budget entries, steps, quotes, links and galleries,
 * so all of them behave identically.
 */
export function Repeater<T>({
  label,
  hint,
  items,
  onChange,
  create,
  renderFields,
  summary,
  addLabel = 'Eintrag hinzufügen',
  max = 24,
  className,
}: RepeaterProps<T>) {
  // Stable keys are required for drag & drop; index based ids are recomputed
  // on every reorder, which is fine because the whole list is replaced at once.
  const withIds = items.map((item, index) => ({ id: `item-${index}`, item, index }))

  function update(index: number, patch: Partial<T>) {
    onChange(items.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function add() {
    if (items.length >= max) return
    onChange([...items, create()])
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-fg-muted">{label}</p>
          {hint ? <p className="mt-0.5 text-[12px] leading-relaxed text-fg-subtle">{hint}</p> : null}
        </div>
        <span className="shrink-0 text-[12px] text-fg-subtle">
          {items.length}/{max}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-control border border-dashed border-line-strong px-4 py-5 text-center text-[12.5px] text-fg-subtle">
          Noch keine Einträge. Fügen Sie den ersten hinzu.
        </p>
      ) : (
        <SortableList
          items={withIds}
          onReorder={(next) => onChange(next.map((entry) => entry.item))}
          renderItem={(entry, controls) => (
            <RepeaterRow
              controls={controls}
              title={summary?.(entry.item, entry.index) || `Eintrag ${controls.index + 1}`}
              onRemove={() => remove(controls.index)}
            >
              {renderFields(entry.item, (patch) => update(controls.index, patch), controls.index)}
            </RepeaterRow>
          )}
        />
      )}

      <Button type="button" variant="secondary" size="sm" onClick={add} disabled={items.length >= max}>
        {addLabel}
      </Button>
    </div>
  )
}

function RepeaterRow({
  controls,
  title,
  onRemove,
  children,
}: {
  controls: SortableControls
  title: string
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <div className="rounded-control border border-line bg-surface-raised">
      <div className="flex items-center gap-2 border-b border-line px-2 py-1.5">
        <SortHandle controls={controls} />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg-muted">{title}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Eintrag entfernen"
          className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-danger/12 hover:text-danger"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m1.5 0-.5 9.5A1.5 1.5 0 0 1 11.5 17h-3A1.5 1.5 0 0 1 7 15.5L6.5 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="space-y-3 px-3 py-3">{children}</div>
    </div>
  )
}
