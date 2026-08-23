import type { SectionType, TemplateType } from '@prisma/client'

import type { SectionData } from '@/lib/section-data'

/**
 * Initial SwissHub content. Everything in here is editable through the admin
 * area afterwards – these are starting values, not hard coded content.
 */

// `value` holds the bare number; `prefix`/`suffix` carry decorations such as
// "~" or "+" so the count-up animation can replace only the number itself.
export const COMMUNITY_STATS: SectionData['stats'] = [
  { value: "6'000", label: 'Discord-Mitglieder', hint: 'Gewachsene Community seit 2021', numeric: 6000, prefix: '', suffix: '+' },
  { value: '200', label: 'Monatlich aktive Mitglieder', hint: 'Regelmässig aktiv im Discord', numeric: 200, prefix: '', suffix: '' },
  { value: "6'000", label: 'Nachrichten pro Monat', hint: 'Laufender Austausch in der Community', numeric: 6000, prefix: '', suffix: '' },
  { value: "30'000", label: 'Voice-Minuten pro Monat', hint: 'Gemeinsames Spielen im Voice-Chat', numeric: 30000, prefix: '', suffix: '' },
  { value: '4', label: 'Grössere Turniere', hint: 'Valorant, Apex Legends und League of Legends', numeric: 4, prefix: '', suffix: '' },
  { value: '100', label: 'Ø Streamviewer', hint: 'Durchschnitt bei Turnierstreams auf Twitch', numeric: 100, prefix: '~', suffix: '' },
]

export const TOURNAMENT_STATS: SectionData['stats'] = [
  { value: '50', label: 'Teilnehmende pro Turnier', hint: 'Durchschnitt der bisherigen Turniere', numeric: 50, prefix: '~', suffix: '' },
  { value: '100', label: 'Ø Zuschauer im Stream', hint: 'Live auf Twitch mit Caster', numeric: 100, prefix: '~', suffix: '' },
  { value: '2', label: 'Turniertage', hint: 'Gruppenphase, Halbfinale und Finale', numeric: 2, prefix: '', suffix: '' },
]

export const VISION_BULLETS: SectionData['bullets'] = [
  { title: 'Jeder ist willkommen', description: 'SwissHub ist ein offener Treffpunkt – unabhängig von Skill-Level, Game oder Hintergrund.', icon: '' },
  { title: 'Neue Mitspieler finden', description: 'Wer allein spielt, findet bei uns Mates für die nächste Runde – von Casual bis kompetitiv.', icon: '' },
  { title: 'Menschen vernetzen', description: 'Aus gemeinsamen Sessions entstehen langfristige Freundschaften und Gaming-Connections.', icon: '' },
  { title: 'Der Community etwas zurückgeben', description: 'Mit Events und Turnieren schaffen wir Aufmerksamkeit und Reichweite für die Schweizer Gaming-Szene.', icon: '' },
]

export const BUDGET_ITEMS: SectionData['budget'] = [
  { title: 'Marketing & Reichweite', description: 'Bewerbung des Turniers in der Schweizer Gaming-Community und auf unseren Kanälen.', share: null },
  { title: 'Turnierdesign & Grafiken', description: 'Turnierbranding, Social-Media-Assets, Overlays und Grafiken – inklusive Sponsorenplatzierung.', share: null },
  { title: 'Caster & Livestream-Produktion', description: 'Caster, Streaming-Setup und Produktion der Übertragung von Halbfinale und Finale.', share: null },
  { title: 'Preisgeld & Preise', description: 'Attraktive Preise für die Teilnehmenden – ein zentraler Faktor für starke Anmeldezahlen.', share: null },
  { title: 'Technische Infrastruktur', description: 'Server, Turniersoftware, Hosting und die Technik hinter dem Turnierbetrieb.', share: null },
  { title: 'Organisation & Communityentwicklung', description: 'Ein vorab vereinbarter Anteil für die Organisation und den weiteren Aufbau von SwissHub.', share: null },
]

export const PROCESS_STEPS: SectionData['steps'] = [
  { label: 'Tag 1', title: 'Gruppenphase', description: 'Alle angemeldeten Teams spielen in Gruppen um den Einzug in die Finalrunde.' },
  { label: 'Tag 2', title: 'Halbfinale & Finale', description: 'Die besten Teams treffen in der Finalrunde aufeinander – der Höhepunkt des Turniers.' },
  { label: 'Live', title: 'Twitch-Übertragung mit Caster', description: 'Halbfinale und Finale werden live auf Twitch übertragen und von einem Caster begleitet.' },
]

