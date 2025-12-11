/**
 * Tests for GET /api/cursos endpoint
 *
 * Tests the expanded API response with 10 fields including:
 * - Basic fields: id, codigo, nombre, tipo
 * - Extended fields: descripcion, area, duracionReferencia, precioReferencia
 * - Visual fields: imagenPortada, totalConvocatorias
 *
 * Related commit: 799c5c6
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { GET } from '../route'
import { NextResponse } from 'next/server'

// Mock Payload CMS
jest.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: jest.fn(),
}))

describe('GET /api/cursos', () => {
  describe('Successful Response', () => {
    it('should return 10 fields per course', async () => {
      // Mock Payload response
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'MKT-PRIV-0001',
              name: 'Marketing Digital Avanzado',
              course_type: 'privado',
              short_description: 'Curso completo de marketing digital',
              area_formativa: {
                id: 1,
                nombre: 'Marketing Digital',
                codigo: 'MKT',
              },
              duration_hours: 120,
              base_price: 1200,
            },
          ],
          totalDocs: 1,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.total).toBe(1)
      expect(data.data).toHaveLength(1)

      const course = data.data[0]
      expect(course).toHaveProperty('id')
      expect(course).toHaveProperty('codigo')
      expect(course).toHaveProperty('nombre')
      expect(course).toHaveProperty('tipo')
      expect(course).toHaveProperty('descripcion')
      expect(course).toHaveProperty('area')
      expect(course).toHaveProperty('duracionReferencia')
      expect(course).toHaveProperty('precioReferencia')
      expect(course).toHaveProperty('imagenPortada')
      expect(course).toHaveProperty('totalConvocatorias')
    })

    it('should transform Payload fields correctly', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 7,
              codigo: 'MKT-PRIV-0004',
              name: 'Máster en Marketing Digital y Redes Sociales',
              course_type: 'privado',
              short_description: 'Curso completo de marketing digital',
              area_formativa: {
                id: 1,
                nombre: 'Marketing Digital',
              },
              duration_hours: 120,
              base_price: 1200,
            },
          ],
          totalDocs: 1,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      const course = data.data[0]
      expect(course.id).toBe(7)
      expect(course.codigo).toBe('MKT-PRIV-0004')
      expect(course.nombre).toBe('Máster en Marketing Digital y Redes Sociales')
      expect(course.tipo).toBe('privado')
      expect(course.descripcion).toBe('Curso completo de marketing digital')
      expect(course.area).toBe('Marketing Digital')
      expect(course.duracionReferencia).toBe(120)
      expect(course.precioReferencia).toBe(1200)
      expect(course.imagenPortada).toBe('/placeholder-course.svg')
      expect(course.totalConvocatorias).toBe(0)
    })

    it('should extract area from relationship object', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'DEV-PRIV-0001',
              name: 'Desarrollo Full Stack',
              course_type: 'privado',
              short_description: 'Curso de desarrollo web',
              area_formativa: {
                id: 2,
                nombre: 'Desarrollo Web',
                codigo: 'DEV',
              },
              duration_hours: 200,
              base_price: 2000,
            },
          ],
          totalDocs: 1,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      expect(data.data[0].area).toBe('Desarrollo Web')
    })

    it('should handle missing area_formativa gracefully', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'GEN-PRIV-0001',
              name: 'Curso Genérico',
              course_type: 'privado',
              short_description: null,
              area_formativa: null,
              duration_hours: null,
              base_price: null,
            },
          ],
          totalDocs: 1,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      const course = data.data[0]
      expect(course.area).toBe('Sin área')
      expect(course.descripcion).toBe('Curso de formación profesional')
      expect(course.duracionReferencia).toBe(0)
      expect(course.precioReferencia).toBe(0)
    })
  })

  describe('Cache Headers', () => {
    it('should include Cache-Control header', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [],
          totalDocs: 0,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()

      expect(response.headers.get('Cache-Control')).toBe(
        's-maxage=10, stale-while-revalidate=30'
      )
    })
  })

  describe('Error Handling', () => {
    it('should return error response when Payload fails', async () => {
      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockRejectedValue(new Error('Database connection failed'))

      const response = await GET()
      const data = await response.json()

      expect(data.success).toBe(false)
      expect(data.error).toBe('Error al obtener cursos')
      expect(response.status).toBe(500)
    })
  })

  describe('Multiple Courses', () => {
    it('should handle multiple courses correctly', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'MKT-PRIV-0001',
              name: 'Marketing Digital',
              course_type: 'privado',
              short_description: 'Marketing',
              area_formativa: { nombre: 'Marketing Digital' },
              duration_hours: 120,
              base_price: 1200,
            },
            {
              id: 2,
              codigo: 'DEV-PRIV-0001',
              name: 'Desarrollo Web',
              course_type: 'privado',
              short_description: 'Desarrollo',
              area_formativa: { nombre: 'Desarrollo Web' },
              duration_hours: 200,
              base_price: 2000,
            },
          ],
          totalDocs: 2,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.total).toBe(2)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].nombre).toBe('Marketing Digital')
      expect(data.data[1].nombre).toBe('Desarrollo Web')
    })
  })

  describe('Default Values', () => {
    it('should use default description when short_description is missing', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'TEST-0001',
              name: 'Test Course',
              course_type: 'privado',
              short_description: null,
              area_formativa: null,
              duration_hours: null,
              base_price: null,
            },
          ],
          totalDocs: 1,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      expect(data.data[0].descripcion).toBe('Curso de formación profesional')
    })

    it('should use 0 for missing duration and price', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'TEST-0001',
              name: 'Test Course',
              course_type: 'privado',
              short_description: 'Test',
              area_formativa: { nombre: 'Test' },
              duration_hours: null,
              base_price: null,
            },
          ],
          totalDocs: 1,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      expect(data.data[0].duracionReferencia).toBe(0)
      expect(data.data[0].precioReferencia).toBe(0)
    })

    it('should use placeholder SVG for all courses', async () => {
      const mockPayload = {
        find: jest.fn().resolves({
          docs: [
            {
              id: 1,
              codigo: 'TEST-0001',
              name: 'Test Course 1',
              course_type: 'privado',
            },
            {
              id: 2,
              codigo: 'TEST-0002',
              name: 'Test Course 2',
              course_type: 'ocupados',
            },
          ],
          totalDocs: 2,
        }),
      }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      const response = await GET()
      const data = await response.json()

      expect(data.data[0].imagenPortada).toBe('/placeholder-course.svg')
      expect(data.data[1].imagenPortada).toBe('/placeholder-course.svg')
    })
  })

  describe('Payload Query Parameters', () => {
    it('should query with correct parameters', async () => {
      const mockFind = jest.fn().resolves({
        docs: [],
        totalDocs: 0,
      })

      const mockPayload = { find: mockFind }

      const { getPayloadHMR } = require('@payloadcms/next/utilities')
      getPayloadHMR.mockResolvedValue(mockPayload)

      await GET()

      expect(mockFind).toHaveBeenCalledWith({
        collection: 'courses',
        limit: 100,
        sort: '-createdAt',
        depth: 2,
      })
    })
  })
})
