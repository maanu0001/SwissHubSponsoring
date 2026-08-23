import 'server-only'

import sanitizeHtml from 'sanitize-html'

/**
 * Allowlist based sanitiser for rich text coming from the admin editor.
 * Applied on write *and* on render, so stored data can never introduce XSS.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'a', 'span', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    span: [],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
    b: 'strong',
    i: 'em',
    h1: 'h2',
    h5: 'h4',
    h6: 'h4',
  },
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
}

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return ''
  return sanitizeHtml(input, OPTIONS).trim()
}

/** Strip every tag – used for meta descriptions and previews. */
export function toPlainText(input: string | null | undefined, maxLength = 300): string {
  if (!input) return ''
  const text = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text
}

/** True when the rich text contains no visible content. */
export function isEmptyRichText(input: string | null | undefined): boolean {
  return toPlainText(input).length === 0
}