export const SPONSORING_MODEL_BULLETS: SectionData['bullets'] = [
  { title: 'Budget', description: 'Direkte finanzielle Unterstützung eines Turniers, z. B. CHF 2’000.', icon: '' },
  { title: 'Sachpreise & Produkte', description: 'Produkte aus Ihrem Sortiment als Preise für die Teilnehmenden.', icon: '' },
  { title: 'Hardware & Peripherie', description: 'Gaming-Hardware, Peripherie oder Ausrüstung für Turnier und Community.', icon: '' },
  { title: 'Game Keys & Gutscheine', description: 'Keys, Gutscheincodes oder Rabattaktionen für Giveaways und Verlosungen.', icon: '' },
  { title: 'Dienstleistungen & Infrastruktur', description: 'Hosting, Serverkapazität, Technik oder andere Dienstleistungen.', icon: '' },
  { title: 'Kombinationen', description: 'Jede Kombination daraus – wir stellen die Partnerschaft gemeinsam zusammen.', icon: '' },
]

export interface BenefitSeed {
  title: string
  description: string
  category: string
  defaultBenefit: boolean
}

export const BENEFIT_CATEGORIES = [
  'Branding',
  'Social Media',
  'Community',
  'Livestream',
  'Turnier',
  'Aktivierung',
  'Premium',
] as const

export const BENEFITS: BenefitSeed[] = [
  { title: 'Logo auf Turniergrafiken', description: 'Ihr Logo erscheint auf allen offiziellen Grafiken rund um das Turnier.', category: 'Branding', defaultBenefit: true },
  { title: 'Logo auf Social-Media-Posts', description: 'Sichtbare Platzierung Ihres Logos auf den Turnier-Posts unserer Kanäle.', category: 'Social Media', defaultBenefit: true },
  { title: 'Erwähnungen auf Discord', description: 'Nennung als Partner in Ankündigungen und Turnier-Updates auf unserem Discord.', category: 'Community', defaultBenefit: true },
  { title: 'Individuelle Sponsor-Posts auf Discord', description: 'Eigenständiger Beitrag zu Ihrem Unternehmen oder Angebot in unserer Community.', category: 'Community', defaultBenefit: false },
  { title: 'Erwähnungen auf Instagram', description: 'Nennung und Verlinkung als Partner in unseren Instagram-Beiträgen und Stories.', category: 'Social Media', defaultBenefit: true },
  { title: 'Branding im Twitch-Livestream', description: 'Präsenz Ihrer Marke während der Live-Übertragung von Halbfinale und Finale.', category: 'Livestream', defaultBenefit: true },
  { title: 'Sponsorlogo in Stream-Overlays', description: 'Dauerhafte Logoplatzierung im Overlay während der gesamten Übertragung.', category: 'Livestream', defaultBenefit: true },
  { title: 'Sponsorlogo in Starting-Screens', description: 'Ihr Logo auf dem Startbildschirm vor Beginn der Übertragung.', category: 'Livestream', defaultBenefit: false },
  { title: 'Sponsorlogo in Pausen-Screens', description: 'Ihr Logo auf den Pausenbildschirmen zwischen den Matches.', category: 'Livestream', defaultBenefit: false },
  { title: 'Erwähnungen durch Caster', description: 'Der Caster nennt Ihr Unternehmen während der Übertragung.', category: 'Livestream', defaultBenefit: true },
  { title: 'Logo auf Turnierseiten', description: 'Platzierung als Partner auf den Turnier- und Anmeldeseiten.', category: 'Turnier', defaultBenefit: true },
  { title: 'Link zur Website des Sponsors', description: 'Direkte Verlinkung Ihrer Website von unseren Turnierseiten aus.', category: 'Turnier', defaultBenefit: true },
  { title: 'Giveaways', description: 'Verlosung Ihrer Produkte oder Angebote in der Community.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Verlosungen', description: 'Gezielte Verlosungsaktionen rund um das Turnier.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Gutscheincodes', description: 'Exklusive Gutscheincodes für die SwissHub-Community.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Rabattaktionen', description: 'Zeitlich begrenzte Rabattaktionen für unsere Mitglieder.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Produktplatzierungen', description: 'Sichtbare Einbindung Ihrer Produkte in Stream und Content.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Hardware-Integration', description: 'Einsatz Ihrer Hardware im Turnierbetrieb oder in der Produktion.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Game-Key-Giveaways', description: 'Verteilung von Game Keys an die Community.', category: 'Aktivierung', defaultBenefit: false },
  { title: 'Naming Rights', description: 'Das Turnier trägt Ihren Namen – maximale Sichtbarkeit über die gesamte Laufzeit.', category: 'Premium', defaultBenefit: false },
  { title: '„Presented by“-Integration', description: 'Ihr Unternehmen wird durchgängig als präsentierender Partner geführt.', category: 'Premium', defaultBenefit: false },
  { title: 'Sponsor eines bestimmten Turnierabschnitts', description: 'Exklusive Präsenz für einen Abschnitt, z. B. das Finale oder die Gruppenphase.', category: 'Premium', defaultBenefit: false },
  { title: 'Individuelle Community-Aktivierungen', description: 'Gemeinsam entwickelte Aktionen, die exakt zu Ihren Zielen passen.', category: 'Aktivierung', defaultBenefit: false },
]

