import { describe, expect, it, vi } from 'vitest'
import { validateSameTenantRelationships } from '../collections/Organization/common'

describe('organization relationship tenant validation', () => {
  const hook = validateSameTenantRelationships([{ field: 'legal_entity', collection: 'legal-entities' }])

  it('accepts a relationship inside the requested tenant', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 8, tenant: 3 })
    await expect(hook({
      data: { tenant: 3, legal_entity: 8 },
      operation: 'create',
      req: { user: { id: 1, role: 'admin', tenant: 3 }, payload: { findByID } },
    } as never)).resolves.toMatchObject({ legal_entity: 8 })
  })

  it('fails closed for a cross-tenant relationship even when an ID exists', async () => {
    const findByID = vi.fn().mockResolvedValue({ id: 8, tenant: 4 })
    await expect(hook({
      data: { tenant: 3, legal_entity: 8 },
      operation: 'create',
      req: { user: { id: 1, role: 'admin', tenant: 3 }, payload: { findByID } },
    } as never)).rejects.toThrow(/mismo tenant/i)
  })
})
