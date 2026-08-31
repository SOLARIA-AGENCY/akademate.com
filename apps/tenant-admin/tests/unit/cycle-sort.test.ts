import { describe, expect, it } from 'vitest'
import {
  applyCycleSort,
  compareSortValues,
  firstDirectionFor,
  nextCycleSort,
} from '../../@payload-config/lib/cycle-sort'

describe('cycle sort', () => {
  it('starts text columns A-Z and numbers high-to-low', () => {
    expect(firstDirectionFor('text')).toBe('asc')
    expect(firstDirectionFor('date')).toBe('asc')
    expect(firstDirectionFor('number')).toBe('desc')
  })

  it('cycles a column through first, second and original', () => {
    const first = nextCycleSort({ column: null, direction: null }, 'name', 'text')
    expect(first).toEqual({ column: 'name', direction: 'asc' })
    const second = nextCycleSort(first, 'name', 'text')
    expect(second).toEqual({ column: 'name', direction: 'desc' })
    const original = nextCycleSort(second, 'name', 'text')
    expect(original).toEqual({ column: null, direction: null })
  })

  it('resets when switching column', () => {
    const current = { column: 'name' as const, direction: 'desc' as const }
    expect(nextCycleSort(current, 'sede', 'text')).toEqual({ column: 'sede', direction: 'asc' })
  })

  it('sorts text, numbers and dates and restores original when idle', () => {
    const rows = [
      { id: 1, name: 'Zeta', plazas: 2, start: '2026-03-01' },
      { id: 2, name: 'Alfa', plazas: 10, start: '2026-01-01' },
      { id: 3, name: 'Beta', plazas: 5, start: '2026-02-01' },
    ]
    const kinds = { name: 'text', plazas: 'number', start: 'date' } as const
    const byName = applyCycleSort(rows, { column: 'name', direction: 'asc' }, kinds, (row, column) => row[column])
    expect(byName.map((row) => row.name)).toEqual(['Alfa', 'Beta', 'Zeta'])
    const byPlazas = applyCycleSort(rows, { column: 'plazas', direction: 'desc' }, kinds, (row, column) => row[column])
    expect(byPlazas.map((row) => row.plazas)).toEqual([10, 5, 2])
    const byDate = applyCycleSort(rows, { column: 'start', direction: 'asc' }, kinds, (row, column) => row[column])
    expect(byDate.map((row) => row.id)).toEqual([2, 3, 1])
    expect(applyCycleSort(rows, { column: null, direction: null }, kinds, (row, column) => row[column])).toBe(rows)
  })

  it('keeps empty values last', () => {
    expect(compareSortValues('', 'Aula 1', 'asc', 'text')).toBe(1)
    expect(compareSortValues('Aula 1', '', 'desc', 'text')).toBe(-1)
  })
})
