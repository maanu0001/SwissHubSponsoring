import type { Media } from '@prisma/client'

import { formatAmount, formatDateRange, formatNumber } from '@/lib/format'
import { SUPPORT_TYPE } from '@/lib/labels'
import type { RenderContext, RenderSection, RenderTournament } from '@/lib/render-context'

import { Reveal } from './Reveal'
import { SectionShell } from './Section'
import { BenefitList } from './sections/BenefitList'
import { BudgetList } from './sections/BudgetList'
import { BulletGrid } from './sections/BulletGrid'
import { Gallery } from './sections/Gallery'
import { Hero } from './sections/Hero'
import { PartnerLogos } from './sections/PartnerLogos'
import { ProcessSteps } from './sections/ProcessSteps'
import { Quotes } from './sections/Quotes'
import { StatsGrid } from './sections/StatsGrid'
import { TournamentCards } from './sections/TournamentCards'
import { VideoLinks } from './sections/VideoLinks'

export interface SectionRendererProps {
  section: RenderSection
  context: RenderContext
  index: number
  /** All media referenced by galleries, resolved once by the caller. */
  galleryMedia: Media[]
}

/**
 * Renders one section. Unknown or empty sections render nothing rather than an
 * empty frame, so a half-filled page still looks intentional.
 */
