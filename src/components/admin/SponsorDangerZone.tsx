'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/Toast'
import { archiveSponsorAction, deleteSponsorAction } from '@/server/actions/sponsors'

export interface SponsorDangerZoneProps {
  sponsorId: string
  companyName: string
  archived: boolean
  pageCount: number
}

/**
 * Archiving is the primary action; hard delete sits behind a typed
 * confirmation because it removes the sponsor's pages as well.
 */
export function SponsorDangerZone({ sponsorId, companyName, archived, pageCount }: SponsorDangerZoneProps) {
  const router = useRouter()
  const toast = useToast()
  const [isPending, startTransition] = useTransition()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveSponsorAction(sponsorId, !archived)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Aktualisiert.')
        router.refresh()
      } else {
        toast.error(result.message ?? 'Fehlgeschlagen.')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSponsorAction(sponsorId)
      if (result.status === 'success') {
        toast.success(result.message ?? 'Gelöscht.')
        router.push('/admin/sponsors')
      } else {
        toast.error(result.message ?? 'Fehlgeschlagen.')
      }
    })
  }

  return (
    <>
      <Card className="border-danger/25">
        <CardHeader
          title="Archivieren & Löschen"
          description="Archivieren ist reversibel und der empfohlene Weg. Löschen kann nicht rückgängig gemacht werden."
        />
        <CardBody className="flex flex-wrap gap-2.5">
          <Button type="button" variant="secondary" onClick={() => setArchiveOpen(true)} disabled={isPending}>
            {archived ? 'Wiederherstellen' : 'Sponsor archivieren'}
          </Button>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)} disabled={isPending}>
            Endgültig löschen
          </Button>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
        title={archived ? 'Sponsor wiederherstellen?' : 'Sponsor archivieren?'}
        description={
          archived
            ? `„${companyName}“ wird wieder als Entwurf geführt und erscheint in der normalen Übersicht.`
            : `„${companyName}“ wird archiviert und aus der Standardansicht ausgeblendet. Alle Daten und Sponsorenseiten bleiben erhalten.`
        }
        confirmLabel={archived ? 'Wiederherstellen' : 'Archivieren'}
        variant={archived ? 'primary' : 'secondary'}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Sponsor endgültig löschen?"
        description={
          <>
            <p>
              Dabei werden auch{' '}
              <strong className="text-fg">
                {pageCount} Sponsorenseite{pageCount === 1 ? '' : 'n'}
              </strong>{' '}
              inklusive aller Sektionen und Leistungen gelöscht. Bereits versendete Links funktionieren danach nicht mehr.
            </p>
            <p className="mt-2">Dieser Schritt kann nicht rückgängig gemacht werden.</p>
          </>
        }
        confirmLabel="Endgültig löschen"
        requireTyped={companyName}
      />
    </>
  )
}
