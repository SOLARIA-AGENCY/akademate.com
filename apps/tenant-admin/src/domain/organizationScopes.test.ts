import { describe, expect, it } from 'vitest'
import {
  assertAllocationPercentage,
  assertExactlyOnePrimaryScope,
  assertValidTemporalRange,
  publicCampusFilter,
} from './organizationScopes'

describe('organization scopes invariants', () => {
  it('accepts open-ended and same-day temporal relationships', () => {
    expect(() => assertValidTemporalRange({ valid_from: '2026-07-28' })).not.toThrow()
    expect(() => assertValidTemporalRange({ valid_from: '2026-07-28', valid_to: '2026-07-28' })).not.toThrow()
  })

  it('fails closed when a temporal relationship ends before it starts', () => {
    expect(() => assertValidTemporalRange({ valid_from: '2026-07-29', valid_to: '2026-07-28' }))
      .toThrow(/fecha de fin/i)
  })

  it.each([0, -1, 100.01, Number.NaN, '50'])('rejects invalid allocation %s', (value) => {
    expect(() => assertAllocationPercentage(value)).toThrow(/porcentaje/i)
  })

  it('allows a tenant-wide role and one scoped role but rejects ambiguous intersections', () => {
    expect(() => assertExactlyOnePrimaryScope({})).not.toThrow()
    expect(() => assertExactlyOnePrimaryScope({ legal_entity: 1 })).not.toThrow()
    expect(() => assertExactlyOnePrimaryScope({ legal_entity: 1, campus: 2 })).toThrow(/unico ambito/i)
  })

  it('builds a public campus filter that excludes internal or inactive sites', () => {
    expect(publicCampusFilter(42)).toEqual({
      and: [
        { tenant: { equals: 42 } },
        { active: { equals: true } },
        { public_visibility: { equals: 'public' } },
      ],
    })
  })
})