export interface TemplateSectionSeed {
  type: SectionType
  title?: string
  subtitle?: string
  content?: string
  data?: SectionData
  visible?: boolean
}

export interface TemplateSeed {
  slug: string
  name: string
  type: TemplateType
  description: string
  order: number
  /** Titles of benefits preselected when this template is used. */
  defaultBenefitTitles: string[]
  sections: TemplateSectionSeed[]
}

const HERO_SECTION: TemplateSectionSeed = {
  type: 'HERO',
  title: '',
  subtitle: 'Gemeinsam bringen wir die Schweizer Gaming-Community zusammen.',
  data: {
    hero: { eyebrow: 'Sponsoring-Anfrage', showSponsorLogo: true, showSwissHubLogo: true, badges: [] },
  },
}

const ABOUT_SECTION: TemplateSectionSeed = {
  type: 'ABOUT_SWISSHUB',
  title: 'Über SwissHub',
  subtitle: 'Schweizer Gaming-Verein, gegründet 2021',
  content:
    '<p>SwissHub ist ein Schweizer Gaming-Verein, der 2021 gegründet wurde. Über unseren Discord haben wir eine Community aufgebaut, in der sich Gamerinnen und Gamer aus der ganzen Schweiz treffen, gemeinsam spielen und neue Mitspieler finden.</p><p>Mit eigenen Online-Turnieren geben wir dieser Community etwas zurück und schaffen zusätzliche Aufmerksamkeit für die Schweizer Gaming-Szene.</p>',
}

const VISION_SECTION: TemplateSectionSeed = {
  type: 'VISION',
  title: 'Unsere Vision',
  subtitle: 'Connect. Compete. Belong.',
  content:
    '<p>SwissHub möchte langfristig einen zentralen Treffpunkt für die Schweizer Gaming-Community bilden – einen Ort, an dem jeder willkommen ist und jeder sich selbst sein darf.</p>',
  data: { bullets: VISION_BULLETS },
}

const REACH_SECTION: TemplateSectionSeed = {
  type: 'REACH',
  title: 'Unsere Reichweite',
  subtitle: 'Aktuelle Kennzahlen der SwissHub-Community',
  data: { stats: COMMUNITY_STATS },
}

const BUDGET_SECTION: TemplateSectionSeed = {
  type: 'BUDGET_USAGE',
  title: 'Wohin fliesst das Sponsoring?',
  subtitle: 'Transparent aufgeschlüsselt',
  data: { budget: BUDGET_ITEMS },
}

const HISTORY_SECTION: TemplateSectionSeed = {
  type: 'TOURNAMENT_HISTORY',
  title: 'Bisherige Turniere',
  subtitle: 'Was wir bereits umgesetzt haben',
  data: { tournamentIds: [] },
}

const PARTNERS_SECTION: TemplateSectionSeed = {
  type: 'PAST_PARTNERS',
  title: 'Bisherige Partner',
  subtitle: 'Unternehmen, die SwissHub bereits unterstützt haben',
  data: { partnerIds: [] },
}

const CTA_SECTION: TemplateSectionSeed = {
  type: 'CTA',
  title: 'Interesse an einer Zusammenarbeit?',
  content:
    '<p>Wir freuen uns darauf, die Partnerschaft gemeinsam mit Ihnen auszugestalten – gerne passen wir Leistungen und Umfang exakt auf Ihre Ziele an.</p>',
  data: { contactNote: 'Antworten Sie einfach direkt auf die E-Mail, über die Sie diesen Link erhalten haben.' },
}

