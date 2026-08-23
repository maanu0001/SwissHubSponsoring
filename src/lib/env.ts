import 'server-only'

/**
 * Central, validated access to server side configuration.
 * Nothing in here may ever be imported from a client component.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`,
    )
  }
  return value
}

function optional(name: string, fallback: string): string {
  const value = process.env[name]
  return value === undefined || value === '' ? fallback : value
}

function intValue(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

export const env = {
  databaseUrl: isBuildPhase
    ? optional('DATABASE_URL', 'postgresql://build:build@localhost:5432/build')
    : required('DATABASE_URL'),

  /** Used to derive signing/hashing keys. Must be long and random in production. */
  authSecret: isBuildPhase
    ? optional('AUTH_SECRET', 'build-time-placeholder-secret-value-not-used')
    : required('AUTH_SECRET'),

  appUrl: optional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000').replace(/\/+$/, ''),

  uploadDir: optional('UPLOAD_DIR', './uploads'),
  maxUploadSize: intValue('MAX_UPLOAD_SIZE', 10 * 1024 * 1024),

  adminEmail: optional('ADMIN_EMAIL', ''),
  adminInitialPassword: optional('ADMIN_INITIAL_PASSWORD', ''),

  sessionMaxAgeSeconds: intValue('SESSION_MAX_AGE', 60 * 60 * 12),
  pagePasswordMaxAgeSeconds: intValue('PAGE_PASSWORD_MAX_AGE', 60 * 60 * 24 * 14),

  loginMaxAttempts: intValue('LOGIN_MAX_ATTEMPTS', 8),
  loginWindowSeconds: intValue('LOGIN_WINDOW_SECONDS', 15 * 60),

  skipBootstrap: process.env.SKIP_BOOTSTRAP === 'true',
  isProduction: process.env.NODE_ENV === 'production',
} as const

/** Public app URL, safe for use in client components through NEXT_PUBLIC_APP_URL. */
export function appUrl(path = ''): string {
  const base = env.appUrl
  if (!path) return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
