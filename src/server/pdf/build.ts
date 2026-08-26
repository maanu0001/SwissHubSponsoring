import 'server-only'

import type { Media, SectionType } from '@prisma/client'

import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { formatAmount, formatDateRange, formatNumber } from '@/lib/format'
import { SUPPORT_TYPE, TOURNAMENT_STATUS } from '@/lib/labels'
import { isSafeExternalUrl, mediaAlt, mediaUrl } from '@/lib/media'
import { isVisibleIn, visibilityOf, type PdfMode } from '@/lib/pdf-sections'
import type { PdfRenderOptions } from '@/lib/pdf-token'
import { sanitizeRichText, toPlainText } from '@/lib/sanitize'
import { parseSectionData, type SectionData } from '@/lib/section-data'
import { isHexColor } from '@/lib/color'
import { getSettings, settingDefault } from '@/lib/settings'
import { publicPartners, renderChrome, tournamentsByIds } from '@/server/render'

import type {
  PdfClosing,
  PdfCover,
  PdfDocumentModel,
  PdfItem,
  PdfPartner,
  PdfTournament,
} from './model'
import {
  chunkByHeight,
  gridHeight,
  htmlHeight,
  paginate,
  textHeight,
  type SectionPlan,
} from './paginate'
import { qrSvg } from './qr'

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/** Sections that never become their own content page – they feed cover/closing. */
const COVER_SECTIONS: SectionType[] = ['HERO']
const CLOSING_SECTIONS: SectionType[] = ['CTA', 'CONTACT']

export class PdfBuildError extends Error {}

