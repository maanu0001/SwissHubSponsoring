'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { SponsorStatus } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { normaliseUrl } from '@/lib/media'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { requireUserForAction } from '@/lib/session'
import { isValidSlug, slugify, uniqueSlug } from '@/lib/slug'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null))

const sponsorSchema = z.object({
  companyName: z.string().trim().min(2, 'Bitte geben Sie den Firmennamen ein.').max(160),
  slug: z.string().trim().max(80).optional(),
  website: optionalText(400),
  industry: optionalText(120),
  contactName: optionalText(160),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((value) => (value ? value : null))
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    }),
  contactPhone: optionalText(60),
  internalNotes: optionalText(5000),
  status: z.nativeEnum(SponsorStatus).default('DRAFT'),
  logoId: optionalText(60),
  lastContactDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return null
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }),
})

function parseForm(formData: FormData) {
  return sponsorSchema.safeParse({
    companyName: formData.get('companyName'),
    slug: formData.get('slug') ?? undefined,
    website: formData.get('website') ?? undefined,
    industry: formData.get('industry') ?? undefined,
    contactName: formData.get('contactName') ?? undefined,
    contactEmail: formData.get('contactEmail') ?? undefined,
    contactPhone: formData.get('contactPhone') ?? undefined,
    internalNotes: formData.get('internalNotes') ?? undefined,
    status: formData.get('status') ?? 'DRAFT',
    logoId: formData.get('logoId') ?? undefined,
    lastContactDate: formData.get('lastContactDate') ?? undefined,
  })
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const existing = await prisma.sponsor.findUnique({ where: { slug }, select: { id: true } })
  return Boolean(existing && existing.id !== exceptId)
}

function revalidateSponsors(id?: string): void {
  revalidatePath('/admin/sponsors')
  revalidatePath('/admin')
  if (id) revalidatePath(`/admin/sponsors/${id}`)
}

export async function createSponsorAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = parseForm(formData)
    if (!parsed.success) return fromZod(parsed.error)

    const data = parsed.data
    const desiredSlug = data.slug ? slugify(data.slug) : slugify(data.companyName)
    if (data.slug && !isValidSlug(desiredSlug)) {
      return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
    }

    const slug = await uniqueSlug(desiredSlug, (candidate) => slugTaken(candidate))

    const sponsor = await prisma.sponsor.create({
      data: {
        companyName: data.companyName,
        slug,
        website: normaliseUrl(data.website),
        industry: data.industry,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        internalNotes: data.internalNotes,
        status: data.status,
        logoId: data.logoId || null,
        lastContactDate: data.lastContactDate,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Sponsor',
      entityId: sponsor.id,
      summary: `Sponsor „${sponsor.companyName}“ erstellt`,
    })
    revalidateSponsors(sponsor.id)
    return success('Sponsor erstellt.', { id: sponsor.id, slug: sponsor.slug })
  } catch (error) {
    return fromError(error)
  }
}

export async function updateSponsorAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const id = String(formData.get('id') ?? '')
    if (!id) return failure('Ungültige Anfrage.')

    const existing = await prisma.sponsor.findUnique({ where: { id } })
    if (!existing) return failure('Dieser Sponsor existiert nicht mehr.')

    const parsed = parseForm(formData)
    if (!parsed.success) return fromZod(parsed.error)
    const data = parsed.data

    let slug = existing.slug
    if (data.slug) {
      const candidate = slugify(data.slug)
      if (!isValidSlug(candidate)) {
        return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
      }
      if (candidate !== existing.slug) {
        if (await slugTaken(candidate, id)) {
          return failure('Dieser Slug ist bereits vergeben.', { slug: 'Bereits vergeben.' })
        }
        slug = candidate
      }
    }

    const statusChanged = existing.status !== data.status

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        companyName: data.companyName,
        slug,
        website: normaliseUrl(data.website),
        industry: data.industry,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        internalNotes: data.internalNotes,
        status: data.status,
        logoId: data.logoId || null,
        lastContactDate: data.lastContactDate,
      },
    })

    await logActivity({
      userId: user.id,
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      entityType: 'Sponsor',
      entityId: sponsor.id,
      summary: statusChanged
        ? `Status von „${sponsor.companyName}“ geändert`
        : `Sponsor „${sponsor.companyName}“ bearbeitet`,
      metadata: statusChanged ? { from: existing.status, to: sponsor.status } : undefined,
    })
    revalidateSponsors(sponsor.id)
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

