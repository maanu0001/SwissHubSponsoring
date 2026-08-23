'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'

/**
 * Local state seeded from server props that re-syncs whenever the server sends
 * a genuinely different value.
 *
 * Needed because `router.refresh()` delivers fresh props, but `useState` keeps
 * its initial value forever. Local state is what makes optimistic reordering
 * feel instant; without this hook a record created in a dialog would only show
 * up after a full page reload.
 *
 * `signature` decides what counts as "different" – usually the list of ids, so
 * that additions and removals re-sync while purely local edits do not.
 */
export function useServerState<T>(
  serverValue: T,
  signature: (value: T) => string,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(serverValue)
  const [lastSignature, setLastSignature] = useState(() => signature(serverValue))

  const nextSignature = signature(serverValue)
  if (nextSignature !== lastSignature) {
    // Adjusting state during render is the documented React pattern for
    // deriving state from props; it re-renders immediately without an effect.
    setLastSignature(nextSignature)
    setState(serverValue)
    return [serverValue, setState]
  }

  return [state, setState]
}

/** Convenience signature for lists of records with an `id`. */
export function idSignature(items: { id: string }[]): string {
  return items.map((item) => item.id).join('|')
}
