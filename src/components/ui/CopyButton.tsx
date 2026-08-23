'use client'

import { useState } from 'react'

import { Button, type ButtonSize, type ButtonVariant } from './Button'

export interface CopyButtonProps {
  value: string
  label?: string
  copiedLabel?: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * Copies to the clipboard with a textarea fallback for browsers that block the
 * async Clipboard API (e.g. non-HTTPS origins).
 */
export function CopyButton({
  value,
  label = 'Link kopieren',
  copiedLabel = 'Kopiert!',
  variant = 'secondary',
  size = 'md',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)

  async function copy() {
    setFailed(false)
    let ok = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        ok = true
      }
    } catch {
      ok = false
    }

    if (!ok) {
      try {
        const field = document.createElement('textarea')
        field.value = value
        field.setAttribute('readonly', '')
        field.style.position = 'fixed'
        field.style.opacity = '0'
        document.body.appendChild(field)
        field.select()
        ok = document.execCommand('copy')
        document.body.removeChild(field)
      } catch {
        ok = false
      }
    }

    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } else {
      setFailed(true)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={copy}
      icon={
        copied ? (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <rect x="7" y="7" width="9" height="9" rx="2" />
            <path d="M13 5.5A2.5 2.5 0 0 0 10.5 3H6a3 3 0 0 0-3 3v4.5A2.5 2.5 0 0 0 5.5 13" strokeLinecap="round" />
          </svg>
        )
      }
    >
      {failed ? 'Manuell kopieren' : copied ? copiedLabel : label}
    </Button>
  )
}
