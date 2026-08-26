'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { PageStatus, PageVisibility, SectionType, SupportType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { checkPasswordPolicy, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { sanitizeRichText } from '@/lib/sanitize'
import { sectionDataSchema } from '@/lib/section-data'
import { defaultVisibilityFor } from '@/lib/pdf-sections'
import { requireUserForAction } from '@/lib/session'
import { isValidSlug, slugify, uniqueSlug } from '@/lib/slug'
import { generateSponsorPage } from '@/server/page-builder'

function revalidatePage(id: string, slug?: string): void {
  revalidatePath('/admin/sponsor-pages')
  revalidatePath(`/admin/sponsor-pages/${id}`)
  revalidatePath('/admin')
  if (slug) revalidatePath(`/partner/${slug}`)
}

const amountSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null
    // Accept "2'000", "2 000", "2.000,50" and "2000.50".
    const normalised = value.replace(/[’'\s]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalised)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null
  })

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

const createSchema = z.object({
  sponsorId: z.string().min(1, 'Bitte wählen Sie einen Sponsor.'),
  templateId: z.string().optional().transform((value) => value || null),
  tournamentId: z.string().optional().transform((value) => value || null),
  title: z.string().trim().max(200).optional(),
  subtitle: z.string().trim().max(300).optional(),
  slug: z.string().trim().max(80).optional(),
  requestedSupportType: z.nativeEnum(SupportType).default('MONEY'),
  requestedAmount: amountSchema,
  requestedSupportText: z.string().trim().max(1000).optional().transform((value) => value || null),
  currency: z.string().trim().max(8).default('CHF'),
  benefitIds: z.array(z.string()).default([]),
})

export async function createSponsorPageAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let created: { id: string; slug: string } | null = null
  try {
    const user = await requireUserForAction()
    const parsed = createSchema.safeParse({
      sponsorId: formData.get('sponsorId'),
      templateId: formData.get('templateId') ?? undefined,
      tournamentId: formData.get('tournamentId') ?? undefined,
      title: formData.get('title') ?? undefined,
      subtitle: formData.get('subtitle') ?? undefined,
      slug: formData.get('slug') ?? undefined,
      requestedSupportType: formData.get('requestedSupportType') ?? 'MONEY',
      requestedAmount: formData.get('requestedAmount') ?? undefined,
      requestedSupportText: formData.get('requestedSupportText') ?? undefined,
      currency: formData.get('currency') || 'CHF',
      benefitIds: formData.getAll('benefitIds').map(String).filter(Boolean),
    })
    if (!parsed.success) return fromZod(parsed.error)

    if (parsed.data.slug && !isValidSlug(slugify(parsed.data.slug))) {
      return failure('Der Link ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
    }

    const page = await generateSponsorPage({
      sponsorId: parsed.data.sponsorId,
      templateId: parsed.data.templateId,
      tournamentId: parsed.data.tournamentId,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      slug: parsed.data.slug,
      requestedSupportType: parsed.data.requestedSupportType,
      requestedAmount: parsed.data.requestedAmount,
      requestedSupportText: parsed.data.requestedSupportText,
      currency: parsed.data.currency,
      benefitIds: parsed.data.benefitIds,
    })

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: parsed.data.sponsorId },
      select: { companyName: true },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SponsorPage',
      entityId: page.id,
      summary: `Sponsorenseite für „${sponsor?.companyName ?? 'Sponsor'}“ erstellt`,
    })
    revalidatePage(page.id, page.slug)
    created = page
  } catch (error) {
    return fromError(error)
  }

  // Outside the try block so the redirect is not swallowed as an error.
  redirect(`/admin/sponsor-pages/${created.id}`)
}

// ---------------------------------------------------------------------------
// Page settings
// ---------------------------------------------------------------------------

const settingsSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Bitte geben Sie einen Titel ein.').max(200),
  subtitle: z.string().trim().max(300).optional().transform((value) => value || null),
  slug: z.string().trim().min(2, 'Bitte geben Sie einen Link ein.').max(80),
  tournamentId: z.string().optional().transform((value) => value || null),
  requestedSupportType: z.nativeEnum(SupportType),
  requestedAmount: amountSchema,
  requestedSupportText: z.string().trim().max(1000).optional().transform((value) => value || null),
  currency: z.string().trim().max(8).default('CHF'),
  heroImageId: z.string().optional().transform((value) => value || null),
  noindex: z.coerce.boolean().default(true),
})

