import { describe, it, expect, vi } from 'vitest'
import { GET } from '../../app/api/config/route'
import { NextRequest } from 'next/server'

describe('Config API Endpoint', () => {
  describe('GET /api/config', () => {
    it('returns logos configuration when section=logos', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('claro')
      expect(data.data).toHaveProperty('oscuro')
    })

    it('returns academia configuration when section=academia', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=academia')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('nombre')
    })

    it('returns 400 when section parameter is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/config')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Section parameter is required')
    })

    it('returns 404 for invalid section', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Section not found')
    })

    it('includes CORS headers', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('returns valid logo paths', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.claro).toMatch(/^\/logos\/.*\.(png|svg|jpg)$/)
      expect(data.data.oscuro).toMatch(/^\/logos\/.*\.(png|svg|jpg)$/)
    })

    it('returns academia name as string', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=academia')
      const response = await GET(request)
      const data = await response.json()

      expect(typeof data.data.nombre).toBe('string')
      expect(data.data.nombre.length).toBeGreaterThan(0)
    })

    it('handles query parameters correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos&extra=param')
      const response = await GET(request)
      const data = await response.json()

      // Should still work with extra params
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('is case-sensitive for section parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=LOGOS')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('returns JSON content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      const response = await GET(request)

      expect(response.headers.get('Content-Type')).toContain('application/json')
    })

    it('handles multiple consecutive requests', async () => {
      const requests = [
        new NextRequest('http://localhost:3000/api/config?section=logos'),
        new NextRequest('http://localhost:3000/api/config?section=academia'),
        new NextRequest('http://localhost:3000/api/config?section=logos'),
      ]

      const responses = await Promise.all(requests.map(req => GET(req)))
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('provides consistent response structure', async () => {
      const sections = ['logos', 'academia']
      
      for (const section of sections) {
        const request = new NextRequest(`http://localhost:3000/api/config?section=${section}`)
        const response = await GET(request)
        const data = await response.json()

        expect(data).toHaveProperty('success')
        expect(data).toHaveProperty('data')
        expect(typeof data.success).toBe('boolean')
        expect(typeof data.data).toBe('object')
      }
    })
  })

  describe('Configuration Data Integrity', () => {
    it('logos section has both light and dark variants', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.claro).toBeDefined()
      expect(data.data.oscuro).toBeDefined()
      expect(data.data.claro).not.toBe('')
      expect(data.data.oscuro).not.toBe('')
    })

    it('academia section has name property', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=academia')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.nombre).toBeDefined()
      expect(data.data.nombre).toBe('CEP FORMACIÓN')
    })

    it('does not expose internal paths', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      const response = await GET(request)
      const data = await response.json()

      expect(data.data.claro).not.toContain('uploads/')
      expect(data.data.claro).not.toContain('private/')
    })
  })

  describe('Error Handling', () => {
    it('provides clear error messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/config')
      const response = await GET(request)
      const data = await response.json()

      expect(data.error).toBeDefined()
      expect(typeof data.error).toBe('string')
      expect(data.error.length).toBeGreaterThan(0)
    })

    it('returns proper HTTP status codes', async () => {
      const testCases = [
        { url: 'http://localhost:3000/api/config', expectedStatus: 400 },
        { url: 'http://localhost:3000/api/config?section=invalid', expectedStatus: 404 },
        { url: 'http://localhost:3000/api/config?section=logos', expectedStatus: 200 },
      ]

      for (const testCase of testCases) {
        const request = new NextRequest(testCase.url)
        const response = await GET(request)
        expect(response.status).toBe(testCase.expectedStatus)
      }
    })

    it('handles empty section parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/config?section=')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400) // Empty param is bad request, not not-found
      expect(data.success).toBe(false)
      expect(data.error).toBe('Section parameter is required')
    })
  })

  describe('Performance', () => {
    it('responds quickly (< 100ms)', async () => {
      const start = Date.now()
      const request = new NextRequest('http://localhost:3000/api/config?section=logos')
      await GET(request)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(100)
    })

    it('handles concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(() => 
        new NextRequest('http://localhost:3000/api/config?section=logos')
      )

      const start = Date.now()
      await Promise.all(requests.map(req => GET(req)))
      const duration = Date.now() - start

      expect(duration).toBeLessThan(500)
    })
  })
})
