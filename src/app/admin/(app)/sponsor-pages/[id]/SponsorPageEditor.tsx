'use client'

import { useState } from 'react'
import type { Media, PageStatus, PageVisibility, SectionType, SponsoringBenefit, SupportType } from '@prisma/client'

import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { CopyButton } from '@/components/ui/CopyButton'
import { useToast } from '@/components/ui/Toast'
import { SectionListEditor } from '@/components/admin/SectionListEditor'
import { PagePreview } from '@/components/admin/PagePreview'
import { PageBenefitsEditor } from '@/components/admin/PageBenefitsEditor'
import { PageSettingsForm } from '@/components/admin/PageSettingsForm'
import { PdfExportDialog } from '@/components/admin/PdfExportDialog'
import { PublishPanel } from '@/components/admin/PublishPanel'
import { PageStatsPanel } from '@/components/admin/PageStatsPanel'
import { cn } from '@/lib/cn'
import { PAGE_STATUS, PAGE_VISIBILITY, SPONSOR_PAGE_SECTION_TYPES } from '@/lib/labels'
import type { PdfMode } from '@/lib/pdf-sections'
import type { EditableSection } from '@/components/admin/PageSectionEditor'
import {
  addSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
  toggleSectionVisibilityAction,
  updateSectionAction,
} from '@/server/actions/sponsor-pages'

export interface EditorPage {
  id: string
  slug: string
  title: string
  subtitle: string
  status: PageStatus
  visibility: PageVisibility
  hasPassword: boolean
  requestedSupportType: SupportType
  requestedAmount: number | null
  requestedSupportText: string
  currency: string
  heroImageId: string
  noindex: boolean
  tournamentId: string
  viewCount: number
  lastViewedAt: string | null
  publishedAt: string | null
  templateName: string | null
  sponsorName: string
}

export interface PageBenefitEntry {
  id: string
  benefitId: string
  title: string
  description: string
  category: string
  customTitle: string
  customDescription: string
  visible: boolean
}

export interface SponsorPageEditorProps {
  page: EditorPage
  heroImage: Media | null
  sections: EditableSection[]
  pageBenefits: PageBenefitEntry[]
  allBenefits: SponsoringBenefit[]
  tournaments: { id: string; title: string; game: string; status: string }[]
  partners: { id: string; name: string }[]
  galleryMedia: Media[]
  views: { day: string; count: number }[]
  appUrl: string
  justCreated: boolean
  initialTab?: string
}

type Tab = 'sections' | 'benefits' | 'settings' | 'preview' | 'stats'

const TABS: { id: Tab; label: string }[] = [
  { id: 'sections', label: 'Sektionen' },
  { id: 'benefits', label: 'Leistungen' },
  { id: 'settings', label: 'Einstellungen' },
  { id: 'preview', label: 'Vorschau' },
  { id: 'stats', label: 'Statistik' },
]

