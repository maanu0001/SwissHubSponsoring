'use client'

import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'

const CONTROL =
  'w-full rounded-control border border-line bg-surface-raised px-3 text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-colors hover:border-line-strong focus:border-brand-accent focus:outline-none ' +
  'focus:ring-2 focus:ring-brand-accent/35 disabled:opacity-60 disabled:cursor-not-allowed'

export interface FieldShellProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  htmlFor?: string
  className?: string
  children: ReactNode
}

/** Label + hint + error wrapper shared by every form control. */
export function FieldShell({ label, hint, error, required, htmlFor, className, children }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-fg-muted">
          {label}
          {required ? <span className="ml-1 text-brand-accent" aria-hidden="true">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] leading-relaxed text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'prefix'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  className?: string
  wrapperClassName?: string
  /** Static text rendered in front of the input, e.g. a URL prefix. */
  prefix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, wrapperClassName, id, required, prefix, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  const control = (
    <input
      ref={ref}
      id={inputId}
      required={required}
      aria-invalid={error ? true : undefined}
      className={cn(CONTROL, 'h-10', error && 'border-danger focus:border-danger focus:ring-danger/30', prefix && 'pl-0', className)}
      {...props}
    />
  )

  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId} className={wrapperClassName}>
      {prefix ? (
        <div
          className={cn(
            'flex h-10 items-center overflow-hidden rounded-control border border-line bg-surface-raised transition-colors focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/35',
            error && 'border-danger',
          )}
        >
          <span className="shrink-0 select-none border-r border-line px-3 text-[13px] text-fg-subtle">{prefix}</span>
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn('h-full w-full bg-transparent px-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none', className)}
            {...props}
          />
        </div>
      ) : (
        control
      )}
    </FieldShell>
  )
})

export interface TextareaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  className?: string
  wrapperClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, id, required, rows = 4, ...props },
  ref,
) {
  const generatedId = useId()
  const areaId = id ?? generatedId
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={areaId} className={wrapperClassName}>
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'py-2.5 leading-relaxed resize-y', error && 'border-danger focus:border-danger focus:ring-danger/30', className)}
        {...props}
      />
    </FieldShell>
  )
})

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'className'> {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  className?: string
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, wrapperClassName, id, required, children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={selectId} className={wrapperClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={cn(
            CONTROL,
            'h-10 appearance-none pr-9',
            error && 'border-danger focus:border-danger focus:ring-danger/30',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </FieldShell>
  )
})

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'className'> {
  label: ReactNode
  description?: ReactNode
  className?: string
}

export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  const generatedId = useId()
  const boxId = id ?? generatedId
  return (
    <div className={cn('flex gap-3', className)}>
      <input
        type="checkbox"
        id={boxId}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line-strong bg-surface-raised text-brand accent-[rgb(var(--c-brand))] focus-visible:ring-2 focus-visible:ring-brand-accent"
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={boxId} className="cursor-pointer text-sm text-fg">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-subtle">{description}</p> : null}
      </div>
    </div>
  )
}

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  name?: string
  disabled?: boolean
  className?: string
}

/** Accessible switch with a hidden checkbox so it also works inside plain forms. */
export function Toggle({ checked, onChange, label, description, name, disabled, className }: ToggleProps) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {name ? <input type="hidden" name={name} value={checked ? 'true' : 'false'} /> : null}
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-brand' : 'bg-line-strong',
        )}
      >
        {/* `left-0` is required: without it the knob is laid out from the
            button's centered static position and escapes the track. */}
        <span
          className={cn(
            'absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
      {label || description ? (
        <div className="min-w-0">
          {label ? (
            <label htmlFor={id} className="cursor-pointer text-sm text-fg">
              {label}
            </label>
          ) : null}
          {description ? <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-subtle">{description}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
