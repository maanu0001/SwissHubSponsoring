'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SectionType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { normaliseUrl } from '@/lib/media'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { sanitizeRichText } from '@/lib/sanitize'
import { sectionDataSchema } from '@/lib/section-data'
import { requireUserForAction } from '@/lib/session'
import { slugify } from '@/lib/slug'

function revalidatePublic(): void {
  revalidatePath('/')
  revalidatePath('/admin/content')
}

// ---------------------------------------------------------------------------
// Site sections (public main page)
// ---------------------------------------------------------------------------

const siteSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().max(200).optional().transform((value) => value || null),
  subtitle: z.string().trim().max(300).optional().transform((value) => value || null),
  content: z.string().max(60000).optional(),
  data: z.string().optional(),
  visible: z.boolean().optional(),
})

export async function updateSiteSectionAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = siteSectionSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title') ?? undefined,
      subtitle: formData.get('subtitle') ?? undefined,
      content: formData.get('content') ?? undefined,
      data: formData.get('data') ?? undefined,
      visible: formData.get('visible') === 'true',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const section = await prisma.siteSection.findUnique({ where: { id: parsed.data.id } })
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

    await prisma.siteSection.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        content: parsed.data.content !== undefined ? sanitizeRichText(parsed.data.content) || null : undefined,
        ...(data !== undefined ? { data } : {}),
        ...(parsed.data.visible !== undefined ? { visible: parsed.data.visible } : {}),
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SiteSection',
      entityId: parsed.data.id,
      summary: `Sektion „${parsed.data.title ?? section.key}“ der Hauptseite bearbeitet`,
    })
    revalidatePublic()
    return success('Sektion gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function toggleSiteSectionAction(id: string, visible: boolean): Promise<ActionState> {
  try {
    await requireUserForAction()
    const section = await prisma.siteSection.findUnique({ where: { id }, select: { id: true } })
    if (!section) return failure('Diese Sektion existiert nicht mehr.')

    await prisma.siteSection.update({ where: { id }, data: { visible } })
    revalidatePublic()
    return success(visible ? 'Sektion eingeblendet.' : 'Sektion ausgeblendet.')
  } catch (error) {
    return fromError(error)
  }
}

export async function reorderSiteSectionsAction(orderedIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const rows = await prisma.siteSection.findMany({ select: { id: true } })
    const valid = new Set(rows.map((row) => row.id))
    const ids = orderedIds.filter((id) => valid.has(id))
    if (ids.length !== rows.length) return failure('Die Reihenfolge konnte nicht übernommen werden.')

    await prisma.$transaction(
      ids.map((id, index) => prisma.siteSection.update({ where: { id }, data: { order: (index + 1) * 10 } })),
    )
    revalidatePublic()
    return success('Reihenfolge gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function addSiteSectionAction(type: SectionType): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const last = await prisma.siteSection.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })

    // Keys stay unique and readable, e.g. "gallery-3".
    const base = slugify(type.toLowerCase().replace(/_/g, '-')) || 'sektion'
    let key = base
    let counter = 2
    while (await prisma.siteSection.findUnique({ where: { key }, select: { key: true } })) {
      key = `${base}-${counter}`
      counter += 1
      if (counter > 200) return failure('Es konnte kein eindeutiger Schlüssel erzeugt werden.')
    }

    const section = await prisma.siteSection.create({
      data: { key, type, order: (last?.order ?? 0) + 10, visible: true, data: {} },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SiteSection',
      entityId: section.id,
      summary: 'Sektion zur Hauptseite hinzugefügt',
    })
    revalidatePublic()
    return success('Sektion hinzugefügt.', { id: section.id })
  } catch (error) {
    return fromError(error)
  }
}

export async function deleteSiteSectionAction(id: string): Promise<ActionState> {
  try {
    await requireUserForAction()
    const section = await prisma.siteSection.findUnique({ where: { id }, select: { id: true } })
    if (!section) return failure('Diese Sektion existiert nicht mehr.')

    await prisma.siteSection.delete({ where: { id } })
    revalidatePublic()
    return success('Sektion gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

// ---------------------------------------------------------------------------
// Partner references
// ---------------------------------------------------------------------------

const partnerSchema = z.object({
  name: z.string().trim().min(2, 'Bitte geben Sie einen Namen ein.').max(160),
  website: z.string().trim().max(400).optional().transform((value) => value || null),
  description: z.string().trim().max(1000).optional().transform((value) => value || null),
  logoId: z.string().trim().max(60).optional().transform((value) => value || null),
  visible: z.boolean().default(true),
})

export async function createPartnerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = partnerSchema.safeParse({
      name: formData.get('name'),
      website: formData.get('website') ?? undefined,
      description: formData.get('description') ?? undefined,
      logoId: formData.get('logoId') ?? undefined,
      visible: formData.get('visible') !== 'false',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const last = await prisma.partnerReference.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })

    const partner = await prisma.partnerReference.create({
      data: {
        ...parsed.data,
        website: normaliseUrl(parsed.data.website),
        order: (last?.order ?? 0) + 10,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'PartnerReference',
      entityId: partner.id,
      summary: `Partner „${partner.name}“ hinzugefügt`,
    })
    revalidatePath('/admin/partners')
    revalidatePublic()
    return success('Partner hinzugefügt.', { id: partner.id })
  } catch (error) {
    return fromError(error)
  }
}

export async function updatePartnerAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const id = String(formData.get('id') ?? '')
    if (!id) return failure('Ungültige Anfrage.')

    const parsed = partnerSchema.safeParse({
      name: formData.get('name'),
      website: formData.get('website') ?? undefined,
      description: formData.get('description') ?? undefined,
      logoId: formData.get('logoId') ?? undefined,
      visible: formData.get('visible') !== 'false',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const partner = await prisma.partnerReference.update({
      where: { id },
      data: { ...parsed.data, website: normaliseUrl(parsed.data.website) },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'PartnerReference',
      entityId: id,
      summary: `Partner „${partner.name}“ bearbeitet`,
    })
    revalidatePath('/admin/partners')
    revalidatePublic()
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function reorderPartnersAction(orderedIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const rows = await prisma.partnerReference.findMany({ select: { id: true } })
    const valid = new Set(rows.map((row) => row.id))
    const ids = orderedIds.filter((id) => valid.has(id))

    await prisma.$transaction(
      ids.map((id, index) => prisma.partnerReference.update({ where: { id }, data: { order: (index + 1) * 10 } })),
    )
    revalidatePath('/admin/partners')
    revalidatePublic()
    return success('Reihenfolge gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function deletePartnerAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const partner = await prisma.partnerReference.findUnique({ where: { id } })
    if (!partner) return failure('Dieser Partner existiert nicht mehr.')

    await prisma.partnerReference.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'PartnerReference',
      entityId: id,
      summary: `Partner „${partner.name}“ gelöscht`,
    })
    revalidatePath('/admin/partners')
    revalidatePublic()
    return success('Partner gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}
