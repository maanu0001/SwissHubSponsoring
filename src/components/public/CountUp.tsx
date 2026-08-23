'use client'

import { useEffect, useRef, useState } from 'react'

export interface CountUpProps {
  /** Numeric target. When null the display value is rendered verbatim. */
  target: number | null
  /** Text rendered when no animation is possible, e.g. "6'000+". */
  display: string
  prefix?: string
  suffix?: string
  durationMs?: number
  className?: string
}

const formatter = new Intl.NumberFormat('de-CH')

/**
 * Counts up to the target once the element becomes visible.
 * The final value is rendered server side, so the number is correct even
 * without JavaScript and for screen readers.
 */
export function CountUp({ target, display, prefix = '', suffix = '', durationMs = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState<number | null>(null)

  useEffect(() => {
    if (target === null || target <= 0) return
    const node = ref.current
    if (!node) return

    const prefersReduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return

    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.disconnect()
          const start = performance.now()
          const step = (now: number) => {
            const progress = Math.min(1, (now - start) / durationMs)
            // easeOutExpo keeps the motion calm at the end.
            const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress)
            setValue(Math.round(target * eased))
            if (progress < 1) frame = requestAnimationFrame(step)
            else setValue(null)
          }
          frame = requestAnimationFrame(step)
        }
      },
      { threshold: 0.4 },
    )

    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [target, durationMs])

  return (
    <span ref={ref} className={className}>
      {value === null ? (
        <>
          {prefix}
          {display}
          {suffix}
        </>
      ) : (
        <>
          {prefix}
          {formatter.format(value).replace(/’/g, '’')}
          {suffix}
        </>
      )}
    </span>
  )
}
