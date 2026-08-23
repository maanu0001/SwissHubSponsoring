'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { SectionType, TemplateType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { sanitizeRichText } from '@/lib/sanitize'
import { sectionDataSchema } from '@/lib/section-data'
import { requireUserForAction } from '@/lib/session'
import { isValidSlug, slugify, uniqueSlug } from '@/lib/slug'
import { parseTemplateStructure } from '@/server/page-builder'

function revalidateTemplates(id?: string): void {
  revalidatePath('/admin/templates')
  if (id) revalidatePath(`/admin/templates/${id}`)
}

const templateSchema = z.object({
  name: z.string().trim().min(2, 'Bitte geben Sie einen Namen ein.').max(160),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(1000).optional().transform((value) => value || null),
  type: z.nativeEnum(TemplateType).default('STANDARD'),
  active: z.boolean().default(true),
})

export async function createTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = templateSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug') ?? undefined,
      description: formData.get('description') ?? undefined,
      type: formData.get('type') ?? 'STANDARD',
      active: formData.get('active') !== 'false',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const desired = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name)
    if (parsed.data.slug && !isValidSlug(desired)) {
      return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
    }
    const slug = await uniqueSlug(desired, async (candidate) => {
      const existing = await prisma.pageTemplate.findUnique({ where: { slug: candidate }, select: { id: true } })
      return Boolean(existing)
    })

    const last = await prisma.pageTemplate.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
    const copyFrom = String(formData.get('copyFrom') ?? '')

    let structure: Prisma.InputJsonValue = { sections: [] }
    if (copyFrom) {
      const source = await prisma.pageTemplate.findUnique({ where: { id: copyFrom } })
      if (source) structure = source.structure as Prisma.InputJsonValue
    }

    const template = await prisma.pageTemplate.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        type: parsed.data.type,
        active: parsed.data.active,
        order: (last?.order ?? 0) + 10,
        structure,
      },
    })

    // Copy the default benefit selection as well, if requested.
    if (copyFrom) {
      const defaults = await prisma.pageTemplateBenefit.findMany({
        where: { templateId: copyFrom },
        orderBy: { order: 'asc' },
      })
      if (defaults.length > 0) {
        await prisma.pageTemplateBenefit.createMany({
          data: defaults.map((entry) => ({
            templateId: template.id,
            benefitId: entry.benefitId,
            order: entry.order,
          })),
        })
      }
    }

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'PageTemplate',
      entityId: template.id,
      summary: `Template „${template.name}“ erstellt`,
    })
    revalidateTemplates(template.id)
    return success('Template erstellt.', { id: template.id })
  } catch (error) {
    return fromError(error)
  }
}

export async function updateTemplateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const id = String(formData.get('id') ?? '')
    if (!id) return failure('Ungültige Anfrage.')

    const existing = await prisma.pageTemplate.findUnique({ where: { id } })
    if (!existing) return failure('Dieses Template existiert nicht mehr.')

    const parsed = templateSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug') ?? undefined,
      description: formData.get('description') ?? undefined,
      type: formData.get('type') ?? 'STANDARD',
      active: formData.get('active') !== 'false',
    })
    if (!parsed.success) return fromZod(parsed.error)

    let slug = existing.slug
    if (parsed.data.slug) {
      const candidate = slugify(parsed.data.slug)
      if (!isValidSlug(candidate)) {
        return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
      }
      if (candidate !== existing.slug) {
        const taken = await prisma.pageTemplate.findUnique({ where: { slug: candidate }, select: { id: true } })
        if (taken) return failure('Dieser Slug ist bereits vergeben.', { slug: 'Bereits vergeben.' })
        slug = candidate
      }
    }

    const template = await prisma.pageTemplate.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        type: parsed.data.type,
        active: parsed.data.active,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'PageTemplate',
      entityId: id,
      summary: `Template „${template.name}“ bearbeitet`,
    })
    revalidateTemplates(id)
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

const structureSectionSchema = z.object({
  type: z.nativeEnum(SectionType),
  title: z.string().max(200).default(''),
  subtitle: z.string().max(300).default(''),
  content: z.string().max(60000).default(''),
  data: z.unknown().optional(),
  visible: z.boolean().default(true),
})

