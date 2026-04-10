import { describe, expect, it } from 'vitest'
import { parseTenantId, withTenantScope } from '../tenant-scope'

describe('tenant-scope helpers', () => {
  it('parses tenant ids from string and number', () => {
    expect(parseTenantId('42')).toBe(42)
    expect(parseTenantId(7)).toBe(7)
    expect(parseTenantId('0')).toBeNull()
    expect(parseTenantId('abc')).toBeNull()
    expect(parseTenantId(undefined)).toBeNull()
  })

  it('adds tenant condition to simple where object', () => {
    expect(withTenantScope({ active: { equals: true } }, '9')).toEqual({
      and: [{ tenant: { equals: 9 } }, { active: { equals: true } }],
    })
  })

  it('prepends tenant condition to existing and arrays', () => {
    expect(withTenantScope({ and: [{ status: { equals: 'published' } }] }, 3)).toEqual({
      and: [{ tenant: { equals: 3 } }, { status: { equals: 'published' } }],
    })
  })

  it('returns base where when tenant id is missing', () => {
    const where = { slug: { equals: 'sede-norte' } }
    expect(withTenantScope(where, null)).toBe(where)
  })
})
