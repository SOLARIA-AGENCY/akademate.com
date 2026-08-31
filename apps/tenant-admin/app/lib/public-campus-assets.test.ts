import { describe, expect, it } from 'vitest'
import { getPublicCampusImage } from './public-campus-assets'

describe('getPublicCampusImage', () => {
  it('returns tenant media and ignores slug maps', () => {
    expect(getPublicCampusImage('cualquier-sede', '/api/media/file/real-sede.png')).toBe(
      '/api/media/file/real-sede.png',
    )
  })

  it('returns null without tenant media, even for named slugs', () => {
    expect(getPublicCampusImage('campus-alpha')).toBeNull()
    expect(getPublicCampusImage('campus-beta')).toBeNull()
    expect(getPublicCampusImage('sede-demo')).toBeNull()
    expect(getPublicCampusImage('cualquier-sede', '   ')).toBeNull()
    expect(getPublicCampusImage('cualquier-sede', null)).toBeNull()
  })
})
