// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { publicPageMetadata } from './metadata'

describe('localized public metadata', () => {
  it('self-canonicalizes Spanish and publishes complete language alternates', () => {
    const metadata = publicPageMetadata({
      locale: 'es',
      pathname: '/features',
      copy: {
        en: { title: 'Features', description: 'English description' },
        es: { title: 'Funciones', description: 'Descripción española' },
      },
    })

    expect(metadata.title).toBe('Funciones')
    expect(metadata.alternates).toEqual({
      canonical: '/es/features',
      languages: {
        en: '/en/features',
        es: '/es/features',
        'x-default': '/en/features',
      },
    })
    expect(metadata.openGraph).toMatchObject({ locale: 'es_ES', url: '/es/features' })
    expect(metadata.openGraph?.images).toEqual([
      {
        url: '/images/marketing/akademate-og-share-v1.jpg',
        alt: 'Funciones',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
      },
    ])
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      images: ['/images/marketing/akademate-og-share-v1.jpg'],
    })
  })
})
