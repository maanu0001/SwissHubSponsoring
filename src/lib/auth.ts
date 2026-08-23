import 'server-only'

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 12

/** Hash a plaintext password for storage. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

/**
 * Verify a password against a stored hash.
 * Always performs work even for an unknown user so that response timing does
 * not reveal whether an account exists.
 */
export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const target = hash ?? '$2b$12$0000000000000000000000000000000000000000000000000000'
  const ok = await bcrypt.compare(plain, target)
  return hash ? ok : false
}

/** Cryptographically strong, URL safe token. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/** Session tokens are stored hashed so a database dump cannot be replayed. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Stable, non-reversible key for rate limiting buckets. */
export function rateLimitKey(...parts: string[]): string {
  return createHash('sha256').update(parts.join('|')).digest('hex')
}

/** Constant time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export interface PasswordPolicyResult {
  ok: boolean
  message?: string
}

/** Minimum password requirements for admin accounts and page protection. */
export function checkPasswordPolicy(password: string, minLength = 10): PasswordPolicyResult {
  if (password.length < minLength) {
    return { ok: false, message: `Das Passwort muss mindestens ${minLength} Zeichen lang sein.` }
  }
  if (password.length > 200) {
    return { ok: false, message: 'Das Passwort darf höchstens 200 Zeichen lang sein.' }
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, message: 'Das Passwort muss Buchstaben und Zahlen enthalten.' }
  }
  return { ok: true }
}
