/**
 * @module cms
 * CMS Client SDK for fetching content from Payload CMS
 */

// ============================================================================
// Configuration
// ============================================================================

const CMS_URL = process.env.PAYLOAD_CMS_URL ?? 'http://localhost:3003'
const CMS_API_KEY = process.env.PAYLOAD_API_KEY ?? ''

// ============================================================================
// Types
// ============================================================================

export interface CMSImage {
  id: string
  url: string
  alt: string
  width: number
  height: number
}

export interface CMSCourse {
  id: string
  title: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  currency: string
  duration: number
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  instructor: {
    id: string
    name: string
    avatar?: CMSImage
  }
  image?: CMSImage
  rating?: number
  studentsCount?: number
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface CMSPage {
  id: string
  title: string
  slug: string
  content: unknown // Rich text content
  seo?: {
    title?: string
    description?: string
    image?: CMSImage
  }
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface CMSPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: unknown
  author: {
    id: string
    name: string
    avatar?: CMSImage
  }
  category: string
  tags: string[]
  image?: CMSImage
  publishedAt: string
  status: 'draft' | 'published'
}

export interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface QueryParams {
  page?: number
  limit?: number
  sort?: string
  where?: Record<string, unknown>
}

// ============================================================================
// API Client
// ============================================================================

class CMSClient {
  private baseUrl: string
  private apiKey: string
  private cache = new Map<string, { data: unknown; timestamp: number }>()
  private cacheTTL = 60000 // 1 minute

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`

    // Check cache
    const cacheKey = `${url}:${JSON.stringify(options)}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
      next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
    })

    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as T

    // Update cache
    this.cache.set(cacheKey, { data, timestamp: Date.now() })

    return data as T
  }

  private buildQuery(params?: QueryParams): string {
    if (!params) return ''

    const query = new URLSearchParams()

    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    if (params.sort) query.set('sort', params.sort)
    if (params.where) {
      query.set('where', JSON.stringify(params.where))
    }

    const queryString = query.toString()
    return queryString ? `?${queryString}` : ''
  }

  // ============================================================================
  // Courses
  // ============================================================================

  async getCourses(params?: QueryParams): Promise<PaginatedResponse<CMSCourse>> {
    const query = this.buildQuery({
      ...params,
      where: {
        ...(params?.where ?? {}),
        status: { equals: 'published' },
      },
    })
    return this.fetch<PaginatedResponse<CMSCourse>>(`/courses${query}`)
  }

  async getCourseBySlug(slug: string): Promise<CMSCourse | null> {
    const response = await this.fetch<PaginatedResponse<CMSCourse>>(
      `/courses?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`
    )
    return response.docs[0] || null
  }

  async getCourseById(id: string): Promise<CMSCourse> {
    return this.fetch<CMSCourse>(`/courses/${id}`)
  }

  async getFeaturedCourses(limit = 6): Promise<CMSCourse[]> {
    const response = await this.getCourses({
      limit,
      sort: '-studentsCount',
      where: { status: { equals: 'published' } },
    })
    return response.docs
  }

  // ============================================================================
  // Pages
  // ============================================================================

  async getPageBySlug(slug: string): Promise<CMSPage | null> {
    const response = await this.fetch<PaginatedResponse<CMSPage>>(
      `/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`
    )
    return response.docs[0] || null
  }

  // ============================================================================
  // Blog Posts
  // ============================================================================

  async getPosts(params?: QueryParams): Promise<PaginatedResponse<CMSPost>> {
    const query = this.buildQuery({
      ...params,
      where: {
        ...(params?.where ?? {}),
        status: { equals: 'published' },
      },
    })
    return this.fetch<PaginatedResponse<CMSPost>>(`/posts${query}`)
  }

  async getPostBySlug(slug: string): Promise<CMSPost | null> {
    const response = await this.fetch<PaginatedResponse<CMSPost>>(
      `/posts?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`
    )
    return response.docs[0] || null
  }

  async getLatestPosts(limit = 3): Promise<CMSPost[]> {
    const response = await this.getPosts({
      limit,
      sort: '-publishedAt',
    })
    return response.docs
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  clearCache(): void {
    this.cache.clear()
  }

  invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const cms = new CMSClient(CMS_URL, CMS_API_KEY)

// ============================================================================
// Server Actions (for ISR invalidation)
// ============================================================================

export function revalidateCourses(): void {
  cms.invalidateCache('/courses')
}

export function revalidatePosts(): void {
  cms.invalidateCache('/posts')
}

export function revalidatePage(slug: string): void {
  cms.invalidateCache(`/pages?where[slug][equals]=${slug}`)
}
