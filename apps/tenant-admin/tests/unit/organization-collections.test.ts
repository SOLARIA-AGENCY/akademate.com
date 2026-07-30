import { describe, expect, it } from 'vitest'
import {
  FinanceEntries,
  LegalEntities,
  OperatingScopes,
  ScopedRoleBindings,
  SiteEntityRelationships,
} from '../../src/collections/Organization'

describe('multi-entity collection contract', () => {
  it.each([LegalEntities, OperatingScopes, SiteEntityRelationships, ScopedRoleBindings, FinanceEntries])(
    'keeps $slug private for anonymous requests',
    (collection) => {
      const read = collection.access?.read
      expect(typeof read).toBe('function')
      if (typeof read === 'function') expect(read({ req: { user: null } } as never)).toBe(false)
    },
  )

  it('requires a legal entity for every operational finance entry', () => {
    const field = FinanceEntries.fields.find((candidate) => 'name' in candidate && candidate.name === 'legal_entity')
    expect(field).toMatchObject({ required: true, relationTo: 'legal-entities' })
  })

  it('marks virtual operating scopes as internal-only by default', () => {
    const field = OperatingScopes.fields.find((candidate) => 'name' in candidate && candidate.name === 'internal_only')
    expect(field).toMatchObject({ required: true, defaultValue: true })
  })
})
