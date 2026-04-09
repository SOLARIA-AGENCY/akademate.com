import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '../route'

vi.mock('../../_lib', () => ({
  getWebsitePageBySlug: vi.fn(),
  saveWebsitePage: vi.fn(),
}))

import { getWebsitePageBySlug, saveWebsitePage } from '../../_lib'

describe('Website page config route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a page by slug', async () => {
    vi.mocked(getWebsitePageBySlug).mockResolvedValue({
      tenantId: '1',
      website: {} as any,
      page: {
        title: 'Inicio',
        path: '/',
        slug: 'home',
        pageKind: 'home',
        sections: [],
      } as any,
    })

    const request = new NextRequest('http://localhost/api/config/website/pages/home')
    const response = await GET(request, { params: Promise.resolve({ slug: 'home' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.page.slug).toBe('home')
  })

  it('returns 404 when page does not exist', async () => {
    vi.mocked(getWebsitePageBySlug).mockResolvedValue({
      tenantId: '1',
      website: {} as any,
      page: null,
    })

    const request = new NextRequest('http://localhost/api/config/website/pages/missing')
    const response = await GET(request, { params: Promise.resolve({ slug: 'missing' }) })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.success).toBe(false)
  })

  it('updates only target page payload', async () => {
    vi.mocked(saveWebsitePage).mockResolvedValue({
      tenantId: '1',
      website: {} as any,
      page: {
        title: 'Cursos',
        path: '/cursos',
        slug: 'cursos',
        pageKind: 'courses_index',
        sections: [{ id: 'list', kind: 'courseList', enabled: true, title: 'Cursos', subtitle: '', limit: 6 }],
      } as any,
    })

    const request = new NextRequest('http://localhost/api/config/website/pages/cursos', {
      method: 'PUT',
      body: JSON.stringify({
        page: {
          title: 'Cursos',
          path: '/cursos',
          slug: 'cursos',
          pageKind: 'courses_index',
          sections: [{ id: 'list', kind: 'courseList', enabled: true, title: 'Cursos', subtitle: '', limit: 6 }],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const response = await PUT(request, { params: Promise.resolve({ slug: 'cursos' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(saveWebsitePage).toHaveBeenCalled()
  })
})