/** Inline status change from the CRM table. */
export async function changeSponsorStatusAction(id: string, status: SponsorStatus): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const existing = await prisma.sponsor.findUnique({ where: { id } })
    if (!existing) return failure('Dieser Sponsor existiert nicht mehr.')
    if (existing.status === status) return success('Status unverändert.')

    await prisma.sponsor.update({ where: { id }, data: { status } })
    await logActivity({
      userId: user.id,
      action: 'STATUS_CHANGE',
      entityType: 'Sponsor',
      entityId: id,
      summary: `Status von „${existing.companyName}“ geändert`,
      metadata: { from: existing.status, to: status },
    })
    revalidateSponsors(id)
    return success('Status aktualisiert.')
  } catch (error) {
    return fromError(error)
  }
}

/** Record "contacted today" without opening the full form. */
export async function markContactedAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const sponsor = await prisma.sponsor.findUnique({ where: { id } })
    if (!sponsor) return failure('Dieser Sponsor existiert nicht mehr.')

    await prisma.sponsor.update({
      where: { id },
      data: {
        lastContactDate: new Date(),
        status: sponsor.status === 'DRAFT' || sponsor.status === 'NOT_CONTACTED' ? 'CONTACTED' : sponsor.status,
      },
    })
    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Sponsor',
      entityId: id,
      summary: `Kontaktdatum von „${sponsor.companyName}“ auf heute gesetzt`,
    })
    revalidateSponsors(id)
    return success('Kontaktdatum aktualisiert.')
  } catch (error) {
    return fromError(error)
  }
}

/** Archiving is the default; it keeps all pages and history intact. */
export async function archiveSponsorAction(id: string, archive: boolean): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const sponsor = await prisma.sponsor.findUnique({ where: { id } })
    if (!sponsor) return failure('Dieser Sponsor existiert nicht mehr.')

    await prisma.sponsor.update({
      where: { id },
      data: { status: archive ? 'ARCHIVED' : 'DRAFT' },
    })
    await logActivity({
      userId: user.id,
      action: archive ? 'ARCHIVE' : 'RESTORE',
      entityType: 'Sponsor',
      entityId: id,
      summary: archive
        ? `Sponsor „${sponsor.companyName}“ archiviert`
        : `Sponsor „${sponsor.companyName}“ wiederhergestellt`,
    })
    revalidateSponsors(id)
    return success(archive ? 'Sponsor archiviert.' : 'Sponsor wiederhergestellt.')
  } catch (error) {
    return fromError(error)
  }
}

/**
 * Hard delete. Only offered behind an explicit confirmation because it also
 * removes the sponsor's pages.
 */
export async function deleteSponsorAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: { _count: { select: { pages: true } } },
    })
    if (!sponsor) return failure('Dieser Sponsor existiert nicht mehr.')

    await prisma.sponsor.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Sponsor',
      entityId: id,
      summary: `Sponsor „${sponsor.companyName}“ inklusive ${sponsor._count.pages} Seite(n) gelöscht`,
    })
    revalidateSponsors()
    return success('Sponsor gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

/** Used by the wizard: create the sponsor, then continue to page creation. */
export async function createSponsorAndContinueAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await createSponsorAction(_previous, formData)
  if (result.status !== 'success' || !result.data?.id) return result
  redirect(`/admin/sponsors/${result.data.id}/create-page`)
}
