'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { TournamentStatus } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { isSafeExternalUrl, normaliseUrl } from '@/lib/media'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { requireUserForAction } from '@/lib/session'
import { isValidSlug, slugify, uniqueSlug } from '@/lib/slug'

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => (value ? value : null))

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null
    const parsed = Number.parseInt(value.replace(/[^\d-]/g, ''), 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  })

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  })

const tournamentSchema = z.object({
  title: z.string().trim().min(2, 'Bitte geben Sie einen Turniernamen ein.').max(200),
  slug: z.string().trim().max(80).optional(),
  game: z.string().trim().min(1, 'Bitte geben Sie das Spiel an.').max(120),
  description: optionalText(4000),
  startDate: optionalDate,
  endDate: optionalDate,
  format: optionalText(400),
  participantCount: optionalInt,
  expectedParticipantCount: optionalInt,
  streamViewerCount: optionalInt,
  status: z.nativeEnum(TournamentStatus).default('PLANNED'),
  twitchUrl: optionalText(600),
  vodUrl: optionalText(600),
  heroImageId: optionalText(60),
  internalNotes: optionalText(5000),
  featured: z.boolean().default(true),
})

function parseForm(formData: FormData) {
  return tournamentSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug') ?? undefined,
    game: formData.get('game'),
    description: formData.get('description') ?? undefined,
    startDate: formData.get('startDate') ?? undefined,
    endDate: formData.get('endDate') ?? undefined,
    format: formData.get('format') ?? undefined,
    participantCount: formData.get('participantCount') ?? undefined,
    expectedParticipantCount: formData.get('expectedParticipantCount') ?? undefined,
    streamViewerCount: formData.get('streamViewerCount') ?? undefined,
    status: formData.get('status') ?? 'PLANNED',
    twitchUrl: formData.get('twitchUrl') ?? undefined,
    vodUrl: formData.get('vodUrl') ?? undefined,
    heroImageId: formData.get('heroImageId') ?? undefined,
    internalNotes: formData.get('internalNotes') ?? undefined,
    featured: formData.get('featured') !== 'false',
  })
}

function revalidateTournaments(id?: string): void {
  revalidatePath('/admin/tournaments')
  revalidatePath('/admin')
  revalidatePath('/')
  if (id) revalidatePath(`/admin/tournaments/${id}`)
}

function validateUrls(twitchUrl: string | null, vodUrl: string | null): Record<string, string> | null {
  const errors: Record<string, string> = {}
  if (twitchUrl && !isSafeExternalUrl(normaliseUrl(twitchUrl) ?? '')) {
    errors.twitchUrl = 'Bitte geben Sie eine gültige http(s)-URL ein.'
  }
  if (vodUrl && !isSafeExternalUrl(normaliseUrl(vodUrl) ?? '')) {
    errors.vodUrl = 'Bitte geben Sie eine gültige http(s)-URL ein.'
  }
  return Object.keys(errors).length > 0 ? errors : null
}

export async function createTournamentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = parseForm(formData)
    if (!parsed.success) return fromZod(parsed.error)
    const data = parsed.data

    const urlErrors = validateUrls(data.twitchUrl, data.vodUrl)
    if (urlErrors) return failure('Bitte prüfen Sie die Links.', urlErrors)

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      return failure('Das Enddatum liegt vor dem Startdatum.', { endDate: 'Muss nach dem Startdatum liegen.' })
    }

    const desired = data.slug ? slugify(data.slug) : slugify(data.title)
    if (data.slug && !isValidSlug(desired)) {
      return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
    }
    const slug = await uniqueSlug(desired, async (candidate) => {
      const existing = await prisma.tournament.findUnique({ where: { slug: candidate }, select: { id: true } })
      return Boolean(existing)
    })

    const last = await prisma.tournament.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })

    const tournament = await prisma.tournament.create({
      data: {
        ...data,
        slug,
        twitchUrl: normaliseUrl(data.twitchUrl),
        vodUrl: normaliseUrl(data.vodUrl),
        order: (last?.order ?? 0) + 10,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Tournament',
      entityId: tournament.id,
      summary: `Turnier „${tournament.title}“ erstellt`,
    })
    revalidateTournaments(tournament.id)
    return success('Turnier erstellt.', { id: tournament.id, title: tournament.title, game: tournament.game })
  } catch (error) {
    return fromError(error)
  }
}

