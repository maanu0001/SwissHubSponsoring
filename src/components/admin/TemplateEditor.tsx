'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { SectionType, SponsoringBenefit, TemplateType } from '@prisma/client'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea, Toggle } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { SortableList } from '@/components/ui/SortableList'
import { useToast } from '@/components/ui/Toast'
import { BenefitSelector } from '@/components/admin/BenefitSelector'
import { PageSectionEditor, type EditableSection } from '@/components/admin/PageSectionEditor'
import { SECTION_TYPES, SPONSOR_PAGE_SECTION_TYPES, TEMPLATE_TYPE } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import {
  deleteTemplateAction,
  setTemplateBenefitsAction,
  updateTemplateAction,
  updateTemplateStructureAction,
} from '@/server/actions/templates'

export interface TemplateEditorProps {
  template: {
    id: string
    name: string
    slug: string
    description: string
    type: TemplateType
    active: boolean
    pageCount: number
  }
  sections: EditableSection[]
  defaultBenefitIds: string[]
  benefits: SponsoringBenefit[]
  tournaments: { id: string; title: string; game: string }[]
  partners: { id: string; name: string }[]
}

/**
 * Editor for a template's blueprint.
 * Structure changes only affect pages created from now on – existing sponsor
 * pages are independent copies and stay untouched.
 */
