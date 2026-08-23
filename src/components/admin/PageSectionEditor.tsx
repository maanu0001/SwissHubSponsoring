'use client'

import { useState, useTransition } from 'react'
import type { Media, SectionType } from '@prisma/client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Field'
import { SortHandle, type SortableControls } from '@/components/ui/SortableList'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { SECTION_TYPES } from '@/lib/labels'
import type { SectionData } from '@/lib/section-data'

import { RichTextEditor } from './RichTextEditor'
import { SectionDataEditor } from './editors/SectionDataEditor'

export interface EditableSection {
  id: string
  type: SectionType
  title: string
  subtitle: string
  content: string
  data: SectionData
  visible: boolean
}

export interface PageSectionEditorProps {
  section: EditableSection
  controls: SortableControls
  expanded: boolean
  onToggleExpand: () => void
  onSave: (section: EditableSection) => Promise<boolean>
  onDelete: () => Promise<void>
  onToggleVisible: (visible: boolean) => Promise<void>
  tournaments: { id: string; title: string; game: string }[]
  partners: { id: string; name: string }[]
  mediaById: Record<string, Media>
}

/** One editable section card inside the sponsor page or CMS editor. */
export function PageSectionEditor({
  section,
  controls,
  expanded,
  onToggleExpand,
  onSave,
  onDelete,
  onToggleVisible,
  tournaments,
  partners,
  mediaById,
}: PageSectionEditorProps) {
  const meta = SECTION_TYPES[section.type]
  const [draft, setDraft] = useState<EditableSection>(section)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [, startTransition] = useTransition()
  const toast = useToast()

  function patch(next: Partial<EditableSection>) {
    setDraft((current) => ({ ...current, ...next }))
    setDirty(true)
  }

  async function save() {
    setSaving(true)
    const ok = await onSave(draft)
    setSaving(false)
    if (ok) setDirty(false)
  }

  function reset() {
    setDraft(section)
    setDirty(false)
  }

  async function toggleVisible() {
    const next = !draft.visible
    setDraft((current) => ({ ...current, visible: next }))
    startTransition(async () => {
      await onToggleVisible(next)
    })
  }

  return (
    <div
      className={cn(
        'rounded-card border bg-surface transition-colors',
        expanded ? 'border-brand-accent/40' : 'border-line',
        !draft.visible && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <SortHandle controls={controls} />

        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-1.5 py-1 text-left transition-colors hover:bg-surface-raised"
        >
          <svg
            className={cn('h-3.5 w-3.5 shrink-0 text-fg-subtle transition-transform', expanded && 'rotate-90')}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium text-fg">
              {draft.title || meta.label}
            </span>
            <span className="block truncate text-[12px] text-fg-subtle">{meta.label}</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {dirty ? <Badge tone="warning">Ungespeichert</Badge> : null}
          {!draft.visible ? <Badge tone="neutral">Ausgeblendet</Badge> : null}

          <button
            type="button"
            onClick={toggleVisible}
            aria-label={draft.visible ? 'Sektion ausblenden' : 'Sektion einblenden'}
            title={draft.visible ? 'Sektion ausblenden' : 'Sektion einblenden'}
            className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-surface-overlay hover:text-fg"
          >
            {draft.visible ? (
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

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label="Sektion löschen"
            title="Sektion löschen"
            className="rounded p-1.5 text-fg-subtle transition-colors hover:bg-danger/12 hover:text-danger"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m1.5 0-.5 9.5A1.5 1.5 0 0 1 11.5 17h-3A1.5 1.5 0 0 1 7 15.5L6.5 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="space-y-5 border-t border-line px-4 py-5">
          <p className="text-[12.5px] leading-relaxed text-fg-subtle">{meta.description}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Titel" value={draft.title} onChange={(event) => patch({ title: event.target.value })} maxLength={200} />
            <Input
              label="Untertitel"
              value={draft.subtitle}
              onChange={(event) => patch({ subtitle: event.target.value })}
              maxLength={300}
            />
          </div>

          <RichTextEditor
            label="Inhalt"
            value={draft.content}
            onChange={(content) => patch({ content })}
            minHeight={meta.richText ? 180 : 120}
            hint="Unterstützt Überschriften, Fett, Kursiv, Links, Listen und Absätze."
          />

          <SectionDataEditor
            type={draft.type}
            data={draft.data}
            onChange={(data) => patch({ data })}
            tournaments={tournaments}
            partners={partners}
            mediaById={mediaById}
          />

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            {dirty ? (
              <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
                Verwerfen
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                if (!dirty) {
                  toast.show('Keine Änderungen vorhanden.')
                  return
                }
                void save()
              }}
              loading={saving}
            >
              Sektion speichern
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={onDelete}
        title="Sektion löschen?"
        description={`Die Sektion „${draft.title || meta.label}“ wird von dieser Seite entfernt. Andere Seiten bleiben unverändert.`}
        confirmLabel="Sektion löschen"
      />
    </div>
  )
}
