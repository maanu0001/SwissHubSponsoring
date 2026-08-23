import type { Config } from 'tailwindcss'

/**
 * All brand-sensitive colours resolve through CSS custom properties so that the
 * palette can be changed at runtime from /admin/settings/branding without a rebuild.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          raised: 'rgb(var(--c-surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--c-surface-overlay) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--c-line) / <alpha-value>)',
          strong: 'rgb(var(--c-line-strong) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--c-fg) / <alpha-value>)',
          muted: 'rgb(var(--c-fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--c-fg-subtle) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
          fg: 'rgb(var(--c-brand-fg) / <alpha-value>)',
          accent: 'rgb(var(--c-accent) / <alpha-value>)',
        },
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        info: 'rgb(var(--c-info) / <alpha-value>)',
      },
      borderRadius: {
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'sans-serif'],
      },
      maxWidth: {
        content: '1180px',
        prose: '68ch',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.4), 0 8px 24px -12px rgb(0 0 0 / 0.6)',
        lift: '0 12px 40px -16px rgb(0 0 0 / 0.75)',
        glow: '0 0 0 1px rgb(var(--c-brand) / 0.35), 0 12px 48px -20px rgb(var(--c-brand) / 0.65)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'none' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.35s ease both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      typography: () => ({
        swisshub: {
          css: {
            '--tw-prose-body': 'rgb(var(--c-fg-muted))',
            '--tw-prose-headings': 'rgb(var(--c-fg))',
            '--tw-prose-lead': 'rgb(var(--c-fg-muted))',
            '--tw-prose-links': 'rgb(var(--c-accent))',
            '--tw-prose-bold': 'rgb(var(--c-fg))',
            '--tw-prose-counters': 'rgb(var(--c-fg-subtle))',
            '--tw-prose-bullets': 'rgb(var(--c-brand))',
            '--tw-prose-hr': 'rgb(var(--c-line))',
            '--tw-prose-quotes': 'rgb(var(--c-fg))',
            '--tw-prose-quote-borders': 'rgb(var(--c-brand))',
            '--tw-prose-captions': 'rgb(var(--c-fg-subtle))',
            '--tw-prose-code': 'rgb(var(--c-fg))',
            '--tw-prose-pre-bg': 'rgb(var(--c-surface-raised))',
            '--tw-prose-th-borders': 'rgb(var(--c-line-strong))',
            '--tw-prose-td-borders': 'rgb(var(--c-line))',
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
