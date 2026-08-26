const UMLAUTS: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss',
  à: 'a', á: 'a', â: 'a', ã: 'a', å: 'a', è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i', ò: 'o', ó: 'o', ô: 'o', õ: 'o',
  ù: 'u', ú: 'u', û: 'u', ç: 'c', ñ: 'n',
  À: 'A', Á: 'A', Â: 'A', È: 'E', É: 'E', Ê: 'E', Ç: 'C', Ñ: 'N',
}

/**
 * Turn a free-text name into a safe filename fragment.
 * Umlauts are transliterated rather than dropped, and everything that could
 * carry meaning in a path or header is removed.
 */
export function slugForFilename(input: string): string {
  return input
    .replace(/[äöüÄÖÜßàáâãåèéêëìíîïòóôõùúûçñÀÁÂÈÉÊÇÑ]/g, (char) => UMLAUTS[char] ?? char)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, '-und-')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export interface FilenameParts {
  brandName: string
  sponsorName: string
  tournamentTitle?: string | null
  mode: 'short' | 'full'
}

/**
 * e.g. `SwissHub_x_World-of-Games_CS2-Cup_Partnerschaft.pdf`
 * Contains no slashes, no traversal sequences and only ASCII.
 */
export function pdfFilename(parts: FilenameParts): string {
  const segments = [
    slugForFilename(parts.brandName) || 'SwissHub',
    'x',
    slugForFilename(parts.sponsorName) || 'Partner',
  ]

  if (parts.tournamentTitle) {
    // The brand name usually prefixes the tournament title; drop the repetition.
    const brandSlug = slugForFilename(parts.brandName)
    let tournament = slugForFilename(parts.tournamentTitle)
    if (brandSlug && tournament.toLowerCase().startsWith(`${brandSlug.toLowerCase()}-`)) {
      tournament = tournament.slice(brandSlug.length + 1)
    }
    if (tournament) segments.push(tournament)
  }

  segments.push(parts.mode === 'full' ? 'Sponsoring-Dossier' : 'Partnerschaft')

  const name = segments.filter(Boolean).join('_').slice(0, 150)
  return `${name}.pdf`
}
