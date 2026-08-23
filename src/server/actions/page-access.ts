'use server'

import { headers } from 'next/headers'

import { verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { grantPageAccess } from '@/lib/page-access'
import { clientIpFrom, consumeMemoryLimit } from '@/lib/rate-limit'
import { failure, fromError, success, type ActionState } from '@/lib/result'

/**
 * Unlock a password protected sponsor page.
 * The password itself is never sent to the client – only this action can
 * validate it, and it is rate limited per page and IP.
 */
export async function unlockPageAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const slug = String(formData.get('slug') ?? '')
    const password = String(formData.get('password') ?? '')

    if (!slug || !password) {
      return failure('Bitte geben Sie das Passwort ein.')
    }

    const headerList = await headers()
    const ip = clientIpFrom(headerList)
    const limit = consumeMemoryLimit(`page:${slug}:${ip}`, 10, 10 * 60 * 1000)
    if (!limit.allowed) {
      const minutes = Math.ceil(limit.retryAfterSeconds / 60)
      return failure(`Zu viele Versuche. Bitte warten Sie ${minutes} Minute${minutes === 1 ? '' : 'n'}.`)
    }

    const page = await prisma.sponsorPage.findUnique({
      where: { slug },
      select: { id: true, status: true, visibility: true, passwordHash: true },
    })

    // Identical response for an unknown page and a wrong password.
    if (!page || page.status !== 'PUBLISHED' || page.visibility !== 'PASSWORD_PROTECTED' || !page.passwordHash) {
      return failure('Das Passwort ist nicht korrekt.')
    }

    const valid = await verifyPassword(password, page.passwordHash)
    if (!valid) {
      return failure('Das Passwort ist nicht korrekt.')
    }

    await grantPageAccess(page.id, page.passwordHash)
    return success('Zugang freigeschaltet.')
  } catch (error) {
    return fromError(error)
  }
}