function personalIntro(focus: string): TemplateSectionSeed {
  return {
    type: 'PERSONAL_INTRO',
    title: 'Guten Tag',
    content: `<p>Wir haben uns gefragt, welche Schweizer Unternehmen wirklich zur Gaming-Community passen – und sind dabei auf Sie gekommen. ${focus}</p><p>Auf dieser Seite haben wir zusammengestellt, wer wir sind, was wir planen und wie eine Partnerschaft konkret aussehen könnte.</p>`,
  }
}

const TOURNAMENT_SECTION: TemplateSectionSeed = {
  type: 'TOURNAMENT',
  title: 'Das geplante Turnier',
  subtitle: 'Eckdaten auf einen Blick',
  data: { stats: TOURNAMENT_STATS },
}

const PROPOSAL_SECTION: TemplateSectionSeed = {
  type: 'SPONSORING_PROPOSAL',
  title: 'Unser Sponsoring-Vorschlag',
  subtitle: 'Was wir konkret suchen',
  data: { showAmount: true },
}

const BENEFITS_SECTION: TemplateSectionSeed = {
  type: 'BENEFITS',
  title: 'Was Sie als Partner erhalten',
  subtitle: 'Individuell zusammengestellt – keine starren Pakete',
}

const WHY_SECTION_BASE: TemplateSectionSeed = {
  type: 'WHY_PARTNERSHIP',
  title: 'Warum diese Partnerschaft passt',
  data: { bullets: [] },
}

