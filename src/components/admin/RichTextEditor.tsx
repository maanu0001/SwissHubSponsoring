'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'

export interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  /** Mirrors the value into a hidden input for plain form submissions. */
  name?: string
  label?: string
  hint?: string
  placeholder?: string
  minHeight?: number
  className?: string
  disabled?: boolean
}

interface ToolbarAction {
  id: string
  label: string
  title: string
  command?: string
  value?: string
  icon: React.ReactNode
  isBlock?: boolean
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const ACTIONS: ToolbarAction[] = [
  { id: 'bold', label: 'B', title: 'Fett (Ctrl+B)', command: 'bold', icon: <span className="font-bold">B</span> },
  { id: 'italic', label: 'I', title: 'Kursiv (Ctrl+I)', command: 'italic', icon: <span className="font-serif italic">I</span> },
  { id: 'h2', label: 'H2', title: 'Überschrift', command: 'formatBlock', value: 'h2', isBlock: true, icon: <span className="text-[11px] font-semibold">H2</span> },
  { id: 'h3', label: 'H3', title: 'Unterüberschrift', command: 'formatBlock', value: 'h3', isBlock: true, icon: <span className="text-[11px] font-semibold">H3</span> },
  { id: 'p', label: 'P', title: 'Absatz', command: 'formatBlock', value: 'p', isBlock: true, icon: <span className="text-[11px] font-semibold">P</span> },
  {
    id: 'ul', label: 'UL', title: 'Aufzählung', command: 'insertUnorderedList',
    icon: <Icon><path d="M7 5h9M7 10h9M7 15h9" /><circle cx="3.5" cy="5" r="1" fill="currentColor" /><circle cx="3.5" cy="10" r="1" fill="currentColor" /><circle cx="3.5" cy="15" r="1" fill="currentColor" /></Icon>,
  },
  {
    id: 'ol', label: 'OL', title: 'Nummerierte Liste', command: 'insertOrderedList',
    icon: <Icon><path d="M7 5h9M7 10h9M7 15h9M2.5 4v2.5M2 12.5h1.5M2 15h1.5M2 12.5a1 1 0 1 1 1.5.8L2 15" /></Icon>,
  },
  {
    id: 'quote', label: 'Zitat', title: 'Zitat', command: 'formatBlock', value: 'blockquote', isBlock: true,
    icon: <Icon><path d="M7 6H4v4h3l-1 4M16 6h-3v4h3l-1 4" /></Icon>,
  },
]

/**
 * Rich text editor built on contenteditable.
 *
 * Only the formatting the public renderer supports is offered, pasting is
 * forced to plain text, and the resulting HTML is sanitised again on the
 * server – the client output is never trusted.
 */
export function RichTextEditor({
  value,
  onChange,
  name,
  label,
  hint,
  placeholder = 'Text eingeben…',
  minHeight = 160,
  className,
  disabled,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const savedRange = useRef<Range | null>(null)
  const editorId = useId()

  // Only write into the DOM when the value diverges, otherwise the caret jumps.
  useEffect(() => {
    const node = editorRef.current
    if (!node) return
    if (node.innerHTML !== value) {
      node.innerHTML = value || ''
    }
  }, [value])

  const emit = useCallback(() => {
    const node = editorRef.current
    if (!node) return
    const html = node.innerHTML
    // An "empty" contenteditable still contains <br> – normalise that away.
    onChange(html === '<br>' || html === '<p><br></p>' || html === '<div><br></div>' ? '' : html)
  }, [onChange])

  function exec(action: ToolbarAction) {
    if (disabled) return
    editorRef.current?.focus()
    if (action.command === 'formatBlock') {
      document.execCommand('formatBlock', false, `<${action.value}>`)
    } else if (action.command) {
      document.execCommand(action.command, false)
    }
    emit()
  }

  function saveSelection() {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRange.current = selection.getRangeAt(0).cloneRange()
    }
  }

  function openLinkDialog() {
    if (disabled) return
    saveSelection()
    const selection = window.getSelection()
    setLinkText(selection?.toString() ?? '')
    setLinkUrl('')
    setLinkOpen(true)
  }

  function applyLink() {
    const url = linkUrl.trim()
    if (!url) return
    const safe = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) ? url : `https://${url}`

    editorRef.current?.focus()
    const selection = window.getSelection()
    if (savedRange.current && selection) {
      selection.removeAllRanges()
      selection.addRange(savedRange.current)
    }

    if (selection && selection.toString().length > 0) {
      document.execCommand('createLink', false, safe)
    } else {
      const anchor = document.createElement('a')
      anchor.href = safe
      anchor.textContent = linkText.trim() || safe
      savedRange.current?.insertNode(anchor)
    }

    emit()
    setLinkOpen(false)
    setLinkUrl('')
    setLinkText('')
  }

