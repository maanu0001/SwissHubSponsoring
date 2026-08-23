'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { requireUserForAction } from '@/lib/session'

const benefitSchema = z.object({
  title: z.string().trim().min(2, 'Bitte geben Sie einen Titel ein.').max(200),
  description: z.string().trim().max(1000).optional().transform((value) => value || null),
  category: z.string().trim().max(80).optional().transform((value) => value || 'Allgemein'),
  icon: z.string().trim().max(60).optional().transform((value) => value || null),
  active: z.boolean().default(true),
  defaultBenefit: z.boolean().default(false),
})

function revalidateBenefits(): void {
  revalidatePath('/admin/benefits')
  revalidatePath('/')
}

export async function createBenefitAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = benefitSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') ?? undefined,
      category: formData.get('category') ?? undefined,
      icon: formData.get('icon') ?? undefined,
      active: formData.get('active') === null ? true : formData.get('active') === 'true',
      defaultBenefit: formData.get('defaultBenefit') === 'true',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const last = await prisma.sponsoringBenefit.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const benefit = await prisma.sponsoringBenefit.create({
      data: { ...parsed.data, order: (last?.order ?? 0) + 10 },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SponsoringBenefit',
      entityId: benefit.id,
      summary: `Leistung „${benefit.title}“ erstellt`,
    })
    revalidateBenefits()
    return success('Leistung erstellt.', {
      id: benefit.id,
      title: benefit.title,
      description: benefit.description ?? '',
      category: benefit.category,
    })
  } catch (error) {
    return fromError(error)
  }
}

export async function updateBenefitAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const id = String(formData.get('id') ?? '')
    if (!id) return failure('Ungültige Anfrage.')

    const parsed = benefitSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') ?? undefined,
      category: formData.get('category') ?? undefined,
      icon: formData.get('icon') ?? undefined,
      active: formData.get('active') === 'true',
      defaultBenefit: formData.get('defaultBenefit') === 'true',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const benefit = await prisma.sponsoringBenefit.update({ where: { id }, data: parsed.data })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SponsoringBenefit',
      entityId: id,
      summary: `Leistung „${benefit.title}“ bearbeitet`,
    })
    revalidateBenefits()
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function toggleBenefitActiveAction(id: string, active: boolean): Promise<ActionState> {
  try {
    await requireUserForAction()
    await prisma.sponsoringBenefit.update({ where: { id }, data: { active } })
    revalidateBenefits()
    return success(active ? 'Leistung aktiviert.' : 'Leistung deaktiviert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function reorderBenefitsAction(orderedIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const rows = await prisma.sponsoringBenefit.findMany({ select: { id: true } })
    const valid = new Set(rows.map((row) => row.id))
    const ids = orderedIds.filter((id) => valid.has(id))

    await prisma.$transaction(
      ids.map((id, index) => prisma.sponsoringBenefit.update({ where: { id }, data: { order: (index + 1) * 10 } })),
    )
    revalidateBenefits()
    return success('Reihenfolge gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function deleteBenefitAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const benefit = await prisma.sponsoringBenefit.findUnique({
      where: { id },
      include: { _count: { select: { pageBenefits: true } } },
    })
    if (!benefit) return failure('Diese Leistung existiert nicht mehr.')

    if (benefit._count.pageBenefits > 0) {
      return failure(
        `Diese Leistung wird auf ${benefit._count.pageBenefits} Sponsorenseite(n) verwendet. ` +
          'Deaktivieren Sie sie stattdessen, damit bestehende Seiten unverändert bleiben.',
      )
    }

    await prisma.sponsoringBenefit.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'SponsoringBenefit',
      entityId: id,
      summary: `Leistung „${benefit.title}“ gelöscht`,
    })
    revalidateBenefits()
    return success('Leistung gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}
