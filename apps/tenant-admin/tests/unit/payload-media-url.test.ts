import { describe, expect, it } from 'vitest'
import {
  canonicalizePayloadMediaUrl,
  resolvePayloadMediaSrc,
} from '../../app/lib/payload-media-url'

describe('payload media url', () => {
  it('canonicalizes /media filenames to /api/media/file', () => {
    expect(canonicalizePayloadMediaUrl('/media/elena.jpg')).toBe('/api/media/file/elena.jpg')
  })

  it('resolves populated media objects', () => {
    expect(resolvePayloadMediaSrc({ filename: 'staff.webp' })).toBe('/api/media/file/staff.webp')
    expect(resolvePayloadMediaSrc({ url: '/api/media/file/staff.webp' })).toBe(
      '/api/media/file/staff.webp',
    )
  })

  it('drops placeholders', () => {
    expect(canonicalizePayloadMediaUrl('/placeholder-avatar.svg')).toBeNull()
  })
})
