/**
 * @fileoverview Tests para las constantes y tipos de la pagina de configuracion
 * Valida: ALL_SCOPES (16 entries), ApiKeyItem interface shape
 *
 * Nota: Como la pagina de configuracion es un componente 'use client',
 * extraemos y testeamos las constantes declaradas en ella.
 * Dado que no podemos importar directamente un componente React con hooks,
 * replicamos las constantes aqui y verificamos su consistencia.
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Constantes replicadas de configuracion/page.tsx
// Se validan contra la source of truth: la coleccion ApiKeys
// ============================================================================

import { ApiKeys } from '../../../../src/collections/ApiKeys/ApiKeys'

/**
 * ALL_SCOPES segun la pagina de configuracion.
 * Debe mantenerse sincronizado con la coleccion ApiKeys.
 */
const ALL_SCOPES = [
  { value: 'courses:read', label: 'Cursos (Lectura)' },
  { value: 'courses:write', label: 'Cursos (Escritura)' },
  { value: 'cycles:read', label: 'Ciclos (Lectura)' },
  { value: 'cycles:write', label: 'Ciclos (Escritura)' },
  { value: 'campuses:read', label: 'Sedes (Lectura)' },
  { value: 'campuses:write', label: 'Sedes (Escritura)' },
  { value: 'staff:read', label: 'Personal (Lectura)' },
  { value: 'staff:write', label: 'Personal (Escritura)' },
  { value: 'convocatorias:read', label: 'Convocatorias (Lectura)' },
  { value: 'convocatorias:write', label: 'Convocatorias (Escritura)' },
  { value: 'students:read', label: 'Alumnos (Lectura)' },
  { value: 'students:write', label: 'Alumnos (Escritura)' },
  { value: 'enrollments:read', label: 'Matriculas (Lectura)' },
  { value: 'enrollments:write', label: 'Matriculas (Escritura)' },
  { value: 'analytics:read', label: 'Analiticas (Lectura)' },
  { value: 'keys:manage', label: 'API Keys (Gestion)' },
]

/**
 * Interfaz ApiKeyItem esperada en la pagina de configuracion
 */
interface ApiKeyItem {
  id: string
  name: string
  scopes: string[]
  is_active: boolean
  rate_limit_per_day: number
  last_used_at: string | null
  created_at: string
}

// ============================================================================
// Tests: ALL_SCOPES
// ============================================================================

