import type { Metadata } from 'next'
import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { NewTemplateButton } from '@/components/admin/NewTemplateButton'
import { prisma } from '@/lib/db'
import { TEMPLATE_TYPE } from '@/lib/labels'
import { requireUser } from '@/lib/session'
import { parseTemplateStructure } from '@/server/page-builder'

export const metadata: Metadata = { title: 'Templates' }
export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  await requireUser()

  const templates = await prisma.pageTemplate.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { pages: true, defaultBenefits: true } } },
  })

  return (
    <>
      <PageHeader
        title="Templates"
        description="Templates definieren nur den Ausgangspunkt einer Sponsorenseite. Nach der Erstellung ist jede Seite vollständig frei editierbar."
        actions={
          <NewTemplateButton templates={templates.map((template) => ({ id: template.id, name: template.name }))} />
        }
      />

      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 [&>li]:min-w-0">
        {templates.map((template) => {
          const sections = parseTemplateStructure(template.structure)
          return (
            <li key={template.id}>
              <Card className="h-full transition-colors hover:border-line-strong">
                <Link href={`/admin/templates/${template.id}`} className="block px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-[14.5px] font-medium text-fg">{template.name}</p>
                    <div className="flex shrink-0 gap-1.5">
                      {!template.active ? <Badge tone="warning">Inaktiv</Badge> : null}
                      <Badge tone={TEMPLATE_TYPE[template.type].tone}>{TEMPLATE_TYPE[template.type].label}</Badge>
                    </div>
                  </div>

                  {template.description ? (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-fg-subtle">{template.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3.5 text-[12px] text-fg-subtle">
                    <span>{sections.length} Sektionen</span>
                    <span>{template._count.defaultBenefits} Standardleistungen</span>
                    <span>{template._count.pages} Seiten erstellt</span>
                  </div>
                </Link>
              </Card>
            </li>
          )
        })}
      </ul>
    </>
  )
}