/** Replace a template's blueprint sections. Existing pages are never touched. */
export async function updateTemplateStructureAction(templateId: string, sectionsJson: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const template = await prisma.pageTemplate.findUnique({ where: { id: templateId } })
    if (!template) return failure('Dieses Template existiert nicht mehr.')

    let raw: unknown
    try {
      raw = JSON.parse(sectionsJson)
    } catch {
      return failure('Die Struktur konnte nicht gelesen werden.')
    }

    const parsed = z.array(structureSectionSchema).max(60).safeParse(raw)
    if (!parsed.success) return failure('Die Struktur ist ungültig.')

    const sections = parsed.data.map((section, index) => {
      const data = sectionDataSchema.safeParse(section.data ?? {})
      return {
        type: section.type,
        title: section.title,
        subtitle: section.subtitle,
        content: sanitizeRichText(section.content),
        data: (data.success ? data.data : {}) as Prisma.InputJsonValue,
        order: (index + 1) * 10,
        visible: section.visible,
      }
    })

    await prisma.pageTemplate.update({
      where: { id: templateId },
      data: { structure: { sections } as Prisma.InputJsonValue },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'PageTemplate',
      entityId: templateId,
      summary: `Struktur von Template „${template.name}“ aktualisiert`,
    })
    revalidateTemplates(templateId)
    return success('Struktur gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function setTemplateBenefitsAction(templateId: string, benefitIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const template = await prisma.pageTemplate.findUnique({ where: { id: templateId }, select: { id: true } })
    if (!template) return failure('Dieses Template existiert nicht mehr.')

    const valid = benefitIds.length
      ? (await prisma.sponsoringBenefit.findMany({ where: { id: { in: benefitIds } }, select: { id: true } })).map(
          (benefit) => benefit.id,
        )
      : []
    const ordered = benefitIds.filter((id) => valid.includes(id))

    await prisma.$transaction([
      prisma.pageTemplateBenefit.deleteMany({ where: { templateId } }),
      ...ordered.map((benefitId, index) =>
        prisma.pageTemplateBenefit.create({ data: { templateId, benefitId, order: (index + 1) * 10 } }),
      ),
    ])

    revalidateTemplates(templateId)
    return success('Standardleistungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function deleteTemplateAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const template = await prisma.pageTemplate.findUnique({
      where: { id },
      include: { _count: { select: { pages: true } } },
    })
    if (!template) return failure('Dieses Template existiert nicht mehr.')

    // Pages keep working – the relation is ON DELETE SET NULL – but warn anyway.
    await prisma.pageTemplate.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'PageTemplate',
      entityId: id,
      summary: `Template „${template.name}“ gelöscht`,
    })
    revalidateTemplates()
    return success('Template gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

/** Convert an existing sponsor page into a reusable template. */
export async function createTemplateFromPageAction(pageId: string, name: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const page = await prisma.sponsorPage.findUnique({
      where: { id: pageId },
      include: { sections: { orderBy: { order: 'asc' } }, benefits: { orderBy: { order: 'asc' } } },
    })
    if (!page) return failure('Diese Seite existiert nicht mehr.')

    const slug = await uniqueSlug(name || 'template', async (candidate) => {
      const existing = await prisma.pageTemplate.findUnique({ where: { slug: candidate }, select: { id: true } })
      return Boolean(existing)
    })

    const last = await prisma.pageTemplate.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })

    const template = await prisma.pageTemplate.create({
      data: {
        name: name.trim() || 'Neues Template',
        slug,
        description: 'Aus einer bestehenden Sponsorenseite erstellt.',
        type: 'CUSTOM',
        active: true,
        order: (last?.order ?? 0) + 10,
        structure: {
          sections: page.sections.map((section, index) => ({
            type: section.type,
            title: section.title ?? '',
            subtitle: section.subtitle ?? '',
            content: section.content ?? '',
            data: section.data ?? {},
            order: (index + 1) * 10,
            visible: section.visible,
          })),
        } as Prisma.InputJsonValue,
        defaultBenefits: {
          create: page.benefits.map((entry, index) => ({
            benefitId: entry.benefitId,
            order: (index + 1) * 10,
          })),
        },
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'PageTemplate',
      entityId: template.id,
      summary: `Template „${template.name}“ aus einer Sponsorenseite erstellt`,
    })
    revalidateTemplates(template.id)
    return success('Template erstellt.', { id: template.id })
  } catch (error) {
    return fromError(error)
  }
}

/** Read the blueprint sections for the template editor. */
export async function templateSectionsAction(templateId: string) {
  await requireUserForAction()
  const template = await prisma.pageTemplate.findUnique({ where: { id: templateId } })
  if (!template) return []
  return parseTemplateStructure(template.structure)
}
