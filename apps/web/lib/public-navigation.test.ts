import { describe, expect, it } from 'vitest'
import { isPublishedSocialProfile } from './public-navigation'

describe('public social profiles', () => {
  it('rejects search, explore and empty destinations', () => {
    expect(
      isPublishedSocialProfile('https://www.instagram.com/explore/search/keyword/?q=akademate')
    ).toBe(false)
    expect(
      isPublishedSocialProfile('https://x.com/search?q=%22akademate.com%22&src=typed_query')
    ).toBe(false)
    expect(isPublishedSocialProfile('https://www.facebook.com/search/top?q=akademate')).toBe(false)
    expect(isPublishedSocialProfile(undefined)).toBe(false)
    expect(isPublishedSocialProfile('https://www.linkedin.com')).toBe(false)
  })

  it('accepts real profile URLs only', () => {
    expect(isPublishedSocialProfile('https://www.linkedin.com/company/akademate')).toBe(true)
    expect(isPublishedSocialProfile('https://www.instagram.com/akademate')).toBe(true)
    expect(isPublishedSocialProfile('https://x.com/akademate')).toBe(true)
    expect(isPublishedSocialProfile('https://www.facebook.com/akademate')).toBe(true)
  })
})
