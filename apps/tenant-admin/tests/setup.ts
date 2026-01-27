import { config } from 'dotenv'
import path from 'path'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeAll, afterAll, beforeEach } from 'vitest'

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') })

// Mock localStorage for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock })

// Clear localStorage before each test
beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next-router-mock')
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }
})

// Mock Next.js Image
vi.mock('next/image', () => ({
  default: ({ priority, fill, ...props }: Record<string, unknown>) => {
    const { createElement } = require('react')
    // Filter out Next.js-specific props that aren't valid HTML attributes
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return createElement('img', props)
  },
}))

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, className, ...props }: any) => {
    const { createElement } = require('react')
    return createElement('a', { href, className, ...props }, children)
  },
}))

// Mock global fetch for API calls
const originalFetch = global.fetch
beforeAll(() => {
  global.fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()

    // Mock config API
    if (url.includes('/api/config')) {
      return Promise.resolve(new Response(JSON.stringify({
        logos: { logoUrl: '/logo.png', faviconUrl: '/favicon.ico' }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }

    // Mock auth API
    if (url.includes('/api/auth') || url.includes('/api/users/login')) {
      return Promise.resolve(new Response(JSON.stringify({
        user: { id: '1', email: 'test@test.com', name: 'Test User' },
        token: 'mock-token'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    }

    // Default: return 404
    return Promise.resolve(new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }))
  }) as unknown as typeof fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

// Note: Integration tests requiring Payload should be in tests/integration/
// and will use a separate setup file with createTestContext/cleanupTestContext
