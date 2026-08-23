'use client'

import type { Media, SectionType } from '@prisma/client'

import { SectionListEditor } from '@/components/admin/SectionListEditor'
import type { EditableSection } from '@/components/admin/PageSectionEditor'
import { SITE_SECTION_TYPES } from '@/lib/labels'
import {
  addSiteSectionAction,
  deleteSiteSectionAction,
  reorderSiteSectionsAction,
  toggleSiteSectionAction,
  updateSiteSectionAction,
} from '@/server/actions/site'

export interface SiteContentEditorProps {
  sections: EditableSection[]
  tournaments: { id: string; title: string; game: string }[]
  partners: { id: string; name: string }[]
  galleryMedia: Media[]
}

/** The CMS for the public main page – same editor as the sponsor pages. */
export function SiteContentEditor({ sections, tournaments, partners, galleryMedia }: SiteContentEditorProps) {
  const mediaById = Object.fromEntries(galleryMedia.map((media) => [media.id, media]))

  return (
    <SectionListEditor
      sections={sections}
      availableTypes={SITE_SECTION_TYPES as SectionType[]}
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
        formData.set('visible', section.visible ? 'true' : 'false')
        return updateSiteSectionAction({ status: 'idle' }, formData)
      }}
      onDelete={deleteSiteSectionAction}
      onToggleVisible={toggleSiteSectionAction}
      onReorder={reorderSiteSectionsAction}
      onAdd={addSiteSectionAction}
    />
  )
}
