'use client'

import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/ui/StatCard'
import { formatDate, formatDateTime } from '@/lib/format'

import type { EditorPage } from '@/app/admin/(app)/sponsor-pages/[id]/SponsorPageEditor'

export interface PageStatsPanelProps {
  page: EditorPage
  views: { day: string; count: number }[]
  publicUrl: string
}

/**
 * Minimal, privacy friendly statistics: a per-day counter and nothing else.
 * No IP addresses, no cookies, no fingerprinting.
 */
export function PageStatsPanel({ page, views, publicUrl }: PageStatsPanelProps) {
  const max = views.reduce((peak, entry) => Math.max(peak, entry.count), 0)
  const last30 = views.reduce((sum, entry) => sum + entry.count, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aufrufe gesamt" value={page.viewCount} />
        <StatCard label="Letzte 30 Tage" value={last30} />
        <StatCard label="Letzter Aufruf" value={page.lastViewedAt ? formatDate(page.lastViewedAt) : '—'} />
        <StatCard
          label="Veröffentlicht"
          value={page.publishedAt ? formatDate(page.publishedAt) : '—'}
          hint={page.publishedAt ? formatDateTime(page.publishedAt) : 'Noch nicht veröffentlicht'}
        />
      </div>

      <Card>
        <CardHeader
          title="Aufrufe pro Tag"
          description="Nur die Anzahl der Aufrufe wird gezählt – keine IP-Adressen, keine Cookies, kein Tracking."
        />
        <CardBody>
          {views.length === 0 ? (
            <EmptyState
              compact
              title="Noch keine Aufrufe"
              description="Sobald die Seite über den Link geöffnet wird, erscheinen hier die täglichen Aufrufe."
            />
          ) : (
            <div className="flex h-40 items-end gap-1" role="img" aria-label="Balkendiagramm der täglichen Aufrufe">
              {views.map((entry) => (
                <div key={entry.day} className="group relative flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-sm bg-brand/70 transition-colors group-hover:bg-brand"
                    style={{ height: `${max > 0 ? Math.max(4, (entry.count / max) * 100) : 4}%` }}
                  />
                  <span className="pointer-events-none absolute -top-7 hidden whitespace-nowrap rounded border border-line bg-surface-overlay px-2 py-1 text-[11px] text-fg group-hover:block">
                    {formatDate(entry.day)}: {entry.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Veröffentlichter Link" description="Diesen Link versenden Sie an das Unternehmen." />
        <CardBody className="flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 break-all rounded-control border border-line bg-surface-raised px-3 py-2 font-mono text-[12.5px] text-fg-muted">
            {publicUrl}
          </code>
          <CopyButton value={publicUrl} size="sm" />
        </CardBody>
      </Card>
    </div>
  )
}
