import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { ThemeStyle } from '@/components/ThemeStyle'
import { ToastProvider } from '@/components/ui/Toast'
import { prisma } from '@/lib/db'
import { mediaUrl } from '@/lib/media'
import { buildMetadata } from '@/lib/metadata'
import { getSettings } from '@/lib/settings'

import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const [base, settings] = await Promise.all([buildMetadata(), getSettings()])
  const faviconId = settings['brand.faviconMediaId']
  if (!faviconId) return base

  const favicon = await prisma.media.findUnique({ where: { id: faviconId } }).catch(() => null)
  const url = mediaUrl(favicon)
  return url ? { ...base, icons: { icon: url, shortcut: url, apple: url } } : base
}

export const viewport: Viewport = {
  themeColor: '#08090b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings()

  return (
    <html lang="de-CH" suppressHydrationWarning>
      <head>
        <ThemeStyle settings={settings} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-fg"
        >
          Zum Inhalt springen
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