  function removeLink() {
    if (disabled) return
    editorRef.current?.focus()
    document.execCommand('unlink', false)
    emit()
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    // Pasting rich HTML from Word or a browser would smuggle in tags the
    // renderer strips anyway – insert plain text and keep line breaks.
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    const lines = text.split(/\r?\n/)
    document.execCommand('insertText', false, lines.join('\n'))
    emit()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key.toLowerCase()
    if (key === 'k') {
      event.preventDefault()
      openLinkDialog()
    }
  }

  const isEmpty = !value || value.replace(/<[^>]*>/g, '').trim().length === 0

  return (
    <div className={cn('space-y-1.5', className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {label ? (
        <label htmlFor={editorId} className="block text-[13px] font-medium text-fg-muted">
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          'overflow-hidden rounded-control border bg-surface-raised transition-colors',
          focused ? 'border-brand-accent ring-2 ring-brand-accent/35' : 'border-line',
          disabled && 'opacity-60',
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-surface/60 px-1.5 py-1.5" role="toolbar" aria-label="Textformatierung">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              title={action.title}
              aria-label={action.title}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => exec(action)}
              className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg disabled:opacity-40"
            >
              {action.icon}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
          <button
            type="button"
            title="Link einfügen (Ctrl+K)"
            aria-label="Link einfügen"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={openLinkDialog}
            className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg disabled:opacity-40"
          >
            <Icon>
              <path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.8-2.8a3 3 0 1 0-4.2-4.2l-.9.9" />
              <path d="M11.5 8.5a3 3 0 0 0-4.2 0l-2.8 2.8a3 3 0 1 0 4.2 4.2l.9-.9" />
            </Icon>
          </button>
          <button
            type="button"
            title="Link entfernen"
            aria-label="Link entfernen"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={removeLink}
            className="flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg disabled:opacity-40"
          >
            <Icon>
              <path d="M8.5 11.5a3 3 0 0 0 4.2 0l1.3-1.3M11.5 8.5a3 3 0 0 0-4.2 0l-1.3 1.3M3 3l14 14" />
            </Icon>
          </button>
        </div>

        <div className="relative">
          {isEmpty ? (
            <span className="pointer-events-none absolute left-3.5 top-3 text-sm text-fg-subtle">{placeholder}</span>
          ) : null}
          <div
            id={editorId}
            ref={editorRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={typeof label === 'string' ? label : 'Rich-Text-Editor'}
            style={{ minHeight }}
            onInput={emit}
            onBlur={() => {
              setFocused(false)
              emit()
            }}
            onFocus={() => setFocused(true)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            className="rich-text-sm px-3.5 py-3 text-fg focus:outline-none [&_a]:text-brand-accent [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_h2]:text-lg [&_h3]:text-base [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          />
        </div>
      </div>

      {hint ? <p className="text-[12.5px] leading-relaxed text-fg-subtle">{hint}</p> : null}

      <Modal
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        title="Link einfügen"
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={applyLink} disabled={!linkUrl.trim()}>
              Einfügen
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="URL"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://…"
            inputMode="url"
            autoFocus
          />
          <Input
            label="Linktext"
            value={linkText}
            onChange={(event) => setLinkText(event.target.value)}
            placeholder="Wird bei markiertem Text übernommen"
            hint="Leer lassen, um den markierten Text zu verlinken."
          />
        </div>
      </Modal>
    </div>
  )
}
