/**
 * @fileoverview Tests para la coleccion ApiKeys de Payload CMS
 * Valida: slug, campos, opciones de scopes, access control
 */

import { describe, it, expect } from 'vitest'
import { ApiKeys } from '../../../../src/collections/ApiKeys/ApiKeys'

// ============================================================================
// Helpers
// ============================================================================

function findField(name: string) {
  return ApiKeys.fields.find((f: any) => f.name === name)
}

function getFieldOptions(fieldName: string): string[] {
  const field = findField(fieldName) as any
  if (!field) return []

  // Para campos tipo array con sub-fields select
  if (field.type === 'array' && field.fields) {
    const selectField = field.fields.find((f: any) => f.type === 'select')
    if (selectField?.options) {
      return selectField.options.map((o: any) => typeof o === 'string' ? o : o.value)
    }
  }

  // Para campos tipo select directos
  if (field.type === 'select' && field.options) {
    return field.options.map((o: any) => typeof o === 'string' ? o : o.value)
  }

  return []
}

// ============================================================================
// Tests
// ============================================================================

describe('ApiKeys Collection', () => {
  // --------------------------------------------------------------------------
  // Slug
  // --------------------------------------------------------------------------

  it('tiene el slug correcto "api-keys"', () => {
    expect(ApiKeys.slug).toBe('api-keys')
  })

  // --------------------------------------------------------------------------
  // Scopes - 16 opciones
  // --------------------------------------------------------------------------

  it('tiene las 16 opciones de scope definidas', () => {
    const scopeOptions = getFieldOptions('scopes')

    expect(scopeOptions).toHaveLength(16)

    const expectedScopes = [
      'courses:read',
      'courses:write',
      'students:read',
      'students:write',
      'enrollments:read',
      'enrollments:write',
      'analytics:read',
      'keys:manage',
      'cycles:read',
      'cycles:write',
      'campuses:read',
      'campuses:write',
      'staff:read',
      'staff:write',
      'convocatorias:read',
      'convocatorias:write',
    ]

    for (const scope of expectedScopes) {
      expect(scopeOptions).toContain(scope)
    }
  })

  // --------------------------------------------------------------------------
  // Campos requeridos
  // --------------------------------------------------------------------------

  it('tiene el campo "name" requerido de tipo text', () => {
    const field = findField('name') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('text')
    expect(field.required).toBe(true)
  })

  it('tiene el campo "key_hash" requerido, unico e indexado', () => {
    const field = findField('key_hash') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('text')
    expect(field.required).toBe(true)
    expect(field.unique).toBe(true)
    expect(field.index).toBe(true)
  })

  it('tiene el campo "scopes" requerido de tipo array con minRows: 1', () => {
    const field = findField('scopes') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('array')
    expect(field.required).toBe(true)
    expect(field.minRows).toBe(1)
  })

  it('tiene el campo "tenant" requerido como relationship a "tenants"', () => {
    const field = findField('tenant') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('relationship')
    expect(field.relationTo).toBe('tenants')
    expect(field.required).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Campos opcionales
  // --------------------------------------------------------------------------

  it('tiene el campo "is_active" como checkbox con defaultValue true', () => {
    const field = findField('is_active') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('checkbox')
    expect(field.defaultValue).toBe(true)
  })

  it('tiene el campo "rate_limit_per_day" como number con default 1000', () => {
    const field = findField('rate_limit_per_day') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('number')
    expect(field.defaultValue).toBe(1000)
  })

  it('tiene el campo "last_used_at" como date', () => {
    const field = findField('last_used_at') as any

    expect(field).toBeDefined()
    expect(field.type).toBe('date')
  })

  // --------------------------------------------------------------------------
  // Access control
  // --------------------------------------------------------------------------

  it('requiere autenticacion para leer (retorna false sin user)', () => {
    const access = ApiKeys.access as any

    expect(access.read).toBeDefined()
    const result = access.read({ req: { user: null } })
    expect(result).toBe(false)
  })

  it('superadmin puede leer todas las keys', () => {
    const access = ApiKeys.access as any

    const result = access.read({
      req: { user: { role: 'superadmin', tenant: 1 } },
    })
    expect(result).toBe(true)
  })

  it('admin puede crear keys', () => {
    const access = ApiKeys.access as any

    const result = access.create({
      req: { user: { role: 'admin', tenant: 1 } },
    })
    expect(result).toBe(true)
  })

  it('superadmin puede crear keys', () => {
    const access = ApiKeys.access as any

    const result = access.create({
      req: { user: { role: 'superadmin' } },
    })
    expect(result).toBe(true)
  })

  it('usuarios no-admin no pueden crear keys', () => {
    const access = ApiKeys.access as any

    const roles = ['gestor', 'marketing', 'asesor', 'lectura']
    for (const role of roles) {
      const result = access.create({
        req: { user: { role, tenant: 1 } },
      })
      expect(result).toBe(false)
    }
  })

  it('admin/superadmin pueden actualizar keys', () => {
    const access = ApiKeys.access as any

    expect(access.update({ req: { user: { role: 'admin' } } })).toBe(true)
    expect(access.update({ req: { user: { role: 'superadmin' } } })).toBe(true)
  })

  it('admin/superadmin pueden eliminar keys', () => {
    const access = ApiKeys.access as any

    expect(access.delete({ req: { user: { role: 'admin' } } })).toBe(true)
    expect(access.delete({ req: { user: { role: 'superadmin' } } })).toBe(true)
  })

  it('usuarios sin autenticar no pueden crear/actualizar/eliminar', () => {
    const access = ApiKeys.access as any

    expect(access.create({ req: { user: null } })).toBe(false)
    expect(access.update({ req: { user: null } })).toBe(false)
    expect(access.delete({ req: { user: null } })).toBe(false)
  })

  // --------------------------------------------------------------------------
  // Timestamps
  // --------------------------------------------------------------------------

  it('tiene timestamps habilitados', () => {
    expect(ApiKeys.timestamps).toBe(true)
  })
})
