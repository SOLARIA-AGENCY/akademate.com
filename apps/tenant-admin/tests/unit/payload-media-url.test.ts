import { describe, expect, it } from 'vitest'
import {
  canonicalizePayloadMediaUrl,
  resolvePayloadMediaSrc,
  toRelativePublicMediaUrl,
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

  it('drops placeholders, CEP website assets and Unsplash', () => {
    expect(canonicalizePayloadMediaUrl('/placeholder-avatar.svg')).toBeNull()
    expect(canonicalizePayloadMediaUrl('/website/cep/team/elena.jpg')).toBeNull()
    expect(canonicalizePayloadMediaUrl('/stock/cursos.jpg')).toBe('/stock/cursos.jpg')
  })

  it('strips broken absolute hosts down to /api/media/file', () => {
    expect(
      canonicalizePayloadMediaUrl('http://cepformacion.app.akademate.com/api/media/file/ciclo.webp'),
    ).toBe('/api/media/file/ciclo.webp')
    expect(
      toRelativePublicMediaUrl('https://cepformacion-app.akademate.com/api/media/file/foto.jpg?w=800'),
    ).toBe('/api/media/file/foto.jpg?w=800')
  })
})
