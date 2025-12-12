import { config } from 'dotenv'
import path from 'path'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi, beforeAll } from 'vitest'

// Load test environment variables
config({ path: path.resolve(__dirname, '../.env.test') })

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
  default: (props: any) => {
    const { createElement } = require('react')
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

import { cleanupTestContext, createTestContext } from '../src/utils/testHelpers'

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...')
  console.log('📦 Database:', process.env.TEST_DATABASE_NAME || 'cepcomunicacion_test')
  console.log('🔌 PostgreSQL Host:', process.env.DATABASE_HOST || 'postgres')

  // Initialize Payload test context for all tests
  try {
    await createTestContext()
    console.log('✅ Payload test context initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Payload test context:', error)
    throw error
  }
})

// Global test cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...')
  try {
    await cleanupTestContext()
    console.log('✅ Test context cleaned up')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
})
