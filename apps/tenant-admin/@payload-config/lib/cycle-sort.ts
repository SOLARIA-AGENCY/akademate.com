export type SortDirection = 'asc' | 'desc'
export type SortKind = 'text' | 'number' | 'date'

export type CycleSortState<K extends string = string> = {
  column: K | null
  direction: SortDirection | null
}

export type SortValue = string | number | Date | null | undefined

export function firstDirectionFor(kind: SortKind): SortDirection {
  return kind === 'number' ? 'desc' : 'asc'
}

export function nextCycleSort<K extends string>(
  current: CycleSortState<K>,
  column: K,
  kind: SortKind,
): CycleSortState<K> {
  const first = firstDirectionFor(kind)
  const second: SortDirection = first === 'asc' ? 'desc' : 'asc'

  if (current.column !== column) {
    return { column, direction: first }
  }
  if (current.direction === first) {
    return { column, direction: second }
  }
  return { column: null, direction: null }
}

function isEmpty(value: SortValue): boolean {
  if (value == null || value === '') return true
  if (value instanceof Date) return Number.isNaN(value.getTime())
  return false
}

function toTime(value: SortValue): number {
  if (value instanceof Date) return value.getTime()
  const parsed = new Date(String(value))
  return parsed.getTime()
}

export function compareSortValues(
  a: SortValue,
  b: SortValue,
  direction: SortDirection,
  kind: SortKind,
): number {
  const aEmpty = isEmpty(a)
  const bEmpty = isEmpty(b)
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  let cmp = 0
  if (kind === 'number') {
    cmp = Number(a) - Number(b)
  } else if (kind === 'date') {
    cmp = toTime(a) - toTime(b)
  } else {
    cmp = String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true })
  }
  return direction === 'asc' ? cmp : -cmp
}

export function applyCycleSort<T, K extends string>(
  rows: T[],
  state: CycleSortState<K>,
  kinds: Record<K, SortKind>,
  getValue: (row: T, column: K) => SortValue,
): T[] {
  if (!state.column || !state.direction) return rows
  const kind = kinds[state.column]
  const column = state.column
  const direction = state.direction
  return [...rows].sort((left, right) =>
    compareSortValues(getValue(left, column), getValue(right, column), direction, kind),
  )
}
