import { describe, expect, it } from 'vitest'
import { allowTenantFieldUpdate } from '../tenantAccess'

describe('allowTenantFieldUpdate', () => {
  it('lets a gestor save when tenant is omitted from the PATCH', () => {
    expect(
      allowTenantFieldUpdate({
        role: 'gestor',
        incomingHasTenantKey: false,
        existingTenant: 1,
      }),
    ).toBe(true)
  })

  it('lets a gestor save when tenant is unchanged', () => {
    expect(
      allowTenantFieldUpdate({
        role: 'admin',
        incomingHasTenantKey: true,
        incomingTenant: 1,
        existingTenant: 1,
      }),
    ).toBe(true)
  })

  it('blocks a gestor from moving a document to another tenant', () => {
    expect(
      allowTenantFieldUpdate({
        role: 'gestor',
        incomingHasTenantKey: true,
        incomingTenant: 2,
        existingTenant: 1,
      }),
    ).toBe(false)
  })

  it('lets superadmin change tenant', () => {
    expect(
      allowTenantFieldUpdate({
        role: 'superadmin',
        incomingHasTenantKey: true,
        incomingTenant: 9,
        existingTenant: 1,
      }),
    ).toBe(true)
  })
})