export const TEMPLATES: TemplateSeed[] = [
  {
    slug: 'standard-sponsoring',
    name: 'Standard Sponsoring',
    type: 'STANDARD',
    order: 10,
    description: 'Ausgewogener Aufbau für allgemeine, individuell zusammengestellte Turnierpartnerschaften.',
    defaultBenefitTitles: [
      'Logo auf Turniergrafiken', 'Logo auf Social-Media-Posts', 'Erwähnungen auf Discord',
      'Erwähnungen auf Instagram', 'Branding im Twitch-Livestream', 'Sponsorlogo in Stream-Overlays',
      'Erwähnungen durch Caster', 'Logo auf Turnierseiten', 'Link zur Website des Sponsors',
    ],
    sections: [
      HERO_SECTION,
      personalIntro('Ihr Unternehmen ist in der Schweiz verankert – genau wie unsere Community.'),
      { ...WHY_SECTION_BASE, data: { bullets: [
        { title: 'Schweizer Zielgruppe', description: 'Unsere Community besteht aus Gamerinnen und Gamern aus der ganzen Schweiz.', icon: '' },
        { title: 'Engagierte Reichweite', description: 'Keine reine Followerzahl, sondern eine aktive Community mit täglichem Austausch.', icon: '' },
        { title: 'Sichtbarkeit im richtigen Moment', description: 'Ihre Marke erscheint dort, wo die Aufmerksamkeit am höchsten ist – im Turnier und im Stream.', icon: '' },
      ] } },
      ABOUT_SECTION,
      VISION_SECTION,
      REACH_SECTION,
      TOURNAMENT_SECTION,
      PROPOSAL_SECTION,
      BENEFITS_SECTION,
      BUDGET_SECTION,
      HISTORY_SECTION,
      PARTNERS_SECTION,
      CTA_SECTION,
    ],
  },
  {
    slug: 'hauptsponsor',
    name: 'Hauptsponsor',
    type: 'MAIN_SPONSOR',
    order: 20,
    description: 'Fokus auf maximale Sichtbarkeit, Naming Rights, „Presented by“ und umfassendes Livestream-Branding.',
    defaultBenefitTitles: [
      'Naming Rights', '„Presented by“-Integration', 'Logo auf Turniergrafiken', 'Logo auf Social-Media-Posts',
      'Branding im Twitch-Livestream', 'Sponsorlogo in Stream-Overlays', 'Sponsorlogo in Starting-Screens',
      'Sponsorlogo in Pausen-Screens', 'Erwähnungen durch Caster', 'Erwähnungen auf Discord',
      'Erwähnungen auf Instagram', 'Logo auf Turnierseiten', 'Link zur Website des Sponsors',
      'Individuelle Sponsor-Posts auf Discord',
    ],
    sections: [
      { ...HERO_SECTION, data: { hero: { eyebrow: 'Hauptsponsoring', showSponsorLogo: true, showSwissHubLogo: true, badges: ['Naming Rights', 'Presented by'] } } },
      personalIntro('Für unser nächstes Turnier suchen wir einen Hauptpartner, der das Event sichtbar mitträgt.'),
      { ...WHY_SECTION_BASE, title: 'Warum als Hauptsponsor', data: { bullets: [
        { title: 'Maximale Sichtbarkeit', description: 'Als Hauptsponsor sind Sie in jeder Turnierkommunikation präsent – von der Ankündigung bis zum Finale.', icon: '' },
        { title: 'Naming Rights', description: 'Das Turnier trägt Ihren Namen und wird über die gesamte Laufzeit damit kommuniziert.', icon: '' },
        { title: 'Exklusivität', description: 'Als Hauptpartner stehen Sie klar im Vordergrund und teilen die Bühne mit niemandem.', icon: '' },
      ] } },
      ABOUT_SECTION,
      VISION_SECTION,
      REACH_SECTION,
      TOURNAMENT_SECTION,
      PROPOSAL_SECTION,
      BENEFITS_SECTION,
      BUDGET_SECTION,
      HISTORY_SECTION,
      PARTNERS_SECTION,
      CTA_SECTION,
    ],
  },
  {
    slug: 'gaming-hardware-partner',
    name: 'Gaming / Hardware Partner',
    type: 'HARDWARE_PARTNER',
    order: 30,
    description: 'Fokus auf Hardware, Peripherie, Produktsichtbarkeit, Giveaways und Produktintegration.',
    defaultBenefitTitles: [
      'Hardware-Integration', 'Produktplatzierungen', 'Giveaways', 'Logo auf Turniergrafiken',
      'Logo auf Social-Media-Posts', 'Branding im Twitch-Livestream', 'Sponsorlogo in Stream-Overlays',
      'Erwähnungen durch Caster', 'Erwähnungen auf Instagram', 'Link zur Website des Sponsors',
    ],
    sections: [
      { ...HERO_SECTION, data: { hero: { eyebrow: 'Hardware-Partnerschaft', showSponsorLogo: true, showSwissHubLogo: true, badges: ['Produktintegration', 'Giveaways'] } } },
      personalIntro('Ihre Produkte sind genau das, womit unsere Community täglich spielt.'),
      { ...WHY_SECTION_BASE, title: 'Warum SwissHub für Ihre Produkte passt', data: { bullets: [
        { title: 'Zielgruppe mit Kaufinteresse', description: 'Gaming-Hardware ist in unserer Community ein Dauerthema – von Peripherie bis Setup.', icon: '' },
        { title: 'Produkte im Einsatz zeigen', description: 'Ihre Hardware wird im Turnierbetrieb und im Stream sichtbar eingesetzt.', icon: '' },
        { title: 'Giveaways mit echter Wirkung', description: 'Verlosungen erzeugen in unserer Community erfahrungsgemäss die höchste Beteiligung.', icon: '' },
      ] } },
      ABOUT_SECTION,
      REACH_SECTION,
      TOURNAMENT_SECTION,
      PROPOSAL_SECTION,
      BENEFITS_SECTION,
      { type: 'GALLERY', title: 'Eindrücke', subtitle: 'Bilder aus unseren Turnieren', data: { gallery: [] }, visible: false },
      BUDGET_SECTION,
      HISTORY_SECTION,
      PARTNERS_SECTION,
      CTA_SECTION,
    ],
  },
  {
    slug: 'key-giveaway-partner',
    name: 'Key / Giveaway Partner',
    type: 'KEY_GIVEAWAY_PARTNER',
    order: 40,
    description: 'Fokus auf Game Keys, Gutscheine, Community-Giveaways und Rabattcodes.',
    defaultBenefitTitles: [
      'Game-Key-Giveaways', 'Gutscheincodes', 'Rabattaktionen', 'Verlosungen', 'Giveaways',
      'Erwähnungen auf Discord', 'Individuelle Sponsor-Posts auf Discord', 'Erwähnungen auf Instagram',
      'Logo auf Turniergrafiken', 'Link zur Website des Sponsors',
    ],
    sections: [
      { ...HERO_SECTION, data: { hero: { eyebrow: 'Giveaway-Partnerschaft', showSponsorLogo: true, showSwissHubLogo: true, badges: ['Game Keys', 'Community-Aktionen'] } } },
      personalIntro('Wir suchen Partner, die unserer Community etwas Konkretes in die Hand geben können.'),
      { ...WHY_SECTION_BASE, title: 'Warum Giveaways bei uns funktionieren', data: { bullets: [
        { title: 'Direkte Aktivierung', description: 'Keys und Codes erreichen unsere Mitglieder unmittelbar über Discord.', icon: '' },
        { title: 'Hohe Beteiligung', description: 'Verlosungen gehören zu den Aktionen mit der stärksten Resonanz in unserer Community.', icon: '' },
        { title: 'Messbarer Effekt', description: 'Über individuelle Codes lässt sich der Rücklauf klar zuordnen.', icon: '' },
      ] } },
      ABOUT_SECTION,
      REACH_SECTION,
      TOURNAMENT_SECTION,
      PROPOSAL_SECTION,
      BENEFITS_SECTION,
      BUDGET_SECTION,
      HISTORY_SECTION,
      PARTNERS_SECTION,
      CTA_SECTION,
    ],
  },
  {
    slug: 'it-tech-partner',
    name: 'IT / Tech Partner',
    type: 'IT_TECH_PARTNER',
    order: 50,
    description: 'Fokus auf Hosting, Infrastruktur, Tech-Produkte und Dienstleistungen von IT-Unternehmen.',
    defaultBenefitTitles: [
      'Logo auf Turniergrafiken', 'Logo auf Turnierseiten', 'Link zur Website des Sponsors',
      'Branding im Twitch-Livestream', 'Sponsorlogo in Stream-Overlays', 'Erwähnungen durch Caster',
      'Erwähnungen auf Discord', 'Erwähnungen auf Instagram', 'Individuelle Sponsor-Posts auf Discord',
    ],
    sections: [
      { ...HERO_SECTION, data: { hero: { eyebrow: 'Technologie-Partnerschaft', showSponsorLogo: true, showSwissHubLogo: true, badges: ['Infrastruktur', 'Hosting'] } } },
      personalIntro('Hinter jedem Turnier steckt Technik – und dort suchen wir verlässliche Partner.'),
      { ...WHY_SECTION_BASE, title: 'Warum SwissHub als Tech-Referenz', data: { bullets: [
        { title: 'Technikaffine Zielgruppe', description: 'Unsere Community beschäftigt sich intensiv mit Hosting, Hardware und Infrastruktur.', icon: '' },
        { title: 'Sichtbarkeit als Enabler', description: 'Sie ermöglichen das Turnier technisch – und werden genau so kommuniziert.', icon: '' },
        { title: 'Langfristige Zusammenarbeit', description: 'Infrastruktur-Partnerschaften funktionieren über einzelne Events hinaus.', icon: '' },
      ] } },
      ABOUT_SECTION,
      REACH_SECTION,
      TOURNAMENT_SECTION,
      PROPOSAL_SECTION,
      BENEFITS_SECTION,
      BUDGET_SECTION,
      HISTORY_SECTION,
      PARTNERS_SECTION,
      CTA_SECTION,
    ],
  },
  {
    slug: 'custom',
    name: 'Custom',
    type: 'CUSTOM',
    order: 60,
    description: 'Fast leeres Template für einen komplett freien Aufbau. Sektionen werden manuell ergänzt.',
    defaultBenefitTitles: [],
    sections: [HERO_SECTION, CTA_SECTION],
  },
]