export function TemplateEditor({
  template,
  sections: initialSections,
  defaultBenefitIds,
  benefits: initialBenefits,
  tournaments,
  partners,
}: TemplateEditorProps) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()

  const [sections, setSections] = useState(initialSections)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [structureDirty, setStructureDirty] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [active, setActive] = useState(template.active)

  const [benefits, setBenefits] = useState(initialBenefits)
  const [selectedBenefits, setSelectedBenefits] = useState(defaultBenefitIds)
  const [benefitsDirty, setBenefitsDirty] = useState(false)

  function persistStructure(next: EditableSection[]) {
    startTransition(async () => {
      const payload = JSON.stringify(
        next.map((section) => ({
          type: section.type,
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
          data: section.data,
          visible: section.visible,
        })),
      )
      const result = await updateTemplateStructureAction(template.id, payload)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Struktur gespeichert.')
        setStructureDirty(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  function saveSettings(formData: FormData) {
    startTransition(async () => {
      const result = await updateTemplateAction(IDLE, formData)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  function saveBenefits() {
    startTransition(async () => {
      const result = await setTemplateBenefitsAction(template.id, selectedBenefits)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gespeichert.')
        setBenefitsDirty(false)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Speichern fehlgeschlagen.')
      }
    })
  }

  function addSection(type: SectionType) {
    const next: EditableSection = {
      id: `blueprint-${Date.now()}`,
      type,
      title: '',
      subtitle: '',
      content: '',
      data: {},
      visible: true,
    }
    setSections((current) => [...current, next])
    setExpanded(next.id)
    setStructureDirty(true)
    setAddOpen(false)
  }

  return (
    <div className="space-y-5">
      <Alert tone="info">
        Änderungen am Template wirken sich nur auf <strong>neu erstellte</strong> Sponsorenseiten aus. Bereits
        erstellte Seiten sind eigenständige Kopien und bleiben unverändert.
      </Alert>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader
            title="Struktur"
            description="Standardsektionen, Standardtexte und Standardreihenfolge für neue Seiten."
            actions={
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
                  Sektion hinzufügen
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => persistStructure(sections)}
                  loading={isPending}
                  disabled={!structureDirty}
                >
                  Struktur speichern
                </Button>
              </div>
            }
          />
          <CardBody>
            {sections.length === 0 ? (
              <EmptyState
                compact
                title="Leeres Template"
                description="Fügen Sie Sektionen hinzu, die neue Sponsorenseiten als Ausgangspunkt erhalten."
                action={
                  <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
                    Sektion hinzufügen
                  </Button>
                }
              />
            ) : (
              <SortableList
                items={sections}
                onReorder={(next) => {
                  setSections(next)
                  setStructureDirty(true)
                }}
                renderItem={(section, controls) => (
                  <PageSectionEditor
                    section={section}
                    controls={controls}
                    expanded={expanded === section.id}
                    onToggleExpand={() => setExpanded(expanded === section.id ? null : section.id)}
                    tournaments={tournaments}
                    partners={partners}
                    mediaById={{}}
                    onSave={async (updated) => {
                      setSections((current) =>
                        current.map((entry) => (entry.id === updated.id ? updated : entry)),
                      )
                      setStructureDirty(true)
                      toast.show('Übernommen – bitte oben „Struktur speichern“ klicken.')
                      return true
                    }}
                    onDelete={async () => {
                      setSections((current) => current.filter((entry) => entry.id !== section.id))
                      setStructureDirty(true)
                    }}
                    onToggleVisible={async (visible) => {
                      setSections((current) =>
                        current.map((entry) => (entry.id === section.id ? { ...entry, visible } : entry)),
                      )
                      setStructureDirty(true)
                    }}
                  />
                )}
              />
            )}

            {structureDirty ? (
              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={() => persistStructure(sections)} loading={isPending}>
                  Struktur speichern
                </Button>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Einstellungen" />
            <CardBody>
              <form action={saveSettings} className="space-y-4">
                <input type="hidden" name="id" value={template.id} />
                <Input label="Name" name="name" required defaultValue={template.name} maxLength={160} />
                <Input label="Slug" name="slug" defaultValue={template.slug} maxLength={80} />
                <Textarea label="Beschreibung" name="description" rows={3} defaultValue={template.description} maxLength={1000} />
                <Select label="Typ" name="type" defaultValue={template.type}>
                  {(Object.keys(TEMPLATE_TYPE) as TemplateType[]).map((type) => (
                    <option key={type} value={type}>
                      {TEMPLATE_TYPE[type].label}
                    </option>
                  ))}
                </Select>
                <Toggle
                  name="active"
                  checked={active}
                  onChange={setActive}
                  label="Aktiv"
                  description="Inaktive Templates stehen beim Erstellen einer Seite nicht zur Auswahl."
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={isPending}>
                    Speichern
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Standardleistungen"
              description="Diese Leistungen sind beim Erstellen einer Seite mit diesem Template vorausgewählt."
              actions={
                <Button type="button" size="sm" onClick={saveBenefits} loading={isPending} disabled={!benefitsDirty}>
                  Speichern
                </Button>
              }
            />
            <CardBody>
              <BenefitSelector
                benefits={benefits}
                selected={selectedBenefits}
                onChange={(ids) => {
                  setSelectedBenefits(ids)
                  setBenefitsDirty(true)
                }}
                onBenefitCreated={(benefit) => setBenefits((current) => [...current, benefit])}
              />
            </CardBody>
          </Card>

          <Card className="border-danger/25">
            <CardHeader
              title="Template löschen"
              description={
                template.pageCount > 0
                  ? `${template.pageCount} bestehende Seite(n) verweisen auf dieses Template. Sie bleiben nach dem Löschen unverändert erhalten.`
                  : 'Das Template wird endgültig entfernt.'
              }
            />
            <CardBody>
              <Button type="button" variant="danger" size="sm" onClick={() => setDeleteOpen(true)} disabled={isPending}>
                Template löschen
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Sektion hinzufügen"
        description="Diese Sektion wird bei neuen Seiten als Ausgangspunkt erstellt."
        size="lg"
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {(SPONSOR_PAGE_SECTION_TYPES as SectionType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addSection(type)}
              className="rounded-control border border-line bg-surface-raised px-4 py-3.5 text-left transition-colors hover:border-brand-accent/60 hover:bg-surface-overlay"
            >
              <span className="block text-[13.5px] font-medium text-fg">{SECTION_TYPES[type].label}</span>
              <span className="mt-1 block text-[12px] leading-relaxed text-fg-subtle">
                {SECTION_TYPES[type].description}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          const result = await deleteTemplateAction(template.id)
          if (result.status === 'success') {
            toast.success(result.message ?? 'Gelöscht.')
            router.push('/admin/templates')
          } else {
            toast.error(result.message ?? 'Löschen fehlgeschlagen.')
          }
        }}
        title="Template löschen?"
        description={`„${template.name}“ wird endgültig entfernt. Bereits erstellte Sponsorenseiten bleiben vollständig erhalten.`}
        confirmLabel="Template löschen"
      />
    </div>
  )
}
