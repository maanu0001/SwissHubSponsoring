import { hexToRgbChannels, readableForeground } from '@/lib/color'
import { PAGE, CONTENT_HEIGHT } from '@/server/pdf/paginate'

/**
 * Print stylesheet for the PDF renderer.
 *
 * Deliberately separate from the web design system: A4 sheets, millimetre
 * units, no animation, no hover states, and a light document body with dark
 * accent panels so the result stays readable when printed on a office printer.
 * Fonts are system families only – nothing is fetched at export time.
 */
export function PdfStyles({ primary, accent }: { primary: string; accent: string }) {
  const css = `
:root {
  --brand: ${hexToRgbChannels(primary)};
  --accent: ${hexToRgbChannels(accent, '232 80 86')};
  --brand-fg: ${readableForeground(primary)};

  --ink: 17 20 24;
  --ink-soft: 68 76 86;
  --ink-mute: 108 117 128;
  --paper: 255 255 255;
  --paper-tint: 246 247 249;
  --rule: 223 227 232;

  --dark: 12 14 17;
  --dark-soft: 26 30 35;
  --dark-fg: 244 246 248;
  --dark-mute: 163 171 180;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

@page {
  size: A4 portrait;
  margin: 0;
}

html, body {
  width: ${PAGE.width}mm;
  background: #fff;
  color: rgb(var(--ink));
  font-family: "Liberation Sans", "DejaVu Sans", "Helvetica Neue", Arial, sans-serif;
  font-size: 10.2pt;
  line-height: 1.52;
  -webkit-font-smoothing: antialiased;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.pdf-sheet {
  position: relative;
  width: ${PAGE.width}mm;
  height: ${PAGE.height}mm;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
  background: rgb(var(--paper));
  display: flex;
  flex-direction: column;
}
/* :last-of-type, not :last-child - the overflow probe script is the last child
   of body, so :last-child would never match and every export would end with a
   blank sheet. */
.pdf-sheet:last-of-type { page-break-after: auto; break-after: auto; }

.pdf-sheet--dark { background: rgb(var(--dark)); color: rgb(var(--dark-fg)); }

/* The PDF route lives inside the app router and therefore inherits the site's
   global stylesheet, whose dark-theme heading colour would make headings almost
   invisible on the light sheets. Reset inheritance for the whole PDF subtree. */
/* The PDF route lives inside the app router and inherits the site stylesheet,
   whose h1..h4 rule carries the dark-theme colour and the web font stack.
   Class level declarations (0,1,0) beat that element rule (0,0,1) without
   out-specifying the component colours further down. */
.pdf-h1, .pdf-h2, .pdf-h3 {
  color: rgb(var(--ink));
  font-family: inherit;
}
.pdf-sheet--dark .pdf-h1,
.pdf-sheet--dark .pdf-h2,
.pdf-sheet--dark .pdf-h3 { color: rgb(var(--dark-fg)); }
.pdf-rich h2, .pdf-rich h3, .pdf-rich h4 { font-family: inherit; }
.pdf-sheet { color: rgb(var(--ink)); }

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

/* --- typography ------------------------------------------------------- */
.pdf-eyebrow {
  font-size: 7.4pt;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(var(--brand));
  margin-bottom: 2mm;
}
.pdf-sheet--dark .pdf-eyebrow { color: rgb(var(--accent)); }

.pdf-h1 { font-size: 30pt; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
.pdf-h2 { font-size: 17pt; line-height: 1.18; font-weight: 700; letter-spacing: -0.01em; }
.pdf-h3 { font-size: 10.6pt; font-weight: 700; line-height: 1.3; }
.pdf-sub { font-size: 10.4pt; color: rgb(var(--ink-soft)); margin-top: 2mm; max-width: 150mm; }
.pdf-sheet--dark .pdf-sub { color: rgb(var(--dark-mute)); }

.pdf-page-heading { margin-bottom: 8mm; }
.pdf-page-heading .pdf-h2 { border-bottom: 0.6mm solid rgb(var(--brand)); padding-bottom: 3mm; display: inline-block; }
.pdf-continued { font-size: 8pt; color: rgb(var(--ink-mute)); font-weight: 400; letter-spacing: 0; }

.pdf-inline-heading { margin: 6mm 0 5mm; }
.pdf-inline-heading .pdf-h2 { font-size: 14pt; border-bottom: 0.5mm solid rgb(var(--brand)); padding-bottom: 2mm; display: inline-block; }

/* --- rich text -------------------------------------------------------- */
.pdf-rich { max-width: 158mm; color: rgb(var(--ink-soft)); }
.pdf-rich p { margin-bottom: 3mm; }
.pdf-rich p:last-child { margin-bottom: 0; }
.pdf-rich h2, .pdf-rich h3, .pdf-rich h4 { color: rgb(var(--ink)); font-size: 11.5pt; margin: 4mm 0 2mm; }
.pdf-rich ul, .pdf-rich ol { margin: 0 0 3mm 5mm; }
.pdf-rich li { margin-bottom: 1.2mm; }
.pdf-rich strong { color: rgb(var(--ink)); font-weight: 700; }
.pdf-rich a { color: rgb(var(--brand)); text-decoration: none; border-bottom: 0.2mm solid rgb(var(--brand) / 0.35); }
.pdf-rich blockquote { border-left: 0.6mm solid rgb(var(--brand)); padding-left: 4mm; margin-bottom: 3mm; }

/* --- generic blocks --------------------------------------------------- */
.pdf-block { margin-bottom: 4mm; }
.pdf-block:last-child { margin-bottom: 0; }

.pdf-grid { display: grid; gap: 4mm; }
.pdf-grid--2 { grid-template-columns: 1fr 1fr; }
.pdf-grid--3 { grid-template-columns: repeat(3, 1fr); }

.pdf-card {
  border: 0.25mm solid rgb(var(--rule));
  border-radius: 2mm;
  padding: 4mm 4.5mm;
  background: rgb(var(--paper));
}
.pdf-card--tint { background: rgb(var(--paper-tint)); }

/* --- KPI ---------------------------------------------------------------*/
.pdf-kpi {
  border: 0.25mm solid rgb(var(--rule));
  border-top: 0.9mm solid rgb(var(--brand));
  border-radius: 2mm;
  padding: 4.5mm 4mm;
  background: rgb(var(--paper-tint));
}
.pdf-kpi__value { font-size: 20pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1; color: rgb(var(--ink)); }
.pdf-kpi__label { font-size: 8.8pt; font-weight: 700; margin-top: 2.4mm; color: rgb(var(--ink)); }
.pdf-kpi__hint { font-size: 7.8pt; color: rgb(var(--ink-mute)); margin-top: 1mm; line-height: 1.35; }

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
.pdf-bullet__text { font-size: 8.9pt; color: rgb(var(--ink-soft)); margin-top: 1mm; line-height: 1.42; }

/* --- benefits --------------------------------------------------------- */
.pdf-benefit { display: flex; gap: 2.8mm; padding: 2.6mm 3mm; border-radius: 1.6mm; background: rgb(var(--paper-tint)); border: 0.25mm solid rgb(var(--rule)); }
.pdf-benefit__check { flex: 0 0 auto; width: 3.6mm; height: 3.6mm; margin-top: 0.8mm; color: rgb(var(--brand)); }
.pdf-benefit__title { font-size: 9pt; font-weight: 700; line-height: 1.32; }
.pdf-benefit__desc { font-size: 7.6pt; color: rgb(var(--ink-mute)); margin-top: 0.8mm; line-height: 1.36; }
.pdf-category { font-size: 7.6pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgb(var(--ink-mute)); margin-bottom: 2.5mm; display: flex; align-items: center; gap: 3mm; }
.pdf-category::after { content: ""; flex: 1; height: 0.25mm; background: rgb(var(--rule)); }

/* --- proposal --------------------------------------------------------- */
.pdf-proposal {
  background: rgb(var(--dark));
  color: rgb(var(--dark-fg));
  border-radius: 2.5mm;
  padding: 6mm 7mm;
  display: flex;
  gap: 8mm;
  align-items: flex-start;
}
.pdf-proposal__amount { font-size: 26pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1; color: rgb(var(--accent)); white-space: nowrap; }
.pdf-proposal__label { font-size: 7.4pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(var(--dark-mute)); margin-bottom: 2.5mm; }
.pdf-proposal__type { font-size: 8.6pt; color: rgb(var(--dark-mute)); margin-top: 2mm; }
.pdf-proposal__text { font-size: 9.2pt; line-height: 1.5; color: rgb(var(--dark-fg)); }

/* --- tournament ------------------------------------------------------- */
.pdf-tournament { border: 0.25mm solid rgb(var(--rule)); border-radius: 2.5mm; overflow: hidden; }
.pdf-tournament__image { width: 100%; height: 42mm; object-fit: cover; display: block; background: rgb(var(--paper-tint)); }
.pdf-tournament__body { padding: 5mm 5.5mm; }
.pdf-tournament__meta { display: flex; flex-wrap: wrap; gap: 2mm 6mm; margin-top: 3mm; padding-top: 3mm; border-top: 0.25mm solid rgb(var(--rule)); }
.pdf-fact__label { font-size: 7.2pt; letter-spacing: 0.09em; text-transform: uppercase; color: rgb(var(--ink-mute)); }
.pdf-fact__value { font-size: 11pt; font-weight: 700; margin-top: 0.6mm; }

.pdf-tcard { border: 0.25mm solid rgb(var(--rule)); border-radius: 2mm; overflow: hidden; display: flex; flex-direction: column; }
.pdf-tcard__image { width: 100%; height: 22mm; object-fit: cover; display: block; background: rgb(var(--paper-tint)); }
.pdf-tcard__body { padding: 3mm 3.5mm; flex: 1; }
.pdf-tcard__title { font-size: 9pt; font-weight: 700; line-height: 1.28; }
.pdf-tcard__meta { font-size: 7.4pt; color: rgb(var(--ink-mute)); margin-top: 1mm; line-height: 1.34; }

/* --- partners --------------------------------------------------------- */
.pdf-partner { border: 0.25mm solid rgb(var(--rule)); border-radius: 2mm; padding: 4mm; background: rgb(var(--paper-tint)); }
.pdf-partner__logo { max-height: 12mm; max-width: 100%; object-fit: contain; object-position: left center; display: block; margin-bottom: 3mm; }
.pdf-partner__name { font-size: 9.4pt; font-weight: 700; }
.pdf-partner__desc { font-size: 7.6pt; color: rgb(var(--ink-mute)); margin-top: 1.2mm; line-height: 1.36; }
.pdf-partner__link { font-size: 7.6pt; color: rgb(var(--brand)); margin-top: 1.6mm; text-decoration: none; }

/* --- gallery ---------------------------------------------------------- */
.pdf-figure { border: 0.25mm solid rgb(var(--rule)); border-radius: 2mm; overflow: hidden; }
.pdf-figure img { width: 100%; height: 44mm; object-fit: cover; display: block; }
.pdf-figure figcaption { font-size: 7.4pt; color: rgb(var(--ink-mute)); padding: 2mm 3mm; }

/* --- budget / steps / quotes / links ---------------------------------- */
.pdf-budget__head { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
.pdf-budget__share { font-size: 10pt; font-weight: 700; color: rgb(var(--brand)); }
.pdf-budget__bar { height: 1mm; border-radius: 1mm; background: rgb(var(--rule)); margin-top: 2.5mm; overflow: hidden; }
.pdf-budget__fill { height: 100%; background: rgb(var(--brand)); }

.pdf-step { display: flex; gap: 4mm; align-items: flex-start; }
.pdf-step__label { flex: 0 0 26mm; font-size: 7.6pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgb(var(--brand)); padding-top: 0.8mm; }

.pdf-quote { border-left: 0.8mm solid rgb(var(--brand)); padding: 1mm 0 1mm 5mm; }
.pdf-quote__text { font-size: 9.6pt; font-style: italic; color: rgb(var(--ink-soft)); }
.pdf-quote__author { font-size: 8pt; color: rgb(var(--ink-mute)); margin-top: 2mm; }

.pdf-link { display: flex; justify-content: space-between; gap: 4mm; align-items: baseline; padding: 2.6mm 0; border-bottom: 0.25mm solid rgb(var(--rule)); }
.pdf-link__label { font-size: 9pt; font-weight: 700; }
.pdf-link__url { font-size: 7.6pt; color: rgb(var(--brand)); text-decoration: none; word-break: break-all; text-align: right; }

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
  color: rgb(var(--ink-mute));
  border-top: 0.25mm solid rgb(var(--rule));
  padding-top: 2.5mm;
}
.pdf-footer__page { font-variant-numeric: tabular-nums; }

/* --- cover ------------------------------------------------------------ */
.pdf-cover { position: relative; height: 100%; display: flex; flex-direction: column; color: rgb(var(--dark-fg)); }
.pdf-cover__art { position: absolute; inset: 0; overflow: hidden; }
.pdf-cover__art img { width: 100%; height: 100%; object-fit: cover; opacity: 0.28; }
.pdf-cover__wash {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 55% at 12% 0%, rgb(var(--brand) / 0.55), transparent 62%),
    linear-gradient(180deg, rgb(var(--dark) / 0.72) 0%, rgb(var(--dark) / 0.95) 62%, rgb(var(--dark)) 100%);
}
.pdf-cover__inner { position: relative; flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 24mm ${PAGE.paddingX}mm 20mm; }
.pdf-cover__head { display: flex; flex-direction: column; gap: 6mm; }
.pdf-cover__logos { display: flex; align-items: center; gap: 7mm; }
.pdf-cover__kicker { font-size: 8pt; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgb(var(--accent)); }
.pdf-cover__titleBlock { padding-bottom: 4mm; }
.pdf-cover__logo { max-height: 15mm; max-width: 52mm; object-fit: contain; }
.pdf-cover__wordmark { font-size: 17pt; font-weight: 700; letter-spacing: -0.01em; }
.pdf-cover__times { font-size: 15pt; color: rgb(var(--dark-mute)); font-weight: 300; }
.pdf-cover__title { color: rgb(var(--dark-fg)); font-size: 32pt; line-height: 1.08; font-weight: 700; letter-spacing: -0.025em; max-width: 160mm; }
.pdf-cover__subtitle { font-size: 12pt; color: rgb(var(--dark-mute)); margin-top: 5mm; max-width: 135mm; line-height: 1.5; }
.pdf-cover__rule { width: 34mm; height: 1mm; background: rgb(var(--brand)); margin: 9mm 0 7mm; border-radius: 1mm; }
.pdf-cover__meta { display: flex; flex-wrap: wrap; gap: 3mm 10mm; }
.pdf-cover__metaLabel { font-size: 7.2pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(var(--dark-mute)); }
.pdf-cover__metaValue { font-size: 11.5pt; font-weight: 700; margin-top: 1.2mm; }
.pdf-cover__foot { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 5mm ${PAGE.paddingX}mm; background: rgb(var(--dark-soft)); font-size: 8pt; color: rgb(var(--dark-mute)); }

/* --- closing ---------------------------------------------------------- */
.pdf-closing { height: 100%; display: flex; flex-direction: column; justify-content: center; color: rgb(var(--dark-fg)); }
.pdf-closing__title { color: rgb(var(--dark-fg)); font-size: 26pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1.12; max-width: 150mm; }
.pdf-closing__rich { margin-top: 6mm; max-width: 140mm; font-size: 10.4pt; color: rgb(var(--dark-mute)); line-height: 1.55; }
.pdf-closing__rich p { margin-bottom: 3mm; }
.pdf-closing__rich a { color: rgb(var(--accent)); text-decoration: none; }
.pdf-closing__panel { margin-top: 11mm; display: flex; gap: 10mm; align-items: flex-start; border-top: 0.3mm solid rgb(var(--dark-mute) / 0.35); padding-top: 8mm; }
.pdf-closing__contact { flex: 1; }
.pdf-closing__label { font-size: 7.2pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgb(var(--dark-mute)); margin-bottom: 2.5mm; }
.pdf-closing__mail { font-size: 15pt; font-weight: 700; color: rgb(var(--accent)); text-decoration: none; display: block; }
.pdf-closing__web { font-size: 10pt; color: rgb(var(--dark-fg)); text-decoration: none; display: block; margin-top: 2.5mm; }
.pdf-closing__note { font-size: 8.4pt; color: rgb(var(--dark-mute)); margin-top: 6mm; max-width: 95mm; line-height: 1.45; }
.pdf-qr { flex: 0 0 auto; text-align: center; }
/* display:block is required - width/height do not apply to an inline span,
   which would let the QR render at its natural pixel size. */
.pdf-qr__frame { display: block; width: 32mm; height: 32mm; background: #fff; border-radius: 2mm; padding: 2mm; }
.pdf-qr__frame svg { width: 100%; height: 100%; display: block; }
.pdf-qr__caption { font-size: 7.4pt; color: rgb(var(--dark-mute)); margin-top: 2.5mm; max-width: 34mm; line-height: 1.35; }
`
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
