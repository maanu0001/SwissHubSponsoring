import { mediaAlt, mediaUrl } from '@/lib/media'
import type { RenderContext, RenderSection } from '@/lib/render-context'
import { heroDataSchema } from '@/lib/section-data'
import { cn } from '@/lib/cn'

export function Hero({ section, context }: { section: RenderSection; context: RenderContext }) {
  const hero = heroDataSchema.partial().parse(section.data.hero ?? {})
  const cta = section.data.cta ?? hero.cta ?? {}

  const sponsorLogo = context.sponsor ? mediaUrl(context.sponsor.logo) : null
  const brandLogo = mediaUrl(context.brand.logo)
  const heroImage = context.page ? mediaUrl(context.page.heroImage) : null

  const showSponsor = hero.showSponsorLogo !== false && Boolean(context.sponsor)
  const showBrand = hero.showSwissHubLogo !== false
  const badges = (hero.badges ?? []).filter((badge) => badge.trim())

  // The lockup only earns its place when at least one side is a real logo.
  // With no uploads at all it would just repeat the headline underneath.
  const hasAnyLogo = (showBrand && Boolean(brandLogo)) || (showSponsor && Boolean(sponsorLogo))
  const showLockup = (showSponsor || showBrand) && hasAnyLogo

  return (
    <section className="relative isolate overflow-hidden">
      {heroImage ? (
        <>
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-canvas/70 via-canvas/90 to-canvas" aria-hidden="true" />
        </>
      ) : (
        <>
          <div className="brand-glow absolute inset-0 -z-20" aria-hidden="true" />
          <div className="grid-texture absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        </>
      )}

      <div className="container-content py-20 sm:py-28 lg:py-36">
        {section.data.eyebrow || hero.eyebrow ? (
          <p className="animate-fade-up text-[12.5px] font-semibold uppercase tracking-[0.16em] text-brand-accent">
            {section.data.eyebrow || hero.eyebrow}
          </p>
        ) : null}

        {showLockup ? (
          <div
            className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 animate-fade-up"
            style={{ animationDelay: '60ms' }}
          >
            {showBrand ? (
              brandLogo ? (
                <img
                  src={brandLogo}
                  alt={context.brand.name}
                  className="h-11 w-auto max-w-[190px] object-contain sm:h-14"
                  decoding="async"
                />
              ) : (
                <span className="font-display text-[26px] font-bold tracking-tight text-fg sm:text-[32px]">
                  {context.brand.name}
                </span>
              )
            ) : null}

            {showSponsor && context.sponsor ? (
              <>
                <span className="font-display text-[26px] font-light text-fg-subtle sm:text-[30px]" aria-hidden="true">
                  ×
                </span>
                {sponsorLogo ? (
                  <img
                    src={sponsorLogo}
                    alt={mediaAlt(context.sponsor.logo, context.sponsor.companyName)}
                    className="h-11 w-auto max-w-[190px] object-contain sm:h-14"
                    decoding="async"
                  />
                ) : (
                  <span className="font-display text-[26px] font-bold tracking-tight text-fg sm:text-[32px]">
                    {context.sponsor.companyName}
                  </span>
                )}
              </>
            ) : null}
          </div>
        ) : null}

        <h1
          className={cn(
            'mt-8 max-w-4xl font-display text-[34px] font-semibold leading-[1.08] tracking-tight animate-fade-up sm:text-[52px] lg:text-[62px]',
          )}
          style={{ animationDelay: '120ms' }}
        >
          {section.title || context.page?.title || context.brand.name}
        </h1>

        {section.subtitle ? (
          <p
            className="mt-5 max-w-2xl text-[16px] leading-relaxed text-fg-muted animate-fade-up sm:text-[19px]"
            style={{ animationDelay: '180ms' }}
          >
            {section.subtitle}
          </p>
        ) : null}

        {section.content ? (
          <div
            className="rich-text mt-6 max-w-2xl animate-fade-up"
            style={{ animationDelay: '220ms' }}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        ) : null}

        {badges.length > 0 ? (
          <ul className="mt-7 flex flex-wrap gap-2 animate-fade-up" style={{ animationDelay: '260ms' }}>
            {badges.map((badge) => (
              <li
                key={badge}
                className="rounded-full border border-line-strong bg-surface/60 px-3.5 py-1.5 text-[12.5px] font-medium text-fg-muted backdrop-blur-sm"
              >
                {badge}
              </li>
            ))}
          </ul>
        ) : null}

        {cta.primaryLabel || cta.secondaryLabel ? (
          <div className="mt-9 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
            {cta.primaryLabel && cta.primaryHref ? (
              <a
                href={cta.primaryHref}
                className="inline-flex h-12 items-center rounded-control bg-brand px-6 text-[15px] font-medium text-brand-fg transition-colors hover:bg-brand/85"
              >
                {cta.primaryLabel}
              </a>
            ) : null}
            {cta.secondaryLabel && cta.secondaryHref ? (
              <a
                href={cta.secondaryHref}
                className="inline-flex h-12 items-center rounded-control border border-line-strong px-6 text-[15px] font-medium text-fg transition-colors hover:border-brand-accent/70 hover:bg-surface-raised"
              >
                {cta.secondaryLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
