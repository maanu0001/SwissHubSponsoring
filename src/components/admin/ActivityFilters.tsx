'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { ACTIVITY_ACTION } from '@/lib/labels'

export function ActivityFilters({
  entityTypes,
  current,
}: {
  entityTypes: string[]
  current: { action: string; entity: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function apply(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  const hasFilters = Boolean(current.action || current.entity)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        label="Aktion"
        value={current.action}
        onChange={(event) => apply({ action: event.target.value })}
        wrapperClassName="w-full sm:w-56"
      >
        <option value="">Alle Aktionen</option>
        {(Object.keys(ACTIVITY_ACTION) as (keyof typeof ACTIVITY_ACTION)[]).map((action) => (
          <option key={action} value={action}>
            {ACTIVITY_ACTION[action].label}
          </option>
        ))}
      </Select>

      <Select
        label="Bereich"
        value={current.entity}
        onChange={(event) => apply({ entity: event.target.value })}
        wrapperClassName="w-full sm:w-56"
      >
        <option value="">Alle Bereiche</option>
        {entityTypes.map((entity) => (
          <option key={entity} value={entity}>
            {entity}
          </option>
        ))}
      </Select>

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          loading={isPending}
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
        >
          Zurücksetzen
        </Button>
      ) : null}
    </div>
  )
}