export interface TournamentSeed {
  title: string
  slug: string
  game: string
  description: string
  format: string
  participantCount: number
  streamViewerCount: number
  status: 'COMPLETED' | 'PLANNED'
  order: number
}

export const TOURNAMENTS: TournamentSeed[] = [
  {
    title: 'SwissHub Valorant Cup',
    slug: 'swisshub-valorant-cup',
    game: 'Valorant',
    description:
      'Online-Turnier über zwei Turniertage: Gruppenphase am ersten Tag, Halbfinale und Finale am zweiten Tag – live auf Twitch mit Caster.',
    format: 'Online · 2 Turniertage · Gruppenphase, Halbfinale, Finale',
    participantCount: 50,
    streamViewerCount: 100,
    status: 'COMPLETED',
    order: 10,
  },
  {
    title: 'SwissHub Apex Legends Cup',
    slug: 'swisshub-apex-legends-cup',
    game: 'Apex Legends',
    description:
      'Vollständig online ausgetragenes Turnier mit Gruppenphase und Finalrunde. Die Finalspiele wurden live auf Twitch übertragen.',
    format: 'Online · 2 Turniertage · Gruppenphase, Halbfinale, Finale',
    participantCount: 50,
    streamViewerCount: 100,
    status: 'COMPLETED',
    order: 20,
  },
  {
    title: 'SwissHub League of Legends Cup',
    slug: 'swisshub-league-of-legends-cup',
    game: 'League of Legends',
    description:
      'Turnier für die Schweizer League-of-Legends-Community mit Gruppenphase, Halbfinale und Finale – die Finalrunde live auf Twitch.',
    format: 'Online · 2 Turniertage · Gruppenphase, Halbfinale, Finale',
    participantCount: 50,
    streamViewerCount: 100,
    status: 'COMPLETED',
    order: 30,
  },
  {
    title: 'SwissHub Community Cup',
    slug: 'swisshub-community-cup',
    game: 'Valorant',
    description:
      'Community-Turnier von SwissHub mit demselben bewährten Format: zwei Turniertage, Gruppenphase und eine live übertragene Finalrunde.',
    format: 'Online · 2 Turniertage · Gruppenphase, Halbfinale, Finale',
    participantCount: 50,
    streamViewerCount: 100,
    status: 'COMPLETED',
    order: 40,
  },
]

