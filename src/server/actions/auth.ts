'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { verifyPassword } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { clearLoginAttempts, clientIpFrom, consumeLoginAttempt } from '@/lib/rate-limit'
import { failure, fromZod, type ActionState } from '@/lib/result'
import { createSession, destroySession, getCurrentUser, pruneExpiredSessions } from '@/lib/session'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Bitte geben Sie Ihre E-Mail-Adresse ein.').email('Bitte geben Sie eine gültige E-Mail-Adresse ein.'),
  password: z.string().min(1, 'Bitte geben Sie Ihr Passwort ein.'),
  next: z.string().max(500).optional(),
})

/** Only same-origin relative paths are accepted as a post-login redirect. */
function safeRedirect(target: string | undefined): string {
  if (!target) return '/admin'
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return '/admin'
  return target.startsWith('/admin') ? target : '/admin'
}

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    // `get` yields null when the field is absent – e.g. when /admin/login is
    // opened directly rather than through a redirect. An optional Zod string
    // rejects null, so it has to be normalised to undefined here.
    next: formData.get('next') ?? undefined,
  })

  if (!parsed.success) return fromZod(parsed.error)

  const email = parsed.data.email.toLowerCase()
  const headerList = await headers()
  const ip = clientIpFrom(headerList)

  const limit = await consumeLoginAttempt([email, ip])
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60)
    return failure(
      `Zu viele Anmeldeversuche. Bitte versuchen Sie es in ${minutes} Minute${minutes === 1 ? '' : 'n'} erneut.`,
    )
  }

  const user = await prisma.adminUser.findUnique({ where: { email } })
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash)

  if (!user || !valid || !user.active) {
    await logActivity({
      action: 'LOGIN_FAILED',
      entityType: 'AdminUser',
      summary: `Fehlgeschlagene Anmeldung für ${email}`,
    })
    // Deliberately identical message for unknown user and wrong password.
    return failure('E-Mail-Adresse oder Passwort ist nicht korrekt.')
  }

  await clearLoginAttempts([email, ip])
  await pruneExpiredSessions()
  await createSession(user)
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
  await logActivity({
    userId: user.id,
    action: 'LOGIN',
    entityType: 'AdminUser',
    entityId: user.id,
    summary: `${user.name} hat sich angemeldet`,
  })

  redirect(safeRedirect(parsed.data.next))
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser()
  if (user) {
    await logActivity({
      userId: user.id,
      action: 'LOGOUT',
      entityType: 'AdminUser',
      entityId: user.id,
      summary: `${user.name} hat sich abgemeldet`,
    })
  }
  await destroySession()
  redirect('/admin/login')
}
