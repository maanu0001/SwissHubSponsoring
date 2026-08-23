'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { TEMPLATE_TYPE } from '@/lib/labels'
import { IDLE } from '@/lib/result'
import { createTemplateAction } from '@/server/actions/templates'

export function NewTemplateButton({ templates }: { templates: { id: string; name: string }[] }) {
  const router = useRouter()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createTemplateAction(IDLE, formData)
      if (result.status === 'success' && result.data?.id) {
        toast.success(result.message ?? 'Template erstellt.')
        setOpen(false)
        router.push(`/admin/templates/${result.data.id}`)
      } else {
        toast.error(result.message ?? 'Das Template konnte nicht erstellt werden.')
      }
    })
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Template erstellen
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Template erstellen"
        description="Starten Sie leer oder übernehmen Sie die Struktur eines bestehenden Templates."
        size="md"
        busy={isPending}
      >
        <form action={submit} className="space-y-4">
          <Input label="Name" name="name" required maxLength={160} placeholder="z. B. Media-Partner" />
          <Textarea label="Beschreibung" name="description" rows={2} maxLength={1000} />
          <Select label="Typ" name="type" defaultValue="CUSTOM">
            {(Object.keys(TEMPLATE_TYPE) as (keyof typeof TEMPLATE_TYPE)[]).map((type) => (
              <option key={type} value={type}>
                {TEMPLATE_TYPE[type].label}
              </option>
            ))}
          </Select>
          <Select
            label="Struktur übernehmen von"
            name="copyFrom"
            defaultValue=""
            hint="Optional – kopiert Sektionen und Standardleistungen."
          >
            <option value="">Leer starten</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              Erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
