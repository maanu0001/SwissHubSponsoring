'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { SponsorStatus, SupportType } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { normaliseUrl } from '@/lib/media'
import { failure, fromError, fromZod, type ActionState } from '@/lib/result'
import { requireUserForAction } from '@/lib/session'
import { isValidSlug, slugify, uniqueSlug } from '@/lib/slug'
import { generateSponsorPage } from '@/server/page-builder'

const amountSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null
    const normalised = value.replace(/[’'\s]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalised)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null
  })

const wizardSchema = z.object({
  // Step 1 – company
  companyName: z.string().trim().min(2, 'Bitte geben Sie den Firmennamen ein.').max(160),
  slug: z.string().trim().max(80).optional(),
  logoId: z.string().trim().max(60).optional().transform((value) => value || null),
  website: z.string().trim().max(400).optional().transform((value) => value || null),
  industry: z.string().trim().max(120).optional().transform((value) => value || null),

  // Step 2 – contact
  contactName: z.string().trim().max(160).optional().transform((value) => value || null),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => value || null)
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    }),
  contactPhone: z.string().trim().max(60).optional().transform((value) => value || null),
  internalNotes: z.string().trim().max(5000).optional().transform((value) => value || null),
  status: z.nativeEnum(SponsorStatus).default('DRAFT'),

  // Step 3 – tournament
  tournamentId: z.string().trim().optional().transform((value) => value || null),

  // Step 4 – support
  requestedSupportType: z.nativeEnum(SupportType).default('MONEY'),
  requestedAmount: amountSchema,
  requestedSupportText: z.string().trim().max(1000).optional().transform((value) => value || null),
  currency: z.string().trim().max(8).default('CHF'),

  // Step 5 – benefits
  benefitIds: z.array(z.string()).default([]),

  // Step 6 – template
  templateId: z.string().trim().optional().transform((value) => value || null),

  // Page basics
  pageTitle: z.string().trim().max(200).optional(),
  pageSubtitle: z.string().trim().max(300).optional(),
  pageSlug: z.string().trim().max(80).optional(),
})

/**
 * The wizard's single submit: creates the sponsor, generates the sponsor page
 * from the chosen template and lands the admin in the editor.
 */
export async function createSponsorWithPageAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let target = ''

  try {
    const user = await requireUserForAction()

    const parsed = wizardSchema.safeParse({
      companyName: formData.get('companyName'),
      slug: formData.get('slug') ?? undefined,
      logoId: formData.get('logoId') ?? undefined,
      website: formData.get('website') ?? undefined,
      industry: formData.get('industry') ?? undefined,
      contactName: formData.get('contactName') ?? undefined,
      contactEmail: formData.get('contactEmail') ?? undefined,
      contactPhone: formData.get('contactPhone') ?? undefined,
      internalNotes: formData.get('internalNotes') ?? undefined,
      status: formData.get('status') ?? 'DRAFT',
      tournamentId: formData.get('tournamentId') ?? undefined,
      requestedSupportType: formData.get('requestedSupportType') ?? 'MONEY',
      requestedAmount: formData.get('requestedAmount') ?? undefined,
      requestedSupportText: formData.get('requestedSupportText') ?? undefined,
      currency: formData.get('currency') || 'CHF',
      benefitIds: formData.getAll('benefitIds').map(String).filter(Boolean),
      templateId: formData.get('templateId') ?? undefined,
      pageTitle: formData.get('pageTitle') ?? undefined,
      pageSubtitle: formData.get('pageSubtitle') ?? undefined,
      pageSlug: formData.get('pageSlug') ?? undefined,
    })

    if (!parsed.success) return fromZod(parsed.error)
    const data = parsed.data

    const sponsorSlugBase = data.slug ? slugify(data.slug) : slugify(data.companyName)
    if (data.slug && !isValidSlug(sponsorSlugBase)) {
      return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
    }
    if (data.pageSlug && !isValidSlug(slugify(data.pageSlug))) {
      return failure('Der Link der Sponsorenseite ist ungültig.', {
        pageSlug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.',
      })
    }

    const sponsorSlug = await uniqueSlug(sponsorSlugBase, async (candidate) => {
      const existing = await prisma.sponsor.findUnique({ where: { slug: candidate }, select: { id: true } })
      return Boolean(existing)
    })

    const sponsor = await prisma.sponsor.create({
      data: {
        companyName: data.companyName,
        slug: sponsorSlug,
        logoId: data.logoId,
        website: normaliseUrl(data.website),
        industry: data.industry,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        internalNotes: data.internalNotes,
        status: data.status,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Sponsor',
      entityId: sponsor.id,
      summary: `Sponsor „${sponsor.companyName}“ erstellt`,
    })

    const page = await generateSponsorPage({
      sponsorId: sponsor.id,
      templateId: data.templateId,
      tournamentId: data.tournamentId,
      title: data.pageTitle,
      subtitle: data.pageSubtitle,
      slug: data.pageSlug || sponsorSlug,
      requestedSupportType: data.requestedSupportType,
      requestedAmount: data.requestedAmount,
      requestedSupportText: data.requestedSupportText,
      currency: data.currency,
      benefitIds: data.benefitIds,
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SponsorPage',
      entityId: page.id,
      summary: `Sponsorenseite für „${sponsor.companyName}“ erstellt`,
    })

    revalidatePath('/admin/sponsors')
    revalidatePath('/admin/sponsor-pages')
    revalidatePath('/admin')
    target = `/admin/sponsor-pages/${page.id}?created=1`
  } catch (error) {
    return fromError(error)
  }

  redirect(target)
}

