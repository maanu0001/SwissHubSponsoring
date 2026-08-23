const REPLACEMENTS: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss',
  à: 'a', á: 'a', â: 'a', ã: 'a', å: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o',
  ù: 'u', ú: 'u', û: 'u',
  ç: 'c', ñ: 'n',
}

/** URL safe slug. Keeps German umlauts readable ("Müller" -> "mueller"). */
export function slugify(input: string): string {
  return input
    .trim()
    .replace(/[äöüÄÖÜßàáâãåèéêëìíîïòóôõùúûçñ]/g, (char) => REPLACEMENTS[char] ?? char)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 80 && SLUG_PATTERN.test(slug)
}

/**
 * Find the next free slug by appending -2, -3, … .
 * `exists` is supplied by the caller so this stays storage agnostic.
 */
export async function uniqueSlug(
  base: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'seite'
  let candidate = root
  let counter = 2
  // Bounded loop – protects against a pathological amount of collisions.
  while (counter < 500) {
    if (!(await exists(candidate))) return candidate
    candidate = `${root.slice(0, 74)}-${counter}`
    counter += 1
  }
  return `${root.slice(0, 66)}-${Date.now().toString(36)}`
}
