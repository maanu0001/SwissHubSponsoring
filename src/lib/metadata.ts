import 'server-only'

import type { Metadata } from 'next'

import { env } from './env'
import { mediaUrl } from './media'
import { prisma } from './db'
import { getSettings } from './settings'

/** Resolve the OpenGraph image configured in the branding settings. */
async function ogImage(mediaId: string | undefined): Promise<string | undefined> {
  if (!mediaId) return undefined
  const media = await prisma.media.findUnique({ where: { id: mediaId } })
  const url = mediaUrl(media)
  if (!url) return undefined
  return url.startsWith('http') ? url : `${env.appUrl}${url}`
}

export interface BuildMetadataOptions {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
  imageMediaId?: string | null
}

/** Shared metadata builder used by every public route. */
export async function buildMetadata(options: BuildMetadataOptions = {}): Promise<Metadata> {
  const settings = await getSettings()
  const siteTitle = settings['site.title'] || 'SwissHub Sponsoring'
  const template = settings['site.titleTemplate'] || '%s · SwissHub'
  const description = options.description || settings['site.description'] || ''
  const title = options.title ? template.replace('%s', options.title) : siteTitle
  const url = `${env.appUrl}${options.path ?? ''}`
  const image = await ogImage(options.imageMediaId ?? settings['site.ogImageMediaId'] ?? undefined)

  return {
    metadataBase: new URL(env.appUrl),
    title,
    description,
    keywords: settings['site.keywords'] ? settings['site.keywords'].split(',').map((k) => k.trim()) : undefined,
    alternates: { canonical: url },
    robots: options.noindex
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: siteTitle,
      title,
      description,
      url,
      locale: 'de_CH',
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}
