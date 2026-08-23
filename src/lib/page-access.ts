import 'server-only'

import { createHmac } from 'node:crypto'
import { cookies } from 'next/headers'

import { env } from './env'
import { safeEqual } from './auth'

/**
 * Access to a password protected sponsor page is granted through a signed
 * cookie. The signature includes the page's password hash, so changing the
 * password immediately invalidates every previously granted cookie.
 * No server side session storage is required.
 */

function cookieName(pageId: string): string {
  return `shp_${pageId.slice(0, 24)}`
}

function sign(pageId: string, passwordHash: string, expiresAt: number): string {
  return createHmac('sha256', env.authSecret)
    .update(`${pageId}:${passwordHash}:${expiresAt}`)
    .digest('base64url')
}

export async function grantPageAccess(pageId: string, passwordHash: string): Promise<void> {
  const expiresAt = Date.now() + env.pagePasswordMaxAgeSeconds * 1000
  const value = `${expiresAt}.${sign(pageId, passwordHash, expiresAt)}`

  const store = await cookies()
  store.set(cookieName(pageId), value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.appUrl.startsWith('https://'),
    path: '/',
    expires: new Date(expiresAt),
  })
}

export async function hasPageAccess(pageId: string, passwordHash: string | null): Promise<boolean> {
  if (!passwordHash) return true

  const store = await cookies()
  const raw = store.get(cookieName(pageId))?.value
  if (!raw) return false

  const separator = raw.indexOf('.')
  if (separator <= 0) return false

  const expiresAt = Number.parseInt(raw.slice(0, separator), 10)
  const signature = raw.slice(separator + 1)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  return safeEqual(signature, sign(pageId, passwordHash, expiresAt))
}

export async function revokePageAccess(pageId: string): Promise<void> {
  const store = await cookies()
  store.delete(cookieName(pageId))
}
