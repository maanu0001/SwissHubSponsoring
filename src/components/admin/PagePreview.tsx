'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/cn'

export interface PagePreviewProps {
  /** Route that renders the page exactly as a visitor would see it. */
  src: string
  onOpenLive?: () => void
}

type Device = 'mobile' | 'tablet' | 'desktop'

const DEVICES: { id: Device; label: string; width: number; height: number }[] = [
  { id: 'mobile', label: 'Mobile', width: 390, height: 844 },
  { id: 'tablet', label: 'Tablet', width: 834, height: 1112 },
  { id: 'desktop', label: 'Desktop', width: 1440, height: 900 },
]

/**
 * Device accurate preview.
 * The iframe renders the real public route, so what the admin sees is exactly
 * what the sponsor will see – not an approximation.
 */
export function PagePreview({ src, onOpenLive }: PagePreviewProps) {
  const [device, setDevice] = useState<Device>('desktop')
  const [reloadKey, setReloadKey] = useState(0)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const active = DEVICES.find((entry) => entry.id === device) ?? DEVICES[2]!

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex gap-1 rounded-control border border-line bg-surface-raised p-1">
          {DEVICES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setDevice(entry.id)}
              className={cn(
                'rounded-[6px] px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                device === entry.id ? 'bg-surface-overlay text-fg' : 'text-fg-subtle hover:text-fg',
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] tabular-nums text-fg-subtle sm:block">
            {active.width} × {active.height}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Aktualisieren
          </Button>
          {onOpenLive ? (
            <Button type="button" variant="secondary" size="sm" onClick={onOpenLive}>
              In neuem Tab
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex justify-center overflow-auto bg-canvas p-4 sm:p-6">
        <div
          className="shrink-0 overflow-hidden rounded-card border border-line-strong bg-canvas shadow-lift transition-[width,height] duration-300"
          style={{
            width: active.width,
            height: active.height,
            maxWidth: '100%',
          }}
        >
          <iframe
            key={reloadKey}
            ref={frameRef}
            src={src}
            title="Vorschau der Sponsorenseite"
            className="h-full w-full border-0"
            // The preview renders our own trusted route; scripts are needed for
            // the reveal animations and the count-up.
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </Card>
  )
}
