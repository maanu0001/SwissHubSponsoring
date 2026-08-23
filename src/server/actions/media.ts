'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { isSafeExternalUrl, normaliseUrl } from '@/lib/media'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { requireUserForAction } from '@/lib/session'
import { UploadError, deleteUpload, imageDimensions, storeUpload } from '@/lib/storage'

const MAX_FILES = 20

function revalidateMedia(): void {
  revalidatePath('/admin/media')
}

/** Upload one or more files into the media library. */
export async function uploadMediaAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0)

    if (files.length === 0) {
      return failure('Bitte wählen Sie mindestens eine Datei aus.')
    }
    if (files.length > MAX_FILES) {
      return failure(`Es können maximal ${MAX_FILES} Dateien gleichzeitig hochgeladen werden.`)
    }

    const altText = String(formData.get('altText') ?? '').trim().slice(0, 300)
    const created: string[] = []
    const errors: string[] = []

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.slice(0, 64 * 1024).arrayBuffer())
        const stored = await storeUpload(file)
        const dimensions = stored.kind === 'IMAGE' ? imageDimensions(buffer, stored.mimeType) : null

        const media = await prisma.media.create({
          data: {
            title: file.name.replace(/\.[^.]+$/, '').slice(0, 180) || 'Datei',
            altText: altText || null,
            type: stored.kind,
            sourceType: 'UPLOAD',
            filePath: stored.relativePath,
            mimeType: stored.mimeType,
            fileSize: stored.size,
            width: dimensions?.width ?? null,
            height: dimensions?.height ?? null,
          },
        })
        created.push(media.id)
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof UploadError ? error.message : 'Upload fehlgeschlagen.'}`)
      }
    }

    if (created.length > 0) {
      await logActivity({
        userId: user.id,
        action: 'UPLOAD',
        entityType: 'Media',
        entityId: created[0],
        summary: `${created.length} Datei(en) hochgeladen`,
      })
      revalidateMedia()
    }

    if (errors.length > 0 && created.length === 0) {
      return failure(errors.join(' · '))
    }
    if (errors.length > 0) {
      return success(`${created.length} Datei(en) hochgeladen. Nicht übernommen: ${errors.join(' · ')}`, {
        mediaId: created[0] ?? '',
      })
    }
    return success(
      created.length === 1 ? 'Datei hochgeladen.' : `${created.length} Dateien hochgeladen.`,
      { mediaId: created[0] ?? '' },
    )
  } catch (error) {
    return fromError(error)
  }
}

const externalSchema = z.object({
  title: z.string().trim().min(1, 'Bitte geben Sie einen Titel ein.').max(180),
  url: z.string().trim().min(1, 'Bitte geben Sie eine URL ein.'),
  altText: z.string().trim().max(300).optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).default('IMAGE'),
})

/** Register an externally hosted image or video by URL. */
export async function createExternalMediaAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = externalSchema.safeParse({
      title: formData.get('title'),
      url: formData.get('url'),
      altText: formData.get('altText') ?? undefined,
      type: formData.get('type') ?? 'IMAGE',
    })
    if (!parsed.success) return fromZod(parsed.error)

    const url = normaliseUrl(parsed.data.url)
    if (!url || !isSafeExternalUrl(url)) {
      return failure('Bitte geben Sie eine gültige http(s)-URL ein.', { url: 'Ungültige URL.' })
    }

    const media = await prisma.media.create({
      data: {
        title: parsed.data.title,
        altText: parsed.data.altText || null,
        type: parsed.data.type,
        sourceType: 'EXTERNAL',
        externalUrl: url,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Media',
      entityId: media.id,
      summary: `Externes Medium „${media.title}“ hinzugefügt`,
    })
    revalidateMedia()
    return success('Externes Medium hinzugefügt.', { mediaId: media.id })
  } catch (error) {
    return fromError(error)
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Bitte geben Sie einen Titel ein.').max(180),
  altText: z.string().trim().max(300).optional(),
})

export async function updateMediaAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = updateSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title'),
      altText: formData.get('altText') ?? undefined,
    })
    if (!parsed.success) return fromZod(parsed.error)

    await prisma.media.update({
      where: { id: parsed.data.id },
      data: { title: parsed.data.title, altText: parsed.data.altText || null },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Media',
      entityId: parsed.data.id,
      summary: `Medium „${parsed.data.title}“ bearbeitet`,
    })
    revalidateMedia()
    revalidatePath('/', 'layout')
    return success('Änderungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

/** Delete a media record and, for uploads, the file on disk. */
export async function deleteMediaAction(id: string): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const media = await prisma.media.findUnique({ where: { id } })
    if (!media) return failure('Dieses Medium existiert nicht mehr.')

    // Relations use ON DELETE SET NULL, so referencing records stay intact.
    await prisma.media.delete({ where: { id } })
    if (media.sourceType === 'UPLOAD') {
      await deleteUpload(media.filePath)
    }

    await logActivity({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Media',
      entityId: id,
      summary: `Medium „${media.title}“ gelöscht`,
    })
    revalidateMedia()
    revalidatePath('/', 'layout')
    return success('Medium gelöscht.')
  } catch (error) {
    return fromError(error)
  }
}

/** Used by the MediaPicker to search the library without a full page load. */
export async function searchMediaAction(query: string, type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT') {
  await requireUserForAction()
  const trimmed = query.trim()

  return prisma.media.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(trimmed
        ? {
            OR: [
              { title: { contains: trimmed, mode: 'insensitive' as const } },
              { altText: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })
}