export function SectionRenderer({ section, context, index, galleryMedia }: SectionRendererProps) {
  const tone = index % 2 === 1 ? 'raised' : 'default'
  const anchor = anchorFor(section)

  switch (section.type) {
    case 'HERO':
      return <Hero section={section} context={context} />

    case 'REACH':
    case 'STATS':
    case 'ABOUT_SWISSHUB': {
      const stats = section.data.stats ?? []
      const hasBody = Boolean(section.content) || stats.length > 0
      if (!hasBody && !section.title) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {section.content ? (
            <Reveal className="rich-text mb-9 max-w-prose">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}
          <StatsGrid stats={stats} columns={section.data.columns ?? 3} />
        </SectionShell>
      )
    }

    case 'VISION':
    case 'WHY_PARTNERSHIP':
    case 'CUSTOM_TEXT': {
      const bullets = section.data.bullets ?? []
      if (!section.content && bullets.length === 0 && !section.title) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {section.content ? (
            <Reveal className="rich-text mb-9 max-w-prose">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}
          <BulletGrid bullets={bullets} />
        </SectionShell>
      )
    }

    case 'PERSONAL_INTRO':
    case 'RICH_TEXT': {
      if (!section.content && !section.title) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {section.content ? (
            <Reveal className="rich-text max-w-prose text-[16px]">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}
        </SectionShell>
      )
    }

    case 'TOURNAMENT': {
      const ids = section.data.tournamentIds ?? []
      const selected = pickTournaments(context, ids.length ? ids : context.page?.tournamentId ? [context.page.tournamentId] : [])
      const stats = section.data.stats ?? []
      const primary = selected[0]

      if (!primary && !section.content && stats.length === 0) return null

      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {primary ? (
            <Reveal className="mb-8 rounded-card border border-line bg-surface px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-display text-[22px] font-semibold tracking-tight text-fg">{primary.title}</h3>
                  <p className="mt-1.5 text-[13.5px] text-fg-subtle">
                    {primary.game}
                    {formatDateRange(primary.startDate, primary.endDate)
                      ? ` · ${formatDateRange(primary.startDate, primary.endDate)}`
                      : ''}
                  </p>
                </div>
                {primary.format ? (
                  <p className="max-w-xs text-right text-[13px] leading-relaxed text-fg-muted">{primary.format}</p>
                ) : null}
              </div>
              {primary.description ? (
                <p className="mt-4 max-w-prose text-[14.5px] leading-relaxed text-fg-muted">{primary.description}</p>
              ) : null}
              <TournamentFacts tournament={primary} />
            </Reveal>
          ) : null}

          {section.content ? (
            <Reveal className="rich-text mb-8 max-w-prose">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}

          <StatsGrid stats={stats} columns={section.data.columns ?? 3} />
        </SectionShell>
      )
    }

    case 'TOURNAMENT_HISTORY': {
      const ids = section.data.tournamentIds ?? []
      const selected = ids.length > 0 ? pickTournaments(context, ids) : context.tournaments
      if (selected.length === 0) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {section.content ? (
            <Reveal className="rich-text mb-8 max-w-prose">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}
          <TournamentCards tournaments={selected} />
        </SectionShell>
      )
    }

    case 'SPONSORING_PROPOSAL': {
      const page = context.page
      const amount = page?.requestedAmount ? formatAmount(page.requestedAmount, page.currency) : null
      const showAmount = section.data.showAmount !== false && Boolean(amount)
      if (!section.content && !showAmount && !section.title) return null

      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-10 [&>*]:min-w-0">
            <div>
              {section.content ? (
                <Reveal className="rich-text max-w-prose text-[16px]">
                  <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </Reveal>
              ) : null}
              <div className="mt-7">
                <BulletGrid bullets={section.data.bullets ?? []} />
              </div>
            </div>

            {showAmount && amount && page ? (
              <Reveal delay={90} className="lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-card border border-brand-accent/35 bg-brand/10 px-6 py-7 shadow-glow">
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand-accent">
                    Gesuchte Unterstützung
                  </p>
                  <p className="mt-3 font-display text-[38px] font-semibold leading-none tracking-tight text-fg">
                    {amount}
                  </p>
                  <p className="mt-2.5 text-[13.5px] text-fg-muted">
                    {SUPPORT_TYPE[page.requestedSupportType].label}
                  </p>
                  {page.requestedSupportText ? (
                    <p className="mt-4 border-t border-brand-accent/25 pt-4 text-[13.5px] leading-relaxed text-fg-muted">
                      {page.requestedSupportText}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            ) : null}
          </div>
        </SectionShell>
      )
    }

    case 'BENEFITS': {
      if (context.benefits.length === 0 && !section.content) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {section.content ? (
            <Reveal className="rich-text mb-8 max-w-prose">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}
          <BenefitList benefits={context.benefits} />
        </SectionShell>
      )
    }

    case 'BUDGET_USAGE': {
      const items = section.data.budget ?? []
      if (items.length === 0 && !section.content) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          {section.content ? (
            <Reveal className="rich-text mb-8 max-w-prose">
              <div dangerouslySetInnerHTML={{ __html: section.content }} />
            </Reveal>
          ) : null}
          <BudgetList items={items} />
        </SectionShell>
      )
    }

    case 'PAST_PARTNERS': {
      const ids = section.data.partnerIds ?? []
      const selected =
        ids.length > 0 ? context.partners.filter((partner) => ids.includes(partner.id)) : context.partners
      if (selected.length === 0) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          <PartnerLogos partners={selected} />
        </SectionShell>
      )
    }

    case 'PROCESS': {
      const steps = section.data.steps ?? []
      if (steps.length === 0) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          <ProcessSteps steps={steps} />
        </SectionShell>
      )
    }

    case 'TWITCH_VOD': {
      const links = section.data.links ?? []
      // Fall back to the linked tournament's stream links when none are set.
      const fallback = fallbackStreamLinks(context)
      const resolved = links.length > 0 ? links : fallback
      if (resolved.length === 0) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          <VideoLinks links={resolved} embedParent={context.embedParent} />
        </SectionShell>
      )
    }

    case 'SOCIAL_PROOF': {
      const quotes = section.data.quotes ?? []
      if (quotes.length === 0) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          <Quotes quotes={quotes} />
        </SectionShell>
      )
    }

    case 'GALLERY': {
      const items = section.data.gallery ?? []
      if (items.length === 0) return null
      return (
        <SectionShell id={anchor} eyebrow={section.data.eyebrow} title={section.title} subtitle={section.subtitle} tone={tone}>
          <Gallery items={items} media={galleryMedia} />
        </SectionShell>
      )
    }

    case 'CTA':
    case 'CONTACT': {
      const email = section.data.contactEmail || context.contact.email
      const note = section.data.contactNote ?? (context.sponsor ? context.contact.sponsorPageNote : '')
      const cta = section.data.cta ?? {}

      return (
        <SectionShell id={anchor} tone={tone} className="border-b border-line/70">
          <Reveal className="overflow-hidden rounded-card border border-brand-accent/25 bg-surface">
            <div className="brand-glow px-6 py-10 sm:px-10 sm:py-14">
              {section.data.eyebrow ? (
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-brand-accent">
                  {section.data.eyebrow}
                </p>
              ) : null}
              {section.title ? (
                <h2 className="mt-2.5 max-w-2xl font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[34px]">
                  {section.title}
                </h2>
              ) : null}
              {section.subtitle ? (
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-[16.5px]">
                  {section.subtitle}
                </p>
              ) : null}
              {section.content ? (
                <div
                  className="rich-text mt-5 max-w-prose"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex h-12 items-center rounded-control bg-brand px-6 text-[15px] font-medium text-brand-fg transition-colors hover:bg-brand/85"
                  >
                    {email}
                  </a>
                ) : null}
                {cta.primaryLabel && cta.primaryHref ? (
                  <a
                    href={cta.primaryHref}
                    className="inline-flex h-12 items-center rounded-control border border-line-strong px-6 text-[15px] font-medium text-fg transition-colors hover:border-brand-accent/70"
                  >
                    {cta.primaryLabel}
                  </a>
                ) : null}
                {cta.secondaryLabel && cta.secondaryHref ? (
                  <a
                    href={cta.secondaryHref}
                    className="inline-flex h-12 items-center rounded-control border border-line-strong px-6 text-[15px] font-medium text-fg transition-colors hover:border-brand-accent/70"
                  >
                    {cta.secondaryLabel}
                  </a>
                ) : null}
              </div>

              {note ? <p className="mt-5 max-w-xl text-[13.5px] leading-relaxed text-fg-subtle">{note}</p> : null}
            </div>
          </Reveal>
        </SectionShell>
      )
    }

    default:
      return null
  }
}

