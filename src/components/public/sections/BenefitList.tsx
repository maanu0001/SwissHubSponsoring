import type { RenderBenefit } from '@/lib/render-context'
import { Reveal } from '../Reveal'

/** Grouped presentation of the selected sponsoring benefits. */
export function BenefitList({ benefits }: { benefits: RenderBenefit[] }) {
  if (benefits.length === 0) return null

  const groups = new Map<string, RenderBenefit[]>()
  for (const benefit of benefits) {
    const list = groups.get(benefit.category) ?? []
    list.push(benefit)
    groups.set(benefit.category, list)
  }

  const entries = [...groups.entries()]

  return (
    <div className="space-y-8">
      {entries.map(([category, list], groupIndex) => (
        <Reveal key={category} delay={groupIndex * 60}>
          {entries.length > 1 ? (
            <h3 className="mb-3.5 flex items-center gap-3 text-[12.5px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">
              {category}
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </h3>
          ) : null}
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {list.map((benefit) => (
              <li
                key={benefit.id}
                className="flex gap-3.5 rounded-card border border-line bg-surface px-4.5 py-4 transition-colors hover:border-line-strong"
                style={{ paddingLeft: '1.15rem', paddingRight: '1.15rem' }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-accent"
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-medium text-fg">{benefit.title}</p>
                  {benefit.description ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-fg-subtle">{benefit.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  )
}
