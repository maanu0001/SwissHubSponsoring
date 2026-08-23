'use client'

import { useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'

import type { ActionState } from '@/lib/result'
import { Alert } from './Alert'
import { Button, type ButtonProps } from './Button'
import { useToast } from './Toast'

/** Submit button that reflects the enclosing form's pending state automatically. */
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" loading={pending} {...props}>
      {children}
    </Button>
  )
}

/** Disables any control while the enclosing form is submitting. */
export function PendingFieldset({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <fieldset disabled={pending} className={className}>
      {children}
    </fieldset>
  )
}

/** Inline error/success banner driven by an ActionState. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === 'idle' || !state.message) return null
  return (
    <Alert tone={state.status === 'success' ? 'success' : 'danger'}>{state.message}</Alert>
  )
}

/** Surfaces an ActionState as a toast exactly once per state change. */
export function useActionToast(state: ActionState, options?: { successOnly?: boolean }) {
  const toast = useToast()
  const seen = useRef<ActionState | null>(null)

  useEffect(() => {
    if (state === seen.current) return
    seen.current = state
    if (state.status === 'success' && state.message) {
      toast.success(state.message)
    } else if (state.status === 'error' && state.message && !options?.successOnly) {
      toast.error(state.message)
    }
  }, [state, toast, options?.successOnly])
}
