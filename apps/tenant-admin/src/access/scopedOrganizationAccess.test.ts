import { describe, expect, it } from 'vitest'
import { buildCourseRunScopeWhere, buildFinanceScopeWhere, isBindingActive, matchesCourseRunScope } from './scopedOrganizationAccess'

describe('scoped organization access', () => {
  const now = new Date('2026-07-28T12:00:00Z')

  it('preserves tenant-wide access when no bindings exist', () => {
    expect(buildCourseRunScopeWhere(7, [], now)).toEqual({ tenant: { equals: 7 } })
  })

  it('restricts a configured user to legal entity or campus scopes', () => {
    expect(buildCourseRunScopeWhere(7, [{ legal_entity: 11 }, { campus: 22 }], now)).toEqual({
      and: [
        { tenant: { equals: 7 } },
        { or: [
          { or: [
            { owner_legal_entity: { equals: 11 } },
            { managing_legal_entity: { equals: 11 } },
            { funding_legal_entity: { equals: 11 } },
          ] },
          { campus: { equals: 22 } },
        ] },
      ],
    })
  })

  it('builds finance scope intersections on entity, site and activity dimensions', () => {
    expect(buildFinanceScopeWhere(7, [{ legal_entity: 11 }, { campus: 22 }, { course_run: 33 }], now)).toEqual({
      and: [
        { tenant: { equals: 7 } },
        { or: [
          { legal_entity: { equals: 11 } },
          { campus: { equals: 22 } },
          { course_run: { equals: 33 } },
        ] },
      ],
    })
  })

  it('ignores expired bindings and denies a record outside configured scopes', () => {
    expect(isBindingActive({ campus: 22, valid_to: '2026-07-27T23:59:59Z' }, now)).toBe(false)
    expect(buildCourseRunScopeWhere(7, [{ campus: 22, valid_to: '2026-07-27T23:59:59Z' }], now)).toEqual({
      and: [{ tenant: { equals: 7 } }, { id: { exists: false } }],
    })
    expect(buildCourseRunScopeWhere(7, [{ campus: 22, active: false }], now)).toEqual({
      and: [{ tenant: { equals: 7 } }, { id: { exists: false } }],
    })
    expect(matchesCourseRunScope(
      { id: 90, campus: 99, owner_legal_entity: 12 },
      [{ campus: 22 }, { legal_entity: 11 }],
      now,
    )).toBe(false)
  })
})
