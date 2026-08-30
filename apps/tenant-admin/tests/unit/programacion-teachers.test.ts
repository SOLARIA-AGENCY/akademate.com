import { describe, expect, it } from 'vitest'
import {
  normalizeTeacherName,
  normalizeTeacherNames,
  normalizeTeacherRefs,
} from '@/app/lib/programacion/teacher-normalization'

describe('programacion teacher normalization', () => {
  it('accepts strings, Payload relations and partial names without returning objects', () => {
    expect(normalizeTeacherName('  Lucia Ortega  ')).toBe('Lucia Ortega')
    expect(normalizeTeacherName({ id: 2, first_name: 'Lucia', last_name: 'Ortega' })).toBe(
      'Lucia Ortega'
    )
    expect(normalizeTeacherName({ id: 3, full_name: '  Nuria Ramos ' })).toBe('Nuria Ramos')
    expect(normalizeTeacherName({ id: 4 })).toBe('')
    expect(normalizeTeacherName(null)).toBe('')
  })

  it('deduplicates names and ignores malformed array entries', () => {
    expect(
      normalizeTeacherNames([
        { id: 1, full_name: 'Lucia Ortega' },
        ' Lucia Ortega ',
        null,
        { id: 2, firstName: 'Luis', lastName: 'Gonzalez' },
        44,
        { id: 3 },
      ])
    ).toEqual(['Lucia Ortega', 'Luis Gonzalez'])
  })

  it('fails closed on deeply nested or oversized relation payloads', () => {
    let deeplyNested: unknown = { id: 1, full_name: 'Should not be reached' }
    for (let depth = 0; depth < 10_000; depth += 1) deeplyNested = [deeplyNested]

    expect(() => normalizeTeacherNames(deeplyNested)).not.toThrow()
    expect(normalizeTeacherNames([deeplyNested, { id: 2, name: 'Lucia Ortega' }])).toEqual([
      'Lucia Ortega',
    ])
    expect(() => normalizeTeacherRefs(deeplyNested)).not.toThrow()
    expect(
      normalizeTeacherRefs(
        Array.from({ length: 10_000 }, (_, id) => ({ id, name: `Teacher ${id}` }))
      )
    ).toHaveLength(1023)
  })

  it('only creates clickable refs when both a stable id and a display name exist', () => {
    expect(
      normalizeTeacherRefs([
        { id: '1', full_name: 'Lucia Ortega' },
        { id: 1, name: 'Duplicated Lucia' },
        { id: '2', first_name: 'Luis', last_name: 'Gonzalez' },
        { full_name: 'Missing id' },
        { id: '3' },
      ])
    ).toEqual([
      { id: '1', name: 'Lucia Ortega' },
      { id: '2', name: 'Luis Gonzalez' },
    ])
  })
})
