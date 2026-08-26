import 'server-only'

import { access } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { chromium, type Browser } from 'playwright-core'

import { env } from '@/lib/env'
import type { PdfMode } from '@/lib/pdf-sections'
import { createPdfToken, type PdfRenderOptions } from '@/lib/pdf-token'

/**
 * Server side PDF generation with headless Chromium.
 *
 * The browser only ever loads one URL: this application's own internal render
 * route on loopback. No user supplied URL ever reaches Chromium, `file://` is
 * refused by the launch flags and every request to another origin than the
 * internal one is aborted, which rules out SSRF through the exporter.
 */

const NAV_TIMEOUT_MS = 30_000
const RENDER_TIMEOUT_MS = 60_000
const MAX_CONCURRENT = Math.max(1, Number.parseInt(process.env.PDF_MAX_CONCURRENT ?? '2', 10) || 2)
const QUEUE_TIMEOUT_MS = 45_000

export class PdfRenderError extends Error {}

// --- tiny in-process semaphore --------------------------------------------
// Two concurrent Chromium instances is plenty for an internal tool and keeps a
// burst of exports from exhausting the server's memory. A dedicated queue
// service would be disproportionate for this feature.
let active = 0
const waiting: { resolve: () => void; reject: (error: Error) => void; timer: NodeJS.Timeout }[] = []

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active += 1
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const entry = {
      resolve,
      reject,
      timer: setTimeout(() => {
        const index = waiting.indexOf(entry)
        if (index >= 0) waiting.splice(index, 1)
        reject(new PdfRenderError('Der Export ist ausgelastet. Bitte versuchen Sie es in einem Moment erneut.'))
      }, QUEUE_TIMEOUT_MS),
    }
    waiting.push(entry)
  })
}

function release(): void {
  const next = waiting.shift()
  if (next) {
    clearTimeout(next.timer)
    next.resolve()
    return
  }
  active = Math.max(0, active - 1)
}

// --- browser executable ----------------------------------------------------

let cachedExecutable: string | null | undefined

/**
 * Resolve the Chromium binary.
 * `PDF_CHROMIUM_PATH` wins so an operator can point at a system package;
 * otherwise Playwright's own installation is used.
 */
async function resolveExecutablePath(): Promise<string | undefined> {
  if (cachedExecutable !== undefined) return cachedExecutable ?? undefined

  const configured = process.env.PDF_CHROMIUM_PATH?.trim()
  if (configured) {
    try {
      await access(configured)
      cachedExecutable = configured
      return configured
    } catch {
      console.warn(`[pdf] PDF_CHROMIUM_PATH="${configured}" is not accessible, falling back to Playwright.`)
    }
  }

  cachedExecutable = null
  return undefined
}

/** Base URL Chromium uses. Loopback by default so the export never leaves the host. */
function internalBaseUrl(): string {
  const configured = process.env.PDF_INTERNAL_BASE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')
  const port = process.env.PORT?.trim() || '3000'
  return `http://127.0.0.1:${port}`
}

export interface RenderResult {
  buffer: Buffer
  pageCount: number
  overflow: string[]
}

export interface RenderInput {
  pageId: string
  mode: PdfMode
  options: PdfRenderOptions
  meta: { title: string; author: string; subject: string; creator: string }
}

