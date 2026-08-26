import type { Media } from '@prisma/client'

import type { BudgetItem, BulletItem, LinkItem, ProcessStep, QuoteItem, StatItem } from '@/lib/section-data'
import type { RenderBenefit } from '@/lib/render-context'

/**
 * Layout model for a generated PDF.
 *
 * The renderer receives a finished list of A4 pages. All decisions about what
 * goes where are made here on the server, so page numbers are exact and no
 * content can silently overflow a sheet.
 */

/** One atomic, non-breakable piece of content plus its estimated height in mm. */
export interface PdfItem {
  height: number
  node: PdfNode
}

export type PdfNode =
  | { kind: 'html'; html: string }
  | { kind: 'lead'; text: string }
  | { kind: 'bullets'; items: BulletItem[] }
  | { kind: 'stats'; items: StatItem[]; columns: number }
  | { kind: 'budget'; items: BudgetItem[] }
  | { kind: 'steps'; items: ProcessStep[] }
  | { kind: 'quotes'; items: QuoteItem[] }
  | { kind: 'links'; items: (LinkItem & { qr: string | null })[] }
  | { kind: 'benefits'; category: string | null; items: RenderBenefit[] }
  | { kind: 'tournamentDetail'; tournament: PdfTournament }
  | { kind: 'tournamentCards'; items: PdfTournament[] }
  | { kind: 'partners'; items: PdfPartner[] }
  | { kind: 'gallery'; items: { url: string; alt: string; caption: string }[] }
  | { kind: 'proposal'; proposal: PdfProposal }
  | { kind: 'image'; url: string; alt: string; ratio: number }

export interface PdfTournament {
  title: string
  game: string
  description: string | null
  dateRange: string
  format: string | null
  participants: string | null
  participantsLabel: string
  viewers: string | null
  status: string
  imageUrl: string | null
  twitchUrl: string | null
  vodUrl: string | null
}

export interface PdfPartner {
  name: string
  description: string | null
  website: string | null
  logoUrl: string | null
}

export interface PdfProposal {
  amount: string | null
  supportTypeLabel: string
  supportText: string | null
  currency: string
}

/** A single A4 sheet. */
export interface PdfPage {
  id: string
  /** Section heading rendered at the top of the sheet, if any. */
  heading?: { eyebrow?: string; title?: string; subtitle?: string; continued?: boolean }
  items: PdfItem[]
  /** Dark treatment for cover and closing sheets. */
  tone: 'light' | 'dark'
  /** Cover and closing pages hide the running footer. */
  showFooter: boolean
}

export interface PdfCover {
  brandLogoUrl: string | null
  brandName: string
  sponsorLogoUrl: string | null
  sponsorName: string
  title: string
  subtitle: string | null
  tournamentTitle: string | null
  tournamentDates: string | null
  kicker: string
  heroImageUrl: string | null
}

export interface PdfClosing {
  title: string
  html: string | null
  contactEmail: string
  website: string | null
  pageUrl: string | null
  qr: string | null
  qrCaption: string
  note: string | null
}

export interface PdfDocumentModel {
  cover: PdfCover
  pages: PdfPage[]
  closing: PdfClosing
  meta: {
    title: string
    author: string
    subject: string
    creator: string
    sponsorName: string
    tournamentTitle: string | null
    dateLabel: string | null
    showPageNumbers: boolean
    mode: 'short' | 'full'
  }
  brand: {
    primary: string
    accent: string
  }
  /** Every media item the document references, for pre-flight checks. */
  referencedMedia: Media[]
}
