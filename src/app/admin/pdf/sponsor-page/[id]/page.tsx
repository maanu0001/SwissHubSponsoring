import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PdfDocument } from '@/components/pdf/PdfDocument'
import { PDF_MODES, type PdfMode } from '@/lib/pdf-sections'
import { verifyPdfToken, type PdfRenderOptions } from '@/lib/pdf-token'
import { getCurrentUser } from '@/lib/session'
import { buildPdfDocument } from '@/server/pdf/build'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export const dynamic = 'force-dynamic'

/**
 * Internal render target for the PDF exporter.
 *
 * Never publicly reachable: access requires either a signed admin session (so a
 * human can inspect the layout) or a short lived, single purpose render token
 * that the exporter hands to the headless browser instead of a session cookie.
 */
export default async function SponsorPagePdfRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string; token?: string; qr?: string; pages?: string; date?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])

  const mode: PdfMode = PDF_MODES.includes(query.mode as PdfMode) ? (query.mode as PdfMode) : 'short'
  const options: PdfRenderOptions = {
    qr: query.qr !== '0',
    pageNumbers: query.pages !== '0',
    date: query.date !== '0',
  }

  const user = await getCurrentUser()
  const tokenValid = verifyPdfToken(query.token, id, mode, options)

  if (!user && !tokenValid) {
    // Deliberately indistinguishable from a missing page.
    notFound()
  }

  const model = await buildPdfDocument(id, mode, options).catch((error) => {
    console.error('[pdf] failed to build document model', error)
    return null
  })

  if (!model) notFound()

  return (
    <>
      <title>{model.meta.title}</title>
      <PdfDocument model={model} />
      <OverflowProbe />
    </>
  )
}

/**
 * Flags sheets whose content exceeds the printable area.
 *
 * Pagination is estimated on the server; this measures the real result and
 * exposes it on the document element so the exporter can log a warning instead
 * of silently shipping a clipped page.
 */
function OverflowProbe() {
  const script = `
(function () {
  try {
    var over = [];
    document.querySelectorAll('[data-pdf-flow]').forEach(function (el) {
      if (el.scrollHeight > el.clientHeight + 2) {
        over.push(el.getAttribute('data-pdf-flow') + ':' + (el.scrollHeight - el.clientHeight));
      }
    });
    document.documentElement.setAttribute('data-pdf-overflow', over.join(','));
    document.documentElement.setAttribute('data-pdf-ready', '1');
  } catch (error) {
    document.documentElement.setAttribute('data-pdf-ready', '1');
  }
})();
`
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
