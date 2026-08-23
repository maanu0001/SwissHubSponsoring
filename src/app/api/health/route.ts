import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Liveness/readiness probe used by the Docker healthcheck and by a reverse
 * proxy. Returns 503 while the database is unreachable so an unhealthy
 * container is restarted instead of serving errors.
 */
export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return Response.json(
      { status: 'error', database: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