export async function updateSponsorPageAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = settingsSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title'),
      subtitle: formData.get('subtitle') ?? undefined,
      slug: formData.get('slug'),
      tournamentId: formData.get('tournamentId') ?? undefined,
      requestedSupportType: formData.get('requestedSupportType') ?? 'MONEY',
      requestedAmount: formData.get('requestedAmount') ?? undefined,
      requestedSupportText: formData.get('requestedSupportText') ?? undefined,
      currency: formData.get('currency') || 'CHF',
      heroImageId: formData.get('heroImageId') ?? undefined,
      noindex: formData.get('noindex') === 'true',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const existing = await prisma.sponsorPage.findUnique({ where: { id: parsed.data.id } })
    if (!existing) return failure('Diese Seite existiert nicht mehr.')

    const slug = slugify(parsed.data.slug)
    if (!isValidSlug(slug)) {
      return failure('Der Link ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
    }
    if (slug !== existing.slug) {
      const taken = await prisma.sponsorPage.findUnique({ where: { slug }, select: { id: true } })
      if (taken) return failure('Dieser Link ist bereits vergeben.', { slug: 'Bereits vergeben.' })
    }

    await prisma.sponsorPage.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        slug,
        tournamentId: parsed.data.tournamentId,
        requestedSupportType: parsed.data.requestedSupportType,
        requestedAmount: parsed.data.requestedAmount,
        requestedSupportText: parsed.data.requestedSupportText,
        currency: parsed.data.currency,
        heroImageId: parsed.data.heroImageId,
        noindex: parsed.data.noindex,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SponsorPage',
      entityId: parsed.data.id,
      summary: `Sponsorenseite „${parsed.data.title}“ bearbeitet`,
    })
    revalidatePage(parsed.data.id, existing.slug)
    if (slug !== existing.slug) revalidatePath(`/partner/${slug}`)
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().max(200).optional().transform((value) => value || null),
  subtitle: z.string().trim().max(300).optional().transform((value) => value || null),
  content: z.string().max(60000).optional(),
  data: z.string().optional(),
  visibleOnWeb: z.boolean().optional(),
  visibleInShortPdf: z.boolean().optional(),
  visibleInFullPdf: z.boolean().optional(),
})

