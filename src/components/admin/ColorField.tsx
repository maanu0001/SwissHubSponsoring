'use client'

import { useId, useState } from 'react'

import { FieldShell } from '@/components/ui/Field'
import { expandHex, isHexColor } from '@/lib/color'

export interface ColorFieldProps {
  name: string
  label: string
  hint?: string
  defaultValue: string
  error?: string
}

/** Colour picker plus hex input, kept in sync in both directions. */
export function ColorField({ name, label, hint, defaultValue, error }: ColorFieldProps) {
  const [value, setValue] = useState(defaultValue)
  const id = useId()
  const valid = isHexColor(value)

  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={`${label} auswählen`}
          value={valid ? expandHex(value) : '#000000'}
          onChange={(event) => setValue(event.target.value.toUpperCase())}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-control border border-line bg-surface-raised p-1"
        />
        <input
          id={id}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          maxLength={7}
          className="h-10 w-full rounded-control border border-line bg-surface-raised px-3 font-mono text-sm uppercase text-fg focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/35"
        />
        <span
          className="h-10 w-10 shrink-0 rounded-control border border-line"
          style={{ backgroundColor: valid ? value : 'transparent' }}
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  )
}
