'use client'

import type { PageTemplate } from '@prisma/client'

import { cn } from '@/lib/cn'
import { TEMPLATE_TYPE } from '@/lib/labels'
import { Badge } from '@/components/ui/Badge'

export interface TemplateSelectorProps {
  templates: (PageTemplate & { _count?: { defaultBenefits: number } })[]
  value: string
  onChange: (templateId: string) => void
  name?: string
  className?: string
}

/** Card based template picker used in the wizard. */
export function TemplateSelector({ templates, value, onChange, name, className }: TemplateSelectorProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)} role="radiogroup" aria-label="Template auswählen">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {templates.map((template) => {
        const selected = value === template.id
        const sectionCount = Array.isArray((template.structure as { sections?: unknown[] })?.sections)
          ? ((template.structure as { sections: unknown[] }).sections.length)
          : 0

        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(template.id)}
            className={cn(
              'rounded-card border px-4 py-4 text-left transition-colors',
              selected
                ? 'border-brand-accent bg-brand/10 shadow-glow'
                : 'border-line bg-surface-raised hover:border-line-strong',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[14px] font-medium text-fg">{template.name}</span>
              <Badge tone={TEMPLATE_TYPE[template.type].tone}>{TEMPLATE_TYPE[template.type].label}</Badge>
            </div>
            {template.description ? (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-subtle">{template.description}</p>
            ) : null}
            <p className="mt-2.5 text-[11.5px] text-fg-subtle">
              {sectionCount} Sektion{sectionCount === 1 ? '' : 'en'}
              {template._count ? ` · ${template._count.defaultBenefits} Standardleistungen` : ''}
            </p>
          </button>
        )
      })}
    </div>
  )
}
