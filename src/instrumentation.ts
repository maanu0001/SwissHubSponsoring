/**
 * Runs once when the Next.js server process starts (not during the build).
 * The bootstrap is idempotent, so a restart never changes existing data.
 *
 * The import sits inside a positive `NEXT_RUNTIME` check so the bundler can
 * eliminate it entirely from the edge build, where node:crypto is unavailable.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.SKIP_BOOTSTRAP === 'true') return
    try {
      const { bootstrap } = await import('./server/bootstrap')
      await bootstrap({ verbose: true })
    } catch (error) {
      // A failing bootstrap must not prevent the server from starting – for
      // example when migrations have not been applied yet.
      console.error('[bootstrap] failed', error)
    }
  }
}
