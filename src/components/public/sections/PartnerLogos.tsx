import { displayUrl, mediaAlt, mediaUrl } from '@/lib/media'
import type { RenderPartner } from '@/lib/render-context'
import { Reveal } from '../Reveal'

export function PartnerLogos({ partners }: { partners: RenderPartner[] }) {
  if (partners.length === 0) return null

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {partners.map((partner, index) => {
        const logo = mediaUrl(partner.logo)
        const inner = (
          <>
            <div className="flex h-14 items-center justify-start">
              {logo ? (
                <img
                  src={logo}
                  alt={mediaAlt(partner.logo, partner.name)}
                  loading="lazy"
                  decoding="async"
                  className="max-h-14 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <span className="font-display text-[19px] font-semibold tracking-tight text-fg">{partner.name}</span>
              )}
            </div>
            {logo ? <p className="mt-3 text-[14px] font-medium text-fg">{partner.name}</p> : null}
            {partner.description ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg-subtle">{partner.description}</p>
            ) : null}
            {partner.website ? (
              <p className="mt-2.5 text-[12.5px] text-brand-accent">{displayUrl(partner.website)}</p>
            ) : null}
          </>
        )

        return (
          <Reveal as="li" key={partner.id} delay={index * 60}>
            {partner.website ? (
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full rounded-card border border-line bg-surface px-5 py-5 transition-colors hover:border-brand-accent/50"
              >
                {inner}
              </a>
            ) : (
              <div className="h-full rounded-card border border-line bg-surface px-5 py-5">{inner}</div>
            )}
          </Reveal>
        )
      })}
    </ul>
  )
}
