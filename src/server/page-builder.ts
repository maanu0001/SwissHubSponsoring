import 'server-only'

import type { Prisma, SectionType, SupportType } from '@prisma/client'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { formatAmount } from '@/lib/format'
import { sanitizeRichText } from '@/lib/sanitize'
import { parseSectionData, type SectionData } from '@/lib/section-data'
import { defaultVisibilityFor, type SectionVisibility } from '@/lib/pdf-sections'
import { uniqueSlug } from '@/lib/slug'

/** Shape a template stores in `structure`. */
const templateStructureSchema = z.object({
  sections: z
    .array(
      z.object({
        type: z.string(),
        title: z.string().optional().default(''),
        subtitle: z.string().optional().default(''),
        content: z.string().optional().default(''),
        data: z.unknown().optional(),
        order: z.number().optional(),
        // Older blueprints only carry `visible`; it seeds the web channel and
        // the PDF channels fall back to the per-type defaults.
        visible: z.boolean().optional(),
        visibleOnWeb: z.boolean().optional(),
        visibleInShortPdf: z.boolean().optional(),
        visibleInFullPdf: z.boolean().optional(),
        pdfOrder: z.number().nullable().optional(),
      }),
    )
    .default([]),
})

const VALID_SECTION_TYPES = new Set<string>([
  'HERO', 'PERSONAL_INTRO', 'WHY_PARTNERSHIP', 'TOURNAMENT', 'REACH', 'SPONSORING_PROPOSAL',
  'BENEFITS', 'BUDGET_USAGE', 'VISION', 'ABOUT_SWISSHUB', 'TOURNAMENT_HISTORY', 'PAST_PARTNERS',
  'TWITCH_VOD', 'SOCIAL_PROOF', 'CTA', 'CUSTOM_TEXT', 'GALLERY', 'STATS', 'PROCESS', 'CONTACT', 'RICH_TEXT',
])

export interface TemplateSection {
  type: SectionType
  title: string
  subtitle: string
  content: string
  data: SectionData
  order: number
  visibility: SectionVisibility
  pdfOrder: number | null
}

/** Parse a stored template structure, skipping anything unusable. */
export function parseTemplateStructure(structure: unknown): TemplateSection[] {
  const parsed = templateStructureSchema.safeParse(structure)
  if (!parsed.success) return []

  return parsed.data.sections
    .filter((section) => VALID_SECTION_TYPES.has(section.type))
    .map((section, index) => {
      const type = section.type as SectionType
      const defaults = defaultVisibilityFor(type)
      return {
        type,
        title: section.title ?? '',
        subtitle: section.subtitle ?? '',
        content: sanitizeRichText(section.content ?? ''),
        data: parseSectionData(section.data),
        order: section.order ?? (index + 1) * 10,
        visibility: {
          web: section.visibleOnWeb ?? section.visible ?? defaults.web,
          shortPdf: section.visibleInShortPdf ?? defaults.shortPdf,
          fullPdf: section.visibleInFullPdf ?? defaults.fullPdf,
        },
        pdfOrder: section.pdfOrder ?? null,
      }
    })
    .sort((a, b) => a.order - b.order)
}

export interface GeneratePageInput {
  sponsorId: string
  templateId?: string | null
  tournamentId?: string | null
  title?: string
  subtitle?: string
  slug?: string
  requestedSupportType: SupportType
  requestedAmount?: number | null
  requestedSupportText?: string | null
  currency?: string
  benefitIds: string[]
  heroImageId?: string | null
}

export interface GeneratedPage {
  id: string
  slug: string
}

/** Dative forms – these are inserted after "mit …" in the generated sentence. */
const SUPPORT_LABEL: Record<SupportType, string> = {
  MONEY: 'einem finanziellen Beitrag',
  PRIZES: 'Sachpreisen',
  GAME_KEYS: 'Game Keys',
  HARDWARE: 'Hardware',
  SERVICES: 'Dienstleistungen',
  COMBINATION: 'einer Kombination aus Budget und Sachleistungen',
  OTHER: 'einer individuellen Unterstützung',
}


/**
 * Build the proposal text shown in the SPONSORING_PROPOSAL section.
 * It is written into the section so the admin can freely edit it afterwards –
 * nothing here is recomputed on render.
 */
