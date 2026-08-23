import 'server-only'

import { prisma } from '@/lib/db'

/**
 * Aggregated page view counter.
 * Only a per-day counter is stored – no IP address, no cookie, no user agent
 * and no fingerprinting of any kind.
 */
export async function recordPageView(pageId: string): Promise<void> {
  const day = new Date()
  day.setUTCHours(0, 0, 0, 0)

  try {
    await prisma.$transaction([
      prisma.sponsorPage.update({
        where: { id: pageId },
        data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      }),
      prisma.pageViewDaily.upsert({
        where: { sponsorPageId_day: { sponsorPageId: pageId, day } },
        create: { sponsorPageId: pageId, day, count: 1 },
        update: { count: { increment: 1 } },
      }),
    ])
  } catch (error) {
    // Counting must never break the page for a visitor.
    console.error('[analytics] failed to record page view', error)
  }
}

/** Daily view series for the admin statistics panel. */
export async function pageViewSeries(pageId: string, days = 30) {
  const from = new Date()
  from.setUTCHours(0, 0, 0, 0)
  from.setUTCDate(from.getUTCDate() - (days - 1))

  return prisma.pageViewDaily.findMany({
    where: { sponsorPageId: pageId, day: { gte: from } },
    orderBy: { day: 'asc' },
  })
}
