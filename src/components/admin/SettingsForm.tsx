'use client'

import { useActionState, useState } from 'react'
import type { Media } from '@prisma/client'

import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Field'
import { FormMessage, SubmitButton, useActionToast } from '@/components/ui/Form'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { ColorField } from '@/components/admin/ColorField'
import type { SettingDefinition } from '@/lib/settings'
import { IDLE } from '@/lib/result'
import { updateSettingsAction } from '@/server/actions/settings'

export interface SettingsFormProps {
  group: string
  title: string
  description: string
  definitions: SettingDefinition[]
  values: Record<string, string>
  mediaById: Record<string, Media>
}

/** Renders one settings group, choosing the right control per setting type. */
export function SettingsForm({ group, title, description, definitions, values, mediaById }: SettingsFormProps) {
  const [state, formAction] = useActionState(updateSettingsAction, IDLE)
  const [mediaValues, setMediaValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      definitions.filter((definition) => definition.type === 'MEDIA').map((definition) => [definition.key, values[definition.key] ?? '']),
    ),
  )
  const [htmlValues, setHtmlValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      definitions.filter((definition) => definition.type === 'HTML').map((definition) => [definition.key, values[definition.key] ?? '']),
    ),
  )
  useActionToast(state)

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="__group" value={group} />
          <FormMessage state={state} />

          {definitions.map((definition) => {
            const value = values[definition.key] ?? definition.defaultValue

            if (definition.type === 'MEDIA') {
              return (
                <MediaPicker
                  key={definition.key}
                  label={definition.label}
                  name={definition.key}
                  hint={definition.hint}
                  value={mediaValues[definition.key] ?? ''}
                  initialMedia={mediaById[mediaValues[definition.key] ?? ''] ?? null}
                  onChange={(id) => setMediaValues((current) => ({ ...current, [definition.key]: id }))}
                />
              )
            }

            if (definition.type === 'COLOR') {
              return (
                <ColorField
                  key={definition.key}
                  name={definition.key}
                  label={definition.label}
                  hint={definition.hint}
                  defaultValue={value}
                  error={state.errors?.[definition.key]}
                />
              )
            }

            if (definition.type === 'HTML') {
              return (
                <RichTextEditor
                  key={definition.key}
                  label={definition.label}
                  name={definition.key}
                  hint={definition.hint}
                  minHeight={260}
                  value={htmlValues[definition.key] ?? ''}
                  onChange={(html) => setHtmlValues((current) => ({ ...current, [definition.key]: html }))}
                />
              )
            }

            if (definition.multiline) {
              return (
                <Textarea
                  key={definition.key}
                  label={definition.label}
                  name={definition.key}
                  hint={definition.hint}
                  rows={3}
                  defaultValue={value}
                  error={state.errors?.[definition.key]}
                  maxLength={2000}
                />
              )
            }

            return (
              <Input
                key={definition.key}
                label={definition.label}
                name={definition.key}
                hint={definition.hint}
                defaultValue={value}
                error={state.errors?.[definition.key]}
                maxLength={600}
              />
            )
          })}

          <div className="flex justify-end border-t border-line pt-5">
            <SubmitButton>Einstellungen speichern</SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
