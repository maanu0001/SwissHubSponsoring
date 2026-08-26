import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

import { env } from './env'
import type { PdfMode } from './pdf-sections'

/**
 * Short lived, signed access token for the internal PDF render route.
 *
 * The headless browser has to fetch the route over HTTP, and handing it a real
 * admin session cookie would give a browser process full admin authority. A
 * token instead grants exactly one thing: rendering one page in one mode with
 * one set of options, for a couple of minutes.
 */

const TOKEN_TTL_MS = 3 * 60 * 1000

export interface PdfRenderOptions {
  qr: boolean
  pageNumbers: boolean
  date: boolean
}

export const DEFAULT_PDF_OPTIONS: PdfRenderOptions = { qr: true, pageNumbers: true, date: true }

/** Canonical option string – part of the signature so a token cannot be reused. */
function optionKey(options: PdfRenderOptions): string {
  return `${options.qr ? 1 : 0}${options.pageNumbers ? 1 : 0}${options.date ? 1 : 0}`
}

function sign(payload: string): string {
  return createHmac('sha256', env.authSecret).update(`pdf:${payload}`).digest('base64url')
}

export function createPdfToken(pageId: string, mode: PdfMode, options: PdfRenderOptions): string {
  const expiresAt = Date.now() + TOKEN_TTL_MS
  const payload = `${pageId}:${mode}:${optionKey(options)}:${expiresAt}`
  return `${expiresAt}.${sign(payload)}`
}

export function verifyPdfToken(
  token: string | null | undefined,
  pageId: string,
  mode: PdfMode,
  options: PdfRenderOptions,
): boolean {
  if (!token) return false

  const separator = token.indexOf('.')
  if (separator <= 0) return false

  const expiresAt = Number.parseInt(token.slice(0, separator), 10)
  const signature = token.slice(separator + 1)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  const expected = sign(`${pageId}:${mode}:${optionKey(options)}:${expiresAt}`)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
