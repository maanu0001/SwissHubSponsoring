import type { PdfDocumentModel, PdfPage } from '@/server/pdf/model'

import { PdfBlock } from './PdfBlocks'
import { PdfStyles } from './PdfStyles'

/**
 * The complete PDF as a sequence of fixed A4 sheets.
 *
 * Pagination has already been decided on the server, so page numbers are exact
 * and every sheet is a self-contained, non-overflowing unit.
 */
export function PdfDocument({ model }: { model: PdfDocumentModel }) {
  // Cover is page 1, then the content sheets, then the closing sheet.
  const totalPages = model.pages.length + 2

  return (
    <>
      <PdfStyles primary={model.brand.primary} accent={model.brand.accent} />

      <Cover model={model} />

      {model.pages.map((page, index) => (
        <ContentSheet
          key={page.id}
          page={page}
          pageNumber={index + 2}
          totalPages={totalPages}
          model={model}
        />
      ))}

      <Closing model={model} pageNumber={totalPages} totalPages={totalPages} />
    </>
  )
}

function Cover({ model }: { model: PdfDocumentModel }) {
  const { cover, meta } = model

  // The sender identity always anchors the top of the sheet – the SwissHub logo
  // when one is uploaded, its wordmark otherwise. The sponsor side is only
  // added when a real logo exists; repeating the company name here would just
  // duplicate the title underneath.
  const showSponsorLockup = Boolean(cover.sponsorLogoUrl)

  return (
    <section className="pdf-sheet pdf-sheet--cover" data-pdf-sheet="cover">
      <div className="pdf-cover">
        {cover.heroImageUrl ? (
          <div className="pdf-cover__art">
            <img src={cover.heroImageUrl} alt="" />
          </div>
        ) : null}
        <div className="pdf-cover__wash" />

        <div className="pdf-cover__inner">
          <div className="pdf-cover__head">
            <div className="pdf-cover__logos">
              {cover.brandLogoUrl ? (
                <img className="pdf-cover__logo" src={cover.brandLogoUrl} alt={cover.brandName} />
              ) : (
                <span className="pdf-cover__wordmark">{cover.brandName}</span>
              )}
              {showSponsorLockup ? (
                <>
                  <span className="pdf-cover__times" aria-hidden="true">
                    ×
                  </span>
                  <img className="pdf-cover__logo" src={cover.sponsorLogoUrl ?? ''} alt={cover.sponsorName} />
                </>
              ) : null}
            </div>
            <p className="pdf-cover__kicker">{cover.kicker}</p>
          </div>

          <div className="pdf-cover__titleBlock">
            <p className="pdf-cover__title">{cover.title}</p>
            {cover.subtitle ? <p className="pdf-cover__subtitle">{cover.subtitle}</p> : null}

            <div className="pdf-cover__rule" />

            <div className="pdf-cover__meta">
              {cover.tournamentTitle ? (
                <div>
                  <p className="pdf-cover__metaLabel">Turnier</p>
                  <p className="pdf-cover__metaValue">{cover.tournamentTitle}</p>
                </div>
              ) : null}
              {cover.tournamentDates ? (
                <div>
                  <p className="pdf-cover__metaLabel">Zeitraum</p>
                  <p className="pdf-cover__metaValue">{cover.tournamentDates}</p>
                </div>
              ) : null}
              {/* The recipient is only spelled out here when there is no
                  tournament to show – otherwise the title already names it. */}
              {!cover.tournamentTitle ? (
                <div>
                  <p className="pdf-cover__metaLabel">Für</p>
                  <p className="pdf-cover__metaValue">{cover.sponsorName}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="pdf-cover__foot">
          <span>{cover.brandName} · Schweizer Gaming-Community</span>
          {meta.dateLabel ? <span>{meta.dateLabel}</span> : null}
        </div>
      </div>
    </section>
  )
}

function ContentSheet({
  page,
  pageNumber,
  totalPages,
  model,
}: {
  page: PdfPage
  pageNumber: number
  totalPages: number
  model: PdfDocumentModel
}) {
  return (
    <section
      className={`pdf-sheet${page.tone === 'feature' ? ' pdf-sheet--feature' : ''}`}
      data-pdf-sheet={page.id}
    >
      <RunningHeader model={model} />

      <div className="pdf-body">
        <div className="pdf-flow" data-pdf-flow={page.id}>
          {page.heading?.title || page.heading?.eyebrow || page.heading?.subtitle ? (
            <div className="pdf-page-heading">
              {page.heading.eyebrow ? <p className="pdf-eyebrow">{page.heading.eyebrow}</p> : null}
              {page.heading.title ? (
                <h2 className="pdf-h2">
                  {page.heading.title}
                  {page.heading.continued ? <span className="pdf-continued"> (Fortsetzung)</span> : null}
                </h2>
              ) : null}
              {page.heading.title ? <div className="pdf-rule" /> : null}
              {page.heading.subtitle && !page.heading.continued ? (
                <p className="pdf-sub">{page.heading.subtitle}</p>
              ) : null}
            </div>
          ) : null}

          {page.items.map((item, index) => (
            <PdfBlock key={`${page.id}-${index}`} node={item.node} />
          ))}
        </div>
      </div>

      <PdfFooter model={model} pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  )
}

function Closing({
  model,
  pageNumber,
  totalPages,
}: {
  model: PdfDocumentModel
  pageNumber: number
  totalPages: number
}) {
  const { closing, cover } = model

  return (
    <section className="pdf-sheet pdf-sheet--closing" data-pdf-sheet="closing">
      <div className="pdf-body">
        <div className="pdf-closing">
          <p className="pdf-closing__title">{closing.title}</p>
          {closing.html ? (
            <div className="pdf-closing__rich" dangerouslySetInnerHTML={{ __html: closing.html }} />
          ) : null}

          <div className="pdf-closing__panel">
            <div className="pdf-closing__contact">
              <p className="pdf-closing__label">Kontakt</p>
              {closing.contactEmail ? (
                <a className="pdf-closing__mail" href={`mailto:${closing.contactEmail}`}>
                  {closing.contactEmail}
                </a>
              ) : null}
              {closing.website ? (
                <a className="pdf-closing__web" href={closing.website}>
                  {closing.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ) : null}
              {closing.note ? <p className="pdf-closing__note">{closing.note}</p> : null}
            </div>

            {closing.qr && closing.pageUrl ? (
              <div className="pdf-qr">
                <a href={closing.pageUrl}>
                  <span className="pdf-qr__frame" dangerouslySetInnerHTML={{ __html: closing.qr }} />
                </a>
                <p className="pdf-qr__caption">{closing.qrCaption}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="pdf-footer">
        <span>
          {cover.brandName} × {cover.sponsorName}
        </span>
        {model.meta.showPageNumbers ? (
          <span className="pdf-footer__page">
            {pageNumber} / {totalPages}
          </span>
        ) : (
          <span />
        )}
      </div>
    </section>
  )
}

/**
 * Slim branding band repeated on every content sheet.
 *
 * It sits absolutely inside the sheet's top padding, above the measured flow,
 * so it carries the SwissHub/sponsor lockup onto every page without costing
 * the paginator a single millimetre.
 */
function RunningHeader({ model }: { model: PdfDocumentModel }) {
  const { cover } = model

  return (
    <div className="pdf-runhead">
      <div className="pdf-runhead__brand">
        {cover.brandLogoUrl ? (
          <img className="pdf-runhead__logo" src={cover.brandLogoUrl} alt={cover.brandName} />
        ) : (
          <span className="pdf-runhead__word">{cover.brandName}</span>
        )}
        <span className="pdf-runhead__times" aria-hidden="true">
          ×
        </span>
        {/* A sponsor logo is preferred; the company name stands in when the
            sponsor record has no artwork. */}
        {cover.sponsorLogoUrl ? (
          <img className="pdf-runhead__sponsorLogo" src={cover.sponsorLogoUrl} alt={cover.sponsorName} />
        ) : (
          <span className="pdf-runhead__word">{cover.sponsorName}</span>
        )}
      </div>
      <span className="pdf-runhead__sponsor">{cover.kicker}</span>
    </div>
  )
}

function PdfFooter({
  model,
  pageNumber,
  totalPages,
}: {
  model: PdfDocumentModel
  pageNumber: number
  totalPages: number
}) {
  return (
    <div className="pdf-footer">
      {/* The branding lives in the running header, so the footer only carries
          the context line and the page number. */}
      <span>{model.meta.tournamentTitle ?? model.cover.sponsorName}</span>
      {model.meta.showPageNumbers ? (
        <span className="pdf-footer__page">
          {pageNumber} / {totalPages}
        </span>
      ) : (
        <span />
      )}
    </div>
  )
}
