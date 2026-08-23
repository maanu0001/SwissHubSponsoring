import 'server-only'

import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { AdminUser } from '@prisma/client'

import { prisma } from './db'
import { env } from './env'
import { generateToken, hashToken } from './auth'

export const SESSION_COOKIE = 'swisshub_session'

export interface SessionUser {
  id: string
  email: string
  name: string
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.appUrl.startsWith('https://'),
  path: '/',
} as const

/** Create a session row and set the session cookie. */
export async function createSession(user: AdminUser): Promise<void> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + env.sessionMaxAgeSeconds * 1000)
  const headerList = await headers()

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt,
      userAgent: headerList.get('user-agent')?.slice(0, 400) ?? null,
    },
  })

  const store = await cookies()
  store.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt })
}

/** Resolve the current admin user, or null when not signed in. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })

  if (!session || session.expiresAt.getTime() < Date.now() || !session.user.active) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  }
})

/** Guard for admin pages and server actions. Redirects to the login page. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    const target = returnTo ? `/admin/login?next=${encodeURIComponent(returnTo)}` : '/admin/login'
    redirect(target)
  }
  return user
}

/**
 * Guard for server actions. Throws instead of redirecting so that callers can
 * surface a proper error state in the UI.
 */
export async function requireUserForAction(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Nicht angemeldet. Bitte melden Sie sich erneut an.')
  }
  return user
}

/** Destroy the current session and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }
  store.delete(SESSION_COOKIE)
}

/** Remove expired sessions and stale login attempts. Cheap, runs opportunistically. */
export async function pruneExpiredSessions(): Promise<void> {
  const now = new Date()
  await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } })
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - env.loginWindowSeconds * 1000) } },
  })
}