/** Checks slug availability while the admin types in the wizard. */
export async function checkSlugAvailabilityAction(
  kind: 'sponsor' | 'page',
  slug: string,
): Promise<{ available: boolean; normalised: string }> {
  await requireUserForAction()
  const normalised = slugify(slug)
  if (!isValidSlug(normalised)) return { available: false, normalised }

  const existing =
    kind === 'sponsor'
      ? await prisma.sponsor.findUnique({ where: { slug: normalised }, select: { id: true } })
      : await prisma.sponsorPage.findUnique({ where: { slug: normalised }, select: { id: true } })

  return { available: !existing, normalised }
}

/** Creates an additional page for an existing sponsor. */
export async function createPageForSponsorAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let target = ''
  try {
    const user = await requireUserForAction()
    const sponsorId = String(formData.get('sponsorId') ?? '')
    const sponsor = await prisma.sponsor.findUnique({ where: { id: sponsorId } })
    if (!sponsor) return failure('Dieser Sponsor existiert nicht mehr.')

    const parsed = wizardSchema
      .pick({
        tournamentId: true,
        requestedSupportType: true,
        requestedAmount: true,
        requestedSupportText: true,
        currency: true,
        benefitIds: true,
        templateId: true,
        pageTitle: true,
        pageSubtitle: true,
        pageSlug: true,
      })
      .safeParse({
        tournamentId: formData.get('tournamentId') ?? undefined,
        requestedSupportType: formData.get('requestedSupportType') ?? 'MONEY',
        requestedAmount: formData.get('requestedAmount') ?? undefined,
        requestedSupportText: formData.get('requestedSupportText') ?? undefined,
        currency: formData.get('currency') || 'CHF',
        benefitIds: formData.getAll('benefitIds').map(String).filter(Boolean),
        templateId: formData.get('templateId') ?? undefined,
        pageTitle: formData.get('pageTitle') ?? undefined,
        pageSubtitle: formData.get('pageSubtitle') ?? undefined,
        pageSlug: formData.get('pageSlug') ?? undefined,
      })

    if (!parsed.success) return fromZod(parsed.error)

    const page = await generateSponsorPage({
      sponsorId: sponsor.id,
      templateId: parsed.data.templateId,
      tournamentId: parsed.data.tournamentId,
      title: parsed.data.pageTitle,
      subtitle: parsed.data.pageSubtitle,
      slug: parsed.data.pageSlug || sponsor.slug,
      requestedSupportType: parsed.data.requestedSupportType,
      requestedAmount: parsed.data.requestedAmount,
      requestedSupportText: parsed.data.requestedSupportText,
      currency: parsed.data.currency,
      benefitIds: parsed.data.benefitIds,
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SponsorPage',
      entityId: page.id,
      summary: `Sponsorenseite für „${sponsor.companyName}“ erstellt`,
    })
    revalidatePath('/admin/sponsor-pages')
    revalidatePath(`/admin/sponsors/${sponsor.id}`)
    target = `/admin/sponsor-pages/${page.id}?created=1`
  } catch (error) {
    return fromError(error)
  }

  redirect(target)
}
