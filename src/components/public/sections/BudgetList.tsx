import type { BudgetItem } from '@/lib/section-data'
import { Reveal } from '../Reveal'

export function BudgetList({ items }: { items: BudgetItem[] }) {
  const entries = items.filter((item) => item.title.trim() || item.description.trim())
  if (entries.length === 0) return null

  const hasShares = entries.some((entry) => typeof entry.share === 'number' && entry.share > 0)

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {entries.map((entry, index) => (
        <Reveal
          key={`${entry.title}-${index}`}
          delay={index * 45}
          className="rounded-card border border-line bg-surface px-5 py-4.5"
        >
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[15px] font-semibold text-fg">{entry.title}</h3>
            {typeof entry.share === 'number' && entry.share > 0 ? (
              <span className="shrink-0 font-display text-[15px] font-semibold tabular-nums text-brand-accent">
                {entry.share}%
              </span>
            ) : null}
          </div>
          {entry.description ? (
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-fg-muted">{entry.description}</p>
          ) : null}
          {hasShares && typeof entry.share === 'number' && entry.share > 0 ? (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-overlay" aria-hidden="true">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-700"
                style={{ width: `${Math.min(100, entry.share)}%` }}
              />
            </div>
          ) : null}
        </Reveal>
      ))}
    </div>
  )
}
