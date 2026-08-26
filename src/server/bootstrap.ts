import 'server-only'

import type { Prisma } from '@prisma/client'

import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import { defaultVisibilityFor } from '@/lib/pdf-sections'
import { SETTING_DEFINITIONS } from '@/lib/settings'
import { sanitizeRichText } from '@/lib/sanitize'

import {
  BENEFITS,
  LEGAL_PLACEHOLDER_IMPRINT,
  LEGAL_PLACEHOLDER_PRIVACY,
  PARTNERS,
  SITE_SECTIONS,
  TEMPLATES,
  TOURNAMENTS,
} from './seed-data'

/**
 * Idempotent seeding.
 * Runs on every application start and only ever fills in what is missing, so
 * an operator's edits are never overwritten.
 */
export async function bootstrap(options: { verbose?: boolean } = {}): Promise<void> {
  const log = (message: string) => {
    if (options.verbose) console.log(`[bootstrap] ${message}`)
  }

  await seedSettings(log)
  await seedBenefits(log)
  await seedTemplates(log)
  await seedTournaments(log)
  await seedPartners(log)
  await seedSiteSections(log)
  await seedAdminUser(log)
}

type Log = (message: string) => void

async function seedSettings(log: Log): Promise<void> {
  const existing = new Set((await prisma.siteSetting.findMany({ select: { key: true } })).map((row) => row.key))

  const missing = SETTING_DEFINITIONS.filter((definition) => !existing.has(definition.key))
  if (missing.length === 0) return

  for (const definition of missing) {
    let value = definition.defaultValue
    if (definition.key === 'legal.imprint') value = LEGAL_PLACEHOLDER_IMPRINT
    if (definition.key === 'legal.privacy') value = LEGAL_PLACEHOLDER_PRIVACY

    await prisma.siteSetting.create({
      data: {
        key: definition.key,
        value,
        type: definition.type,
        label: definition.label,
        group: definition.group,
        order: definition.order,
      },
    })
  }
  log(`${missing.length} Einstellungen angelegt`)
}

async function seedBenefits(log: Log): Promise<void> {
  const count = await prisma.sponsoringBenefit.count()
  if (count > 0) return

  await prisma.sponsoringBenefit.createMany({
    data: BENEFITS.map((benefit, index) => ({
      title: benefit.title,
      description: benefit.description,
      category: benefit.category,
      defaultBenefit: benefit.defaultBenefit,
      active: true,
      order: (index + 1) * 10,
    })),
  })
  log(`${BENEFITS.length} Leistungen angelegt`)
}

async function seedTemplates(log: Log): Promise<void> {
  const benefits = await prisma.sponsoringBenefit.findMany({ select: { id: true, title: true } })
  const byTitle = new Map(benefits.map((benefit) => [benefit.title, benefit.id]))

  let created = 0
  for (const seed of TEMPLATES) {
    const existing = await prisma.pageTemplate.findUnique({ where: { slug: seed.slug } })
    if (existing) continue

    const structure: Prisma.InputJsonValue = {
      sections: seed.sections.map((section, index) => {
        const defaults = defaultVisibilityFor(section.type)
        return {
          type: section.type,
          title: section.title ?? '',
          subtitle: section.subtitle ?? '',
          content: sanitizeRichText(section.content ?? ''),
          data: (section.data ?? {}) as Prisma.InputJsonValue,
          order: (index + 1) * 10,
          visibleOnWeb: section.visible !== false,
          visibleInShortPdf: defaults.shortPdf,
          visibleInFullPdf: defaults.fullPdf,
          pdfOrder: null,
        }
      }),
    }

    await prisma.pageTemplate.create({
      data: {
        name: seed.name,
        slug: seed.slug,
        description: seed.description,
        type: seed.type,
        order: seed.order,
        active: true,
        structure,
        defaultBenefits: {
          create: seed.defaultBenefitTitles
            .map((title, index) => ({ benefitId: byTitle.get(title), order: (index + 1) * 10 }))
            .filter((entry): entry is { benefitId: string; order: number } => Boolean(entry.benefitId)),
        },
      },
    })
    created += 1
  }
  if (created > 0) log(`${created} Templates angelegt`)
}

async function seedTournaments(log: Log): Promise<void> {
  const count = await prisma.tournament.count()
  if (count > 0) return

  for (const seed of TOURNAMENTS) {
    await prisma.tournament.create({
      data: {
        title: seed.title,
        slug: seed.slug,
        game: seed.game,
        description: seed.description,
        format: seed.format,
        participantCount: seed.participantCount,
        streamViewerCount: seed.streamViewerCount,
        status: seed.status,
        order: seed.order,
        featured: true,
      },
    })
  }
  log(`${TOURNAMENTS.length} Turniere angelegt`)
}

async function seedPartners(log: Log): Promise<void> {
  const count = await prisma.partnerReference.count()
  if (count > 0) return

  await prisma.partnerReference.createMany({
    data: PARTNERS.map((partner) => ({
      name: partner.name,
      website: partner.website || null,
      description: partner.description,
      order: partner.order,
      visible: true,
    })),
  })
  log(`${PARTNERS.length} Partner-Referenzen angelegt`)
}

async function seedSiteSections(log: Log): Promise<void> {
  const existing = new Set((await prisma.siteSection.findMany({ select: { key: true } })).map((row) => row.key))
  const missing = SITE_SECTIONS.filter((section) => !existing.has(section.key))
  if (missing.length === 0) return

  for (const section of missing) {
    await prisma.siteSection.create({
      data: {
        key: section.key,
        type: section.type,
        title: section.title,
        subtitle: section.subtitle ?? null,
        content: sanitizeRichText(section.content ?? '') || null,
        data: (section.data ?? {}) as Prisma.InputJsonValue,
        order: section.order,
        visible: section.visible !== false,
      },
    })
  }
  log(`${missing.length} Sektionen der Hauptseite angelegt`)
}

async function seedAdminUser(log: Log): Promise<void> {
  const count = await prisma.adminUser.count()
  if (count > 0) return

  const email = env.adminEmail.trim().toLowerCase()
  const password = env.adminInitialPassword

  if (!email || !password) {
    console.warn(
      '[bootstrap] Kein Admin-Konto vorhanden. Setzen Sie ADMIN_EMAIL und ADMIN_INITIAL_PASSWORD ' +
        'oder legen Sie ein Konto mit "npm run admin:create" an.',
    )
    return
  }

  await prisma.adminUser.create({
    data: {
      email,
      name: 'SwissHub Admin',
      passwordHash: await hashPassword(password),
    },
  })
  log(`Admin-Konto ${email} angelegt`)
  console.warn(
    `[bootstrap] Admin-Konto "${email}" wurde mit dem Passwort aus ADMIN_INITIAL_PASSWORD angelegt. ` +
      'Bitte ändern Sie dieses Passwort nach der ersten Anmeldung unter /admin/settings/account.',
  )
}