export function SponsorPageEditor({
  page,
  heroImage,
  sections,
  pageBenefits,
  allBenefits,
  tournaments,
  partners,
  galleryMedia,
  views,
  appUrl,
  justCreated,
  initialTab,
}: SponsorPageEditorProps) {
  const [tab, setTab] = useState<Tab>(
    TABS.some((entry) => entry.id === initialTab) ? (initialTab as Tab) : 'sections',
  )
  const [pdfOpen, setPdfOpen] = useState(false)
  const toast = useToast()
  const publicUrl = `${appUrl}/partner/${page.slug}`
  const mediaById = Object.fromEntries(galleryMedia.map((media) => [media.id, media]))

  return (
    <div className="space-y-5">
      {justCreated ? (
        <Alert tone="success" title="Sponsorenseite erstellt">
          Die Seite ist als Entwurf angelegt und noch nicht öffentlich erreichbar. Passen Sie die Inhalte an und
          veröffentlichen Sie sie anschliessend.
        </Alert>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            <Badge tone={PAGE_STATUS[page.status].tone} dot>
              {PAGE_STATUS[page.status].label}
            </Badge>
            <Badge tone={PAGE_VISIBILITY[page.visibility].tone}>{PAGE_VISIBILITY[page.visibility].label}</Badge>
            {page.templateName ? (
              <span className="text-[12.5px] text-fg-subtle">Template: {page.templateName}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setPdfOpen(true)}>
              PDF Export
            </Button>
            {page.status === 'PUBLISHED' ? (
              <>
                <CopyButton value={publicUrl} size="sm" />
                <a
                  href={`/partner/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line-strong px-3 text-[13px] font-medium text-fg-muted transition-colors hover:border-brand-accent/60 hover:text-fg"
                >
                  Live ansehen
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M7 4h9v9M16 4 5 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </>
            ) : (
              <Button type="button" variant="secondary" size="sm" onClick={() => setTab('preview')}>
                Vorschau öffnen
              </Button>
            )}
          </div>
        </div>

        {page.status === 'PUBLISHED' ? (
          <div className="border-t border-line px-5 py-3">
            <p className="break-all font-mono text-[12.5px] text-fg-subtle">{publicUrl}</p>
          </div>
        ) : null}
      </Card>

      <div className="flex gap-1 overflow-x-auto rounded-control border border-line bg-surface p-1 no-scrollbar">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            aria-current={tab === entry.id ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-[7px] px-4 py-1.5 text-[13px] font-medium transition-colors',
              tab === entry.id ? 'bg-surface-overlay text-fg' : 'text-fg-subtle hover:text-fg',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'sections' ? (
        <Card>
          <CardHeader
            title="Sektionen"
            description="Jede Sektion ist frei editierbar, kann ein- und ausgeblendet und beliebig sortiert werden."
          />
          <CardBody>
            <SectionListEditor
              sections={sections}
              availableTypes={SPONSOR_PAGE_SECTION_TYPES as SectionType[]}
              tournaments={tournaments}
              partners={partners}
              mediaById={mediaById}
              onSave={async (section) => {
                const formData = new FormData()
                formData.set('id', section.id)
                formData.set('title', section.title)
                formData.set('subtitle', section.subtitle)
                formData.set('content', section.content)
                formData.set('data', JSON.stringify(section.data))
                formData.set('visibleOnWeb', section.visibility.web ? 'true' : 'false')
                formData.set('visibleInShortPdf', section.visibility.shortPdf ? 'true' : 'false')
                formData.set('visibleInFullPdf', section.visibility.fullPdf ? 'true' : 'false')
                return updateSectionAction({ status: 'idle' }, formData)
              }}
              onDelete={deleteSectionAction}
              onToggleVisible={toggleSectionVisibilityAction}
              onReorder={(ids) => reorderSectionsAction(page.id, ids)}
              onAdd={(type) => addSectionAction(page.id, type)}
            />
          </CardBody>
        </Card>
      ) : null}

      {tab === 'benefits' ? (
        <PageBenefitsEditor pageId={page.id} entries={pageBenefits} allBenefits={allBenefits} />
      ) : null}

      {tab === 'settings' ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
          <PageSettingsForm page={page} heroImage={heroImage} tournaments={tournaments} />
          <PublishPanel page={page} publicUrl={publicUrl} />
        </div>
      ) : null}

      {tab === 'preview' ? (
        <PagePreview
          src={`/admin/preview/sponsor-page/${page.id}`}
          onOpenLive={
            page.status === 'PUBLISHED'
              ? () => window.open(`/partner/${page.slug}`, '_blank', 'noopener')
              : () => toast.show('Die Seite ist noch nicht veröffentlicht.')
          }
        />
      ) : null}

      {tab === 'stats' ? <PageStatsPanel page={page} views={views} publicUrl={publicUrl} /> : null}

      <PdfExportDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        pageId={page.id}
        published={page.status === 'PUBLISHED'}
        previewHref={(mode: PdfMode) => `/admin/pdf/sponsor-page/${page.id}?mode=${mode}`}
      />
    </div>
  )
}
