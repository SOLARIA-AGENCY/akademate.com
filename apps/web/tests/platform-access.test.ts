import { describe, expect, it } from 'vitest'
import { getPathFromUrl, getRuntimePlatformUrls } from '@/lib/platform-access'

describe('platform access URLs', () => {
  it('keeps path, query and hash when routing through a platform URL', () => {
    expect(getPathFromUrl('https://tenant.example.test/registro?plan=pro#payment')).toBe(
      '/registro?plan=pro#payment'
    )
  })

  it('fails closed to the root path for malformed URLs', () => {
    expect(getPathFromUrl('not-a-url')).toBe('/')
  })

  it('provides all platform destinations in server rendering', () => {
    const urls = getRuntimePlatformUrls()

    expect(urls.web).toMatch(/^https?:\/\//)
    expect(urls.tenant).toMatch(/^https?:\/\//)
    expect(urls.campus).toMatch(/^https?:\/\//)
  })
})
