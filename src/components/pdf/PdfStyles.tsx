import { hexToRgbChannels, readableForeground } from '@/lib/color'
import { PAGE, CONTENT_HEIGHT } from '@/server/pdf/paginate'

/**
 * Print stylesheet for the PDF renderer.
 *
 * The document is dark throughout – the same anthracite/red language the web
 * app uses, so an export reads as one continuous SwissHub presentation rather
 * than a printed web page. There is deliberately no light theme: every sheet
 * paints the same base, and the only variation is the 'feature' wash used for
 * the pitch sheets. Fonts are system families only, nothing is fetched at
 * export time.
 */
export function PdfStyles({ primary, accent }: { primary: string; accent: string }) {
  const css = `
:root {
  --brand: ${hexToRgbChannels(primary)};
  --accent: ${hexToRgbChannels(accent, '232 80 86')};
  --brand-fg: ${readableForeground(primary)};

  /* Mirrors the application's dark tokens (see globals.css) so the PDF and the
     sponsor page speak the same visual language. */
  --canvas: 8 9 11;
  --surface: 15 17 21;
  --raised: 23 26 31;
  --overlay: 31 35 41;
  --line: 39 44 51;
  --line-strong: 57 64 73;

  --fg: 241 244 247;
  /* Muted and subtle are brighter than the web tokens on purpose: PDF body
     copy sits at 8-10pt, well below the sizes the web values were tuned for. */
  --fg-muted: 174 183 193;
  --fg-subtle: 140 149 159;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

/* The Next.js dev overlay renders into this element. It is absent from a
   production build, but an export must never depend on which server rendered
   it. */
nextjs-portal { display: none !important; }

@page {
  size: A4 portrait;
  margin: 0;
}

/* The two element selectors are not redundant. The app's global stylesheet
   carries "@media print { body { background: #fff; color: #000 } }", which is
   correct for a visitor printing the public site but would wash out every
   sheet here. "html body" (0,0,2) outranks it regardless of source order. */
html, body,
html body {
  width: ${PAGE.width}mm;
  background: rgb(var(--canvas));
  color: rgb(var(--fg));
  font-family: "Liberation Sans", "DejaVu Sans", "Helvetica Neue", Arial, sans-serif;
  font-size: 10.2pt;
  line-height: 1.52;
  -webkit-font-smoothing: antialiased;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Re-asserted inside the print context the exporter actually renders in, so a
   background can never be dropped even if the cascade above is reordered. */
@media print {
  html body { background: rgb(var(--canvas)); color: rgb(var(--fg)); }
  .pdf-sheet { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

/* --- sheets ----------------------------------------------------------- */
.pdf-sheet {
  position: relative;
  width: ${PAGE.width}mm;
  height: ${PAGE.height}mm;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
  background: rgb(var(--surface));
  color: rgb(var(--fg));
  display: flex;
  flex-direction: column;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
/* :last-of-type, not :last-child - the overflow probe script is the last child
   of body, so :last-child would never match and every export would end with a
   blank sheet. */
.pdf-sheet:last-of-type { page-break-after: auto; break-after: auto; }

/* Feature sheets carry the pitch (reach figures, the offer). The wash is the
   only thing that separates them from a base sheet, so the document stays
   varied without ever leaving the same visual language. */
.pdf-sheet--feature {
  background:
    radial-gradient(96% 62% at 100% 0%, rgb(var(--brand) / 0.30), transparent 62%),
    radial-gradient(70% 44% at 0% 100%, rgb(var(--accent) / 0.07), transparent 60%),
    rgb(var(--surface));
}
.pdf-sheet--feature::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1.1mm;
  background: linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)));
}

/* The PDF route lives inside the app router and inherits the site stylesheet,
   whose h1..h4 rule carries the web font stack. Class level declarations
   (0,1,0) beat that element rule (0,0,1). */
.pdf-h1, .pdf-h2, .pdf-h3 {
  color: rgb(var(--fg));
  font-family: inherit;
}
.pdf-rich h2, .pdf-rich h3, .pdf-rich h4 { font-family: inherit; }

.pdf-body {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  padding: ${PAGE.paddingTop}mm ${PAGE.paddingX}mm ${PAGE.paddingBottom}mm;
  display: flex;
  flex-direction: column;
}

/* Hard safety net: content can never bleed onto the next sheet. */
.pdf-flow { height: ${CONTENT_HEIGHT}mm; overflow: hidden; }

/* --- running header --------------------------------------------------- */
/* Sits inside the sheet's top padding, above .pdf-flow, so it costs the
   paginator nothing. Carries the branding on every content sheet. */
.pdf-runhead {
  position: absolute;
  top: 9.5mm;
  left: ${PAGE.paddingX}mm;
  right: ${PAGE.paddingX}mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6mm;
  padding-bottom: 2.6mm;
  border-bottom: 0.25mm solid rgb(var(--line));
}
.pdf-runhead__brand { display: flex; align-items: center; gap: 3mm; min-width: 0; }
.pdf-runhead__logo { max-height: 6.4mm; max-width: 30mm; object-fit: contain; object-position: left center; display: block; }
.pdf-runhead__word { font-size: 9pt; font-weight: 700; letter-spacing: -0.01em; color: rgb(var(--fg)); }
.pdf-runhead__times { font-size: 8.4pt; color: rgb(var(--fg-subtle)); font-weight: 300; }
.pdf-runhead__sponsorLogo { max-height: 6mm; max-width: 28mm; object-fit: contain; display: block; }
.pdf-runhead__sponsor {
  font-size: 7.4pt;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--fg-subtle));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- typography ------------------------------------------------------- */
.pdf-eyebrow {
  font-size: 7.4pt;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgb(var(--accent));
  margin-bottom: 2.4mm;
}

.pdf-h1 { font-size: 30pt; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
.pdf-h2 { font-size: 20pt; line-height: 1.14; font-weight: 700; letter-spacing: -0.02em; }
.pdf-h3 { font-size: 10.6pt; font-weight: 700; line-height: 1.3; }
.pdf-sub { font-size: 10.2pt; color: rgb(var(--fg-muted)); margin-top: 2.4mm; max-width: 150mm; }

/* A short accent rule under the title reads as a deliberate mark; the old
   full-width underline made every page look like a form. */
.pdf-page-heading { margin-bottom: 9mm; }
.pdf-page-heading .pdf-h2 { font-size: 22pt; }
.pdf-page-heading .pdf-rule,
.pdf-inline-heading .pdf-rule {
  height: 0.9mm;
  width: 18mm;
  border-radius: 1mm;
  background: linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent)));
  margin-top: 3.4mm;
}
.pdf-continued { font-size: 8.5pt; color: rgb(var(--fg-subtle)); font-weight: 400; letter-spacing: 0; }

.pdf-inline-heading { margin: 8mm 0 5mm; }
.pdf-inline-heading .pdf-h2 { font-size: 15.5pt; }
.pdf-inline-heading .pdf-rule { width: 13mm; height: 0.7mm; margin-top: 2.6mm; }

/* --- rich text -------------------------------------------------------- */
.pdf-rich { max-width: 158mm; color: rgb(var(--fg-muted)); }
.pdf-rich p { margin-bottom: 3mm; }
.pdf-rich p:last-child { margin-bottom: 0; }
.pdf-rich h2, .pdf-rich h3, .pdf-rich h4 { color: rgb(var(--fg)); font-size: 11.5pt; margin: 4mm 0 2mm; }
.pdf-rich ul, .pdf-rich ol { margin: 0 0 3mm 5mm; }
.pdf-rich li { margin-bottom: 1.2mm; }
.pdf-rich strong { color: rgb(var(--fg)); font-weight: 700; }
.pdf-rich a { color: rgb(var(--accent)); text-decoration: none; border-bottom: 0.2mm solid rgb(var(--accent) / 0.4); }
.pdf-rich blockquote { border-left: 0.6mm solid rgb(var(--brand)); padding-left: 4mm; margin-bottom: 3mm; }

/* --- generic blocks --------------------------------------------------- */
.pdf-block { margin-bottom: 4mm; }
.pdf-block:last-child { margin-bottom: 0; }

.pdf-grid { display: grid; gap: 4mm; }
.pdf-grid--2 { grid-template-columns: 1fr 1fr; }
.pdf-grid--3 { grid-template-columns: repeat(3, 1fr); }

.pdf-card {
  border: 0.25mm solid rgb(var(--line));
  border-radius: 2.4mm;
  padding: 4mm 4.5mm;
  background: rgb(var(--raised));
}
.pdf-card--tint { background: rgb(var(--overlay)); }

/* --- KPI ---------------------------------------------------------------*/
.pdf-kpi {
  position: relative;
  border: 0.25mm solid rgb(var(--line));
  border-radius: 2.4mm;
  padding: 5mm 4.5mm;
  background: rgb(var(--raised));
  overflow: hidden;
}
/* A hairline rather than a heavy top border: red is a highlight here, not a
   frame around every tile. */
.pdf-kpi::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 12mm; height: 0.7mm;
  background: rgb(var(--accent));
}
.pdf-kpi__value { font-size: 21pt; font-weight: 700; letter-spacing: -0.03em; line-height: 1; color: rgb(var(--fg)); }
.pdf-kpi__label {
  font-size: 7.6pt;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  margin-top: 3mm;
  color: rgb(var(--fg-muted));
}
.pdf-kpi__hint { font-size: 7.6pt; color: rgb(var(--fg-subtle)); margin-top: 1.4mm; line-height: 1.35; }

/* Emphasised figures for the reach sheet – the numbers are the message there,
   so they get the room and the labels step back. */
.pdf-kpi--lg { padding: 6.5mm 5mm; background: rgb(var(--raised)); }
.pdf-kpi--lg .pdf-kpi__value { font-size: 32pt; letter-spacing: -0.04em; }
.pdf-kpi--lg .pdf-kpi__label { font-size: 8pt; letter-spacing: 0.13em; margin-top: 3.6mm; color: rgb(var(--fg)); }
.pdf-kpi--lg .pdf-kpi__hint { font-size: 7.8pt; margin-top: 1.8mm; }
.pdf-kpi--lg::before { width: 16mm; height: 0.9mm; }

/* --- bullets ---------------------------------------------------------- */
.pdf-bullet { display: flex; gap: 3mm; }
.pdf-bullet__dot {
  flex: 0 0 auto;
  width: 4mm; height: 4mm; margin-top: 1mm;
  border-radius: 50%;
  background: rgb(var(--brand));
  color: rgb(var(--brand-fg));
  font-size: 6pt;
  display: flex; align-items: center; justify-content: center;
}
.pdf-bullet__text { font-size: 8.9pt; color: rgb(var(--fg-muted)); margin-top: 1mm; line-height: 1.42; }

/* --- benefits --------------------------------------------------------- */
.pdf-benefit {
  display: flex;
  gap: 2.8mm;
  padding: 3mm 3.4mm;
  border-radius: 2mm;
  background: rgb(var(--raised));
  border: 0.25mm solid rgb(var(--line));
}
.pdf-benefit__check { flex: 0 0 auto; width: 3.6mm; height: 3.6mm; margin-top: 0.8mm; color: rgb(var(--accent)); }
.pdf-benefit__title { font-size: 9pt; font-weight: 700; line-height: 1.32; color: rgb(var(--fg)); }
.pdf-benefit__desc { font-size: 7.6pt; color: rgb(var(--fg-subtle)); margin-top: 0.8mm; line-height: 1.36; }
.pdf-category {
  font-size: 7.6pt;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: rgb(var(--accent));
  margin-bottom: 2.8mm;
  display: flex;
  align-items: center;
  gap: 3mm;
}
.pdf-category::after { content: ""; flex: 1; height: 0.25mm; background: rgb(var(--line)); }

/* --- proposal --------------------------------------------------------- */
/* The offer is the anchor of the whole document, so it gets the largest type
   on any content sheet and the only full brand panel. */
.pdf-proposal {
  position: relative;
  border: 0.3mm solid rgb(var(--brand) / 0.55);
  border-radius: 3mm;
  padding: 8mm 8mm 7.5mm;
  background:
    radial-gradient(80% 120% at 0% 0%, rgb(var(--brand) / 0.42), transparent 66%),
    rgb(var(--overlay));
  overflow: hidden;
}
.pdf-proposal__label {
  font-size: 7.6pt;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(var(--accent));
  margin-bottom: 3.5mm;
}
.pdf-proposal__amount {
  font-size: 44pt;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.98;
  color: rgb(var(--fg));
  white-space: nowrap;
}
.pdf-proposal__amount--sm { font-size: 26pt; white-space: normal; }
.pdf-proposal__for {
  font-size: 9.6pt;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--fg-muted));
  margin-top: 4mm;
  line-height: 1.45;
  max-width: 105mm;
}
.pdf-proposal__type { font-size: 8.6pt; color: rgb(var(--fg-subtle)); margin-top: 2.4mm; }
.pdf-proposal__divider { height: 0.25mm; background: rgb(var(--line-strong)); margin: 6mm 0 5mm; }
.pdf-proposal__text { font-size: 9.4pt; line-height: 1.52; color: rgb(var(--fg-muted)); max-width: 150mm; }

/* --- tournament ------------------------------------------------------- */
.pdf-tournament { border: 0.25mm solid rgb(var(--line)); border-radius: 2.6mm; overflow: hidden; background: rgb(var(--raised)); }
.pdf-tournament__image { width: 100%; height: 42mm; object-fit: cover; display: block; background: rgb(var(--overlay)); }
.pdf-tournament__body { padding: 5mm 5.5mm; }
.pdf-tournament__meta { display: flex; flex-wrap: wrap; gap: 2mm 8mm; margin-top: 4mm; padding-top: 3.5mm; border-top: 0.25mm solid rgb(var(--line)); }
.pdf-fact__label { font-size: 7.2pt; letter-spacing: 0.11em; text-transform: uppercase; color: rgb(var(--fg-subtle)); }
.pdf-fact__value { font-size: 12pt; font-weight: 700; margin-top: 0.8mm; color: rgb(var(--fg)); }

.pdf-tcard { border: 0.25mm solid rgb(var(--line)); border-radius: 2.4mm; overflow: hidden; display: flex; flex-direction: column; background: rgb(var(--raised)); }
.pdf-tcard__image { width: 100%; height: 22mm; object-fit: cover; display: block; background: rgb(var(--overlay)); }
.pdf-tcard__body { padding: 3.4mm 3.6mm; flex: 1; }
.pdf-tcard__title { font-size: 9pt; font-weight: 700; line-height: 1.28; color: rgb(var(--fg)); }
.pdf-tcard__meta { font-size: 7.4pt; color: rgb(var(--fg-subtle)); margin-top: 1.2mm; line-height: 1.34; }

/* --- partners --------------------------------------------------------- */
.pdf-partner { border: 0.25mm solid rgb(var(--line)); border-radius: 2.4mm; padding: 4mm; background: rgb(var(--raised)); }
/* Partner logos are supplied as artwork for light backgrounds more often than
   not, so each one gets its own light plate instead of floating on the dark. */
.pdf-partner__plate {
  background: #fff;
  border-radius: 1.6mm;
  padding: 2.2mm 2.6mm;
  margin-bottom: 3.2mm;
  display: inline-flex;
  align-items: center;
}
.pdf-partner__logo { max-height: 9mm; max-width: 34mm; object-fit: contain; display: block; }
.pdf-partner__name { font-size: 9.4pt; font-weight: 700; color: rgb(var(--fg)); }
.pdf-partner__desc { font-size: 7.6pt; color: rgb(var(--fg-subtle)); margin-top: 1.4mm; line-height: 1.36; }
.pdf-partner__link { font-size: 7.6pt; color: rgb(var(--accent)); margin-top: 1.8mm; text-decoration: none; display: block; }

/* --- gallery ---------------------------------------------------------- */
.pdf-figure { border: 0.25mm solid rgb(var(--line)); border-radius: 2.4mm; overflow: hidden; background: rgb(var(--raised)); }
.pdf-figure img { width: 100%; height: 44mm; object-fit: cover; display: block; }
.pdf-figure figcaption { font-size: 7.4pt; color: rgb(var(--fg-subtle)); padding: 2.4mm 3mm; }

/* --- budget / steps / quotes / links ---------------------------------- */
.pdf-budget__head { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
.pdf-budget__share { font-size: 10pt; font-weight: 700; color: rgb(var(--accent)); }
.pdf-budget__bar { height: 1mm; border-radius: 1mm; background: rgb(var(--line-strong)); margin-top: 2.5mm; overflow: hidden; }
.pdf-budget__fill { height: 100%; background: linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent))); }

.pdf-step { display: flex; gap: 4mm; align-items: flex-start; }
.pdf-step__label { flex: 0 0 26mm; font-size: 7.6pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgb(var(--accent)); padding-top: 0.8mm; }

.pdf-quote { border-left: 0.8mm solid rgb(var(--brand)); padding: 1mm 0 1mm 5mm; }
.pdf-quote__text { font-size: 9.6pt; font-style: italic; color: rgb(var(--fg-muted)); }
.pdf-quote__author { font-size: 8pt; color: rgb(var(--fg-subtle)); margin-top: 2mm; }

.pdf-link { display: flex; justify-content: space-between; gap: 4mm; align-items: baseline; padding: 2.8mm 0; border-bottom: 0.25mm solid rgb(var(--line)); }
.pdf-link__label { font-size: 9pt; font-weight: 700; color: rgb(var(--fg)); }
.pdf-link__url { font-size: 7.6pt; color: rgb(var(--accent)); text-decoration: none; word-break: break-all; text-align: right; }

/* --- footer ----------------------------------------------------------- */
.pdf-footer {
  position: absolute;
  left: ${PAGE.paddingX}mm;
  right: ${PAGE.paddingX}mm;
  bottom: 9mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 7.4pt;
  color: rgb(var(--fg-subtle));
  border-top: 0.25mm solid rgb(var(--line));
  padding-top: 2.6mm;
}
.pdf-footer__page { font-variant-numeric: tabular-nums; color: rgb(var(--fg-muted)); font-weight: 700; }

/* --- cover ------------------------------------------------------------ */
.pdf-sheet--cover { background: rgb(var(--canvas)); }
.pdf-cover { position: relative; height: 100%; display: flex; flex-direction: column; color: rgb(var(--fg)); }
.pdf-cover__art { position: absolute; inset: 0; overflow: hidden; }
.pdf-cover__art img { width: 100%; height: 100%; object-fit: cover; opacity: 0.28; }
.pdf-cover__wash {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 55% at 12% 0%, rgb(var(--brand) / 0.55), transparent 62%),
    linear-gradient(180deg, rgb(var(--canvas) / 0.72) 0%, rgb(var(--canvas) / 0.95) 62%, rgb(var(--canvas)) 100%);
}
.pdf-cover__inner { position: relative; flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 24mm ${PAGE.paddingX}mm 20mm; }
.pdf-cover__head { display: flex; flex-direction: column; gap: 6mm; }
.pdf-cover__logos { display: flex; align-items: center; gap: 7mm; }
.pdf-cover__kicker { font-size: 8pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgb(var(--accent)); }
.pdf-cover__titleBlock { padding-bottom: 4mm; }
.pdf-cover__logo { max-height: 15mm; max-width: 52mm; object-fit: contain; }
.pdf-cover__wordmark { font-size: 17pt; font-weight: 700; letter-spacing: -0.01em; }
.pdf-cover__times { font-size: 15pt; color: rgb(var(--fg-subtle)); font-weight: 300; }
.pdf-cover__title { color: rgb(var(--fg)); font-size: 32pt; line-height: 1.08; font-weight: 700; letter-spacing: -0.025em; max-width: 160mm; }
.pdf-cover__subtitle { font-size: 12pt; color: rgb(var(--fg-muted)); margin-top: 5mm; max-width: 135mm; line-height: 1.5; }
.pdf-cover__rule { width: 34mm; height: 1mm; background: linear-gradient(90deg, rgb(var(--brand)), rgb(var(--accent))); margin: 9mm 0 7mm; border-radius: 1mm; }
.pdf-cover__meta { display: flex; flex-wrap: wrap; gap: 3mm 10mm; }
.pdf-cover__metaLabel { font-size: 7.2pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(var(--fg-subtle)); }
.pdf-cover__metaValue { font-size: 11.5pt; font-weight: 700; margin-top: 1.2mm; }
.pdf-cover__foot { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 5mm ${PAGE.paddingX}mm; background: rgb(var(--surface)); font-size: 8pt; color: rgb(var(--fg-subtle)); }

/* --- closing ---------------------------------------------------------- */
.pdf-sheet--closing {
  background:
    radial-gradient(80% 55% at 90% 100%, rgb(var(--brand) / 0.34), transparent 64%),
    rgb(var(--canvas));
}
.pdf-closing { height: 100%; display: flex; flex-direction: column; justify-content: center; color: rgb(var(--fg)); }
.pdf-closing__title { color: rgb(var(--fg)); font-size: 26pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1.12; max-width: 150mm; }
.pdf-closing__rich { margin-top: 6mm; max-width: 140mm; font-size: 10.4pt; color: rgb(var(--fg-muted)); line-height: 1.55; }
.pdf-closing__rich p { margin-bottom: 3mm; }
.pdf-closing__rich a { color: rgb(var(--accent)); text-decoration: none; }
.pdf-closing__panel { margin-top: 11mm; display: flex; gap: 10mm; align-items: flex-start; border-top: 0.3mm solid rgb(var(--line-strong)); padding-top: 8mm; }
.pdf-closing__contact { flex: 1; }
.pdf-closing__label { font-size: 7.2pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(var(--fg-subtle)); margin-bottom: 2.5mm; }
.pdf-closing__mail { font-size: 15pt; font-weight: 700; color: rgb(var(--accent)); text-decoration: none; display: block; }
.pdf-closing__web { font-size: 10pt; color: rgb(var(--fg)); text-decoration: none; display: block; margin-top: 2.5mm; }
.pdf-closing__note { font-size: 8.4pt; color: rgb(var(--fg-subtle)); margin-top: 6mm; max-width: 95mm; line-height: 1.45; }
.pdf-qr { flex: 0 0 auto; text-align: center; }
/* display:block is required - width/height do not apply to an inline span,
   which would let the QR render at its natural pixel size. */
.pdf-qr__frame { display: block; width: 32mm; height: 32mm; background: #fff; border-radius: 2mm; padding: 2mm; }
.pdf-qr__frame svg { width: 100%; height: 100%; display: block; }
.pdf-qr__caption { font-size: 7.4pt; color: rgb(var(--fg-subtle)); margin-top: 2.5mm; max-width: 34mm; line-height: 1.35; }
`
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
