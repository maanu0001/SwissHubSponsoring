import { z } from 'zod'
import type { SectionType } from '@prisma/client'

/**
 * Every section stores its structured payload in `data`. The shapes are
 * validated on write and parsed defensively on read, so an older payload can
 * never crash a public page.
 */

export const statItemSchema = z.object({
  value: z.string().max(40).default(''),
  label: z.string().max(120).default(''),
  hint: z.string().max(200).default(''),
  /** Numeric target for the count-up animation; derived when omitted. */
  numeric: z.number().nullable().default(null),
  prefix: z.string().max(8).default(''),
  suffix: z.string().max(8).default(''),
})
export type StatItem = z.infer<typeof statItemSchema>

export const bulletItemSchema = z.object({
  title: z.string().max(160).default(''),
  description: z.string().max(600).default(''),
  icon: z.string().max(40).default(''),
})
export type BulletItem = z.infer<typeof bulletItemSchema>

export const budgetItemSchema = z.object({
  title: z.string().max(160).default(''),
  description: z.string().max(600).default(''),
  /** Optional share in percent, only rendered when > 0. */
  share: z.number().min(0).max(100).nullable().default(null),
})
export type BudgetItem = z.infer<typeof budgetItemSchema>

export const processStepSchema = z.object({
  label: z.string().max(60).default(''),
  title: z.string().max(160).default(''),
  description: z.string().max(600).default(''),
})
export type ProcessStep = z.infer<typeof processStepSchema>

export const quoteItemSchema = z.object({
  quote: z.string().max(1000).default(''),
  author: z.string().max(120).default(''),
  role: z.string().max(160).default(''),
})
export type QuoteItem = z.infer<typeof quoteItemSchema>

export const galleryItemSchema = z.object({
  mediaId: z.string().max(60).default(''),
  caption: z.string().max(240).default(''),
})
export type GalleryItem = z.infer<typeof galleryItemSchema>

export const linkItemSchema = z.object({
  label: z.string().max(120).default(''),
  url: z.string().max(600).default(''),
  description: z.string().max(400).default(''),
})
export type LinkItem = z.infer<typeof linkItemSchema>

export const ctaSchema = z.object({
  primaryLabel: z.string().max(80).default(''),
  primaryHref: z.string().max(600).default(''),
  secondaryLabel: z.string().max(80).default(''),
  secondaryHref: z.string().max(600).default(''),
  note: z.string().max(600).default(''),
})
export type CtaConfig = z.infer<typeof ctaSchema>

export const heroDataSchema = z.object({
  eyebrow: z.string().max(120).default(''),
  showSponsorLogo: z.boolean().default(true),
  showSwissHubLogo: z.boolean().default(true),
  badges: z.array(z.string().max(60)).max(8).default([]),
  cta: ctaSchema.partial().default({}),
})
export type HeroData = z.infer<typeof heroDataSchema>

/** Union payload – every optional list is present so editors can rely on it. */
export const sectionDataSchema = z.object({
  eyebrow: z.string().max(120).optional(),
  stats: z.array(statItemSchema).max(24).optional(),
  bullets: z.array(bulletItemSchema).max(24).optional(),
  budget: z.array(budgetItemSchema).max(24).optional(),
  steps: z.array(processStepSchema).max(12).optional(),
  quotes: z.array(quoteItemSchema).max(12).optional(),
  gallery: z.array(galleryItemSchema).max(30).optional(),
  links: z.array(linkItemSchema).max(12).optional(),
  cta: ctaSchema.partial().optional(),
  hero: heroDataSchema.partial().optional(),
  /** Which tournaments / partners to show; empty means "all visible". */
  tournamentIds: z.array(z.string().max(60)).max(30).optional(),
  partnerIds: z.array(z.string().max(60)).max(30).optional(),
  /** Layout hints understood by the renderers. */
  layout: z.enum(['default', 'compact', 'split', 'grid']).optional(),
  columns: z.number().int().min(1).max(4).optional(),
  showAmount: z.boolean().optional(),
  contactEmail: z.string().max(200).optional(),
  contactNote: z.string().max(600).optional(),
})

export type SectionData = z.infer<typeof sectionDataSchema>

/** Parse a stored JSON payload, discarding anything that no longer validates. */
export function parseSectionData(value: unknown): SectionData {
  if (!value || typeof value !== 'object') return {}
  const result = sectionDataSchema.safeParse(value)
  return result.success ? result.data : {}
}

/** Which structured editors a section kind exposes in the admin UI. */
export interface SectionCapabilities {
  stats?: boolean
  bullets?: boolean
  budget?: boolean
  steps?: boolean
  quotes?: boolean
  gallery?: boolean
  links?: boolean
  cta?: boolean
  hero?: boolean
  tournamentPicker?: boolean
  partnerPicker?: boolean
  amount?: boolean
  contact?: boolean
}

export const SECTION_CAPABILITIES: Record<SectionType, SectionCapabilities> = {
  HERO: { hero: true, cta: true },
  PERSONAL_INTRO: {},
  WHY_PARTNERSHIP: { bullets: true },
  TOURNAMENT: { stats: true, tournamentPicker: true },
  REACH: { stats: true },
  SPONSORING_PROPOSAL: { bullets: true, amount: true },
  BENEFITS: {},
  BUDGET_USAGE: { budget: true },
  VISION: { bullets: true },
  ABOUT_SWISSHUB: { stats: true },
  TOURNAMENT_HISTORY: { tournamentPicker: true },
  PAST_PARTNERS: { partnerPicker: true },
  TWITCH_VOD: { links: true },
  SOCIAL_PROOF: { quotes: true },
  CTA: { cta: true, contact: true },
  CUSTOM_TEXT: {},
  GALLERY: { gallery: true },
  STATS: { stats: true },
  PROCESS: { steps: true },
  CONTACT: { contact: true, cta: true },
  RICH_TEXT: {},
}

/**
 * Derive the numeric target for the count-up animation from a display value
 * such as "6'000+" or "~100".
 */
export function numericFromStat(item: StatItem): number | null {
  if (item.numeric !== null && Number.isFinite(item.numeric)) return item.numeric
  const digits = item.value.replace(/[^\d]/g, '')
  if (!digits) return null
  const parsed = Number.parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : null
}