export async function buildPdfDocument(
  pageId: string,
  mode: PdfMode,
  options: PdfRenderOptions,
): Promise<PdfDocumentModel> {
  const page = await prisma.sponsorPage.findUnique({
    where: { id: pageId },
    include: {
      sponsor: { include: { logo: true } },
      heroImage: true,
      tournament: { include: { heroImage: true } },
      sections: { orderBy: { order: 'asc' } },
      benefits: {
        where: { visible: true },
        orderBy: { order: 'asc' },
        include: { benefit: true },
      },
    },
  })

  if (!page) throw new PdfBuildError('Diese Sponsorenseite existiert nicht mehr.')

  const [settings, chrome, partners] = await Promise.all([getSettings(), renderChrome(), publicPartners()])

  // Sections for this export, in PDF order.
  const sections = page.sections
    .filter((section) => isVisibleIn(visibilityOf(section), mode))
    .map((section) => ({
      ...section,
      parsed: parseSectionData(section.data),
      effectiveOrder: section.pdfOrder ?? section.order,
    }))
    .sort((a, b) => a.effectiveOrder - b.effectiveOrder)

  // Tournaments referenced anywhere in this export.
  const tournamentIds = new Set<string>()
  if (page.tournamentId) tournamentIds.add(page.tournamentId)
  for (const section of sections) {
    for (const id of section.parsed.tournamentIds ?? []) tournamentIds.add(id)
  }
  const tournaments = await tournamentsByIds([...tournamentIds])
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]))

  // Gallery media.
  const galleryIds = new Set<string>()
  for (const section of sections) {
    for (const item of section.parsed.gallery ?? []) if (item.mediaId) galleryIds.add(item.mediaId)
  }
  const galleryMedia = galleryIds.size
    ? await prisma.media.findMany({ where: { id: { in: [...galleryIds] } } })
    : []
  const galleryById = new Map(galleryMedia.map((media) => [media.id, media]))

  const benefits = page.benefits.map((entry) => ({
    id: entry.id,
    title: entry.customTitle || entry.benefit.title,
    description: entry.customDescription || entry.benefit.description,
    category: entry.benefit.category,
  }))

  const sponsorName = page.sponsor.companyName
  const brandName = settings['brand.name'] || 'SwissHub'
  const contactEmail = settings['contact.email'] || ''
  const websiteUrl = settings['contact.websiteUrl'] || ''

  const primary = isHexColor(settings['brand.primaryColor'] ?? '')
    ? (settings['brand.primaryColor'] as string)
    : settingDefault('brand.primaryColor')
  const accent = isHexColor(settings['brand.secondaryColor'] ?? '')
    ? (settings['brand.secondaryColor'] as string)
    : settingDefault('brand.secondaryColor')

  const primaryTournament = page.tournamentId ? tournamentById.get(page.tournamentId) : undefined
  const heroSection = sections.find((section) => section.type === 'HERO')

  // --- cover -------------------------------------------------------------
  const cover: PdfCover = {
    brandLogoUrl: absolute(mediaUrl(chrome.brand.logo)),
    brandName,
    sponsorLogoUrl: absolute(mediaUrl(page.sponsor.logo)),
    sponsorName,
    title: heroSection?.title || page.title,
    subtitle: heroSection?.subtitle || page.subtitle,
    tournamentTitle: primaryTournament?.title ?? null,
    tournamentDates: primaryTournament
      ? formatDateRange(primaryTournament.startDate, primaryTournament.endDate) || null
      : null,
    kicker: 'Partnerschaftsvorschlag',
    heroImageUrl: absolute(mediaUrl(page.heroImage)) ?? absolute(mediaUrl(primaryTournament?.heroImage ?? null)),
  }

  // --- content sections --------------------------------------------------
  const plans: SectionPlan[] = []

  for (const section of sections) {
    if (COVER_SECTIONS.includes(section.type)) continue
    if (CLOSING_SECTIONS.includes(section.type)) continue

    const plan = planSection({
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      content: section.content,
      data: section.parsed,
      key: section.id,
      mode,
      benefits,
      tournamentById,
      allTournaments: tournaments,
      partners,
      galleryById,
      page: {
        currency: page.currency,
        amount: page.requestedAmount ? Number(page.requestedAmount) : null,
        supportType: page.requestedSupportType,
        supportText: page.requestedSupportText,
        tournamentId: page.tournamentId,
      },
      sponsorName,
    })

    if (plan && plan.items.length > 0) plans.push(plan)
  }

  const pages = paginate(plans)

  // --- closing -----------------------------------------------------------
  const closingSection = sections.find((section) => CLOSING_SECTIONS.includes(section.type))
  const publicUrl = `${env.appUrl}/partner/${page.slug}`
  // A draft has no working public link, so the QR code is suppressed there.
  const qrEligible = options.qr && page.status === 'PUBLISHED'
  const qr = qrEligible ? await qrSvg(publicUrl, { size: 320 }) : null

  const closing: PdfClosing = {
    title: closingSection?.title || 'Gemeinsam mehr erreichen.',
    html: closingSection?.content ? sanitizeRichText(closingSection.content) : null,
    contactEmail: closingSection?.parsed.contactEmail || contactEmail,
    website: websiteUrl || null,
    pageUrl: qrEligible ? publicUrl : null,
    qr,
    qrCaption: 'Digitale Präsentation öffnen',
    note: closingSection?.parsed.contactNote ?? settings['contact.sponsorPageNote'] ?? null,
  }

  const now = new Date()
  const dateLabel = options.date ? `Stand: ${MONTHS[now.getMonth()]} ${now.getFullYear()}` : null

  return {
    cover,
    pages,
    closing,
    meta: {
      title: `${brandName} × ${sponsorName} – Partnerschaftsvorschlag`,
      author: brandName,
      subject: 'Sponsoring Partnership',
      creator: `${brandName} Sponsoring`,
      sponsorName,
      tournamentTitle: primaryTournament?.title ?? null,
      dateLabel,
      showPageNumbers: options.pageNumbers,
      mode,
    },
    brand: { primary, accent },
    referencedMedia: [
      ...galleryMedia,
      ...(page.sponsor.logo ? [page.sponsor.logo] : []),
      ...(page.heroImage ? [page.heroImage] : []),
      ...(chrome.brand.logo ? [chrome.brand.logo] : []),
    ],
  }
}

/** Media URLs must be absolute for the headless browser fetching them. */
function absolute(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return isSafeExternalUrl(url) ? url : null
  }
  return `${env.appUrl}${url}`
}

interface PlanContext {
  type: SectionType
  title: string | null
  subtitle: string | null
  content: string | null
  data: SectionData
  key: string
  mode: PdfMode
  benefits: { id: string; title: string; description: string | null; category: string }[]
  tournamentById: Map<string, Awaited<ReturnType<typeof tournamentsByIds>>[number]>
  allTournaments: Awaited<ReturnType<typeof tournamentsByIds>>
  partners: Awaited<ReturnType<typeof publicPartners>>
  galleryById: Map<string, Media>
  page: {
    currency: string
    amount: number | null
    supportType: keyof typeof SUPPORT_TYPE
    supportText: string | null
    tournamentId: string | null
  }
  sponsorName: string
}

/**
 * Turn one section into a plan of atomic, measured items.
 * Returns null when the section has nothing to show in this export.
 */
