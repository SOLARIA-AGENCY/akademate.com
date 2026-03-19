/**
 * @fileoverview Tests para la configuracion de autenticacion de la coleccion Users
 * Valida: useAPIKey, maxLoginAttempts, lockTime, tokenExpiration, roles, tenant
 */

import { describe, it, expect } from 'vitest'
import { Users } from '../../../../src/collections/Users/Users'

// ============================================================================
// Helpers
// ============================================================================

function findField(name: string) {
  return Users.fields.find((f: any) => f.name === name)
}

// ============================================================================
// Tests
// ============================================================================

describe('Users Collection — Auth Config', () => {
  // --------------------------------------------------------------------------
  // Auth settings
  // --------------------------------------------------------------------------

  it('tiene useAPIKey habilitado (true)', () => {
    const auth = Users.auth as any

    expect(auth).toBeDefined()
    expect(auth.useAPIKey).toBe(true)
  })

  it('tiene maxLoginAttempts configurado a 5', () => {
    const auth = Users.auth as any

    expect(auth.maxLoginAttempts).toBe(5)
  })

  it('tiene lockTime configurado a 900000ms (15 minutos)', () => {
    const auth = Users.auth as any

    expect(auth.lockTime).toBe(900000)
  })

  it('tiene tokenExpiration configurado a 7200s (2 horas)', () => {
    const auth = Users.auth as any

    expect(auth.tokenExpiration).toBe(7200)
  })

  // --------------------------------------------------------------------------
  // Roles — 6 definidos
  // --------------------------------------------------------------------------

  it('tiene los 6 roles definidos en el campo "role"', () => {
    const roleField = findField('role') as any

    expect(roleField).toBeDefined()
    expect(roleField.type).toBe('select')

    const roleValues = roleField.options.map((o: any) =>
      typeof o === 'string' ? o : o.value,
    )

    expect(roleValues).toHaveLength(6)

    const expectedRoles = ['superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura']
    for (const role of expectedRoles) {
      expect(roleValues).toContain(role)
    }
  })

  it('tiene "lectura" como defaultValue del campo role', () => {
    const roleField = findField('role') as any

    expect(roleField.defaultValue).toBe('lectura')
  })

  // --------------------------------------------------------------------------
  // Tenant relationship
  // --------------------------------------------------------------------------

  it('tiene campo "tenant" como relationship a "tenants"', () => {
    const tenantField = findField('tenant') as any

    expect(tenantField).toBeDefined()
    expect(tenantField.type).toBe('relationship')
    expect(tenantField.relationTo).toBe('tenants')
  })

  it('el campo "tenant" no es requerido (superadmin no tiene tenant)', () => {
    const tenantField = findField('tenant') as any

    expect(tenantField.required).toBe(false)
  })

  it('el campo "tenant" esta indexado', () => {
    const tenantField = findField('tenant') as any

    expect(tenantField.index).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Campo email
  // --------------------------------------------------------------------------

  it('tiene campo "email" requerido, unico e indexado', () => {
    const emailField = findField('email') as any

    expect(emailField).toBeDefined()
    expect(emailField.type).toBe('email')
    expect(emailField.required).toBe(true)
    expect(emailField.unique).toBe(true)
    expect(emailField.index).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Tracking fields
  // --------------------------------------------------------------------------

  it('tiene campo "login_count" con defaultValue 0', () => {
    const field = findField('login_count') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('number')
    expect(field.defaultValue).toBe(0)
  })

  it('tiene campo "last_login_at" de tipo date', () => {
    const field = findField('last_login_at') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('date')
  })

  it('tiene campo "is_active" con defaultValue true', () => {
    const field = findField('is_active') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('checkbox')
    expect(field.defaultValue).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Hooks
  // --------------------------------------------------------------------------

  it('tiene hook afterLogin definido', () => {
    expect(Users.hooks).toBeDefined()
    expect(Users.hooks!.afterLogin).toBeDefined()
    expect(Users.hooks!.afterLogin!.length).toBeGreaterThanOrEqual(1)
  })

  it('tiene hook beforeChange definido', () => {
    expect(Users.hooks!.beforeChange).toBeDefined()
    expect(Users.hooks!.beforeChange!.length).toBeGreaterThanOrEqual(1)
  })

  it('tiene hook beforeDelete definido', () => {
    expect(Users.hooks!.beforeDelete).toBeDefined()
    expect(Users.hooks!.beforeDelete!.length).toBeGreaterThanOrEqual(1)
  })

  // --------------------------------------------------------------------------
  // Access control
  // --------------------------------------------------------------------------

  it('tiene access control definido para read, create, update, delete, admin', () => {
    const access = Users.access as any

    expect(access.read).toBeDefined()
    expect(access.create).toBeDefined()
    expect(access.update).toBeDefined()
    expect(access.delete).toBeDefined()
    expect(access.admin).toBeDefined()
  })

  it('admin access requiere usuario autenticado', () => {
    const access = Users.access as any

    // Sin usuario
    expect(access.admin({ req: { user: null } })).toBe(false)

    // Con usuario
    expect(access.admin({ req: { user: { id: 1, role: 'lectura' } } })).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Timestamps
  // --------------------------------------------------------------------------

  it('tiene timestamps habilitados', () => {
    expect(Users.timestamps).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Slug
  // --------------------------------------------------------------------------

  it('tiene slug "users"', () => {
    expect(Users.slug).toBe('users')
  })
})
