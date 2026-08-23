import 'server-only'

import { cache } from 'react'
import type { Media } from '@prisma/client'

import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { parseSectionData } from '@/lib/section-data'
import { sanitizeRichText } from '@/lib/sanitize'
import { getSettings } from '@/lib/settings'
import type { RenderContext, RenderPartner, RenderSection, RenderTournament } from '@/lib/render-context'

/** Hostname the Twitch player requires as `parent`. */
function embedParent(): string {
  try {
    return new URL(env.appUrl).hostname
  } catch {
    return 'localhost'
  }
}

const tournamentSelect = {
  id: true,
  title: true,
  game: true,
  description: true,
  startDate: true,
  endDate: true,
  format: true,
  participantCount: true,
  expectedParticipantCount: true,
  streamViewerCount: true,
  status: true,
  twitchUrl: true,
  vodUrl: true,
  heroImage: true,
  media: { orderBy: { order: 'asc' as const }, include: { mediaItem: true } },
} as const

/** Tournaments shown publicly – archived ones are always excluded. */
export const publicTournaments = cache(async (): Promise<RenderTournament[]> => {
  const rows = await prisma.tournament.findMany({
    where: { status: { not: 'ARCHIVED' }, featured: true },
    orderBy: [{ order: 'asc' }, { startDate: 'desc' }],
    select: tournamentSelect,
  })

  return rows.map((row) => ({
    ...row,
    gallery: row.media.map((entry) => entry.mediaItem),
  }))
})

/** Tournaments referenced by a specific page, regardless of the featured flag. */
export async function tournamentsByIds(ids: string[]): Promise<RenderTournament[]> {
  if (ids.length === 0) return []
  const rows = await prisma.tournament.findMany({
    where: { id: { in: ids } },
    select: tournamentSelect,
  })
  return rows.map((row) => ({ ...row, gallery: row.media.map((entry) => entry.mediaItem) }))
}

export const publicPartners = cache(async (): Promise<RenderPartner[]> => {
  const rows = await prisma.partnerReference.findMany({
    where: { visible: true },
    orderBy: { order: 'asc' },
    include: { logo: true },
  })
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    website: row.website,
    description: row.description,
    logo: row.logo,
  }))
})

/** Media referenced by the gallery sections of a page. */
export async function galleryMediaFor(sections: RenderSection[]): Promise<Media[]> {
  const ids = new Set<string>()
  for (const section of sections) {
    for (const item of section.data.gallery ?? []) {
      if (item.mediaId) ids.add(item.mediaId)
    }
  }
  if (ids.size === 0) return []
  return prisma.media.findMany({ where: { id: { in: [...ids] } } })
}

export interface SectionInput {
  id: string
  type: RenderSection['type']
  title: string | null
  subtitle: string | null
  content: string | null
  data: unknown
  visible: boolean
  order: number
}

/**
 * Normalise stored sections for rendering.
 * Content is sanitised again here so even data written directly into the
 * database can never inject markup into a public page.
 */
export function toRenderSections(sections: SectionInput[], includeHidden = false): RenderSection[] {
  return sections
    .filter((section) => includeHidden || section.visible)
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      id: section.id,
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      content: section.content ? sanitizeRichText(section.content) : null,
      data: parseSectionData(section.data),
      visible: section.visible,
      order: section.order,
    }))
}

/** Brand and contact details shared by every public surface. */
export const renderChrome = cache(async () => {
  const settings = await getSettings()
  const logoId = settings['brand.logoMediaId']
  const logo = logoId ? await prisma.media.findUnique({ where: { id: logoId } }).catch(() => null) : null

  return {
    brand: { name: settings['brand.name'] || 'SwissHub', logo },
    contact: {
      email: settings['contact.email'] || '',
      website: settings['contact.websiteUrl'] || '',
      discord: settings['contact.discordUrl'] || '',
      instagram: settings['contact.instagramUrl'] || '',
      twitch: settings['contact.twitchUrl'] || '',
      sponsorPageNote: settings['contact.sponsorPageNote'] || '',
    },
    settings,
  }
})

export interface BuildContextInput {
  sections: RenderSection[]
  benefits: RenderContext['benefits']
  sponsor: RenderContext['sponsor']
  page: RenderContext['page']
  /** Tournaments to make available in addition to the public ones. */
  extraTournaments?: RenderTournament[]
}

export async function buildRenderContext(input: BuildContextInput): Promise<RenderContext> {
  const [chrome, tournaments, partners] = await Promise.all([
    renderChrome(),
    publicTournaments(),
    publicPartners(),
  ])

  const merged = new Map<string, RenderTournament>()
  for (const tournament of [...tournaments, ...(input.extraTournaments ?? [])]) {
    merged.set(tournament.id, tournament)
  }

  return {
    sections: input.sections,
    benefits: input.benefits,
    tournaments: [...merged.values()],
    partners,
    sponsor: input.sponsor,
    page: input.page,
    brand: chrome.brand,
    contact: chrome.contact,
    embedParent: embedParent(),
  }
}
