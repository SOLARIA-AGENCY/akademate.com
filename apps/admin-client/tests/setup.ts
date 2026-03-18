import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next/link
vi.mock('next/link', () => {
  const { createElement } = require('react')
  return {
    default: (props: Record<string, unknown>) => {
      return createElement('a', props)
    },
  }
})

// Mock next/image
vi.mock('next/image', () => {
  const { createElement } = require('react')
  return {
    default: (props: Record<string, unknown>) => {
      return createElement('img', props)
    },
  }
})

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
    resolvedTheme: 'dark',
  }),
  ThemeProvider: ({ children }: { children: unknown }) => children,
}))

// Mock fetch globally
global.fetch = vi.fn()
