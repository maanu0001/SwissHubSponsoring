'use client'

import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface WizardStep {
  id: number
  title: string
  description: string
}

export interface WizardShellProps {
  steps: WizardStep[]
  current: number
  onStepClick: (step: number) => void
  /** Highest step the user has reached; later steps stay locked. */
  maxReached: number
  children: ReactNode
}

/** Step indicator + panel frame shared by the sponsor and page wizards. */
export function WizardShell({ steps, current, onStepClick, maxReached, children }: WizardShellProps) {
  const active = steps.find((step) => step.id === current)

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr] [&>*]:min-w-0">
      <nav aria-label="Schritte" className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <ol className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {steps.map((step) => {
            const isCurrent = step.id === current
            const isDone = step.id < maxReached
            const isLocked = step.id > maxReached

            return (
              <li key={step.id} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => onStepClick(step.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-[13px] transition-colors lg:whitespace-normal',
                    isCurrent
                      ? 'bg-brand/15 font-medium text-fg'
                      : isLocked
                        ? 'cursor-not-allowed text-fg-subtle opacity-50'
                        : 'text-fg-muted hover:bg-surface-raised hover:text-fg',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      isCurrent
                        ? 'bg-brand text-brand-fg'
                        : isDone
                          ? 'bg-success/20 text-success'
                          : 'bg-surface-overlay text-fg-subtle',
                    )}
                    style={{ height: 22, width: 22 }}
                    aria-hidden="true"
                  >
                    {isDone ? (
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="hidden min-w-0 truncate lg:block">{step.title}</span>
                  <span className="lg:hidden">{step.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="min-w-0">
        <div className="surface-card">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[12px] font-medium uppercase tracking-wide text-brand-accent">
              Schritt {current} von {steps.length}
            </p>
            <h2 className="mt-1 font-display text-[17px] font-semibold tracking-tight">{active?.title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-subtle">{active?.description}</p>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  )
}
