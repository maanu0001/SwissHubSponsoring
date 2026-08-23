'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { TOURNAMENT_STATUS, TOURNAMENT_STATUS_ORDER } from '@/lib/labels'

export function TournamentFilters({
  games,
  current,
}: {
  games: string[]
  current: { q: string; status: string; game: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(current.q)
  const firstRender = useRef(true)

  function apply(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      if (query !== current.q) apply({ q: query })
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const hasFilters = Boolean(current.q || current.status || current.game)

  return (
    <Card className="mt-1">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[200px]">
          <Input
            label="Suche"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Turniername oder Spiel"
          />
        </div>
        <Select
          label="Status"
          value={current.status}
          onChange={(event) => apply({ status: event.target.value })}
          wrapperClassName="w-full sm:w-52"
        >
          <option value="">Alle Status</option>
          {TOURNAMENT_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {TOURNAMENT_STATUS[status].label}
            </option>
          ))}
        </Select>
        <Select
          label="Spiel"
          value={current.game}
          onChange={(event) => apply({ game: event.target.value })}
          wrapperClassName="w-full sm:w-52"
        >
          <option value="">Alle Spiele</option>
          {games.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </Select>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            loading={isPending}
            onClick={() => {
              setQuery('')
              startTransition(() => router.replace(pathname, { scroll: false }))
            }}
          >
            Zurücksetzen
          </Button>
        ) : null}
      </div>
    </Card>
  )
}
