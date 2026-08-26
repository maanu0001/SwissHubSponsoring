import type { SectionType } from '@prisma/client'

/**
 * Which output channels a section is shown in.
 * Every sponsor page section carries this triple; the public main page only
 * uses `web`.
 */
export interface SectionVisibility {
  web: boolean
  shortPdf: boolean
  fullPdf: boolean
}

export const PDF_MODES = ['short', 'full'] as const
export type PdfMode = (typeof PDF_MODES)[number]

export const PDF_MODE_LABELS: Record<PdfMode, { label: string; description: string }> = {
  short: {
    label: 'Kurzpräsentation',
    description: 'Kompakter Pitch für die Erstansprache – rund 5 bis 7 Seiten.',
  },
  full: {
    label: 'Vollständiges Dossier',
    description: 'Ausführliche Partnerschaftspräsentation für Firmen mit konkretem Interesse.',
  },
}

/**
 * Starting point for each section kind.
 *
 * The short pitch carries only the core narrative – who SwissHub is, which
 * audience it reaches, what the tournament is, why this company, what is being
 * asked for and what it gets in return. Everything that adds depth rather than
 * argument defaults to the full dossier only.
 */
export const SECTION_PDF_DEFAULTS: Record<SectionType, { shortPdf: boolean; fullPdf: boolean }> = {
  HERO: { shortPdf: true, fullPdf: true },
  PERSONAL_INTRO: { shortPdf: true, fullPdf: true },
  WHY_PARTNERSHIP: { shortPdf: true, fullPdf: true },
  TOURNAMENT: { shortPdf: true, fullPdf: true },
  REACH: { shortPdf: true, fullPdf: true },
  SPONSORING_PROPOSAL: { shortPdf: true, fullPdf: true },
  BENEFITS: { shortPdf: true, fullPdf: true },
  ABOUT_SWISSHUB: { shortPdf: true, fullPdf: true },
  VISION: { shortPdf: true, fullPdf: true },
  CTA: { shortPdf: true, fullPdf: true },
  CONTACT: { shortPdf: true, fullPdf: true },

  // Depth, not argument – dossier only by default.
  BUDGET_USAGE: { shortPdf: false, fullPdf: true },
  TOURNAMENT_HISTORY: { shortPdf: false, fullPdf: true },
  PAST_PARTNERS: { shortPdf: false, fullPdf: true },
  TWITCH_VOD: { shortPdf: false, fullPdf: true },
  SOCIAL_PROOF: { shortPdf: false, fullPdf: true },
  PROCESS: { shortPdf: false, fullPdf: true },
  STATS: { shortPdf: false, fullPdf: true },
  CUSTOM_TEXT: { shortPdf: false, fullPdf: true },
  RICH_TEXT: { shortPdf: false, fullPdf: true },
  // Galleries are great online and bulky in a short pitch.
  GALLERY: { shortPdf: false, fullPdf: true },
}

export function defaultVisibilityFor(type: SectionType): SectionVisibility {
  const defaults = SECTION_PDF_DEFAULTS[type] ?? { shortPdf: true, fullPdf: true }
  return { web: true, shortPdf: defaults.shortPdf, fullPdf: defaults.fullPdf }
}

/** Reads a visibility triple off a database row or template blueprint entry. */
export function visibilityOf(section: {
  visibleOnWeb?: boolean | null
  visibleInShortPdf?: boolean | null
  visibleInFullPdf?: boolean | null
}): SectionVisibility {
  return {
    web: section.visibleOnWeb !== false,
    shortPdf: section.visibleInShortPdf !== false,
    fullPdf: section.visibleInFullPdf !== false,
  }
}

export function isVisibleIn(visibility: SectionVisibility, mode: PdfMode): boolean {
  return mode === 'short' ? visibility.shortPdf : visibility.fullPdf
}

/** Short, human readable summary for the section header in the editor. */
export function visibilitySummary(visibility: SectionVisibility): string {
  const active: string[] = []
  if (visibility.web) active.push('Web')
  if (visibility.shortPdf) active.push('Kurz')
  if (visibility.fullPdf) active.push('Dossier')
  return active.length === 0 ? 'Nirgends sichtbar' : active.join(' · ')
}
