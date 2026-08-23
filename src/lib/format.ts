import type { Decimal } from '@prisma/client/runtime/library'

const DATE = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
const DATE_LONG = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })
const DATE_TIME = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

type MaybeDate = Date | string | null | undefined

function toDate(value: MaybeDate): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: MaybeDate, fallback = '—'): string {
  const date = toDate(value)
  return date ? DATE.format(date) : fallback
}

export function formatDateLong(value: MaybeDate, fallback = '—'): string {
  const date = toDate(value)
  return date ? DATE_LONG.format(date) : fallback
}

export function formatDateTime(value: MaybeDate, fallback = '—'): string {
  const date = toDate(value)
  return date ? DATE_TIME.format(date) : fallback
}

/** "vor 3 Tagen" style relative label used in activity feeds. */
export function formatRelative(value: MaybeDate): string {
  const date = toDate(value)
  if (!date) return '—'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.round(hours / 24)
  if (days < 31) return days === 1 ? 'gestern' : `vor ${days} Tagen`
  return formatDate(date)
}

/** Swiss number formatting with an apostrophe as thousands separator. */
export function formatNumber(value: number | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback
  return new Intl.NumberFormat('de-CH').format(value).replace(/’/g, '’')
}

export type DecimalLike = Decimal | number | string | null | undefined

function toNumber(value: DecimalLike): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value.toString())
  return Number.isFinite(num) ? num : null
}

/** e.g. `CHF 2’000` – trailing ".00" is dropped for round amounts. */
export function formatAmount(value: DecimalLike, currency = 'CHF'): string | null {
  const num = toNumber(value)
  if (num === null) return null
  const hasFraction = Math.abs(num % 1) > 0.0001
  const formatted = new Intl.NumberFormat('de-CH', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })
    .format(num)
    .replace(/’/g, '’')
  return `${currency} ${formatted}`
}

export function decimalToInput(value: DecimalLike): string {
  const num = toNumber(value)
  if (num === null) return ''
  return Number.isInteger(num) ? String(num) : num.toFixed(2)
}

/** Human readable file size for the media library. */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

/** Compact date range label, e.g. "14. – 15. März 2026". */
export function formatDateRange(start: MaybeDate, end: MaybeDate): string {
  const from = toDate(start)
  const to = toDate(end)
  if (!from && !to) return ''
  if (from && !to) return formatDateLong(from)
  if (!from && to) return formatDateLong(to)
  if (from && to) {
    if (from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()) {
      return `${from.getDate()}. – ${formatDateLong(to)}`
    }
    return `${formatDateLong(from)} – ${formatDateLong(to)}`
  }
  return ''
}
