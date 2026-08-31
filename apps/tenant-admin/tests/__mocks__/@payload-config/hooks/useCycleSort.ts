import { useCallback, useState } from 'react'

export function useCycleSort<K extends string>(_kinds: Record<K, string>) {
  const [state, setState] = useState<{ column: K | null; direction: 'asc' | 'desc' | null }>({
    column: null,
    direction: null,
  })
  const toggle = useCallback((column: K) => {
    setState((current) => ({
      column,
      direction:
        current.column !== column ? 'asc' : current.direction === 'asc' ? 'desc' : null,
    }))
  }, [])
  const reset = useCallback(() => setState({ column: null, direction: null }), [])
  const sortRows = useCallback(<T,>(rows: T[]) => rows, [])
  return { state, toggle, reset, sortRows }
}
