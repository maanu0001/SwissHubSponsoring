import 'server-only'

import { prisma } from './db'
import { env } from './env'
import { rateLimitKey } from './auth'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Database backed sliding window limiter. Persisting attempts means the limit
 * survives restarts and is shared between app instances behind a proxy.
 */
export async function consumeLoginAttempt(identifiers: string[]): Promise<RateLimitResult> {
  const key = rateLimitKey(...identifiers)
  const windowStart = new Date(Date.now() - env.loginWindowSeconds * 1000)

  const attempts = await prisma.loginAttempt.count({
    where: { key, createdAt: { gte: windowStart } },
  })

  if (attempts >= env.loginMaxAttempts) {
    const oldest = await prisma.loginAttempt.findFirst({
      where: { key, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    })
    const retryAt = (oldest?.createdAt.getTime() ?? Date.now()) + env.loginWindowSeconds * 1000
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - Date.now()) / 1000)),
    }
  }

  await prisma.loginAttempt.create({ data: { key } })
  return {
    allowed: true,
    remaining: Math.max(0, env.loginMaxAttempts - attempts - 1),
    retryAfterSeconds: 0,
  }
}

/** Called after a successful login so a legitimate user is not locked out. */
export async function clearLoginAttempts(identifiers: string[]): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: rateLimitKey(...identifiers) } })
}

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Lightweight in-process limiter for non-critical, high-frequency endpoints
 * (page password attempts). Not shared across instances by design – the
 * authoritative protection for those is the bcrypt cost factor.
 */
export function consumeMemoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    }
  }

  bucket.count += 1
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 }
}

/** Periodically drop expired in-memory buckets so the map cannot grow forever. */
if (typeof setInterval === 'function') {
  const timer = setInterval(
    () => {
      const now = Date.now()
      for (const [key, bucket] of memoryBuckets) {
        if (bucket.resetAt < now) memoryBuckets.delete(key)
      }
    },
    5 * 60 * 1000,
  )
  timer.unref?.()
}

/** Best effort client IP from common reverse proxy headers. */
export function clientIpFrom(headerList: Headers): string {
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headerList.get('x-real-ip') ?? 'unknown'
}
