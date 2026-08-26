import { numericFromStat } from '@/lib/section-data'
import type { PdfNode } from '@/server/pdf/model'

/** Renders one atomic content block. Pure presentation – no data access. */
export function PdfBlock({ node }: { node: PdfNode }) {
  switch (node.kind) {
    case 'html':
      return node.html ? (
        <div className="pdf-block pdf-rich" dangerouslySetInnerHTML={{ __html: node.html }} />
      ) : null

    case 'lead':
      return (
        <p className="pdf-block pdf-sub" style={{ fontSize: '11pt' }}>
          {node.text}
        </p>
      )

    case 'stats':
      return (
        <div className={`pdf-block pdf-grid pdf-grid--${node.columns === 2 ? 2 : 3}`}>
          {node.items.map((stat, index) => (
            <div className="pdf-kpi" key={`${stat.label}-${index}`}>
              <p className="pdf-kpi__value">
                {stat.prefix}
                {stat.value || formatFallback(stat)}
                {stat.suffix}
              </p>
              {stat.label ? <p className="pdf-kpi__label">{stat.label}</p> : null}
              {stat.hint ? <p className="pdf-kpi__hint">{stat.hint}</p> : null}
            </div>
          ))}
        </div>
      )

    case 'bullets':
      return (
        <div className="pdf-block pdf-grid pdf-grid--2">
          {node.items.map((bullet, index) => (
            <div className="pdf-card" key={`${bullet.title}-${index}`}>
              <div className="pdf-bullet">
                <span className="pdf-bullet__dot" aria-hidden="true">
                  <CheckIcon />
                </span>
                <div>
                  {bullet.title ? <p className="pdf-h3">{bullet.title}</p> : null}
                  {bullet.description ? <p className="pdf-bullet__text">{bullet.description}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case 'benefits':
      return (
        <div className="pdf-block">
          {node.category ? <p className="pdf-category">{node.category}</p> : null}
          <div className="pdf-grid pdf-grid--2">
            {node.items.map((benefit) => (
              <div className="pdf-benefit" key={benefit.id}>
                <span className="pdf-benefit__check" aria-hidden="true">
                  <CheckIcon />
                </span>
                <div>
                  <p className="pdf-benefit__title">{benefit.title}</p>
                  {benefit.description ? <p className="pdf-benefit__desc">{benefit.description}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    case 'budget':
      return (
        <div className="pdf-block pdf-grid pdf-grid--2">
          {node.items.map((entry, index) => (
            <div className="pdf-card pdf-card--tint" key={`${entry.title}-${index}`}>
              <div className="pdf-budget__head">
                <p className="pdf-h3">{entry.title}</p>
                {typeof entry.share === 'number' && entry.share > 0 ? (
                  <span className="pdf-budget__share">{entry.share}%</span>
                ) : null}
              </div>
              {entry.description ? <p className="pdf-bullet__text">{entry.description}</p> : null}
              {typeof entry.share === 'number' && entry.share > 0 ? (
                <div className="pdf-budget__bar">
                  <div className="pdf-budget__fill" style={{ width: `${Math.min(100, entry.share)}%` }} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )

    case 'steps':
      return (
        <div className="pdf-block" style={{ display: 'grid', gap: '4mm' }}>
          {node.items.map((step, index) => (
            <div className="pdf-card" key={`${step.label}-${index}`}>
              <div className="pdf-step">
                <span className="pdf-step__label">{step.label || `Schritt ${index + 1}`}</span>
                <div>
                  {step.title ? <p className="pdf-h3">{step.title}</p> : null}
                  {step.description ? <p className="pdf-bullet__text">{step.description}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )

    case 'quotes':
      return (
        <div className="pdf-block" style={{ display: 'grid', gap: '6mm' }}>
          {node.items.map((quote, index) => (
            <figure className="pdf-quote" key={`${quote.author}-${index}`}>
              <blockquote className="pdf-quote__text">„{quote.quote}“</blockquote>
              {quote.author || quote.role ? (
                <figcaption className="pdf-quote__author">
                  {quote.author}
                  {quote.author && quote.role ? ' · ' : ''}
                  {quote.role}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )

    case 'links':
      return (
        <div className="pdf-block">
          {node.items.map((link, index) => (
            <div className="pdf-link" key={`${link.url}-${index}`}>
              <div>
                <p className="pdf-link__label">{link.label || 'Aufzeichnung'}</p>
                {link.description ? <p className="pdf-bullet__text">{link.description}</p> : null}
              </div>
              <a className="pdf-link__url" href={link.url}>
                {link.url.replace(/^https?:\/\//, '')}
              </a>
            </div>
          ))}
        </div>
      )

    case 'tournamentDetail': {
      const t = node.tournament
      return (
        <div className="pdf-block pdf-tournament">
          {t.imageUrl ? <img className="pdf-tournament__image" src={t.imageUrl} alt="" /> : null}
          <div className="pdf-tournament__body">
            <p className="pdf-h2" style={{ fontSize: '14pt' }}>
              {t.title}
            </p>
            <p className="pdf-sub" style={{ fontSize: '9.4pt', marginTop: '1.5mm' }}>
              {[t.game, t.dateRange, t.format].filter(Boolean).join(' · ')}
            </p>
            {t.description ? (
              <p className="pdf-bullet__text" style={{ marginTop: '3mm' }}>
                {t.description}
              </p>
            ) : null}
            {t.participants || t.viewers ? (
              <div className="pdf-tournament__meta">
                {t.participants ? (
                  <div>
                    <p className="pdf-fact__label">{t.participantsLabel}</p>
                    <p className="pdf-fact__value">{t.participants}</p>
                  </div>
                ) : null}
                {t.viewers ? (
                  <div>
                    <p className="pdf-fact__label">Ø Zuschauer im Stream</p>
                    <p className="pdf-fact__value">{t.viewers}</p>
                  </div>
                ) : null}
                <div>
                  <p className="pdf-fact__label">Status</p>
                  <p className="pdf-fact__value" style={{ fontSize: '9.4pt' }}>
                    {t.status}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )
    }

    case 'tournamentCards':
      return (
        <div className="pdf-block pdf-grid pdf-grid--2">
          {node.items.map((tournament, index) => (
            <div className="pdf-tcard" key={`${tournament.title}-${index}`}>
              {tournament.imageUrl ? (
                <img className="pdf-tcard__image" src={tournament.imageUrl} alt="" />
              ) : null}
              <div className="pdf-tcard__body">
                <p className="pdf-tcard__title">{tournament.title}</p>
                <p className="pdf-tcard__meta">
                  {[tournament.game, tournament.dateRange].filter(Boolean).join(' · ')}
                </p>
                <p className="pdf-tcard__meta">
                  {[
                    tournament.participants ? `${tournament.participants} ${tournament.participantsLabel}` : null,
                    tournament.viewers ? `Ø ${tournament.viewers} Zuschauer` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'partners':
      return (
        <div className="pdf-block pdf-grid pdf-grid--3">
          {node.items.map((partner, index) => (
            <div className="pdf-partner" key={`${partner.name}-${index}`}>
              {partner.logoUrl ? (
                <img className="pdf-partner__logo" src={partner.logoUrl} alt="" />
              ) : null}
              <p className="pdf-partner__name">{partner.name}</p>
              {partner.description ? <p className="pdf-partner__desc">{partner.description}</p> : null}
              {partner.website ? (
                <a className="pdf-partner__link" href={partner.website}>
                  {partner.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )

    case 'gallery':
      return (
        <div className="pdf-block pdf-grid pdf-grid--2">
          {node.items.map((image, index) => (
            <figure className="pdf-figure" key={`${image.url}-${index}`}>
              <img src={image.url} alt={image.alt} />
              {image.caption ? <figcaption>{image.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      )

    case 'proposal': {
      const p = node.proposal
      return (
        <div className="pdf-block pdf-proposal">
          {p.amount ? (
            <div>
              <p className="pdf-proposal__label">Gesuchte Unterstützung</p>
              <p className="pdf-proposal__amount">{p.amount}</p>
              <p className="pdf-proposal__type">{p.supportTypeLabel}</p>
            </div>
          ) : (
            <div>
              <p className="pdf-proposal__label">Gesuchte Unterstützung</p>
              <p className="pdf-proposal__amount" style={{ fontSize: '18pt' }}>
                {p.supportTypeLabel}
              </p>
            </div>
          )}
          {p.supportText ? <p className="pdf-proposal__text">{p.supportText}</p> : null}
        </div>
      )
    }

    case 'image':
      return (
        <div className="pdf-block pdf-figure">
          <img src={node.url} alt={node.alt} />
        </div>
      )

    default:
      return null
  }
}

function formatFallback(stat: { value: string; numeric: number | null }): string {
  if (stat.value) return stat.value
  const numeric = numericFromStat({ ...stat, label: '', hint: '', prefix: '', suffix: '' })
  return numeric === null ? '' : new Intl.NumberFormat('de-CH').format(numeric)
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3" width="100%" height="100%">
      <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
