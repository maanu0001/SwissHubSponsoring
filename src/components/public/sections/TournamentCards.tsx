import { formatDateRange, formatNumber } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'
import type { RenderTournament } from '@/lib/render-context'
import { TOURNAMENT_STATUS } from '@/lib/labels'
import { Reveal } from '../Reveal'

export function TournamentCards({ tournaments }: { tournaments: RenderTournament[] }) {
  if (tournaments.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament, index) => {
        const image = mediaUrl(tournament.heroImage)
        const dates = formatDateRange(tournament.startDate, tournament.endDate)
        const participants = tournament.participantCount ?? tournament.expectedParticipantCount

        return (
          <Reveal
            key={tournament.id}
            delay={index * 70}
            className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-line-strong"
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
              {image ? (
                <img
                  src={image}
                  alt={mediaAlt(tournament.heroImage, tournament.title)}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="brand-glow flex h-full w-full items-center justify-center">
                  <span className="font-display text-[15px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                    {tournament.game}
                  </span>
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full border border-line-strong bg-canvas/85 px-2.5 py-1 text-[11.5px] font-medium text-fg-muted backdrop-blur-sm">
                {tournament.game}
              </span>
            </div>

            <div className="flex flex-1 flex-col px-5 py-4.5" style={{ paddingTop: '1.15rem', paddingBottom: '1.15rem' }}>
              <h3 className="font-display text-[16.5px] font-semibold leading-snug tracking-tight text-fg">
                {tournament.title}
              </h3>
              {dates ? <p className="mt-1 text-[12.5px] text-fg-subtle">{dates}</p> : null}
              {tournament.description ? (
                <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-relaxed text-fg-muted">
                  {tournament.description}
                </p>
              ) : null}

              <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3.5 text-[12.5px]">
                {participants ? (
                  <div>
                    <dt className="inline text-fg-subtle">Teilnehmende: </dt>
                    <dd className="inline font-medium text-fg-muted">{formatNumber(participants)}</dd>
                  </div>
                ) : null}
                {tournament.streamViewerCount ? (
                  <div>
                    <dt className="inline text-fg-subtle">Ø Zuschauer: </dt>
                    <dd className="inline font-medium text-fg-muted">{formatNumber(tournament.streamViewerCount)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="sr-only">Status</dt>
                  <dd className="text-fg-subtle">{TOURNAMENT_STATUS[tournament.status].label}</dd>
                </div>
              </dl>

              {tournament.twitchUrl || tournament.vodUrl ? (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {tournament.twitchUrl ? (
                    <a
                      href={tournament.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-control border border-line-strong px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:border-brand-accent/60 hover:text-fg"
                    >
                      Twitch
                      <ExternalIcon />
                    </a>
                  ) : null}
                  {tournament.vodUrl ? (
                    <a
                      href={tournament.vodUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-control border border-line-strong px-2.5 py-1 text-[12px] text-fg-muted transition-colors hover:border-brand-accent/60 hover:text-fg"
                    >
                      VOD ansehen
                      <ExternalIcon />
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

function ExternalIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 4h9v9M16 4 5 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
