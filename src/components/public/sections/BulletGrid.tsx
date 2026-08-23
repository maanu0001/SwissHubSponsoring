import type { BulletItem } from '@/lib/section-data'
import { Reveal } from '../Reveal'

export function BulletGrid({ bullets }: { bullets: BulletItem[] }) {
  const items = bullets.filter((bullet) => bullet.title.trim() || bullet.description.trim())
  if (items.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
      {items.map((bullet, index) => (
        <Reveal
          key={`${bullet.title}-${index}`}
          delay={index * 50}
          className="rounded-card border border-line bg-surface px-5 py-5 transition-colors hover:border-line-strong"
        >
          <div className="flex items-start gap-3.5">
            <span
              className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-brand-accent"
              aria-hidden="true"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              {bullet.title ? <h3 className="text-[15px] font-semibold text-fg">{bullet.title}</h3> : null}
              {bullet.description ? (
                <p className="mt-1.5 text-[14px] leading-relaxed text-fg-muted">{bullet.description}</p>
              ) : null}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}
