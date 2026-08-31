'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  applyCycleSort,
  nextCycleSort,
  type CycleSortState,
  type SortKind,
  type SortValue,
} from '@payload-config/lib/cycle-sort'

export function useCycleSort<K extends string>(kinds: Record<K, SortKind>) {
  const kindsRef = useRef(kinds)
  kindsRef.current = kinds
  const [state, setState] = useState<CycleSortState<K>>({ column: null, direction: null })

  const toggle = useCallback((column: K) => {
    setState((current) => nextCycleSort(current, column, kindsRef.current[column]))
  }, [])

  const reset = useCallback(() => {
    setState({ column: null, direction: null })
  }, [])

  const sortRows = useCallback(
    <T,>(rows: T[], getValue: (row: T, column: K) => SortValue) =>
      applyCycleSort(rows, state, kindsRef.current, getValue),
    [state],
  )

  return useMemo(
    () => ({ state, toggle, reset, sortRows }),
    [reset, sortRows, state, toggle],
  )
}