function proposalContent(input: GeneratePageInput, sponsorName: string, tournamentTitle: string | null): string {
  const amount = input.requestedAmount ? formatAmount(input.requestedAmount, input.currency ?? 'CHF') : null
  const target = tournamentTitle ? `unser Turnier „${tournamentTitle}“` : 'ein kommendes SwissHub-Turnier'

  const parts: string[] = []
  if (amount && (input.requestedSupportType === 'MONEY' || input.requestedSupportType === 'COMBINATION')) {
    parts.push(
      `<p>Wir würden uns freuen, wenn ${sponsorName} ${target} mit <strong>${amount}</strong> unterstützt.</p>`,
    )
  } else if (amount) {
    parts.push(
      `<p>Wir würden uns freuen, wenn ${sponsorName} ${target} mit ${SUPPORT_LABEL[input.requestedSupportType]} im Gegenwert von <strong>${amount}</strong> unterstützt.</p>`,
    )
  } else {
    parts.push(
      `<p>Wir würden uns freuen, wenn ${sponsorName} ${target} mit ${SUPPORT_LABEL[input.requestedSupportType]} unterstützt.</p>`,
    )
  }

  // `requestedSupportText` is deliberately not repeated here: both the web page
  // and the PDF render it in the highlighted proposal card, and duplicating it
  // in the body text made the section read twice.

  parts.push(
    '<p>Selbstverständlich ist das ein Vorschlag und kein fixes Paket – Umfang und Leistungen stellen wir gerne gemeinsam mit Ihnen zusammen.</p>',
  )

  return sanitizeRichText(parts.join(''))
}


/**
 * Create a fully populated, immediately editable sponsor page from a template.
 * The template only supplies starting values – afterwards the page is
 * completely independent of it.
 */
export async function generateSponsorPage(input: GeneratePageInput): Promise<GeneratedPage> {
  const sponsor = await prisma.sponsor.findUnique({ where: { id: input.sponsorId } })
  if (!sponsor) throw new Error('Der ausgewählte Sponsor existiert nicht mehr.')

  const tournament = input.tournamentId
    ? await prisma.tournament.findUnique({ where: { id: input.tournamentId } })
    : null

  const template = input.templateId
    ? await prisma.pageTemplate.findUnique({ where: { id: input.templateId } })
    : null

  const sections = template ? parseTemplateStructure(template.structure) : []

  const slug = await uniqueSlug(input.slug || sponsor.slug || sponsor.companyName, async (candidate) => {
    const existing = await prisma.sponsorPage.findUnique({ where: { slug: candidate }, select: { id: true } })
    return Boolean(existing)
  })

  const title = input.title?.trim() || `SwissHub × ${sponsor.companyName}`
  const subtitle = input.subtitle?.trim() || 'Gemeinsam bringen wir die Schweizer Gaming-Community zusammen.'

  // Resolve the benefit list, keeping the catalogue order stable.
  const benefits = input.benefitIds.length
    ? await prisma.sponsoringBenefit.findMany({
        where: { id: { in: input.benefitIds } },
        orderBy: { order: 'asc' },
        select: { id: true },
      })
    : []

  const page = await prisma.sponsorPage.create({
    data: {
      sponsorId: sponsor.id,
      tournamentId: tournament?.id ?? null,
      templateId: template?.id ?? null,
      slug,
      title,
      subtitle,
      status: 'DRAFT',
      visibility: 'PUBLIC',
      requestedSupportType: input.requestedSupportType,
      requestedAmount: input.requestedAmount ?? null,
      requestedSupportText: input.requestedSupportText ?? null,
      currency: input.currency || 'CHF',
      heroImageId: input.heroImageId || null,
      benefits: {
        create: benefits.map((benefit, index) => ({
          benefitId: benefit.id,
          order: (index + 1) * 10,
          visible: true,
        })),
      },
      sections: {
        create: sections.map((section, index) => {
          const data: SectionData = { ...section.data }

          // Pre-fill the sections that depend on the wizard input.
          if (section.type === 'TOURNAMENT' && tournament) {
            data.tournamentIds = [tournament.id]
          }
          if (section.type === 'HERO') {
            data.hero = { ...(data.hero ?? {}) }
          }

          const content =
            section.type === 'SPONSORING_PROPOSAL' && !section.content
              ? proposalContent(input, sponsor.companyName, tournament?.title ?? null)
              : section.content

          const resolvedTitle =
            section.type === 'HERO' && !section.title ? title : section.title

          const resolvedSubtitle =
            section.type === 'HERO' && !section.subtitle ? subtitle : section.subtitle

          return {
            type: section.type,
            title: resolvedTitle || null,
            subtitle: resolvedSubtitle || null,
            content: content || null,
            data: data as Prisma.InputJsonValue,
            order: (index + 1) * 10,
            visibleOnWeb: section.visibility.web,
            visibleInShortPdf: section.visibility.shortPdf,
            visibleInFullPdf: section.visibility.fullPdf,
            pdfOrder: section.pdfOrder,
          }
        }),
      },
    },
    select: { id: true, slug: true },
  })

  return page
}

/** Benefits preselected by a template, used to initialise the wizard. */
export async function templateDefaultBenefitIds(templateId: string): Promise<string[]> {
  const rows = await prisma.pageTemplateBenefit.findMany({
    where: { templateId },
    orderBy: { order: 'asc' },
    select: { benefitId: true },
  })
  return rows.map((row) => row.benefitId)
}
