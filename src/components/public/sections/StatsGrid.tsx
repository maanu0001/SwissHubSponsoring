import { cn } from '@/lib/cn'
import { numericFromStat, type StatItem } from '@/lib/section-data'
import { CountUp } from '../CountUp'
import { Reveal } from '../Reveal'

export function StatsGrid({ stats, columns = 3 }: { stats: StatItem[]; columns?: number }) {
  const items = stats.filter((stat) => stat.value.trim() || stat.label.trim())
  if (items.length === 0) return null

  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        columns >= 4 ? 'grid-cols-2 lg:grid-cols-4' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3',
      )}
    >
      {items.map((stat, index) => (
        <Reveal
          key={`${stat.label}-${index}`}
          delay={index * 60}
          className="group relative overflow-hidden rounded-card border border-line bg-surface px-5 py-6 transition-colors hover:border-line-strong"
        >
          <span
            className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
          <p className="font-display text-[30px] font-semibold leading-none tracking-tight text-fg sm:text-[38px]">
            <CountUp
              target={numericFromStat(stat)}
              display={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
            />
          </p>
          <p className="mt-2.5 text-[13.5px] font-medium text-fg-muted">{stat.label}</p>
          {stat.hint ? <p className="mt-1 text-[12.5px] leading-relaxed text-fg-subtle">{stat.hint}</p> : null}
        </Reveal>
      ))}
    </div>
  )
}
