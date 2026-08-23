import { cn } from '@/lib/cn'

export interface BrandMarkProps {
  logoUrl: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { box: 'h-8', text: 'text-[15px]', fallback: 'h-8 w-8 text-[13px]' },
  md: { box: 'h-10', text: 'text-[17px]', fallback: 'h-10 w-10 text-[15px]' },
  lg: { box: 'h-14', text: 'text-[22px]', fallback: 'h-14 w-14 text-[20px]' },
}

/**
 * Renders the uploaded SwissHub logo, or a typographic fallback when none has
 * been uploaded yet – so the app never shows a broken image placeholder.
 */
export function BrandMark({ logoUrl, name, size = 'md', className }: BrandMarkProps) {
  const dimensions = SIZES[size]

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={cn('w-auto object-contain', dimensions.box, className)}
        loading="eager"
        decoding="async"
      />
    )
  }

  const initials = name.trim().slice(0, 2).toUpperCase() || 'SH'

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-[10px] bg-brand font-display font-bold text-brand-fg',
          dimensions.fallback,
        )}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className={cn('font-display font-semibold tracking-tight', dimensions.text)}>{name}</span>
    </span>
  )
}
