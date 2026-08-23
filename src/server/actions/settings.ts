'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { logActivity } from '@/lib/activity'
import { checkPasswordPolicy, hashPassword, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { failure, fromError, fromZod, success, type ActionState } from '@/lib/result'
import { sanitizeRichText } from '@/lib/sanitize'
import { requireUserForAction } from '@/lib/session'
import { SETTING_DEFINITIONS, definitionFor, isHexColor } from '@/lib/settings'

/**
 * Persist a group of settings. Only keys from the canonical definition list are
 * accepted, so a crafted request cannot introduce arbitrary settings.
 */
export async function updateSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const group = String(formData.get('__group') ?? '')

    const definitions = group
      ? SETTING_DEFINITIONS.filter((definition) => definition.group === group)
      : SETTING_DEFINITIONS

    if (definitions.length === 0) return failure('Unbekannter Einstellungsbereich.')

    const errors: Record<string, string> = {}
    const updates: { key: string; value: string }[] = []

    for (const definition of definitions) {
      const raw = formData.get(definition.key)
      if (raw === null) continue
      let value = String(raw).trim()

      if (definition.type === 'COLOR' && value && !isHexColor(value)) {
        errors[definition.key] = 'Bitte geben Sie eine gültige Hex-Farbe an, z. B. #83060A.'
        continue
      }
      if (definition.type === 'HTML') {
        value = sanitizeRichText(value)
      }
      if (definition.key === 'contact.email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[definition.key] = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
        continue
      }
      if (value.length > 100000) {
        errors[definition.key] = 'Der Wert ist zu lang.'
        continue
      }

      updates.push({ key: definition.key, value })
    }

    if (Object.keys(errors).length > 0) {
      return { status: 'error', message: 'Bitte prüfen Sie die markierten Felder.', errors }
    }

    await prisma.$transaction(
      updates.map((update) => {
        const definition = definitionFor(update.key)
        return prisma.siteSetting.upsert({
          where: { key: update.key },
          create: {
            key: update.key,
            value: update.value,
            type: definition?.type ?? 'STRING',
            label: definition?.label,
            group: definition?.group ?? 'general',
            order: definition?.order ?? 0,
          },
          update: { value: update.value },
        })
      }),
    )

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SiteSetting',
      summary: `Einstellungen (${group || 'alle'}) aktualisiert`,
    })

    // Branding and legal text appear on every public surface.
    revalidatePath('/', 'layout')
    revalidatePath('/admin', 'layout')
    return success('Einstellungen gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

const accountSchema = z.object({
  name: z.string().trim().min(2, 'Bitte geben Sie einen Namen ein.').max(120),
  email: z.string().trim().email('Bitte geben Sie eine gültige E-Mail-Adresse ein.').max(200),
})

export async function updateAccountAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const parsed = accountSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
    })
    if (!parsed.success) return fromZod(parsed.error)

    const email = parsed.data.email.toLowerCase()
    if (email !== user.email) {
      const taken = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } })
      if (taken && taken.id !== user.id) {
        return failure('Diese E-Mail-Adresse wird bereits verwendet.', { email: 'Bereits vergeben.' })
      }
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { name: parsed.data.name, email },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'AdminUser',
      entityId: user.id,
      summary: 'Kontodaten aktualisiert',
    })
    revalidatePath('/admin', 'layout')
    return success('Kontodaten gespeichert.')
  } catch (error) {
    return fromError(error)
  }
}

export async function changePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const current = String(formData.get('currentPassword') ?? '')
    const next = String(formData.get('newPassword') ?? '')
    const confirm = String(formData.get('confirmPassword') ?? '')

    if (!current || !next) {
      return failure('Bitte füllen Sie alle Felder aus.')
    }
    if (next !== confirm) {
      return failure('Die Passwörter stimmen nicht überein.', { confirmPassword: 'Stimmt nicht überein.' })
    }

    const policy = checkPasswordPolicy(next)
    if (!policy.ok) {
      const message = policy.message ?? 'Das Passwort ist zu schwach.'
      return failure(message, { newPassword: message })
    }

    const record = await prisma.adminUser.findUnique({ where: { id: user.id } })
    if (!record) return failure('Konto nicht gefunden.')

    const valid = await verifyPassword(current, record.passwordHash)
    if (!valid) {
      return failure('Das aktuelle Passwort ist nicht korrekt.', { currentPassword: 'Nicht korrekt.' })
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(next) },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'AdminUser',
      entityId: user.id,
      summary: 'Passwort geändert',
    })
    return success('Passwort geändert. Ihre anderen Sitzungen bleiben bestehen.')
  } catch (error) {
    return fromError(error)
  }
}

/** Sign out of every other browser by deleting all sessions of this account. */
export async function revokeOtherSessionsAction(): Promise<ActionState> {
  try {
    const user = await requireUserForAction()
    const { SESSION_COOKIE } = await import('@/lib/session')
    const { cookies } = await import('next/headers')
    const { hashToken } = await import('@/lib/auth')

    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    const currentHash = token ? hashToken(token) : ''

    const result = await prisma.session.deleteMany({
      where: { userId: user.id, ...(currentHash ? { tokenHash: { not: currentHash } } : {}) },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'AdminUser',
      entityId: user.id,
      summary: `${result.count} andere Sitzung(en) beendet`,
    })
    return success(
      result.count === 0
        ? 'Es waren keine weiteren Sitzungen aktiv.'
        : `${result.count} andere Sitzung(en) beendet.`,
    )
  } catch (error) {
    return fromError(error)
  }
}