function planSection(context: PlanContext): SectionPlan | null {
  const { type, data, mode } = context
  const items: PdfItem[] = []

  const heading = {
    eyebrow: data.eyebrow || undefined,
    title: context.title || undefined,
    subtitle: context.subtitle || undefined,
  }

  const richText = context.content ? sanitizeRichText(context.content) : ''
  if (richText) {
    items.push({ height: htmlHeight(richText), node: { kind: 'html', html: richText } })
  }

  switch (type) {
    case 'REACH':
    case 'STATS':
    case 'ABOUT_SWISSHUB': {
      const stats = (data.stats ?? []).filter((stat) => stat.value.trim() || stat.label.trim())
      const columns = Math.min(3, Math.max(2, data.columns ?? 3))
      for (const chunk of chunkByHeight(stats, columns, 30)) {
        items.push({
          height: gridHeight(chunk.length, columns, 30),
          node: { kind: 'stats', items: chunk, columns },
        })
      }
      break
    }

    case 'VISION':
    case 'WHY_PARTNERSHIP':
    case 'CUSTOM_TEXT': {
      const bullets = (data.bullets ?? []).filter((b) => b.title.trim() || b.description.trim())
      for (const chunk of chunkByHeight(bullets, 2, 28)) {
        items.push({ height: gridHeight(chunk.length, 2, 28), node: { kind: 'bullets', items: chunk } })
      }
      break
    }

    case 'TOURNAMENT': {
      const ids = data.tournamentIds ?? (context.page.tournamentId ? [context.page.tournamentId] : [])
      const tournament = ids.map((id) => context.tournamentById.get(id)).find(Boolean)
      if (tournament) {
        const detail = toPdfTournament(tournament)
        items.unshift({ height: detail.imageUrl ? 96 : 58, node: { kind: 'tournamentDetail', tournament: detail } })
      }
      const stats = (data.stats ?? []).filter((stat) => stat.value.trim() || stat.label.trim())
      for (const chunk of chunkByHeight(stats, 3, 30)) {
        items.push({ height: gridHeight(chunk.length, 3, 30), node: { kind: 'stats', items: chunk, columns: 3 } })
      }
      break
    }

    case 'TOURNAMENT_HISTORY': {
      const ids = data.tournamentIds ?? []
      const list = ids.length > 0
        ? ids.map((id) => context.tournamentById.get(id)).filter(Boolean)
        : context.allTournaments
      const mapped = (list as typeof context.allTournaments).map(toPdfTournament)
      const rowHeight = 46
      for (const chunk of chunkByHeight(mapped, 2, rowHeight)) {
        items.push({
          height: gridHeight(chunk.length, 2, rowHeight),
          node: { kind: 'tournamentCards', items: chunk },
        })
      }
      break
    }

    case 'SPONSORING_PROPOSAL': {
      const amount = context.page.amount
        ? formatAmount(context.page.amount, context.page.currency)
        : null
      if (data.showAmount !== false && (amount || context.page.supportText)) {
        const supportText = context.page.supportText
        // The offer is the page's anchor, so it goes above the explanatory text.
        items.unshift({
          height: 44 + (supportText ? textHeight(supportText, 70, 5.4) : 0),
          node: {
            kind: 'proposal',
            proposal: {
              amount,
              supportTypeLabel: SUPPORT_TYPE[context.page.supportType].label,
              supportText,
              currency: context.page.currency,
            },
          },
        })
      }
      const bullets = (data.bullets ?? []).filter((b) => b.title.trim() || b.description.trim())
      for (const chunk of chunkByHeight(bullets, 2, 28)) {
        items.push({ height: gridHeight(chunk.length, 2, 28), node: { kind: 'bullets', items: chunk } })
      }
      break
    }

    case 'BENEFITS': {
      if (context.benefits.length === 0) break
      // The short pitch lists benefits flat; the dossier groups them by category.
      if (mode === 'short') {
        const rowHeight = 21
        for (const chunk of chunkByHeight(context.benefits, 2, rowHeight)) {
          items.push({
            height: gridHeight(chunk.length, 2, rowHeight),
            node: { kind: 'benefits', category: null, items: chunk },
          })
        }
      } else {
        const groups = new Map<string, typeof context.benefits>()
        for (const benefit of context.benefits) {
          const list = groups.get(benefit.category) ?? []
          list.push(benefit)
          groups.set(benefit.category, list)
        }
        for (const [category, list] of groups) {
          const rowHeight = 22
          const chunks = chunkByHeight(list, 2, rowHeight)
          chunks.forEach((chunk, index) => {
            items.push({
              height: gridHeight(chunk.length, 2, rowHeight) + (index === 0 ? 11 : 0),
              node: { kind: 'benefits', category: index === 0 ? category : null, items: chunk },
            })
          })
        }
      }
      break
    }

    case 'BUDGET_USAGE': {
      const budget = (data.budget ?? []).filter((entry) => entry.title.trim() || entry.description.trim())
      for (const chunk of chunkByHeight(budget, 2, 27)) {
        items.push({ height: gridHeight(chunk.length, 2, 27), node: { kind: 'budget', items: chunk } })
      }
      break
    }

    case 'PROCESS': {
      const steps = (data.steps ?? []).filter((step) => step.title.trim() || step.label.trim())
      for (const chunk of chunkByHeight(steps, 1, 24)) {
        items.push({ height: gridHeight(chunk.length, 1, 24), node: { kind: 'steps', items: chunk } })
      }
      break
    }

    case 'SOCIAL_PROOF': {
      const quotes = (data.quotes ?? []).filter((quote) => quote.quote.trim())
      for (const chunk of chunkByHeight(quotes, 1, 34)) {
        items.push({ height: gridHeight(chunk.length, 1, 34), node: { kind: 'quotes', items: chunk } })
      }
      break
    }

    case 'PAST_PARTNERS': {
      const ids = data.partnerIds ?? []
      const selected = ids.length > 0
        ? context.partners.filter((partner) => ids.includes(partner.id))
        : context.partners
      const mapped: PdfPartner[] = selected.map((partner) => ({
        name: partner.name,
        description: partner.description,
        website: partner.website,
        logoUrl: absolute(mediaUrl(partner.logo)),
      }))
      for (const chunk of chunkByHeight(mapped, 3, 40)) {
        items.push({ height: gridHeight(chunk.length, 3, 40), node: { kind: 'partners', items: chunk } })
      }
      break
    }

    case 'GALLERY': {
      const gallery = (data.gallery ?? [])
        .map((entry) => {
          const media = context.galleryById.get(entry.mediaId)
          const url = absolute(mediaUrl(media))
          return url ? { url, alt: mediaAlt(media, entry.caption), caption: entry.caption } : null
        })
        .filter((entry): entry is { url: string; alt: string; caption: string } => Boolean(entry))
      for (const chunk of chunkByHeight(gallery, 2, 62)) {
        items.push({ height: gridHeight(chunk.length, 2, 62), node: { kind: 'gallery', items: chunk } })
      }
      break
    }

    case 'TWITCH_VOD': {
      const links = (data.links ?? []).filter((link) => link.url.trim() && isSafeExternalUrl(link.url))
      const fallback: typeof links = []
      if (links.length === 0) {
        for (const tournament of context.allTournaments) {
          if (tournament.twitchUrl) {
            fallback.push({ label: `${tournament.title} – Twitch`, url: tournament.twitchUrl, description: '' })
          }
          if (tournament.vodUrl) {
            fallback.push({ label: `${tournament.title} – Aufzeichnung`, url: tournament.vodUrl, description: '' })
          }
        }
      }
      const resolved = (links.length > 0 ? links : fallback).slice(0, 8)
      for (const chunk of chunkByHeight(resolved, 1, 20)) {
        items.push({
          height: gridHeight(chunk.length, 1, 20),
          node: { kind: 'links', items: chunk.map((link) => ({ ...link, qr: null })) },
        })
      }
      break
    }

    default:
      break
  }

  if (items.length === 0) return null

  return {
    key: context.key,
    heading,
    items,
    // Sections are packed onto sheets in both modes. Forcing a page break per
    // section produced dossier pages that were only a third full, which reads
    // as padding rather than substance. The dossier is longer because it
    // carries more sections, not because each one sits alone on a sheet.
    startsNewPage: false,
  }
}

function toPdfTournament(tournament: Awaited<ReturnType<typeof tournamentsByIds>>[number]): PdfTournament {
  const participants = tournament.participantCount ?? tournament.expectedParticipantCount
  return {
    title: tournament.title,
    game: tournament.game,
    description: tournament.description ? toPlainText(tournament.description, 320) : null,
    dateRange: formatDateRange(tournament.startDate, tournament.endDate),
    format: tournament.format,
    participants: participants ? formatNumber(participants) : null,
    participantsLabel: tournament.participantCount ? 'Teilnehmende' : 'Erwartete Teilnehmende',
    viewers: tournament.streamViewerCount ? formatNumber(tournament.streamViewerCount) : null,
    status: TOURNAMENT_STATUS[tournament.status].label,
    imageUrl: absolute(mediaUrl(tournament.heroImage)),
    twitchUrl: tournament.twitchUrl,
    vodUrl: tournament.vodUrl,
  }
}
