import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'
import type { NextRequest } from 'next/server'

import { resolveUploadPath } from '@/lib/storage'

/**
 * Serves uploaded files from the persistent upload volume.
 * Files live outside the application bundle so that a redeploy never touches
 * them; this route is the only way they become reachable over HTTP.
 */

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path: segments } = await context.params

  if (!segments || segments.length === 0 || segments.length > 6) {
    return new Response('Not found', { status: 404 })
  }

  // Reject traversal attempts before touching the filesystem.
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('\0'))) {
    return new Response('Not found', { status: 404 })
  }

  const relativePath = segments.map((segment) => decodeURIComponent(segment)).join('/')
  if (relativePath.includes('..')) {
    return new Response('Not found', { status: 404 })
  }

  const absolute = resolveUploadPath(relativePath)
  if (!absolute) {
    return new Response('Not found', { status: 404 })
  }

  let info: Awaited<ReturnType<typeof stat>>
  try {
    info = await stat(absolute)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  if (!info.isFile()) {
    return new Response('Not found', { status: 404 })
  }

  const extension = absolute.split('.').pop()?.toLowerCase() ?? ''
  const contentType = CONTENT_TYPES[extension]
  if (!contentType) {
    // Never serve a file type the upload pipeline does not know about.
    return new Response('Not found', { status: 404 })
  }

  const etag = `W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } })
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(info.size),
    ETag: etag,
    'Last-Modified': info.mtime.toUTCString(),
    // Filenames are content addressed random hashes, so they can be cached hard.
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    // SVG and PDF are served sandboxed so they can never execute in our origin.
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
  })

  if (contentType === 'application/pdf' || contentType === 'image/svg+xml') {
    headers.set('Content-Disposition', 'inline')
  }

  const stream = Readable.toWeb(createReadStream(absolute)) as ReadableStream
  return new Response(stream, { status: 200, headers })
}
