import 'server-only'

import { cache } from 'react'
import type { SettingType } from '@prisma/client'

import { prisma } from './db'

/** Canonical list of settings – used by the seed, the admin UI and the renderer. */
export interface SettingDefinition {
  key: string
  label: string
  type: SettingType
  group: 'branding' | 'general' | 'seo' | 'legal' | 'contact'
  order: number
  defaultValue: string
  hint?: string
  /** Rendered as a textarea instead of a single line input. */
  multiline?: boolean
}

export const SETTING_DEFINITIONS: SettingDefinition[] = [
  // Branding
  { key: 'brand.logoMediaId', label: 'SwissHub Logo', type: 'MEDIA', group: 'branding', order: 10, defaultValue: '', hint: 'Wird im Header und in den Sponsorenseiten verwendet.' },
  { key: 'brand.faviconMediaId', label: 'Favicon', type: 'MEDIA', group: 'branding', order: 20, defaultValue: '', hint: 'Quadratisches Bild, idealerweise PNG mit 512×512 Pixel.' },
  { key: 'brand.primaryColor', label: 'Primärfarbe', type: 'COLOR', group: 'branding', order: 30, defaultValue: '#83060A', hint: 'SwissHub-Rot. Wird als Akzentfarbe in der ganzen Anwendung verwendet.' },
  { key: 'brand.secondaryColor', label: 'Sekundärfarbe', type: 'COLOR', group: 'branding', order: 40, defaultValue: '#E85056', hint: 'Hellerer Akzent für Links, Hovers und Verläufe. Auf ausreichenden Kontrast achten (mindestens 4.5:1 auf dunklem Grund).' },
  { key: 'brand.name', label: 'Markenname', type: 'STRING', group: 'branding', order: 50, defaultValue: 'SwissHub' },

  // General / SEO
  { key: 'site.title', label: 'Seitentitel', type: 'STRING', group: 'seo', order: 10, defaultValue: 'SwissHub Sponsoring' },
  { key: 'site.titleTemplate', label: 'Titel-Vorlage', type: 'STRING', group: 'seo', order: 15, defaultValue: '%s · SwissHub', hint: '%s wird durch den Seitentitel ersetzt.' },
  { key: 'site.description', label: 'Meta Description', type: 'TEXT', group: 'seo', order: 20, multiline: true, defaultValue: 'SwissHub verbindet die Schweizer Gaming-Community. Werden Sie Partner unserer Turniere und erreichen Sie eine engagierte Schweizer Gaming-Zielgruppe.' },
  { key: 'site.ogImageMediaId', label: 'OpenGraph Bild', type: 'MEDIA', group: 'seo', order: 30, defaultValue: '', hint: 'Vorschaubild beim Teilen der Seite, idealerweise 1200×630 Pixel.' },
  { key: 'site.keywords', label: 'Keywords', type: 'STRING', group: 'seo', order: 40, defaultValue: 'Gaming Sponsoring Schweiz, Esport Sponsoring, SwissHub, Gaming Community Schweiz' },

  // Contact
  { key: 'contact.email', label: 'Kontakt E-Mail', type: 'STRING', group: 'contact', order: 10, defaultValue: 'info@swisshub.gg' },
  { key: 'contact.websiteUrl', label: 'SwissHub Website', type: 'STRING', group: 'contact', order: 20, defaultValue: 'https://swisshub.gg' },
  { key: 'contact.discordUrl', label: 'Discord Link', type: 'STRING', group: 'contact', order: 30, defaultValue: '' },
  { key: 'contact.instagramUrl', label: 'Instagram Link', type: 'STRING', group: 'contact', order: 40, defaultValue: 'https://instagram.com/swisshub.gg' },
  { key: 'contact.twitchUrl', label: 'Twitch Link', type: 'STRING', group: 'contact', order: 50, defaultValue: '' },
  { key: 'contact.sponsorPageNote', label: 'Hinweis auf Sponsorenseiten', type: 'TEXT', group: 'contact', order: 60, multiline: true, defaultValue: 'Antworten Sie einfach direkt auf die E-Mail, über die Sie diesen Link erhalten haben.' },

  // Legal
  { key: 'legal.imprint', label: 'Impressum', type: 'HTML', group: 'legal', order: 10, multiline: true, defaultValue: '' },
  { key: 'legal.privacy', label: 'Datenschutzerklärung', type: 'HTML', group: 'legal', order: 20, multiline: true, defaultValue: '' },
  { key: 'legal.footerNote', label: 'Footer-Hinweis', type: 'STRING', group: 'legal', order: 30, defaultValue: 'SwissHub – Schweizer Gaming-Community seit 2021.' },
]

export const SETTING_GROUPS: { id: SettingDefinition['group']; label: string; description: string }[] = [
  { id: 'branding', label: 'Branding', description: 'Logo, Favicon und Farben der gesamten Plattform.' },
  { id: 'seo', label: 'SEO & Social', description: 'Titel, Meta-Description und Vorschaubild.' },
  { id: 'contact', label: 'Kontakt', description: 'Kontaktangaben und Links zu den SwissHub-Kanälen.' },
  { id: 'legal', label: 'Rechtliches', description: 'Impressum und Datenschutzerklärung.' },
]

export type SettingsMap = Record<string, string>

const DEFAULTS: SettingsMap = Object.fromEntries(
  SETTING_DEFINITIONS.map((definition) => [definition.key, definition.defaultValue]),
)

/** All settings merged over their defaults. Cached for the duration of a request. */
export const getSettings = cache(async (): Promise<SettingsMap> => {
  try {
    const rows = await prisma.siteSetting.findMany()
    const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]))
    return { ...DEFAULTS, ...stored }
  } catch {
    // The public pages must still render if the database is briefly unavailable.
    return { ...DEFAULTS }
  }
})

export function settingDefault(key: string): string {
  return DEFAULTS[key] ?? ''
}

export function definitionFor(key: string): SettingDefinition | undefined {
  return SETTING_DEFINITIONS.find((definition) => definition.key === key)
}

/** Re-exported so server modules keep a single settings import. */
export { hexToRgbChannels, isHexColor, readableForeground } from './color'
