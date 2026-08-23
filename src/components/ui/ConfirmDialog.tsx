'use client'

import { useState, type ReactNode } from 'react'

import { Button, type ButtonVariant } from './Button'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ButtonVariant
  /** When set, the user must type this exact text to enable confirmation. */
  requireTyped?: string
}

/** Guard rail in front of every destructive action. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  variant = 'danger',
  requireTyped,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')

  const blocked = Boolean(requireTyped) && typed.trim() !== requireTyped

  async function handleConfirm() {
    if (blocked) return
    setBusy(true)
    try {
      await onConfirm()
      setTyped('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (busy) return
        setTyped('')
        onClose()
      }}
      title={title}
      busy={busy}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={handleConfirm} loading={busy} disabled={blocked}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <div className="text-[13.5px] leading-relaxed text-fg-muted">{description}</div> : null}
      {requireTyped ? (
        <div className="mt-4 space-y-1.5">
          <label htmlFor="confirm-typed" className="block text-[13px] font-medium text-fg-muted">
            Tippen Sie <span className="font-mono text-fg">{requireTyped}</span> zur Bestätigung
          </label>
          <input
            id="confirm-typed"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            className="h-10 w-full rounded-control border border-line bg-surface-raised px-3 font-mono text-sm text-fg focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/35"
          />
        </div>
      ) : null}
    </Modal>
  )
}
