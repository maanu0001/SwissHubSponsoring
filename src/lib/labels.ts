import type {
  ActivityAction,
  MediaSourceType,
  MediaType,
  PageStatus,
  PageVisibility,
  SectionType,
  SponsorStatus,
  SupportType,
  TemplateType,
  TournamentStatus,
} from '@prisma/client'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand'

export interface StatusMeta {
  label: string
  tone: Tone
  description?: string
}

export const SPONSOR_STATUS: Record<SponsorStatus, StatusMeta> = {
  DRAFT: { label: 'Entwurf', tone: 'neutral', description: 'Noch in Vorbereitung.' },
  NOT_CONTACTED: { label: 'Noch nicht kontaktiert', tone: 'neutral', description: 'Bereit für die Kontaktaufnahme.' },
  CONTACTED: { label: 'Kontaktiert', tone: 'info', description: 'Anfrage wurde versendet.' },
  IN_TALKS: { label: 'In Gesprächen', tone: 'brand', description: 'Aktive Verhandlung läuft.' },
  CONFIRMED: { label: 'Zugesagt', tone: 'success', description: 'Partnerschaft ist bestätigt.' },
  DECLINED: { label: 'Abgesagt', tone: 'danger', description: 'Kein Interesse oder abgelehnt.' },
  ARCHIVED: { label: 'Archiviert', tone: 'neutral', description: 'Nicht mehr aktiv.' },
}

export const SPONSOR_STATUS_ORDER: SponsorStatus[] = [
  'DRAFT', 'NOT_CONTACTED', 'CONTACTED', 'IN_TALKS', 'CONFIRMED', 'DECLINED', 'ARCHIVED',
]

export const PAGE_STATUS: Record<PageStatus, StatusMeta> = {
  DRAFT: { label: 'Entwurf', tone: 'neutral', description: 'Nicht öffentlich erreichbar.' },
  PUBLISHED: { label: 'Veröffentlicht', tone: 'success', description: 'Über den Link erreichbar.' },
  ARCHIVED: { label: 'Archiviert', tone: 'warning', description: 'Offline gestellt.' },
}

export const PAGE_STATUS_ORDER: PageStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

export const PAGE_VISIBILITY: Record<PageVisibility, StatusMeta> = {
  PUBLIC: { label: 'Öffentlich', tone: 'info', description: 'Jeder mit dem Link sieht die Seite.' },
  PASSWORD_PROTECTED: { label: 'Passwortgeschützt', tone: 'brand', description: 'Zugriff nur mit Passwort.' },
}

export const SUPPORT_TYPE: Record<SupportType, StatusMeta> = {
  MONEY: { label: 'Geld', tone: 'brand' },
  PRIZES: { label: 'Sachpreise', tone: 'info' },
  GAME_KEYS: { label: 'Game Keys', tone: 'info' },
  HARDWARE: { label: 'Hardware', tone: 'info' },
  SERVICES: { label: 'Dienstleistungen', tone: 'info' },
  COMBINATION: { label: 'Kombination', tone: 'brand' },
  OTHER: { label: 'Sonstiges', tone: 'neutral' },
}

export const SUPPORT_TYPE_ORDER: SupportType[] = [
  'MONEY', 'PRIZES', 'GAME_KEYS', 'HARDWARE', 'SERVICES', 'COMBINATION', 'OTHER',
]

export const TOURNAMENT_STATUS: Record<TournamentStatus, StatusMeta> = {
  PLANNED: { label: 'Geplant', tone: 'info' },
  OPEN: { label: 'Anmeldung offen', tone: 'brand' },
  RUNNING: { label: 'Laufend', tone: 'warning' },
  COMPLETED: { label: 'Abgeschlossen', tone: 'success' },
  ARCHIVED: { label: 'Archiviert', tone: 'neutral' },
}

export const TOURNAMENT_STATUS_ORDER: TournamentStatus[] = [
  'PLANNED', 'OPEN', 'RUNNING', 'COMPLETED', 'ARCHIVED',
]

export const TEMPLATE_TYPE: Record<TemplateType, StatusMeta> = {
  STANDARD: { label: 'Standard Sponsoring', tone: 'neutral' },
  MAIN_SPONSOR: { label: 'Hauptsponsor', tone: 'brand' },
  HARDWARE_PARTNER: { label: 'Gaming / Hardware Partner', tone: 'info' },
  KEY_GIVEAWAY_PARTNER: { label: 'Key / Giveaway Partner', tone: 'info' },
  IT_TECH_PARTNER: { label: 'IT / Tech Partner', tone: 'info' },
  CUSTOM: { label: 'Custom', tone: 'neutral' },
}

export const MEDIA_TYPE: Record<MediaType, StatusMeta> = {
  IMAGE: { label: 'Bild', tone: 'info' },
  VIDEO: { label: 'Video', tone: 'brand' },
  DOCUMENT: { label: 'Dokument', tone: 'neutral' },
}

export const MEDIA_SOURCE: Record<MediaSourceType, StatusMeta> = {
  UPLOAD: { label: 'Upload', tone: 'success' },
  EXTERNAL: { label: 'Externe URL', tone: 'info' },
}