function anchorFor(section: RenderSection): string {
  return `section-${section.type.toLowerCase().replace(/_/g, '-')}-${section.id.slice(-6)}`
}

function pickTournaments(context: RenderContext, ids: string[]): RenderTournament[] {
  if (ids.length === 0) return []
  const byId = new Map(context.tournaments.map((tournament) => [tournament.id, tournament]))
  return ids.map((id) => byId.get(id)).filter((entry): entry is RenderTournament => Boolean(entry))
}

function fallbackStreamLinks(context: RenderContext) {
  const links: { label: string; url: string; description: string }[] = []
  const relevant = context.page?.tournamentId
    ? context.tournaments.filter((tournament) => tournament.id === context.page?.tournamentId)
    : context.tournaments

  for (const tournament of relevant) {
    if (tournament.twitchUrl) {
      links.push({ label: `${tournament.title} – Twitch`, url: tournament.twitchUrl, description: '' })
    }
    if (tournament.vodUrl) {
      links.push({ label: `${tournament.title} – Aufzeichnung`, url: tournament.vodUrl, description: '' })
    }
  }
  return links.slice(0, 6)
}

function TournamentFacts({ tournament }: { tournament: RenderTournament }) {
  const facts: { label: string; value: string }[] = []
  const participants = tournament.participantCount ?? tournament.expectedParticipantCount
  if (participants) {
    facts.push({
      label: tournament.participantCount ? 'Teilnehmende' : 'Erwartete Teilnehmende',
      value: formatNumber(participants),
    })
  }
  if (tournament.streamViewerCount) {
    facts.push({ label: 'Ø Zuschauer im Stream', value: formatNumber(tournament.streamViewerCount) })
  }
  if (facts.length === 0) return null

  return (
    <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-[12px] uppercase tracking-wide text-fg-subtle">{fact.label}</dt>
          <dd className="mt-0.5 font-display text-[20px] font-semibold tabular-nums text-fg">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