export async function updateTournamentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const id = String(formData.get('id') ?? '')
    if (!id) return failure('Ungültige Anfrage.')

    const existing = await prisma.tournament.findUnique({ where: { id } })
    if (!existing) return failure('Dieses Turnier existiert nicht mehr.')

    const parsed = parseForm(formData)
    if (!parsed.success) return fromZod(parsed.error)
    const data = parsed.data

    const urlErrors = validateUrls(data.twitchUrl, data.vodUrl)
    if (urlErrors) return failure('Bitte prüfen Sie die Links.', urlErrors)

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      return failure('Das Enddatum liegt vor dem Startdatum.', { endDate: 'Muss nach dem Startdatum liegen.' })
    }

    let slug = existing.slug
    if (data.slug) {
      const candidate = slugify(data.slug)
      if (!isValidSlug(candidate)) {
        return failure('Der Slug ist ungültig.', { slug: 'Nur Kleinbuchstaben, Zahlen und Bindestriche.' })
      }
      if (candidate !== existing.slug) {
        const taken = await prisma.tournament.findUnique({ where: { slug: candidate }, select: { id: true } })
        if (taken) return failure('Dieser Slug ist bereits vergeben.', { slug: 'Bereits vergeben.' })
        slug = candidate
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...data,
        slug,
        twitchUrl: normaliseUrl(data.twitchUrl),
        vodUrl: normaliseUrl(data.vodUrl),
      },
    })

    await logActivity({
      userId: user.id,
      action: existing.status !== data.status ? 'STATUS_CHANGE' : 'UPDATE',
      entityType: 'Tournament',
      entityId: id,
      summary: `Turnier „${tournament.title}“ bearbeitet`,
    })
    revalidateTournaments(id)
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

/** Compact creation used inside the sponsor wizard. */
export async function quickCreateTournamentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const data = new FormData()
  data.set('title', String(formData.get('title') ?? ''))
  data.set('game', String(formData.get('game') ?? ''))
  data.set('status', String(formData.get('status') ?? 'PLANNED'))
  data.set('startDate', String(formData.get('startDate') ?? ''))
  data.set('format', 'Online · 2 Turniertage · Gruppenphase, Halbfinale, Finale')
  return createTournamentAction(_previous, data)
}

export async function setTournamentStatusAction(id: string, status: TournamentStatus): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) return failure('Dieses Turnier existiert nicht mehr.')

    await prisma.tournament.update({ where: { id }, data: { status } })
    await logActivity({
      userId: user.id,
      action: status === 'ARCHIVED' ? 'ARCHIVE' : 'STATUS_CHANGE',
      entityType: 'Tournament',
      entityId: id,
      summary: `Status von „${tournament.title}“ geändert`,
      metadata: { from: tournament.status, to: status },
    })
    revalidateTournaments(id)
    return success('Status aktualisiert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function deleteTournamentAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { pages: true } } },
    })
    if (!tournament) return failure('Dieses Turnier existiert nicht mehr.')

    if (tournament._count.pages > 0) {
      return failure(
        `Dieses Turnier ist mit ${tournament._count.pages} Sponsorenseite(n) verknüpft. ` +
          'Archivieren Sie es stattdessen, damit die Zuordnung erhalten bleibt.',
      )
    }

    await prisma.tournament.delete({ where: { id } })
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Tournament',
      entityId: id,
      summary: `Turnier „${tournament.title}“ gelöscht`,
    })
    revalidateTournaments()
    return success('Turnier gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

export async function setTournamentMediaAction(tournamentId: string, mediaIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true } })
    if (!tournament) return failure('Dieses Turnier existiert nicht mehr.')

    const valid = mediaIds.length
      ? (await prisma.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true } })).map((m) => m.id)
      : []
    const ordered = mediaIds.filter((id) => valid.includes(id))

    await prisma.$transaction([
      prisma.tournamentMedia.deleteMany({ where: { tournamentId } }),
      ...ordered.map((mediaId, index) =>
        prisma.tournamentMedia.create({ data: { tournamentId, mediaId, order: (index + 1) * 10 } }),
      ),
    ])

    revalidateTournaments(tournamentId)
    return success('Galerie gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function reorderTournamentsAction(orderedIds: string[]): Promise<ActionState> {
  try {
    await requireUserForAction()
    const rows = await prisma.tournament.findMany({ select: { id: true } })
    const valid = new Set(rows.map((row) => row.id))
    const ids = orderedIds.filter((id) => valid.has(id))

    await prisma.$transaction(
      ids.map((id, index) => prisma.tournament.update({ where: { id }, data: { order: (index + 1) * 10 } })),
    )
    revalidateTournaments()
    return success('Reihenfolge gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}
