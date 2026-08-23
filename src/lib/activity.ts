import 'server-only'

import type { ActivityAction, Prisma } from '@prisma/client'

import { prisma } from './db'

export interface LogInput {
  userId?: string | null
  action: ActivityAction
  entityType: string
  entityId?: string | null
  summary: string
  metadata?: Prisma.InputJsonValue
}

/**
 * Append an entry to the audit log. Never throws – a failing audit write must
 * not roll back the user's actual change.
 * Passwords and tokens are never passed in here by callers.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary.slice(0, 500),
        metadata: input.metadata,
      },
    })
  } catch (error) {
    console.error('[activity] failed to write log entry', error)
  }
}

export async function recentActivity(limit = 12) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  })
}
