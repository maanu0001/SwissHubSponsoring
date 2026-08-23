import type {
  Media,
  PartnerReference,
  SectionType,
  SponsorPage,
  SponsoringBenefit,
  Sponsor,
  Tournament,
} from '@prisma/client'

import type { SectionData } from './section-data'

/** A section flattened into exactly what the renderer needs. */
export interface RenderSection {
  id: string
  type: SectionType
  title: string | null
  subtitle: string | null
  /** Already sanitised HTML. */
  content: string | null
  data: SectionData
  visible: boolean
  order: number
}

export interface RenderBenefit {
  id: string
  title: string
  description: string | null
  category: string
}

export interface RenderTournament
  extends Pick<
    Tournament,
    | 'id'
    | 'title'
    | 'game'
    | 'description'
    | 'startDate'
    | 'endDate'
    | 'format'
    | 'participantCount'
    | 'expectedParticipantCount'
    | 'streamViewerCount'
    | 'status'
    | 'twitchUrl'
    | 'vodUrl'
  > {
  heroImage: Media | null
  gallery: Media[]
}

export interface RenderPartner extends Pick<PartnerReference, 'id' | 'name' | 'website' | 'description'> {
  logo: Media | null
}

/**
 * Everything the section renderers may read.
 * Assembling this once per request keeps every renderer free of database access.
 */
export interface RenderContext {
  sections: RenderSection[]
  benefits: RenderBenefit[]
  tournaments: RenderTournament[]
  partners: RenderPartner[]
  /** Present on individual sponsor pages, absent on the public main page. */
  sponsor: (Pick<Sponsor, 'id' | 'companyName' | 'website'> & { logo: Media | null }) | null
  page:
    | (Pick<
        SponsorPage,
        'id' | 'slug' | 'title' | 'subtitle' | 'requestedSupportType' | 'requestedSupportText' | 'currency'
      > & {
        requestedAmount: number | null
        heroImage: Media | null
        tournamentId: string | null
      })
    | null
  brand: {
    name: string
    logo: Media | null
  }
  contact: {
    email: string
    website: string
    discord: string
    instagram: string
    twitch: string
    sponsorPageNote: string
  }
  /** Hostname required by the Twitch embed API. */
  embedParent: string
}

export type BenefitLike = Pick<SponsoringBenefit, 'id' | 'title' | 'description' | 'category'>