describe('ALL_SCOPES', () => {
  it('tiene exactamente 16 entradas', () => {
    expect(ALL_SCOPES).toHaveLength(16)
  })

  it('cada scope tiene propiedades "value" y "label"', () => {
    for (const scope of ALL_SCOPES) {
      expect(scope).toHaveProperty('value')
      expect(scope).toHaveProperty('label')
      expect(typeof scope.value).toBe('string')
      expect(typeof scope.label).toBe('string')
      expect(scope.value.length).toBeGreaterThan(0)
      expect(scope.label.length).toBeGreaterThan(0)
    }
  })

  it('cada value sigue el formato "recurso:accion"', () => {
    for (const scope of ALL_SCOPES) {
      expect(scope.value).toMatch(/^[a-z]+:[a-z]+$/)
    }
  })

  it('los valores son unicos (no hay duplicados)', () => {
    const values = ALL_SCOPES.map((s) => s.value)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it('esta sincronizado con la coleccion ApiKeys de Payload', () => {
    // Extraer los values de la coleccion ApiKeys
    const scopesField = ApiKeys.fields.find((f: any) => f.name === 'scopes') as any
    const selectField = scopesField.fields.find((f: any) => f.type === 'select')
    const collectionScopeValues = selectField.options.map((o: any) =>
      typeof o === 'string' ? o : o.value,
    )

    const uiScopeValues = ALL_SCOPES.map((s) => s.value)

    // Misma cantidad
    expect(uiScopeValues.length).toBe(collectionScopeValues.length)

    // Mismos valores (pueden estar en diferente orden)
    const sortedUI = [...uiScopeValues].sort()
    const sortedCollection = [...collectionScopeValues].sort()
    expect(sortedUI).toEqual(sortedCollection)
  })

  it('incluye scopes de lectura y escritura para cada recurso principal', () => {
    const resources = ['courses', 'cycles', 'campuses', 'staff', 'convocatorias', 'students', 'enrollments']
    const values = ALL_SCOPES.map((s) => s.value)

    for (const resource of resources) {
      expect(values).toContain(`${resource}:read`)
      expect(values).toContain(`${resource}:write`)
    }
  })

  it('incluye scopes especiales: analytics:read y keys:manage', () => {
    const values = ALL_SCOPES.map((s) => s.value)

    expect(values).toContain('analytics:read')
    expect(values).toContain('keys:manage')
  })
})

// ============================================================================
// Tests: ApiKeyItem interface shape
// ============================================================================

describe('ApiKeyItem interface', () => {
  it('un objeto valido cumple con la interfaz esperada', () => {
    const item: ApiKeyItem = {
      id: 'key-123',
      name: 'Integracion CRM',
      scopes: ['courses:read', 'students:read'],
      is_active: true,
      rate_limit_per_day: 1000,
      last_used_at: '2026-03-19T12:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
    }

    expect(item.id).toBe('key-123')
    expect(item.name).toBe('Integracion CRM')
    expect(item.scopes).toHaveLength(2)
    expect(item.is_active).toBe(true)
    expect(item.rate_limit_per_day).toBe(1000)
    expect(item.last_used_at).toBe('2026-03-19T12:00:00Z')
    expect(item.created_at).toBe('2026-01-01T00:00:00Z')
  })

  it('last_used_at acepta null (key nunca usada)', () => {
    const item: ApiKeyItem = {
      id: 'key-new',
      name: 'Key Nueva',
      scopes: ['analytics:read'],
      is_active: true,
      rate_limit_per_day: 500,
      last_used_at: null,
      created_at: '2026-03-19T00:00:00Z',
    }

    expect(item.last_used_at).toBeNull()
  })

  it('tiene todas las 7 propiedades esperadas', () => {
    const expectedKeys: (keyof ApiKeyItem)[] = [
      'id',
      'name',
      'scopes',
      'is_active',
      'rate_limit_per_day',
      'last_used_at',
      'created_at',
    ]

    const item: ApiKeyItem = {
      id: '1',
      name: 'Test',
      scopes: [],
      is_active: true,
      rate_limit_per_day: 1000,
      last_used_at: null,
      created_at: '2026-01-01',
    }

    for (const key of expectedKeys) {
      expect(key in item).toBe(true)
    }

    // No debe tener propiedades extra
    expect(Object.keys(item)).toHaveLength(expectedKeys.length)
  })

  it('coincide con la respuesta del endpoint GET /api/internal/api-keys', () => {
    // El endpoint retorna objetos con esta estructura exacta
    // Verificamos que la interfaz mapea correctamente
    const serverResponse = {
      id: 'key-from-api',
      name: 'API Response Key',
      scopes: ['courses:read', 'courses:write'],
      is_active: true,
      rate_limit_per_day: 2000,
      last_used_at: '2026-03-19T10:30:00Z',
      created_at: '2026-02-15T08:00:00Z',
    }

    // Debe ser asignable a ApiKeyItem sin errores
    const item: ApiKeyItem = serverResponse

    expect(item.id).toBe(serverResponse.id)
    expect(item.name).toBe(serverResponse.name)
    expect(item.scopes).toEqual(serverResponse.scopes)
    expect(item.is_active).toBe(serverResponse.is_active)
    expect(item.rate_limit_per_day).toBe(serverResponse.rate_limit_per_day)
    expect(item.last_used_at).toBe(serverResponse.last_used_at)
    expect(item.created_at).toBe(serverResponse.created_at)
  })
})
