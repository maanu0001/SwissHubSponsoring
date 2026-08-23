import 'server-only'

import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, unlink, stat } from 'node:fs/promises'
import path from 'node:path'

import { env } from './env'
import { ALLOWED_UPLOAD_TYPES } from './media'

/** Absolute, normalised root of the upload directory. */
export function uploadRoot(): string {
  return path.resolve(process.cwd(), env.uploadDir)
}

/**
 * Resolve a stored relative path to an absolute one, refusing anything that
 * would escape the upload root (path traversal).
 */
export function resolveUploadPath(relativePath: string): string | null {
  if (!relativePath || relativePath.includes('\0')) return null
  const root = uploadRoot()
  const absolute = path.resolve(root, relativePath)
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep
  if (absolute !== root && !absolute.startsWith(rootWithSep)) return null
  return absolute
}

export interface StoredFile {
  relativePath: string
  size: number
  mimeType: string
  kind: 'IMAGE' | 'DOCUMENT'
}

export class UploadError extends Error {}

/**
 * SVG can carry scripts, so only a conservative subset is accepted.
 * Anything with a script, event handler, external reference or embedded
 * foreign content is rejected outright rather than rewritten.
 */
function assertSafeSvg(content: string): void {
  const lower = content.toLowerCase()
  const forbidden = [
    '<script', '<foreignobject', '<iframe', '<embed', '<object', '<use',
    'javascript:', 'data:text/html', '<!entity', '<!doctype svg system',
  ]
  for (const needle of forbidden) {
    if (lower.includes(needle)) {
      throw new UploadError('Diese SVG-Datei enthält potenziell unsichere Inhalte und wurde abgelehnt.')
    }
  }
  if (/\son\w+\s*=/.test(lower)) {
    throw new UploadError('Diese SVG-Datei enthält Event-Handler und wurde abgelehnt.')
  }
  if (!lower.includes('<svg')) {
    throw new UploadError('Diese Datei ist keine gültige SVG-Datei.')
  }
}

/** Magic-number check so the declared MIME type cannot be spoofed. */
function detectSignature(buffer: Buffer): string | null {
  const startsWith = (...bytes: number[]) => bytes.every((byte, index) => buffer[index] === byte)
  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png'
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return 'image/gif'
  if (startsWith(0x25, 0x50, 0x44, 0x46)) return 'application/pdf'
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp' && buffer.subarray(8, 12).toString('ascii').startsWith('avif')) {
    return 'image/avif'
  }
  const head = buffer.subarray(0, 1024).toString('utf8').trimStart().toLowerCase()
  if (head.startsWith('<svg') || head.startsWith('<?xml')) return 'image/svg+xml'
  return null
}

/**
 * Validate and persist an uploaded file.
 * Filenames are always randomly generated – the client supplied name is only
 * used for the human readable title, never for the path on disk.
 */
export async function storeUpload(file: File): Promise<StoredFile> {
  if (file.size === 0) {
    throw new UploadError('Die Datei ist leer.')
  }
  if (file.size > env.maxUploadSize) {
    const limitMb = Math.round(env.maxUploadSize / (1024 * 1024))
    throw new UploadError(`Die Datei ist zu gross. Maximal erlaubt sind ${limitMb} MB.`)
  }

  const declared = file.type.split(';')[0]?.trim().toLowerCase() ?? ''
  const buffer = Buffer.from(await file.arrayBuffer())
  const detected = detectSignature(buffer)

  const mimeType = detected ?? declared
  const descriptor = ALLOWED_UPLOAD_TYPES[mimeType]
  if (!descriptor) {
    throw new UploadError(
      'Dieser Dateityp wird nicht unterstützt. Erlaubt sind JPG, PNG, WebP, AVIF, GIF, SVG und PDF.',
    )
  }
  if (detected && declared && detected !== declared && !(detected === 'image/svg+xml' && declared === 'image/svg+xml')) {
    // A mismatch is a strong indicator of a disguised file.
    if (ALLOWED_UPLOAD_TYPES[declared] === undefined) {
      throw new UploadError('Der Dateityp konnte nicht eindeutig bestimmt werden.')
    }
  }

  if (mimeType === 'image/svg+xml') {
    assertSafeSvg(buffer.toString('utf8'))
  }

  const now = new Date()
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const name = `${randomBytes(16).toString('hex')}.${descriptor.ext}`
  const relativePath = `${folder}/${name}`

  const absolute = resolveUploadPath(relativePath)
  if (!absolute) throw new UploadError('Ungültiger Speicherpfad.')

  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, buffer, { mode: 0o644 })

  return { relativePath, size: buffer.byteLength, mimeType, kind: descriptor.kind }
}

/** Remove a stored file. Missing files are not an error. */
export async function deleteUpload(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return
  const absolute = resolveUploadPath(relativePath)
  if (!absolute) return
  try {
    await unlink(absolute)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('[storage] failed to delete upload', error)
    }
  }
}

export async function uploadExists(relativePath: string): Promise<boolean> {
  const absolute = resolveUploadPath(relativePath)
  if (!absolute) return false
  try {
    const info = await stat(absolute)
    return info.isFile()
  } catch {
    return false
  }
}

/** Best effort intrinsic size detection so galleries can reserve space. */
export function imageDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === 'image/png' && buffer.length > 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    }
    if (mimeType === 'image/gif' && buffer.length > 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
    }
    if (mimeType === 'image/jpeg') {
      let offset = 2
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) {
          offset += 1
          continue
        }
        const marker = buffer[offset + 1]
        if (marker === undefined) break
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
        }
        offset += 2 + buffer.readUInt16BE(offset + 2)
      }
    }
  } catch {
    return null
  }
  return null
}
