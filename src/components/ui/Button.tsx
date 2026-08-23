'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'subtle'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-fg hover:bg-brand/85 active:bg-brand/95 shadow-[0_1px_0_rgb(255_255_255/0.08)_inset]',
  secondary:
    'bg-surface-overlay text-fg hover:bg-surface-overlay/70 border border-line-strong',
  outline:
    'border border-line-strong text-fg hover:border-brand-accent/70 hover:text-fg hover:bg-surface-raised/60',
  ghost: 'text-fg-muted hover:text-fg hover:bg-surface-raised',
  subtle: 'bg-surface-raised text-fg-muted hover:text-fg hover:bg-surface-overlay',
  danger: 'bg-danger text-white hover:bg-danger/85',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-control',
  md: 'h-10 px-4 text-sm gap-2 rounded-control',
  lg: 'h-12 px-6 text-[15px] gap-2.5 rounded-control',
  icon: 'h-9 w-9 rounded-control',
}

const BASE =
  'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none'

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<'button'>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  className?: string
  icon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, disabled, icon, fullWidth, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? <Spinner className="h-4 w-4" /> : icon}
      {children}
    </button>
  )
})

export interface ButtonLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  icon?: ReactNode
  fullWidth?: boolean
}

/** Same visual language as Button, but renders a real anchor for navigation. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
  fullWidth,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {icon}
      {children}
    </Link>
  )
}