export const PARTNERS: { name: string; website: string; description: string; order: number }[] = [
  {
    name: 'hosttech GmbH',
    website: 'https://www.hosttech.ch',
    description: 'Schweizer Hosting-Anbieter und bisheriger Partner von SwissHub.',
    order: 10,
  },
  {
    name: 'Freestar Informatik',
    website: '',
    description: 'IT-Dienstleister und bisheriger Partner von SwissHub.',
    order: 20,
  },
]

export interface SiteSectionSeed {
  key: string
  type: SectionType
  title: string
  subtitle?: string
  content?: string
  data?: SectionData
  order: number
  visible?: boolean
}

export const SITE_SECTIONS: SiteSectionSeed[] = [
  {
    key: 'hero',
    type: 'HERO',
    title: 'Die Schweizer Gaming-Community. Gemeinsam weiter.',
    subtitle:
      'SwissHub verbindet Gaming, Community und Brands. Wir bringen Schweizer Gamerinnen und Gamer zusammen – in unserem Discord und in eigenen Online-Turnieren.',
    order: 10,
    data: {
      hero: {
        eyebrow: 'Sponsoring bei SwissHub',
        showSwissHubLogo: true,
        showSponsorLogo: false,
        badges: ['Gegründet 2021', 'Online-Turniere', 'Live auf Twitch'],
        cta: {
          primaryLabel: 'SwissHub kennenlernen',
          primaryHref: '#ueber-swisshub',
          secondaryLabel: 'Sponsoring ansehen',
          secondaryHref: '#sponsoring',
        },
      },
    },
  },
  {
    key: 'stats',
    type: 'REACH',
    title: 'SwissHub in Zahlen',
    subtitle: 'Eine gewachsene, aktive Community – keine gekaufte Reichweite.',
    order: 20,
    data: { stats: COMMUNITY_STATS },
  },
  {
    key: 'about',
    type: 'ABOUT_SWISSHUB',
    title: 'Über SwissHub',
    subtitle: 'Schweizer Gaming-Verein seit 2021',
    order: 30,
    content:
      '<p>SwissHub ist ein Schweizer Gaming-Verein, gegründet im Jahr 2021. Über unseren Discord ist seither eine Community entstanden, in der sich Gamerinnen und Gamer aus der ganzen Schweiz treffen, gemeinsam spielen und neue Mitspieler finden.</p><p>Mit eigenen Online-Turnieren geben wir dieser Community etwas zurück und schaffen zusätzliche Aufmerksamkeit und Reichweite für die Schweizer Gaming-Szene.</p>',
  },
  {
    key: 'vision',
    type: 'VISION',
    title: 'Unsere Vision',
    subtitle: 'Connect. Compete. Belong.',
    order: 40,
    content:
      '<p>Wir möchten langfristig einen zentralen Treffpunkt für die Schweizer Gaming-Community bilden – einen Ort, an dem jeder willkommen ist, jeder sich selbst sein darf und aus gemeinsamen Sessions echte Freundschaften entstehen.</p>',
    data: { bullets: VISION_BULLETS },
  },
  {
    key: 'tournaments',
    type: 'TOURNAMENT_HISTORY',
    title: 'Unsere Turniere',
    subtitle: 'Valorant, Apex Legends und League of Legends',
    order: 50,
    data: { tournamentIds: [] },
  },
  {
    key: 'process',
    type: 'PROCESS',
    title: 'So läuft ein SwissHub-Turnier ab',
    subtitle: 'Bewährtes Format über zwei Turniertage',
    order: 60,
    data: { steps: PROCESS_STEPS },
  },
  {
    key: 'sponsoring',
    type: 'CUSTOM_TEXT',
    title: 'Sponsoring bei SwissHub',
    subtitle: 'Jede Partnerschaft wird individuell zusammengestellt',
    order: 70,
    content:
      '<p>Wir bieten bewusst keine starren Bronze-, Silber- oder Gold-Pakete an. Stattdessen schauen wir gemeinsam, was zu Ihrem Unternehmen passt – und stellen die Partnerschaft daraus zusammen.</p>',
    data: { bullets: SPONSORING_MODEL_BULLETS },
  },
  {
    key: 'benefits',
    type: 'BENEFITS',
    title: 'Was Sponsoren erhalten können',
    subtitle: 'Unser modularer Leistungskatalog',
    order: 80,
  },
  {
    key: 'budget',
    type: 'BUDGET_USAGE',
    title: 'Wohin fliesst das Sponsoring?',
    subtitle: 'Transparent aufgeschlüsselt',
    order: 90,
    data: { budget: BUDGET_ITEMS },
  },
  {
    key: 'partners',
    type: 'PAST_PARTNERS',
    title: 'Bisherige Partner',
    subtitle: 'Unternehmen, die SwissHub bereits unterstützt haben',
    order: 100,
    data: { partnerIds: [] },
  },
  {
    key: 'contact',
    type: 'CONTACT',
    title: 'Interesse an einer Zusammenarbeit?',
    order: 110,
    content:
      '<p>Wir freuen uns über Ihre Nachricht und melden uns zeitnah zurück. Gerne stellen wir Ihnen ein individuelles Sponsoring-Konzept für Ihr Unternehmen zusammen.</p>',
  },
]

