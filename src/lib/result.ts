/**
 * Shared shape returned by every server action, consumed by `useActionState`
 * in the forms. Keeping this uniform is what makes the error/success handling
 * in the UI consistent.
 */
export interface ActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  /** Field level validation errors keyed by input name. */
  errors?: Record<string, string>
  /** Optional payload, e.g. a newly created id. */
  data?: Record<string, string>
}

export const IDLE: ActionState = { status: 'idle' }

export function success(message: string, data?: Record<string, string>): ActionState {
  return { status: 'success', message, data }
}

export function failure(message: string, errors?: Record<string, string>): ActionState {
  return { status: 'error', message, errors }
}

import type { ZodError } from 'zod'

/** Convert a Zod error into the flat field map used by the forms. */
export function fromZod(error: ZodError): ActionState {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!errors[key]) errors[key] = issue.message
  }
  return {
    status: 'error',
    message: 'Bitte prüfen Sie die markierten Felder.',
    errors,
  }
}

/**
 * Next.js signals `redirect()` and `notFound()` by throwing. Those must bubble
 * up instead of being turned into an error message.
 */
export function isControlFlowError(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest
  return typeof digest === 'string' && (digest.startsWith('NEXT_REDIRECT') || digest === 'NEXT_NOT_FOUND')
}

/** Wrap an unknown thrown value into a user facing error state. */
export function fromError(error: unknown, fallback = 'Es ist ein Fehler aufgetreten.'): ActionState {
  if (isControlFlowError(error)) throw error
  if (error instanceof Error && error.message) {
    return failure(error.message)
  }
  console.error('[action] unexpected error', error)
  return failure(fallback)
}