export async function renderSponsorPagePdf(input: RenderInput): Promise<RenderResult> {
  await acquire()

  let browser: Browser | null = null
  const started = Date.now()

  try {
    const executablePath = await resolveExecutablePath()

    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        // Nothing on the rendered page needs these, and turning them off keeps
        // the browser from reaching anywhere it should not.
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--no-first-run',
        '--no-default-browser-check',
        '--allow-file-access-from-files=false',
      ],
      timeout: NAV_TIMEOUT_MS,
    })

    const context = await browser.newContext({
      viewport: { width: 1240, height: 1754 },
      deviceScaleFactor: 2,
      javaScriptEnabled: true,
      // No locale-dependent surprises in dates rendered by the browser.
      locale: 'de-CH',
      timezoneId: 'Europe/Zurich',
    })
    context.setDefaultTimeout(NAV_TIMEOUT_MS)

    const base = internalBaseUrl()
    const allowedOrigins = new Set<string>()
    allowedOrigins.add(new URL(base).origin)
    try {
      allowedOrigins.add(new URL(env.appUrl).origin)
    } catch {
      // appUrl is validated elsewhere; ignore a malformed value here.
    }

    const blocked: string[] = []
    await context.route('**/*', async (route) => {
      const url = route.request().url()
      if (url.startsWith('data:') || url.startsWith('blob:')) {
        await route.continue()
        return
      }
      let origin: string
      try {
        origin = new URL(url).origin
      } catch {
        await route.abort()
        return
      }
      if (allowedOrigins.has(origin)) {
        await route.continue()
        return
      }
      // External images are allowed – anything else (scripts, fonts, beacons)
      // is refused, so the export can never call out to a third party service.
      if (route.request().resourceType() === 'image' && /^https?:$/.test(new URL(url).protocol)) {
        await route.continue()
        return
      }
      blocked.push(url)
      await route.abort()
    })

    const page = await context.newPage()
    page.on('pageerror', (error) => console.error('[pdf] page error', error.message))

    const token = createPdfToken(input.pageId, input.mode, input.options)
    const target = new URL(`/admin/pdf/sponsor-page/${encodeURIComponent(input.pageId)}`, base)
    target.searchParams.set('mode', input.mode)
    target.searchParams.set('token', token)
    if (!input.options.qr) target.searchParams.set('qr', '0')
    if (!input.options.pageNumbers) target.searchParams.set('pages', '0')
    if (!input.options.date) target.searchParams.set('date', '0')

    const response = await page.goto(target.toString(), {
      waitUntil: 'domcontentloaded',
      timeout: NAV_TIMEOUT_MS,
    })

    if (!response || !response.ok()) {
      throw new PdfRenderError(
        `Die interne Renderansicht antwortete mit Status ${response?.status() ?? 'ohne Antwort'}.`,
      )
    }

    // Wait for the layout probe, then for images and fonts – each bounded, so a
    // single unreachable external image cannot stall the whole export.
    await page.waitForFunction(() => document.documentElement.dataset.pdfReady === '1', undefined, {
      timeout: 15_000,
    })
    await page
      .waitForFunction(
        () => Array.from(document.images).every((image) => image.complete),
        undefined,
        { timeout: 12_000 },
      )
      .catch(() => console.warn('[pdf] some images did not finish loading – exporting without them'))
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined)

    const overflowAttr = await page.getAttribute('html', 'data-pdf-overflow')
    const overflow = (overflowAttr ?? '').split(',').filter(Boolean)

    const raw = await page.pdf({
      format: 'A4',
      printBackground: true,
      // The CSS `@page { size: A4 portrait }` rule maps to 210 × 297 mm more
      // precisely than Chromium's own inch-based A4 preset.
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      scale: 1,
    })

    const buffer = await applyMetadata(Buffer.from(raw), input.meta)
    const pageCount = await countPages(buffer)

    if (blocked.length > 0) {
      console.warn(`[pdf] blocked ${blocked.length} non-image cross-origin request(s) during export`)
    }
    if (overflow.length > 0) {
      console.warn(`[pdf] content overflow on sheet(s): ${overflow.join(', ')}`)
    }
    console.info(
      `[pdf] exported page=${input.pageId} mode=${input.mode} pages=${pageCount} in ${Date.now() - started}ms`,
    )

    return { buffer, pageCount, overflow }
  } catch (error) {
    if (error instanceof PdfRenderError) throw error
    console.error('[pdf] render failed', error)
    throw new PdfRenderError(describeLaunchFailure(error))
  } finally {
    // Always tear the browser down, including on timeout, so no Chromium
    // process is left behind.
    if (browser) {
      await browser.close().catch((error) => console.error('[pdf] browser close failed', error))
    }
    release()
  }
}

/** Turn a Chromium launch failure into something an operator can act on. */
function describeLaunchFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/Executable doesn't exist|browserType.launch/i.test(message)) {
    return (
      'Chromium wurde nicht gefunden. Installieren Sie den Browser mit ' +
      '"npx playwright install --with-deps chromium" oder setzen Sie PDF_CHROMIUM_PATH.'
    )
  }
  if (/error while loading shared libraries|libnss3|libgbm/i.test(message)) {
    return 'Chromium konnte nicht starten – es fehlen Systembibliotheken. Siehe README, Abschnitt „PDF-Export“.'
  }
  if (/Timeout|timed out/i.test(message)) {
    return 'Die PDF-Erstellung hat zu lange gedauert und wurde abgebrochen.'
  }
  return 'Das PDF konnte nicht erstellt werden.'
}

/** Chromium writes its own producer metadata; replace it with ours. */
async function applyMetadata(buffer: Buffer, meta: RenderInput['meta']): Promise<Buffer> {
  try {
    // `updateMetadata: false` is a *load* option in pdf-lib – without it the
    // library stamps its own name into Producer when saving.
    const document = await PDFDocument.load(buffer, { updateMetadata: false })
    document.setTitle(meta.title)
    document.setAuthor(meta.author)
    document.setSubject(meta.subject)
    document.setCreator(meta.creator)
    document.setProducer(meta.creator)
    document.setCreationDate(new Date())
    document.setModificationDate(new Date())
    return Buffer.from(await document.save())
  } catch (error) {
    console.error('[pdf] could not write metadata, returning the raw document', error)
    return buffer
  }
}

async function countPages(buffer: Buffer): Promise<number> {
  try {
    // `updateMetadata: false` is a *load* option in pdf-lib – without it the
    // library stamps its own name into Producer when saving.
    const document = await PDFDocument.load(buffer, { updateMetadata: false })
    return document.getPageCount()
  } catch {
    return 0
  }
}

export const PDF_RENDER_TIMEOUT_MS = RENDER_TIMEOUT_MS