/**
 * Legal pages are seeded as clearly marked placeholders – legal content must be
 * supplied by SwissHub, never invented.
 */
export const LEGAL_PLACEHOLDER_IMPRINT = `<h2>Impressum</h2>
<p><strong>Hinweis: Dieser Text ist ein Platzhalter und muss noch durch die tatsächlichen Angaben von SwissHub ersetzt werden.</strong> Sie können ihn unter „Einstellungen → Rechtliches“ bearbeiten.</p>
<h3>Verantwortlich für den Inhalt</h3>
<p>SwissHub<br>[Rechtsform]<br>[Strasse und Hausnummer]<br>[PLZ und Ort]<br>Schweiz</p>
<h3>Kontakt</h3>
<p>E-Mail: info@swisshub.gg<br>Website: https://swisshub.gg</p>
<h3>Vertretungsberechtigte Personen</h3>
<p>[Namen der vertretungsberechtigten Personen ergänzen]</p>
<h3>Handelsregister / UID</h3>
<p>[Falls vorhanden: Handelsregistereintrag und UID-Nummer ergänzen]</p>`

export const LEGAL_PLACEHOLDER_PRIVACY = `<h2>Datenschutzerklärung</h2>
<p><strong>Hinweis: Dieser Text ist ein Platzhalter und muss noch rechtlich geprüft und vervollständigt werden.</strong> Sie können ihn unter „Einstellungen → Rechtliches“ bearbeiten.</p>
<h3>Verantwortliche Stelle</h3>
<p>SwissHub, [Adresse ergänzen], E-Mail: info@swisshub.gg</p>
<h3>Welche Daten wir bearbeiten</h3>
<p>Diese Website kommt ohne Kontaktformulare, ohne Newsletter-Anmeldung und ohne externe Analyse- oder Tracking-Dienste aus.</p>
<ul>
<li><strong>Server-Logs:</strong> Beim Aufruf der Website werden technisch notwendige Daten verarbeitet. [Aufbewahrungsdauer und Details ergänzen.]</li>
<li><strong>Aufrufstatistik:</strong> Für individuelle Sponsorenseiten zählen wir ausschliesslich die Anzahl der Aufrufe pro Tag. Es werden dabei keine IP-Adressen, keine Cookies zu Analysezwecken und keine personenbezogenen Merkmale gespeichert.</li>
<li><strong>Technisch notwendige Cookies:</strong> Für den Adminbereich und für passwortgeschützte Sponsorenseiten wird ein technisch notwendiges Cookie gesetzt.</li>
</ul>
<h3>Eingebettete Inhalte</h3>
<p>Auf einzelnen Seiten können Inhalte von Twitch oder YouTube eingebettet sein. Beim Abspielen werden Daten an die jeweiligen Anbieter übermittelt. [Details und Verlinkung der Datenschutzerklärungen ergänzen.]</p>
<h3>Ihre Rechte</h3>
<p>[Auskunft, Berichtigung, Löschung und weitere Betroffenenrechte gemäss geltendem Datenschutzrecht ergänzen.]</p>`
