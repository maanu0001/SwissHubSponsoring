import type { NextRequest } from 'next/server'

import { logActivity } from '@/lib/activity'
import { prisma } from '@/lib/db'
import { PDF_MODES, type PdfMode } from '@/lib/pdf-sections'
import type { PdfRenderOptions } from '@/lib/pdf-token'
import { getCurrentUser } from '@/lib/session'
import { getSettings } from '@/lib/settings'
import { pdfFilename } from '@/server/pdf/filename'
import { PdfRenderError, renderSponsorPagePdf } from '@/server/pdf/render'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Generates and returns the sponsoring PDF.
 *
 * Authorisation is checked here on the server, not just by hiding a button:
 * without a valid admin session this endpoint returns 401 regardless of what
 * the caller sends.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  const { id } = await context.params

  let body: { mode?: string; qr?: boolean; pageNumbers?: boolean; date?: boolean }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const mode: PdfMode = PDF_MODES.includes(body.mode as PdfMode) ? (body.mode as PdfMode) : 'short'
  const options: PdfRenderOptions = {
    qr: body.qr !== false,
    pageNumbers: body.pageNumbers !== false,
    date: body.date !== false,
  }

  const page = await prisma.sponsorPage.findUnique({
    where: { id },
    include: {
      sponsor: { select: { companyName: true } },
      tournament: { select: { title: true } },
    },
  })

  if (!page) {
    return Response.json({ error: 'Diese Sponsorenseite existiert nicht mehr.' }, { status: 404 })
  }

  const settings = await getSettings()
  const brandName = settings['brand.name'] || 'SwissHub'

  try {
    const result = await renderSponsorPagePdf({
      pageId: id,
      mode,
      options,
      meta: {
        title: `${brandName} × ${page.sponsor.companyName} – Partnerschaftsvorschlag`,
        author: brandName,
        subject: 'Sponsoring Partnership',
        creator: `${brandName} Sponsoring`,
      },
    })

    const filename = pdfFilename({
      brandName,
      sponsorName: page.sponsor.companyName,
      tournamentTitle: page.tournament?.title ?? null,
      mode,
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'SponsorPage',
      entityId: id,
      summary: `PDF exportiert (${mode === 'full' ? 'Dossier' : 'Kurzpräsentation'}) für „${page.sponsor.companyName}“`,
      metadata: { mode, pages: result.pageCount },
    })

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(result.buffer.byteLength),
        // The filename is ASCII-only and free of separators, see pdfFilename().
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Pdf-Pages': String(result.pageCount),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    // The operator-facing detail stays in the server log; the client only ever
    // sees a message it can act on.
    const message =
      error instanceof PdfRenderError
        ? error.message
        : 'Das PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.'
    if (!(error instanceof PdfRenderError)) {
      console.error('[pdf] export endpoint failed', error)
    }
    return Response.json({ error: message }, { status: 500 })
  }
}
