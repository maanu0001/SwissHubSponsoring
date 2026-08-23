import type { QuoteItem } from '@/lib/section-data'
import { Reveal } from '../Reveal'

export function Quotes({ quotes }: { quotes: QuoteItem[] }) {
  const items = quotes.filter((quote) => quote.quote.trim())
  if (items.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((quote, index) => (
        <Reveal
          as="figure"
          key={`${quote.author}-${index}`}
          delay={index * 70}
          className="relative rounded-card border border-line bg-surface px-6 py-6"
        >
          <span className="absolute left-5 top-3 font-display text-[42px] leading-none text-brand/40" aria-hidden="true">
            &ldquo;
          </span>
          <blockquote className="relative text-[15px] leading-relaxed text-fg-muted">{quote.quote}</blockquote>
          {quote.author || quote.role ? (
            <figcaption className="mt-4 border-t border-line pt-3.5 text-[13px]">
              {quote.author ? <span className="font-medium text-fg">{quote.author}</span> : null}
              {quote.role ? <span className="text-fg-subtle">{quote.author ? ' · ' : ''}{quote.role}</span> : null}
            </figcaption>
          ) : null}
        </Reveal>
      ))}
    </div>
  )
}