export async function updateSectionAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = sectionSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title') ?? undefined,
      subtitle: formData.get('subtitle') ?? undefined,
      content: formData.get('content') ?? undefined,
      data: formData.get('data') ?? undefined,
      visibleOnWeb: formData.get('visibleOnWeb') === 'true',
      visibleInShortPdf: formData.get('visibleInShortPdf') === 'true',
      visibleInFullPdf: formData.get('visibleInFullPdf') === 'true',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const section = await prisma.sponsorPageSection.findUnique({
      where: { id: parsed.data.id },
      include: { page: { select: { id: true, slug: true, title: true } } },
    })
    if (!section) return failure('Diese Sektion existiert nicht mehr.')

    let data: Prisma.InputJsonValue | undefined
    if (parsed.data.data !== undefined) {
      try {
        const result = sectionDataSchema.safeParse(JSON.parse(parsed.data.data))
        if (!result.success) return failure('Die Sektionsdaten sind ungültig.')
        data = result.data as Prisma.InputJsonValue
      } catch {
        return failure('Die Sektionsdaten konnten nicht gelesen werden.')
      }
    }

    await prisma.sponsorPageSection.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        // Sanitised again server side – client output is never trusted.
        content: parsed.data.content !== undefined ? sanitizeRichText(parsed.data.content) || null : undefined,
        ...(data !== undefined ? { data } : {}),
        ...(parsed.data.visibleOnWeb !== undefined ? { visibleOnWeb: parsed.data.visibleOnWeb } : {}),
        ...(parsed.data.visibleInShortPdf !== undefined
          ? { visibleInShortPdf: parsed.data.visibleInShortPdf }
          : {}),
        ...(parsed.data.visibleInFullPdf !== undefined
          ? { visibleInFullPdf: parsed.data.visibleInFullPdf }
          : {}),
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SponsorPageSection',
      entityId: parsed.data.id,
      summary: `Sektion auf „${section.page.title}“ bearbeitet`,
    })
    revalidatePage(section.page.id, section.page.slug)
    return success('Sektion gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

const CHANNEL_COLUMN = {
  web: 'visibleOnWeb',
  shortPdf: 'visibleInShortPdf',
  fullPdf: 'visibleInFullPdf',
} as const

export type SectionChannel = keyof typeof CHANNEL_COLUMN

const CHANNEL_LABEL: Record<SectionChannel, string> = {
  web: 'Website',
  shortPdf: 'Kurzpräsentation',
  fullPdf: 'Dossier',
}

/** Flip a single output channel of one section. */
export async function toggleSectionVisibilityAction(
  id: string,
  channel: SectionChannel,
  visible: boolean,
): Promise<ActionState> {
  try {
    await requireUserForAction()
    const column = CHANNEL_COLUMN[channel]
    if (!column) return failure('Unbekannter Sichtbarkeitsbereich.')

    const section = await prisma.sponsorPageSection.findUnique({
      where: { id },
      include: { page: { select: { id: true, slug: true } } },
    })
    if (!section) return failure('Diese Sektion existiert nicht mehr.')

    await prisma.sponsorPageSection.update({ where: { id }, data: { [column]: visible } })
    revalidatePage(section.page.id, section.page.slug)
    return success(
      visible
        ? `In „${CHANNEL_LABEL[channel]}“ eingeblendet.`
        : `Aus „${CHANNEL_LABEL[channel]}“ ausgeblendet.`,
    )
  } catch (error) {
    return fromError(error)
  }
}

export async function reorderSectionsAction(pageId: string, orderedIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({ where: { id: pageId }, select: { id: true, slug: true } })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    const sections = await prisma.sponsorPageSection.findMany({
      where: { sponsorPageId: pageId },
      select: { id: true },
    })
    const valid = new Set(sections.map((section) => section.id))
    const ids = orderedIds.filter((id) => valid.has(id))
    if (ids.length !== sections.length) return failure('Die Reihenfolge konnte nicht übernommen werden.')

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.sponsorPageSection.update({ where: { id }, data: { order: (index + 1) * 10 } }),
      ),
    )
    revalidatePage(page.id, page.slug)
    return success('Reihenfolge gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function addSectionAction(pageId: string, type: SectionType): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({ where: { id: pageId }, select: { id: true, slug: true } })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    const last = await prisma.sponsorPageSection.findFirst({
      where: { sponsorPageId: pageId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const defaults = defaultVisibilityFor(type)
    const section = await prisma.sponsorPageSection.create({
      data: {
        sponsorPageId: pageId,
        type,
        order: (last?.order ?? 0) + 10,
        visibleOnWeb: defaults.web,
        visibleInShortPdf: defaults.shortPdf,
        visibleInFullPdf: defaults.fullPdf,
        data: {},
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SponsorPageSection',
      entityId: section.id,
      summary: `Sektion hinzugefügt`,
    })
    revalidatePage(page.id, page.slug)
    return success('Sektion hinzugefügt.', { id: section.id })
  } catch (error) {
    return fromError(error)
  }
}

export async function deleteSectionAction(id: string): Promise<ActionState> {
  try {
    await requireUserForAction()
    const section = await prisma.sponsorPageSection.findUnique({
      where: { id },
      include: { page: { select: { id: true, slug: true } } },
    })
    if (!section) return failure('Diese Sektion existiert nicht mehr.')

    await prisma.sponsorPageSection.delete({ where: { id } })
    revalidatePage(section.page.id, section.page.slug)
    return success('Sektion gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

// ---------------------------------------------------------------------------
// Benefits on a page
// ---------------------------------------------------------------------------

export async function setPageBenefitsAction(pageId: string, benefitIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({ where: { id: pageId }, select: { id: true, slug: true } })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    const existing = await prisma.sponsorPageBenefit.findMany({
      where: { sponsorPageId: pageId },
      select: { benefitId: true },
    })
    const existingIds = new Set(existing.map((entry) => entry.benefitId))
    const nextIds = new Set(benefitIds)

    const toRemove = [...existingIds].filter((id) => !nextIds.has(id))
    const toAdd = benefitIds.filter((id) => !existingIds.has(id))

    // Verify every added id actually exists before writing.
    const validAdds = toAdd.length
      ? (await prisma.sponsoringBenefit.findMany({ where: { id: { in: toAdd } }, select: { id: true } })).map(
          (benefit) => benefit.id,
        )
      : []

    const lastOrder = await prisma.sponsorPageBenefit.findFirst({
      where: { sponsorPageId: pageId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    let order = lastOrder?.order ?? 0

    await prisma.$transaction([
      ...(toRemove.length
        ? [prisma.sponsorPageBenefit.deleteMany({ where: { sponsorPageId: pageId, benefitId: { in: toRemove } } })]
        : []),
      ...validAdds.map((benefitId) => {
        order += 10
        return prisma.sponsorPageBenefit.create({
          data: { sponsorPageId: pageId, benefitId, order, visible: true },
        })
      }),
    ])

    revalidatePage(page.id, page.slug)
    return success('Leistungen aktualisiert.')
  } catch (error) {
    return fromError(error)
  }
}

const pageBenefitSchema = z.object({
  id: z.string().min(1),
  customTitle: z.string().trim().max(200).optional().transform((value) => value || null),
  customDescription: z.string().trim().max(1000).optional().transform((value) => value || null),
  visible: z.boolean().optional(),
})

export async function updatePageBenefitAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireUserForAction()
    const parsed = pageBenefitSchema.safeParse({
      id: formData.get('id'),
      customTitle: formData.get('customTitle') ?? undefined,
      customDescription: formData.get('customDescription') ?? undefined,
      visible: formData.get('visible') === 'true',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const entry = await prisma.sponsorPageBenefit.findUnique({
      where: { id: parsed.data.id },
      include: { page: { select: { id: true, slug: true } } },
    })
    if (!entry) return failure('Diese Leistung existiert nicht mehr.')

    await prisma.sponsorPageBenefit.update({
      where: { id: parsed.data.id },
      data: {
        customTitle: parsed.data.customTitle,
        customDescription: parsed.data.customDescription,
        ...(parsed.data.visible !== undefined ? { visible: parsed.data.visible } : {}),
      },
    })
    revalidatePage(entry.page.id, entry.page.slug)
    return success('Leistung gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function reorderPageBenefitsAction(pageId: string, orderedIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({ where: { id: pageId }, select: { id: true, slug: true } })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    const rows = await prisma.sponsorPageBenefit.findMany({
      where: { sponsorPageId: pageId },
      select: { id: true },
    })
    const valid = new Set(rows.map((row) => row.id))
    const ids = orderedIds.filter((id) => valid.has(id))
    if (ids.length !== rows.length) return failure('Die Reihenfolge konnte nicht übernommen werden.')

    await prisma.$transaction(
      ids.map((id, index) => prisma.sponsorPageBenefit.update({ where: { id }, data: { order: (index + 1) * 10 } })),
    )
    revalidatePage(page.id, page.slug)
    return success('Reihenfolge gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

// ---------------------------------------------------------------------------
// Publishing, visibility and lifecycle
// ---------------------------------------------------------------------------

export async function setPageStatusAction(id: string, status: PageStatus): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({
      where: { id },
      include: { sponsor: { select: { companyName: true } } },
    })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    await prisma.sponsorPage.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'PUBLISHED' ? (page.publishedAt ?? new Date()) : page.publishedAt,
      },
    })

    await logActivity({
      userId: user.id,
      action: status === 'PUBLISHED' ? 'PUBLISH' : status === 'ARCHIVED' ? 'ARCHIVE' : 'UNPUBLISH',
      entityType: 'SponsorPage',
      entityId: id,
      summary:
        status === 'PUBLISHED'
          ? `Sponsorenseite für „${page.sponsor.companyName}“ veröffentlicht`
          : status === 'ARCHIVED'
            ? `Sponsorenseite für „${page.sponsor.companyName}“ archiviert`
            : `Sponsorenseite für „${page.sponsor.companyName}“ auf Entwurf gesetzt`,
    })
    revalidatePage(id, page.slug)
    return success(
      status === 'PUBLISHED'
        ? 'Seite veröffentlicht.'
        : status === 'ARCHIVED'
          ? 'Seite archiviert.'
          : 'Seite auf Entwurf gesetzt.',
    )
  } catch (error) {
    return fromError(error)
  }
}

export async function setPagePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const id = String(formData.get('id') ?? '')
    const enabled = formData.get('enabled') === 'true'
    const password = String(formData.get('password') ?? '')

    const page = await prisma.sponsorPage.findUnique({
      where: { id },
      include: { sponsor: { select: { companyName: true } } },
    })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    if (!enabled) {
      await prisma.sponsorPage.update({
        where: { id },
        data: { visibility: PageVisibility.PUBLIC, passwordHash: null },
      })
      await logActivity({
        userId: user.id,
        action: 'PASSWORD_REMOVED',
        entityType: 'SponsorPage',
        entityId: id,
        summary: `Passwortschutz für „${page.sponsor.companyName}“ entfernt`,
      })
      revalidatePage(id, page.slug)
      return success('Passwortschutz deaktiviert.')
    }

    // Keeping the existing password when the field is left empty lets the admin
    // toggle protection back on without retyping it.
    if (!password) {
      if (!page.passwordHash) {
        return failure('Bitte legen Sie ein Passwort fest.', { password: 'Passwort erforderlich.' })
      }
      await prisma.sponsorPage.update({
        where: { id },
        data: { visibility: PageVisibility.PASSWORD_PROTECTED },
      })
      revalidatePage(id, page.slug)
      return success('Passwortschutz aktiviert.')
    }

    const policy = checkPasswordPolicy(password, 8)
    if (!policy.ok) {
      const message = policy.message ?? 'Das Passwort ist zu schwach.'
      return failure(message, { password: message })
    }

    await prisma.sponsorPage.update({
      where: { id },
      data: {
        visibility: PageVisibility.PASSWORD_PROTECTED,
        passwordHash: await hashPassword(password),
      },
    })
    await logActivity({
      userId: user.id,
      action: 'PASSWORD_SET',
      entityType: 'SponsorPage',
      entityId: id,
      summary: `Passwortschutz für „${page.sponsor.companyName}“ gesetzt`,
    })
    revalidatePage(id, page.slug)
    return success('Passwort gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function deleteSponsorPageAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({
      where: { id },
      include: { sponsor: { select: { companyName: true } } },
    })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    await prisma.sponsorPage.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'SponsorPage',
      entityId: id,
      summary: `Sponsorenseite für „${page.sponsor.companyName}“ gelöscht`,
    })
    revalidatePath('/admin/sponsor-pages')
    revalidatePath(`/partner/${page.slug}`)
    return success('Sponsorenseite gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

/** Duplicate a page including its sections and benefits. */
export async function duplicateSponsorPageAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({
      where: { id },
      include: { sections: { orderBy: { order: 'asc' } }, benefits: { orderBy: { order: 'asc' } } },
    })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    const slug = await uniqueSlug(`${page.slug}-kopie`, async (candidate) => {
      const existing = await prisma.sponsorPage.findUnique({ where: { slug: candidate }, select: { id: true } })
      return Boolean(existing)
    })

    const copy = await prisma.sponsorPage.create({
      data: {
        sponsorId: page.sponsorId,
        tournamentId: page.tournamentId,
        templateId: page.templateId,
        slug,
        title: `${page.title} (Kopie)`,
        subtitle: page.subtitle,
        status: 'DRAFT',
        visibility: 'PUBLIC',
        requestedSupportType: page.requestedSupportType,
        requestedAmount: page.requestedAmount,
        requestedSupportText: page.requestedSupportText,
        currency: page.currency,
        heroImageId: page.heroImageId,
        noindex: page.noindex,
        sections: {
          create: page.sections.map((section) => ({
            type: section.type,
            title: section.title,
            subtitle: section.subtitle,
            content: section.content,
            data: (section.data ?? {}) as Prisma.InputJsonValue,
            order: section.order,
            visibleOnWeb: section.visibleOnWeb,
            visibleInShortPdf: section.visibleInShortPdf,
            visibleInFullPdf: section.visibleInFullPdf,
            pdfOrder: section.pdfOrder,
          })),
        },
        benefits: {
          create: page.benefits.map((benefit) => ({
            benefitId: benefit.benefitId,
            customTitle: benefit.customTitle,
            customDescription: benefit.customDescription,
            order: benefit.order,
            visible: benefit.visible,
          })),
        },
      },
      select: { id: true },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SponsorPage',
      entityId: copy.id,
      summary: `Sponsorenseite „${page.title}“ dupliziert`,
    })
    revalidatePath('/admin/sponsor-pages')
    return success('Seite dupliziert.', { id: copy.id })
  } catch (error) {
    return fromError(error)
  }
}
