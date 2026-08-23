'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Field'
import { SPONSOR_STATUS, SPONSOR_STATUS_ORDER } from '@/lib/labels'

export interface SponsorFiltersProps {
  industries: string[]
  tournaments: { id: string; title: string }[]
  current: {
    q: string
    status: string
    industry: string
    tournament: string
    from: string
    to: string
    sort: string
  }
}

const SORT_OPTIONS = [
  { value: 'updated', label: 'Zuletzt aktualisiert' },
  { value: 'name', label: 'Firmenname A–Z' },
  { value: 'status', label: 'Status' },
  { value: 'contact', label: 'Letztes Kontaktdatum' },
]

/**
 * URL-driven filter bar. Keeping the state in the query string means every
 * filtered view is bookmarkable and survives a reload.
 */
export function SponsorFilters({ industries, tournaments, current }: SponsorFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(current.q)
  const [advanced, setAdvanced] = useState(Boolean(current.from || current.to || current.industry || current.tournament))
  const firstRender = useRef(true)

  function apply(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    // Any filter change resets pagination.
    params.delete('page')
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  // Debounced free text search.
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

  const hasFilters = Boolean(
    current.q || current.status || current.industry || current.tournament || current.from || current.to,
  )

  return (
    <Card className="mt-1">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[220px]">
          <Input
            label="Suche"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Firmenname, Ansprechpartner oder E-Mail"
            type="search"
          />
        </div>

        <Select
          label="Status"
          value={current.status}
          onChange={(event) => apply({ status: event.target.value })}
          wrapperClassName="w-full sm:w-52"
        >
          <option value="">Alle Status</option>
          {SPONSOR_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {SPONSOR_STATUS[status].label}
            </option>
          ))}
        </Select>

        <Select
          label="Sortierung"
          value={current.sort}
          onChange={(event) => apply({ sort: event.target.value })}
          wrapperClassName="w-full sm:w-52"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="md" onClick={() => setAdvanced((value) => !value)}>
            {advanced ? 'Weniger Filter' : 'Mehr Filter'}
          </Button>
          {hasFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
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
      </div>

      {advanced ? (
        <div className="grid gap-3 border-t border-line px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Branche"
            value={current.industry}
            onChange={(event) => apply({ industry: event.target.value })}
          >
            <option value="">Alle Branchen</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </Select>

          <Select
            label="Turnier"
            value={current.tournament}
            onChange={(event) => apply({ tournament: event.target.value })}
          >
            <option value="">Alle Turniere</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.title}
              </option>
            ))}
          </Select>

          <Input
            label="Kontakt ab"
            type="date"
            value={current.from}
            onChange={(event) => apply({ from: event.target.value })}
          />
          <Input
            label="Kontakt bis"
            type="date"
            value={current.to}
            onChange={(event) => apply({ to: event.target.value })}
          />
        </div>
      ) : null}
    </Card>
  )
}
