'use client'

import { useId, type ReactNode } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/cn'

export interface SortableItem {
  id: string
}

export interface SortableListProps<T extends SortableItem> {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, controls: SortableControls) => ReactNode
  className?: string
  disabled?: boolean
}

export interface SortableControls {
  /** Props for the drag handle button. */
  handleProps: Record<string, unknown>
  moveUp: () => void
  moveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  isDragging: boolean
  index: number
}

/**
 * Vertical drag & drop list. Every item additionally exposes up/down controls
 * so the ordering stays fully usable with a keyboard or without a pointer.
 */
export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  className,
  disabled,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const contextId = useId()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    onReorder(arrayMove(items, oldIndex, newIndex))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    onReorder(arrayMove(items, index, target))
  }

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-2', className)}>
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              disabled={disabled}
              index={index}
              total={items.length}
              onMove={move}
            >
              {(controls) => renderItem(item, controls)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({
  id,
  index,
  total,
  disabled,
  onMove,
  children,
}: {
  id: string
  index: number
  total: number
  disabled?: boolean
  onMove: (index: number, delta: number) => void
  children: (controls: SortableControls) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })

  const controls: SortableControls = {
    handleProps: { ...attributes, ...listeners },
    moveUp: () => onMove(index, -1),
    moveDown: () => onMove(index, 1),
    canMoveUp: index > 0,
    canMoveDown: index < total - 1,
    isDragging,
    index,
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-20 opacity-90 shadow-lift')}
    >
      {children(controls)}
    </div>
  )
}

/** Reusable grab handle + up/down buttons. */
export function SortHandle({ controls, className }: { controls: SortableControls; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <button
        type="button"
        aria-label="Zum Verschieben ziehen"
        className="cursor-grab touch-none rounded p-1.5 text-fg-subtle transition-colors hover:bg-surface-overlay hover:text-fg active:cursor-grabbing"
        {...controls.handleProps}
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="7" cy="5" r="1.4" />
          <circle cx="13" cy="5" r="1.4" />
          <circle cx="7" cy="10" r="1.4" />
          <circle cx="13" cy="10" r="1.4" />
          <circle cx="7" cy="15" r="1.4" />
          <circle cx="13" cy="15" r="1.4" />
        </svg>
      </button>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={controls.moveUp}
          disabled={!controls.canMoveUp}
          aria-label="Nach oben verschieben"
          className="rounded p-0.5 text-fg-subtle transition-colors hover:bg-surface-overlay hover:text-fg disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m5 12 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={controls.moveDown}
          disabled={!controls.canMoveDown}
          aria-label="Nach unten verschieben"
          className="rounded p-0.5 text-fg-subtle transition-colors hover:bg-surface-overlay hover:text-fg disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}