export const ACTIVITY_ACTION: Record<ActivityAction, StatusMeta> = {
  LOGIN: { label: 'Anmeldung', tone: 'neutral' },
  LOGOUT: { label: 'Abmeldung', tone: 'neutral' },
  LOGIN_FAILED: { label: 'Fehlgeschlagene Anmeldung', tone: 'danger' },
  CREATE: { label: 'Erstellt', tone: 'success' },
  UPDATE: { label: 'Bearbeitet', tone: 'info' },
  DELETE: { label: 'Gelöscht', tone: 'danger' },
  ARCHIVE: { label: 'Archiviert', tone: 'warning' },
  RESTORE: { label: 'Wiederhergestellt', tone: 'success' },
  STATUS_CHANGE: { label: 'Status geändert', tone: 'brand' },
  PUBLISH: { label: 'Veröffentlicht', tone: 'success' },
  UNPUBLISH: { label: 'Offline gestellt', tone: 'warning' },
  PASSWORD_SET: { label: 'Passwortschutz gesetzt', tone: 'brand' },
  PASSWORD_REMOVED: { label: 'Passwortschutz entfernt', tone: 'warning' },
  UPLOAD: { label: 'Medium hochgeladen', tone: 'info' },
}

export interface SectionMeta {
  label: string
  description: string
  /** Sections that make sense on individual sponsor pages. */
  sponsorPage: boolean
  /** Sections that make sense on the public main page. */
  sitePage: boolean
  /** Whether the section body uses the rich text editor. */
  richText: boolean
}

export const SECTION_TYPES: Record<SectionType, SectionMeta> = {
  HERO: {
    label: 'Hero',
    description: 'Grosser Einstieg mit Logos, Titel und Untertitel.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  PERSONAL_INTRO: {
    label: 'Persönliche Ansprache',
    description: 'Direkter, persönlicher Einstiegstext an das Unternehmen.',
    sponsorPage: true, sitePage: false, richText: true,
  },
  WHY_PARTNERSHIP: {
    label: 'Warum diese Partnerschaft',
    description: 'Argumente, weshalb genau diese Firma gut zu SwissHub passt.',
    sponsorPage: true, sitePage: false, richText: true,
  },
  TOURNAMENT: {
    label: 'Turnier',
    description: 'Das konkret geplante Turnier mit Eckdaten.',
    sponsorPage: true, sitePage: false, richText: true,
  },
  REACH: {
    label: 'Reichweite',
    description: 'Community-Kennzahlen als Karten.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  SPONSORING_PROPOSAL: {
    label: 'Sponsoring-Vorschlag',
    description: 'Die konkret gesuchte Unterstützung inklusive Betrag.',
    sponsorPage: true, sitePage: false, richText: true,
  },
  BENEFITS: {
    label: 'Leistungen',
    description: 'Ausgewählte Leistungen aus dem Leistungskatalog.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  BUDGET_USAGE: {
    label: 'Budgetverwendung',
    description: 'Transparent, wofür das Sponsoring eingesetzt wird.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  VISION: {
    label: 'Vision',
    description: 'Die Community-Vision von SwissHub.',
    sponsorPage: true, sitePage: true, richText: true,
  },
  ABOUT_SWISSHUB: {
    label: 'Über SwissHub',
    description: 'Wer SwissHub ist und wofür der Verein steht.',
    sponsorPage: true, sitePage: true, richText: true,
  },
  TOURNAMENT_HISTORY: {
    label: 'Turnierhistorie',
    description: 'Bisher durchgeführte Turniere.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  PAST_PARTNERS: {
    label: 'Bisherige Partner',
    description: 'Referenzen und bisherige Partner.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  TWITCH_VOD: {
    label: 'Twitch / VOD',
    description: 'Links zu Livestream und Aufzeichnungen.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  SOCIAL_PROOF: {
    label: 'Social Proof',
    description: 'Zitate, Referenzen oder Community-Stimmen.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  CTA: {
    label: 'Call to Action',
    description: 'Abschluss mit Kontaktangaben und nächstem Schritt.',
    sponsorPage: true, sitePage: true, richText: true,
  },
  CUSTOM_TEXT: {
    label: 'Freier Textblock',
    description: 'Beliebiger zusätzlicher Abschnitt.',
    sponsorPage: true, sitePage: true, richText: true,
  },
  GALLERY: {
    label: 'Bildergalerie',
    description: 'Bilder aus der Medienverwaltung.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  STATS: {
    label: 'Statistiken',
    description: 'Freie Kennzahlen-Karten.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  PROCESS: {
    label: 'Ablauf',
    description: 'Schrittweiser Ablauf, z. B. eines Turniers.',
    sponsorPage: true, sitePage: true, richText: false,
  },
  CONTACT: {
    label: 'Kontakt',
    description: 'Kontaktangaben ohne Formular.',
    sponsorPage: true, sitePage: true, richText: true,
  },
  RICH_TEXT: {
    label: 'Rich Text',
    description: 'Langer, frei formatierter Inhalt.',
    sponsorPage: true, sitePage: true, richText: true,
  },
}

export function sectionLabel(type: SectionType): string {
  return SECTION_TYPES[type]?.label ?? type
}

export const SPONSOR_PAGE_SECTION_TYPES = (Object.keys(SECTION_TYPES) as SectionType[]).filter(
  (type) => SECTION_TYPES[type].sponsorPage,
)

export const SITE_SECTION_TYPES = (Object.keys(SECTION_TYPES) as SectionType[]).filter(
  (type) => SECTION_TYPES[type].sitePage,
)
