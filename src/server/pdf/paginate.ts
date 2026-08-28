import 'server-only'

import type { PdfItem, PdfPage } from './model'

/**
 * A4 geometry in millimetres. The renderer uses exactly these numbers, so the
 * estimates here and the CSS cannot drift apart.
 */
export const PAGE = {
  width: 210,
  height: 297,
  paddingX: 17,
  // The top padding also houses the running header band, which sits absolutely
  // positioned above the flow. Changing it changes CONTENT_HEIGHT below.
  paddingTop: 22,
  paddingBottom: 20,
} as const

/** Usable content height on a sheet. */
export const CONTENT_HEIGHT = PAGE.height - PAGE.paddingTop - PAGE.paddingBottom
export const CONTENT_WIDTH = PAGE.width - PAGE.paddingX * 2

/** Height a section heading occupies, depending on which parts are present. */
export function headingHeight(heading: { title?: string; subtitle?: string; eyebrow?: string }): number {
  let height = 0
  if (heading.eyebrow) height += 7
  if (heading.title) height += Math.ceil(heading.title.length / 42) * 10 + 3
  if (heading.subtitle) height += Math.ceil(heading.subtitle.length / 78) * 5.4 + 3
  return height > 0 ? height + 8 : 0
}

export interface SectionPlan {
  key: string
  heading: { eyebrow?: string; title?: string; subtitle?: string }
  items: PdfItem[]
  /** Force this section to start on a fresh sheet. */
  startsNewPage: boolean
  /**
   * Sheet treatment. Every sheet is dark; 'feature' adds the brand wash used
   * for the sections that carry the pitch (reach figures, the offer).
   */
  tone?: 'base' | 'feature'
}

/**
 * Pack planned sections onto A4 sheets.
 *
 * Items are atomic: an item is never split across sheets, which is what keeps
 * benefit cards, KPI blocks and images from being cut in half. When a section
 * spills over, the heading repeats on the next sheet marked as a continuation.
 */
export function paginate(sections: SectionPlan[]): PdfPage[] {
  const pages: PdfPage[] = []
  let used = 0

  function openPage(heading: PdfPage['heading'] | undefined, tone: PdfPage['tone'], headingCost: number): PdfPage {
    const page: PdfPage = {
      id: `p${pages.length + 1}`,
      heading,
      items: [],
      tone,
      showFooter: true,
    }
    pages.push(page)
    used = headingCost
    return page
  }

  for (const section of sections) {
    const headingCost = headingHeight(section.heading)
    const tone = section.tone ?? 'base'
    const items = section.items.filter((item) => item.height > 0)
    if (items.length === 0) continue

    const firstItem = items[0]!
    const last = pages[pages.length - 1]

    // A compact section may share the sheet with the previous one, as long as
    // its heading and at least its first item still fit.
    // Tones are not compared here: every sheet shares the same dark base, so a
    // following section reads correctly on a feature sheet. The sheet keeps the
    // tone of the section that opened it.
    const canShare =
      last !== undefined &&
      !section.startsNewPage &&
      // The +12mm keeps a section from starting with just its heading and a
      // single card squeezed against the bottom edge of a sheet.
      used + headingCost + firstItem.height + 12 <= CONTENT_HEIGHT

    let page: PdfPage
    if (canShare && last) {
      page = last
      if (headingCost > 0) {
        page.items.push({
          height: headingCost,
          node: { kind: 'html', html: renderInlineHeading(section.heading) },
        })
        used += headingCost
      }
    } else {
      page = openPage({ ...section.heading }, tone, headingCost)
    }

    for (const item of items) {
      if (used + item.height > CONTENT_HEIGHT) {
        page = openPage({ ...section.heading, continued: true }, tone, headingCost)
      }
      page.items.push(item)
      used += item.height
    }
  }

  return pages
}

/**
 * Heading markup for a section that shares a sheet with the previous one.
 * Kept as raw HTML so the paginator stays free of JSX.
 */
function renderInlineHeading(heading: { eyebrow?: string; title?: string; subtitle?: string }): string {
  const parts: string[] = ['<div class="pdf-inline-heading">']
  if (heading.eyebrow) parts.push(`<p class="pdf-eyebrow">${escapeHtml(heading.eyebrow)}</p>`)
  if (heading.title) {
    parts.push(`<h2 class="pdf-h2">${escapeHtml(heading.title)}</h2>`)
    parts.push('<div class="pdf-rule"></div>')
  }
  if (heading.subtitle) parts.push(`<p class="pdf-sub">${escapeHtml(heading.subtitle)}</p>`)
  parts.push('</div>')
  return parts.join('')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Height estimates
//
// These are deliberately a little generous. Over-estimating costs at most some
// white space at the bottom of a sheet; under-estimating would clip content.
// ---------------------------------------------------------------------------

const CHARS_PER_LINE = 92
const LINE_HEIGHT = 5.6

/** Estimated height of a rich-text block, measured on its plain text. */
export function htmlHeight(html: string): number {
  if (!html) return 0
  const blocks = html.split(/<\/(?:p|h2|h3|h4|ul|ol|blockquote)>/i).filter((part) => part.trim())
  let height = 0
  for (const block of blocks) {
    const text = block.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!text) continue
    const isHeading = /<h[234]/i.test(block)
    const listItems = (block.match(/<li/gi) ?? []).length
    if (listItems > 0) {
      height += listItems * (LINE_HEIGHT + 1.4) + 3
      continue
    }
    const lines = Math.max(1, Math.ceil(text.length / (isHeading ? 55 : CHARS_PER_LINE)))
    height += isHeading ? lines * 7.5 + 3 : lines * LINE_HEIGHT + 3.5
  }
  return height + 2
}

export function textHeight(text: string, charsPerLine = CHARS_PER_LINE, lineHeight = LINE_HEIGHT): number {
  if (!text) return 0
  return Math.max(1, Math.ceil(text.length / charsPerLine)) * lineHeight
}

/** Height of a grid of cards: `rows × rowHeight` plus the gaps between them. */
export function gridHeight(count: number, columns: number, rowHeight: number, gap = 4): number {
  if (count <= 0) return 0
  const rows = Math.ceil(count / columns)
  return rows * rowHeight + (rows - 1) * gap
}

/**
 * Split a list into chunks that each fit the remaining budget of a sheet.
 * Used for benefit lists, galleries and tournament histories.
 */
export function chunkByHeight<T>(
  items: T[],
  columns: number,
  rowHeight: number,
  budget = CONTENT_HEIGHT * 0.75,
  gap = 4,
): T[][] {
  if (items.length === 0) return []
  // The default budget is deliberately below a full sheet. A single item that
  // claims the whole page leaves no slack for estimation error, and estimation
  // error on a full page is exactly what causes clipped content.
  const rowsPerChunk = Math.max(1, Math.floor((budget + gap) / (rowHeight + gap)))
  const perChunk = Math.max(1, rowsPerChunk * columns)
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += perChunk) {
    chunks.push(items.slice(index, index + perChunk))
  }
  return chunks
}
