'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Media, SectionType } from '@prisma/client'

import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SortableList } from '@/components/ui/SortableList'
import { useToast } from '@/components/ui/Toast'
import { SECTION_TYPES } from '@/lib/labels'
import type { ActionState } from '@/lib/result'
import { idSignature, useServerState } from '@/lib/use-server-state'

import { PageSectionEditor, type EditableSection } from './PageSectionEditor'

export interface SectionListEditorProps {
  sections: EditableSection[]
  /** Section kinds offered in the "add section" dialog. */
  availableTypes: SectionType[]
  onSave: (section: EditableSection) => Promise<ActionState>
  onDelete: (id: string) => Promise<ActionState>
  onToggleVisible: (id: string, visible: boolean) => Promise<ActionState>
  onReorder: (orderedIds: string[]) => Promise<ActionState>
  onAdd: (type: SectionType) => Promise<ActionState>
  tournaments: { id: string; title: string; game: string }[]
  partners: { id: string; name: string }[]
  mediaById: Record<string, Media>
}

/**
 * Sortable list of editable sections.
 * Reordering persists immediately; content changes are saved per section so a
 * long editing session can never be lost by one failing request.
 */
export function SectionListEditor({
  sections: initialSections,
  availableTypes,
  onSave,
  onDelete,
  onToggleVisible,
  onReorder,
  onAdd,
  tournaments,
  partners,
  mediaById,
}: SectionListEditorProps) {
  const router = useRouter()
  const toast = useToast()
  // Re-syncs when sections are added or removed on the server.
  const [sections, setSections] = useServerState(initialSections, idSignature)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleReorder(next: EditableSection[]) {
    const previous = sections
    setSections(next)
    startTransition(async () => {
      const result = await onReorder(next.map((section) => section.id))
      if (result.status === 'error') {
        setSections(previous)
        toast.error(result.message ?? 'Die Reihenfolge konnte nicht gespeichert werden.')
      } else {
        router.refresh()
      }
    })
  }

  async function handleSave(section: EditableSection): Promise<boolean> {
    const result = await onSave(section)
    if (result.status === 'success') {
      setSections((current) => current.map((entry) => (entry.id === section.id ? section : entry)))
      toast.success(result.message ?? 'Gespeichert.')
      router.refresh()
      return true
    }
    toast.error(result.message ?? 'Speichern fehlgeschlagen.')
    return false
  }

  async function handleDelete(id: string) {
    const result = await onDelete(id)
    if (result.status === 'success') {
      setSections((current) => current.filter((section) => section.id !== id))
      toast.success(result.message ?? 'Gelöscht.')
      router.refresh()
    } else {
      toast.error(result.message ?? 'Löschen fehlgeschlagen.')
    }
  }

  async function handleToggleVisible(id: string, visible: boolean) {
    const result = await onToggleVisible(id, visible)
    if (result.status === 'success') {
      setSections((current) =>
        current.map((section) => (section.id === id ? { ...section, visible } : section)),
      )
      router.refresh()
    } else {
      toast.error(result.message ?? 'Änderung fehlgeschlagen.')
    }
  }

  function handleAdd(type: SectionType) {
    startTransition(async () => {
      const result = await onAdd(type)
      if (result.status === 'success' && result.data?.id) {
        const created: EditableSection = {
          id: result.data.id,
          type,
          title: '',
          subtitle: '',
          content: '',
          data: {},
          visible: true,
        }
        setSections((current) => [...current, created])
        setExpanded(created.id)
        setAddOpen(false)
        toast.success('Sektion hinzugefügt.')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Die Sektion konnte nicht hinzugefügt werden.')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-fg-subtle">
          {sections.length} Sektion{sections.length === 1 ? '' : 'en'} · Ziehen Sie am Griff oder nutzen Sie die Pfeile,
          um die Reihenfolge zu ändern.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setAddOpen(true)} disabled={isPending}>
          Sektion hinzufügen
        </Button>
      </div>

      {sections.length === 0 ? (
        <EmptyState
          title="Noch keine Sektionen"
          description="Fügen Sie die erste Sektion hinzu, um die Seite aufzubauen."
          action={
            <Button type="button" onClick={() => setAddOpen(true)}>
              Sektion hinzufügen
            </Button>
          }
        />
      ) : (
        <SortableList
          items={sections}
          onReorder={handleReorder}
          renderItem={(section, controls) => (
            <PageSectionEditor
              section={section}
              controls={controls}
              expanded={expanded === section.id}
              onToggleExpand={() => setExpanded(expanded === section.id ? null : section.id)}
              onSave={handleSave}
              onDelete={() => handleDelete(section.id)}
              onToggleVisible={(visible) => handleToggleVisible(section.id, visible)}
              tournaments={tournaments}
              partners={partners}
              mediaById={mediaById}
            />
          )}
        />
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Sektion hinzufügen"
        description="Wählen Sie den Typ der neuen Sektion. Inhalte ergänzen Sie danach direkt im Editor."
        size="lg"
        busy={isPending}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              disabled={isPending}
              onClick={() => handleAdd(type)}
              className="rounded-control border border-line bg-surface-raised px-4 py-3.5 text-left transition-colors hover:border-brand-accent/60 hover:bg-surface-overlay disabled:opacity-50"
            >
              <span className="block text-[13.5px] font-medium text-fg">{SECTION_TYPES[type].label}</span>
              <span className="mt-1 block text-[12px] leading-relaxed text-fg-subtle">
                {SECTION_TYPES[type].description}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
