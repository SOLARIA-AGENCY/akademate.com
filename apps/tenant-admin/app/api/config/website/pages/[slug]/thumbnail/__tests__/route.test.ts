import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

vi.mock('../../../_lib', () => ({
  getWebsitePageBySlug: vi.fn(),
  ensureThumbnailForPage: vi.fn(),
  saveWebsitePage: vi.fn(),
}))

import { ensureThumbnailForPage, getWebsitePageBySlug, saveWebsitePage } from '../../../_lib'

describe('Website page thumbnail route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('regenerates thumbnail for an existing page', async () => {
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
    vi.mocked(ensureThumbnailForPage).mockResolvedValue('/website-cache/1/home.hash.svg')
    vi.mocked(saveWebsitePage).mockResolvedValue({
      tenantId: '1',
      website: {} as any,
      page: {
        title: 'Inicio',
        path: '/',
        slug: 'home',
        pageKind: 'home',
        thumbnailUrl: '/website-cache/1/home.hash.svg',
        sections: [],
      } as any,
    })

    const request = new NextRequest('http://localhost/api/config/website/pages/home/thumbnail', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ slug: 'home' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.thumbnailUrl).toBe('/website-cache/1/home.hash.svg')
  })

  it('returns 404 when page does not exist', async () => {
    vi.mocked(getWebsitePageBySlug).mockResolvedValue({
      tenantId: '1',
      website: {} as any,
      page: null,
    })

    const request = new NextRequest('http://localhost/api/config/website/pages/missing/thumbnail', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ slug: 'missing' }) })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.success).toBe(false)
  })
})
