/**
 * @fileoverview Tests para el endpoint OpenAPI /api/v1/openapi
 * Valida la estructura y contenido de la especificacion OpenAPI 3.1
 */

import { describe, it, expect } from 'vitest'
import { GET } from '../openapi/route'

// ============================================================================
// Tests
// ============================================================================

describe('GET /api/v1/openapi', () => {
  it('retorna 200 con JSON valido', async () => {
    const response = await GET()

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toBeDefined()
    expect(typeof body).toBe('object')
  })

  it('contiene el campo openapi con version 3.1.0', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.openapi).toBe('3.1.0')
  })

  it('contiene info con titulo y version de la API', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.info).toBeDefined()
    expect(body.info.title).toBe('Akademate V1 API')
    expect(body.info.version).toBe('1.0.0')
    expect(body.info.contact).toBeDefined()
    expect(body.info.contact.email).toBe('hola@akademate.com')
  })

  it('contiene los 12 tags esperados', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.tags).toBeDefined()
    expect(body.tags).toHaveLength(12)

    const tagNames = body.tags.map((t: { name: string }) => t.name)
    expect(tagNames).toContain('Auth')
    expect(tagNames).toContain('Courses')
    expect(tagNames).toContain('Cycles')
    expect(tagNames).toContain('Campuses')
    expect(tagNames).toContain('Staff')
    expect(tagNames).toContain('Convocatorias')
    expect(tagNames).toContain('Students')
    expect(tagNames).toContain('Enrollments')
    expect(tagNames).toContain('Leads')
    expect(tagNames).toContain('Analytics')
    expect(tagNames).toContain('Keys')
    expect(tagNames).toContain('Media')
  })

  it('contiene los 17 paths esperados', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.paths).toBeDefined()
    const paths = Object.keys(body.paths)
    expect(paths).toHaveLength(17)

    const expectedPaths = [
      '/api/v1/me',
      '/api/v1/courses',
      '/api/v1/courses/{id}',
      '/api/v1/cycles',
      '/api/v1/cycles/{id}',
      '/api/v1/campuses',
      '/api/v1/campuses/{id}',
      '/api/v1/staff',
      '/api/v1/staff/{id}',
      '/api/v1/convocatorias',
      '/api/v1/convocatorias/{id}',
      '/api/v1/students',
      '/api/v1/enrollments',
      '/api/v1/leads',
      '/api/v1/keys',
      '/api/v1/media',
      '/api/v1/analytics',
    ]

    for (const p of expectedPaths) {
      expect(paths).toContain(p)
    }
  })

  it('tiene el esquema de seguridad bearerAuth definido', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.components).toBeDefined()
    expect(body.components.securitySchemes).toBeDefined()
    expect(body.components.securitySchemes.bearerAuth).toBeDefined()
    expect(body.components.securitySchemes.bearerAuth.type).toBe('http')
    expect(body.components.securitySchemes.bearerAuth.scheme).toBe('bearer')
    expect(body.components.securitySchemes.bearerAuth.bearerFormat).toBe('AkKey')
  })

  it('tiene el array de servers con la URL de produccion', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.servers).toBeDefined()
    expect(Array.isArray(body.servers)).toBe(true)
    expect(body.servers.length).toBeGreaterThanOrEqual(1)

    const productionServer = body.servers.find(
      (s: { url: string }) => s.url === 'https://app.akademate.com',
    )
    expect(productionServer).toBeDefined()
    expect(productionServer.description).toBe('Production server')
  })

  it('tiene seguridad global definida con bearerAuth', async () => {
    const response = await GET()
    const body = await response.json()

    expect(body.security).toBeDefined()
    expect(Array.isArray(body.security)).toBe(true)
    expect(body.security).toContainEqual({ bearerAuth: [] })
  })

  it('contiene los schemas necesarios en components', async () => {
    const response = await GET()
    const body = await response.json()

    const schemas = body.components.schemas
    expect(schemas).toBeDefined()

    const expectedSchemas = [
      'ApiError',
      'PaginatedMeta',
      'Course',
      'Student',
      'Enrollment',
      'Analytics',
      'ApiKeyInfo',
    ]

    for (const schemaName of expectedSchemas) {
      expect(schemas[schemaName]).toBeDefined()
    }
  })

  it('retorna headers CORS y cache adecuados', async () => {
    const response = await GET()

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
  })
})
