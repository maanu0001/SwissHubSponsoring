import { embedUrl, isSafeExternalUrl } from '@/lib/media'
import type { LinkItem } from '@/lib/section-data'
import { Reveal } from '../Reveal'

/**
 * Twitch and YouTube links. The first embeddable link is rendered as a
 * lazy iframe, every link is additionally offered as a plain anchor so the
 * section stays useful when embedding is blocked.
 */
export function VideoLinks({ links, embedParent }: { links: LinkItem[]; embedParent: string }) {
  const valid = links.filter((link) => link.url.trim() && isSafeExternalUrl(link.url))
  if (valid.length === 0) return null

  const firstEmbed = valid.map((link) => ({ link, src: embedUrl(link.url, embedParent) })).find((entry) => entry.src)

  return (
    <div className="space-y-5">
      {firstEmbed?.src ? (
        <Reveal className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="aspect-video w-full">
            <iframe
              src={firstEmbed.src}
              title={firstEmbed.link.label || 'Stream'}
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              className="h-full w-full border-0"
            />
          </div>
        </Reveal>
      ) : null}

      <ul className="grid gap-2.5 sm:grid-cols-2">
        {valid.map((link, index) => (
          <Reveal as="li" key={`${link.url}-${index}`} delay={index * 55}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-start justify-between gap-3 rounded-card border border-line bg-surface px-4.5 py-4 transition-colors hover:border-brand-accent/50"
              style={{ paddingLeft: '1.15rem', paddingRight: '1.15rem' }}
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-fg">{link.label || 'Aufzeichnung ansehen'}</span>
                {link.description ? (
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-fg-subtle">{link.description}</span>
                ) : null}
              </span>
              <svg
                className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-accent"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M7 4h9v9M16 4 5 15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Reveal>
        ))}
      </ul>
    </div>
  )
}
