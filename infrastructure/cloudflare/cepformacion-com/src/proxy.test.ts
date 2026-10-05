import { describe, expect, it } from 'vitest'
import {
  CANONICAL_ORIGIN,
  PUBLIC_APP_ORIGIN,
  canonicalOriginForHost,
  isBlockedSitePath,
  isCapturedDashboardResponse,
  isOriginFormPath,
  isWorkerOwnedPath,
  previewSitePath,
  rewriteForwardedNextUrl,
  rewriteLocation,
  rewritePublicText,
  shouldFallbackToBrandAsset,
  shouldRewriteBody,
} from './proxy'

describe('previewSitePath', () => {
  it('maps /preview to the public home', () => {
    expect(previewSitePath('/preview')).toBe('/')
    expect(previewSitePath('/preview/')).toBe('/')
    expect(previewSitePath('/preview/cursos')).toBe('/cursos')
  })

  it('ignores non-preview paths', () => {
    expect(previewSitePath('/')).toBeNull()
    expect(previewSitePath('/cursos')).toBeNull()
  })
})

describe('path guards', () => {
  it('blocks dashboard and admin', () => {
    expect(isBlockedSitePath('/dashboard')).toBe(true)
    expect(isBlockedSitePath('/admin/collections')).toBe(true)
    expect(isBlockedSitePath('/api/users/login')).toBe(true)
    expect(isBlockedSitePath('/cursos')).toBe(false)
    expect(isBlockedSitePath('/_next/static/css/app.css')).toBe(false)
  })

  it('keeps worker routes local', () => {
    expect(isWorkerOwnedPath('/health')).toBe(true)
    expect(isWorkerOwnedPath('/internal/purge')).toBe(true)
    expect(isWorkerOwnedPath('/campus')).toBe(true)
    expect(isWorkerOwnedPath('/website/cep/partners/dkv.jpg')).toBe(true)
    expect(isWorkerOwnedPath('/website/cep/certifications/iso-14001.jpg')).toBe(true)
    expect(isWorkerOwnedPath('/website/cep/empleo/bolsa-empleo-oficina.jpg')).toBe(true)
    expect(isWorkerOwnedPath('/website/cep/categories/idiomas-competencias-linguisticas.jpg')).toBe(true)
    expect(isWorkerOwnedPath('/cursos')).toBe(false)
  })

  it('sends lead and track forms to the data origin', () => {
    expect(isOriginFormPath('/api/leads')).toBe(true)
    expect(isOriginFormPath('/api/track')).toBe(true)
    expect(isOriginFormPath('/api/public/v1/catalog')).toBe(false)
  })

  it('blocks extra admin surfaces', () => {
    expect(isBlockedSitePath('/api/v1/users')).toBe(true)
    expect(isBlockedSitePath('/auth/login')).toBe(true)
    expect(isBlockedSitePath('/campus-virtual')).toBe(true)
    expect(isBlockedSitePath('/campus')).toBe(false)
    expect(isBlockedSitePath('/api/public/v1/catalog')).toBe(true)
  })
})

describe('rewrites', () => {
  it('rewrites the public app origin in HTML and RSC payloads', () => {
    const html = `<link rel="canonical" href="${PUBLIC_APP_ORIGIN}/"><script>{"origin":"${PUBLIC_APP_ORIGIN}"}</script>`
    expect(rewritePublicText(html, CANONICAL_ORIGIN)).toBe(
      `<link rel="canonical" href="${CANONICAL_ORIGIN}/"><script>{"origin":"${CANONICAL_ORIGIN}"}</script>`,
    )
    expect(rewritePublicText('/_next/static/css/app.css', CANONICAL_ORIGIN)).toBe('/_next/static/css/app.css')
  })

  it('rewrites absolute redirects and leaves relative ones', () => {
    expect(rewriteLocation(`${PUBLIC_APP_ORIGIN}/cursos`, CANONICAL_ORIGIN)).toBe(`${CANONICAL_ORIGIN}/cursos`)
    expect(rewriteLocation('/cursos', CANONICAL_ORIGIN)).toBe('/cursos')
  })

  it('maps Next navigation headers back to the public app', () => {
    expect(rewriteForwardedNextUrl(`${CANONICAL_ORIGIN}/cursos`, CANONICAL_ORIGIN)).toBe(`${PUBLIC_APP_ORIGIN}/cursos`)
  })

  it('uses workers.dev as the rewrite host when the request is not on the apex', () => {
    expect(canonicalOriginForHost('cepformacion-com.workers.dev', 'https://cepformacion-com.workers.dev')).toBe(
      'https://cepformacion-com.workers.dev',
    )
    expect(canonicalOriginForHost('www.cepformacion.com', 'https://www.cepformacion.com')).toBe(CANONICAL_ORIGIN)
  })

  it('pins public HTML and catalog to Hetzner', () => {
    expect(PUBLIC_APP_ORIGIN).toBe('https://cepformacion.akademate.com')
  })

  it('rewrites HTML, RSC and JSON but not images', () => {
    expect(shouldRewriteBody('text/html; charset=utf-8')).toBe(true)
    expect(shouldRewriteBody('text/x-component')).toBe(true)
    expect(shouldRewriteBody('image/png')).toBe(false)
    expect(shouldRewriteBody('font/woff2')).toBe(false)
  })

  it('captures dashboard login redirects and falls back brand assets', () => {
    expect(isCapturedDashboardResponse(302, 'https://cepformacion-app.akademate.com/dashboard')).toBe(true)
    expect(isCapturedDashboardResponse(302, '/cursos')).toBe(false)
    expect(shouldFallbackToBrandAsset('/logos/cep.png', 404)).toBe(true)
    expect(shouldFallbackToBrandAsset('/cursos', 404)).toBe(false)
  })
})
