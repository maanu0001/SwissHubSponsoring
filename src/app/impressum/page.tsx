import type { Metadata } from 'next'

import { PublicFooter } from '@/components/public/PublicFooter'
import { buildMetadata } from '@/lib/metadata'
import { sanitizeRichText } from '@/lib/sanitize'
import { renderChrome } from '@/server/render'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: 'Impressum', path: '/impressum' })
}

export default async function ImprintPage() {
  const chrome = await renderChrome()
  const html = sanitizeRichText(chrome.settings['legal.imprint'])

  return (
    <>
      <main id="main" className="container-content py-16 sm:py-24">
        <div className="mx-auto max-w-prose">
          <h1 className="font-display text-[30px] font-semibold tracking-tight sm:text-[38px]">Impressum</h1>
          {html ? (
            <div className="rich-text mt-8" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="mt-8 text-[15px] leading-relaxed text-fg-muted">
              Die Impressumsangaben werden derzeit ergänzt. Bitte wenden Sie sich in der Zwischenzeit direkt an{' '}
              {chrome.contact.email ? (
                <a href={`mailto:${chrome.contact.email}`} className="text-brand-accent hover:underline">
                  {chrome.contact.email}
                </a>
              ) : (
                'das SwissHub-Team'
              )}
              .
            </p>
          )}
        </div>
      </main>
      <PublicFooter
        brandName={chrome.brand.name}
        contact={chrome.contact}
        footerNote={chrome.settings['legal.footerNote']}
      />
    </>
  )
}
