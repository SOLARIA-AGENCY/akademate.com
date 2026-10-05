import { describe, expect, it } from 'vitest'
import {
  assertPublicCatalogHasNoPii,
  hashCatalogVersion,
  PUBLIC_CATALOG_FORBIDDEN_KEYS,
  PublicCatalogError,
  resolvePublicCatalogHost,
} from '@/app/lib/server/public-catalog-shared'
import { consumePublicCatalogRateLimit } from '@/app/lib/server/public-api-rate-limit'

describe('public catalog contract', () => {
  it('hashes a stable content version', () => {
    expect(hashCatalogVersion(['1', 'v1', 'a'])).toBe(hashCatalogVersion(['1', 'v1', 'a']))
    expect(hashCatalogVersion(['1', 'v1', 'a'])).not.toBe(hashCatalogVersion(['1', 'v1', 'b']))
    expect(hashCatalogVersion(['1'])).toHaveLength(64)
  })

  it('rejects email and credential keys', () => {
    expect(PUBLIC_CATALOG_FORBIDDEN_KEYS).toContain('email')
    expect(() => assertPublicCatalogHasNoPii({ teachers: [{ name: 'Ana', email: 'a@b.c' }] })).toThrow(
      PublicCatalogError,
    )
    expect(() => assertPublicCatalogHasNoPii({ teachers: [{ name: 'Ana', bio: 'Docente' }] })).not.toThrow()
  })

  it('prefers the host query over forwarded host', () => {
    const request = new Request('https://cepformacion-app.akademate.com/api/public/v1/catalog?host=cepformacion.akademate.com', {
      headers: { 'x-forwarded-host': 'cepformacion-app.akademate.com' },
    })
    expect(resolvePublicCatalogHost(request)).toBe('cepformacion.akademate.com')
  })

  it('keeps catalog version marker current', () => {
    expect(hashCatalogVersion(['1', 'v2', 'a'])).toHaveLength(64)
  })

  it('rate-limits a key after 60 requests', () => {
    const key = `rate-${Date.now()}`
    for (let i = 0; i < 60; i += 1) {
      expect(consumePublicCatalogRateLimit(key).allowed).toBe(true)
    }
    expect(consumePublicCatalogRateLimit(key).allowed).toBe(false)
  })
})
