'use client'

import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import type { SectionVisibility } from '@/lib/pdf-sections'

export type VisibilityChannel = keyof SectionVisibility

export interface SectionVisibilityControlProps {
  value: SectionVisibility
  onChange: (channel: VisibilityChannel, next: boolean) => void
  /** The public main page has no PDF export, so it only shows the web channel. */
  channels?: VisibilityChannel[]
  disabled?: boolean
  className?: string
}

const CHANNELS: { id: VisibilityChannel; label: string; hint: string; short: string }[] = [
  { id: 'web', label: 'Website', hint: 'Auf der öffentlichen Seite sichtbar', short: 'Web' },
  { id: 'shortPdf', label: 'Kurzpräsentation', hint: 'Im kompakten Pitch-PDF enthalten', short: 'Kurz' },
  { id: 'fullPdf', label: 'Vollständiges Dossier', hint: 'Im ausführlichen PDF enthalten', short: 'Dossier' },
]

/**
 * Compact per-section visibility switch.
 *
 * Collapsed it is a single chip summarising the active channels; expanded it
 * offers one switch per channel. This keeps three independent flags out of the
 * section body, which would otherwise dominate the editor.
 */
export function SectionVisibilityControl({
  value,
  onChange,
  channels = ['web', 'shortPdf', 'fullPdf'],
  disabled,
  className,
}: SectionVisibilityControlProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = CHANNELS.filter((channel) => channels.includes(channel.id) && value[channel.id])
  const allHidden = active.length === 0

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title="Sichtbarkeit je Kanal"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
          allHidden
            ? 'border-warning/40 bg-warning/10 text-warning'
            : 'border-line-strong text-fg-muted hover:border-brand-accent/60 hover:text-fg',
          disabled && 'opacity-50',
        )}
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M1.8 10S4.6 4.8 10 4.8 18.2 10 18.2 10 15.4 15.2 10 15.2 1.8 10 1.8 10Z" />
          <circle cx="10" cy="10" r="2.4" />
        </svg>
        <span>{allHidden ? 'Nirgends sichtbar' : active.map((channel) => channel.short).join(' · ')}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute right-0 top-[calc(100%+6px)] z-40 w-64 overflow-hidden rounded-card border border-line bg-surface-raised shadow-lift animate-scale-in"
        >
          <p className="border-b border-line px-3.5 py-2.5 text-[12px] font-semibold uppercase tracking-wide text-fg-subtle">
            Sichtbarkeit
          </p>
          <ul className="p-1.5">
            {CHANNELS.filter((channel) => channels.includes(channel.id)).map((channel) => {
              const checked = value[channel.id]
              return (
                <li key={channel.id}>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    onClick={() => onChange(channel.id, !checked)}
                    className="flex w-full items-start gap-2.5 rounded-control px-2.5 py-2 text-left transition-colors hover:bg-surface-overlay"
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                        checked ? 'border-brand bg-brand text-brand-fg' : 'border-line-strong bg-surface',
                      )}
                      aria-hidden="true"
                    >
                      {checked ? (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="3.2">
                          <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] text-fg">{channel.label}</span>
                      <span className="block text-[11.5px] leading-relaxed text-fg-subtle">{channel.hint}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
