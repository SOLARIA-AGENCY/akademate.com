import { describe, expect, it } from 'vitest'
import {
  directoryPageNumbers,
  directoryRangeLabel,
  paginateDirectory,
} from '../directory-pagination'

describe('directory pagination', () => {
  it('slices the current page and reports a 1-based visible range', () => {
    const items = Array.from({ length: 23 }, (_, index) => index + 1)
    const first = paginateDirectory(items, 1, 10)
    expect(first).toMatchObject({ page: 1, start: 1, end: 10, total: 23, pageCount: 3 })
    expect(first.items).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

    const last = paginateDirectory(items, 3, 10)
    expect(last).toMatchObject({ page: 3, start: 21, end: 23 })
    expect(last.items).toEqual([21, 22, 23])
  })

  it('clamps an overflow page instead of returning an empty window', () => {
    const slice = paginateDirectory(['a', 'b'], 99, 10)
    expect(slice.page).toBe(1)
    expect(slice.items).toEqual(['a', 'b'])
  })

  it('labels an empty set without inventing a 1-to-0 range', () => {
    const empty = paginateDirectory([], 1, 10)
    expect(empty.start).toBe(0)
    expect(empty.end).toBe(0)
    expect(directoryRangeLabel('profesores', empty.start, empty.end, empty.total)).toBe(
      'Mostrando 0 profesores',
    )
  })

  it('formats the visible range from live totals', () => {
    expect(directoryRangeLabel('profesores', 1, 10, 128)).toBe(
      'Mostrando 1 a 10 de 128 profesores',
    )
  })

  it('inserts ellipsis for long page ranges', () => {
    expect(directoryPageNumbers(1, 13)).toEqual([1, 2, 'ellipsis', 13])
    expect(directoryPageNumbers(7, 13)).toEqual([1, 'ellipsis', 6, 7, 8, 'ellipsis', 13])
  })
})
