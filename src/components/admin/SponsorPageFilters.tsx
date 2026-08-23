'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { PAGE_STATUS, PAGE_STATUS_ORDER } from '@/lib/labels'

export interface SponsorPageFiltersProps {
  tournaments: { id: string; title: string }[]
  current: { q: string; status: string; tournament: string; sort: string }
}

export function SponsorPageFilters({ tournaments, current }: SponsorPageFiltersProps) {
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
    params.delete('page')
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

  const hasFilters = Boolean(current.q || current.status || current.tournament)

  return (
    <Card className="mt-1">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[220px]">
          <Input
            label="Suche"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titel, Link oder Firmenname"
          />
        </div>

        <Select
          label="Status"
          value={current.status}
          onChange={(event) => apply({ status: event.target.value })}
          wrapperClassName="w-full sm:w-48"
        >
          <option value="">Alle Status</option>
          {PAGE_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {PAGE_STATUS[status].label}
            </option>
          ))}
        </Select>

        <Select
          label="Turnier"
          value={current.tournament}
          onChange={(event) => apply({ tournament: event.target.value })}
          wrapperClassName="w-full sm:w-52"
        >
          <option value="">Alle Turniere</option>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.title}
            </option>
          ))}
        </Select>

        <Select
          label="Sortierung"
          value={current.sort}
          onChange={(event) => apply({ sort: event.target.value })}
          wrapperClassName="w-full sm:w-48"
        >
          <option value="updated">Zuletzt aktualisiert</option>
          <option value="title">Titel A–Z</option>
          <option value="views">Meiste Aufrufe</option>
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
