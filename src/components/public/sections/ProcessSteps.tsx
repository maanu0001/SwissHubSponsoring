import type { ProcessStep } from '@/lib/section-data'
import { Reveal } from '../Reveal'

export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
  const items = steps.filter((step) => step.title.trim() || step.label.trim())
  if (items.length === 0) return null

  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {items.map((step, index) => (
        <Reveal
          as="li"
          key={`${step.label}-${index}`}
          delay={index * 80}
          className="relative rounded-card border border-line bg-surface px-5 py-6"
        >
          <span className="inline-flex items-center rounded-full border border-brand-accent/40 bg-brand/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-brand-accent">
            {step.label || `Schritt ${index + 1}`}
          </span>
          <h3 className="mt-3.5 font-display text-[18px] font-semibold tracking-tight text-fg">{step.title}</h3>
          {step.description ? (
            <p className="mt-2 text-[13.5px] leading-relaxed text-fg-muted">{step.description}</p>
          ) : null}
        </Reveal>
      ))}
    </ol>
  )
}
