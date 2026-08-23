import type { MetadataRoute } from 'next'

import { prisma } from '@/lib/db'
import { env } from '@/lib/env'

/**
 * Only genuinely public pages are listed. Individual sponsor pages are
 * deliberately excluded – they are meant for direct outreach.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified = new Date()
  try {
    const latest = await prisma.siteSection.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    })
    if (latest) lastModified = latest.updatedAt
  } catch {
    // Fall back to "now" if the database is unavailable.
  }

  return [
    { url: `${env.appUrl}/`, lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: `${env.appUrl}/impressum`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${env.appUrl}/datenschutz`, lastModified, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
