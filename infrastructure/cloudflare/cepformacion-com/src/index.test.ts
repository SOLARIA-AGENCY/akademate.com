import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import worker, { sealPublicHtml } from './index'
import type { WorkerEnv } from './index'
import type { CatalogSnapshot } from './render'

class MemoryCache {
  store = new Map<string, Response>()
  async match(request: RequestInfo): Promise<Response | undefined> {
    const url = request instanceof Request ? request.url : String(request)
    const hit = this.store.get(url)
    return hit?.clone()
  }
  async put(request: RequestInfo, response: Response): Promise<void> {
    const url = request instanceof Request ? request.url : String(request)
    this.store.set(url, response.clone())
  }
  async delete(request: RequestInfo): Promise<boolean> {
    const url = request instanceof Request ? request.url : String(request)
    return this.store.delete(url)
  }
}

const catalog: CatalogSnapshot = {
  meta: {
    tenant: 'cep-formacion',
    host: 'cepformacion.akademate.com',
    generatedAt: '2026-09-03T00:00:00.000Z',
    version: 'container',
    cacheTtlSeconds: 60,
  },
  data: {
    branding: { academyName: 'CEP Formación', primaryColor: '#f2014b' },
    seo: { defaultTitle: 'CEP', defaultDescription: 'Formación', canonicalOrigin: 'https://cepformacion.com' },
    courses: [
      {
        slug: 'canino',
        nombre: 'ADIESTRAMIENTO CANINO I',
        studyType: 'privados',
        enrollmentStatus: 'open',
        durationHours: 72,
        modality: 'presencial',
      },
      { slug: 'dietetica', nombre: 'Dietética', studyType: 'ocupados', enrollmentStatus: 'published' },
      {
        slug: 'redes',
        nombre: 'Gestión de redes',
        studyType: 'desempleados',
        enrollmentStatus: 'none',
        modality: 'teleformacion',
        durationHours: 40,
      },
      { slug: 'online', nombre: 'Tatuaje online', studyType: 'teleformacion', enrollmentStatus: 'open' },
    ],
    convocatorias: [
      { codigo: 'CONV-1', status: 'enrollment_open', classroomHours: 250, deliveryMode: 'presencial', course: { slug: 'dietetica' } },
    ],
    cycles: [
      { slug: 'cfgm-farmacia-parafarmacia', name: 'Farmacia y Parafarmacia', level: 'grado_medio' },
      { slug: 'cfgs-higiene-bucodental', name: 'Higiene Bucodental', level: 'grado_superior' },
      { slug: 'qa-ciclo-omega-persistencia', name: 'QA Ciclo Omega persistencia', level: 'grado_medio' },
    ],
    campuses: [],
    teachers: [],
    sitemap: [{ path: '/', changefreq: 'daily', lastmod: '2026-09-03' }],
  },
}

const brandHome = `<!doctype html><html><head><title>CEP</title></head><body>
<header><a href="/p/contacto" class="top">info@cep.es</a><a href="/p/contacto" class="brand-btn">Contacto</a></header>
<section class="hero">Hero akademate</section>
<img alt="CEP Sur" src="/api/media/file/campus-sur.svg">
<section class="bg-[#fff7fa]"><div>
<h2>Cursos</h2>
<p>Consulta de un vistazo todos los cursos que imparte CEP Formación, agrupados por tipo de formación.</p>
<section id="privados"><img src="/foto.jpg" alt="ficha"><input placeholder="Buscar en cursos"></section>
</div></section>
<section>Convocatorias</section>
<section>
<h2>Ciclos formativos oficiales</h2>
<p>Texto previo no centrado.</p>
<div class="mt-10 grid gap-8 lg:grid-cols-2"></div>
</section>
</body></html>`

const brandInner = `<!doctype html><html><head><title>Contacto</title></head><body>
<header><a href="/">CEP</a><nav><a href="/p/cursos">Cursos</a><a href="/p/contacto" class="brand-btn">Contacto</a></nav><a href="/p/contacto" class="top">info@cep.es</a></header>
<main class="flex-1">formulario de contacto</main>
<footer>Sedes Santa Cruz Norte Cookies</footer>
</body></html>`

const brandCiclos = `<!doctype html><html><head><title>Ciclos</title></head><body>
<article>
  <span style="background-color:#16A34A;color:#FFFFFF">Grado Medio · CFGM</span>
  <span class="rounded-full bg-white/90 px-3 py-1">Ref. SANMS</span>
  <p class="text-base leading-7 text-slate-600"><em>Formación práctica. Centro autorizado MEC 38017275.</em></p>
  <div class="mt-5 flex flex-wrap gap-2">
    <span class="rounded-full border border-rose-100 bg-rose-50">Régimen LOE</span>
  </div>
</article>
</body></html>`

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=UTF-8', 'x-powered-by': 'Next.js' },
  })
}

function env(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    MODE: 'origin-html',
    ORIGIN_API_URL: 'https://cepformacion.akademate.com',
    DASHBOARD_ORIGIN_URL: 'https://cepformacion-app.akademate.com',
    ORIGIN_SERVICE_TOKEN: 'test-token',
    ...overrides,
  }
}

function ctx(): ExecutionContext {
  return {
    waitUntil: (promise: Promise<unknown>) => {
      void promise
    },
    passThroughOnException: () => undefined,
  } as ExecutionContext
}

async function handle(path: string, init?: RequestInit, workerEnv?: WorkerEnv): Promise<Response> {
  return worker.fetch(new Request(`https://cepformacion.com${path}`, init), env(workerEnv), ctx())
}

async function handleDashboard(path: string, init?: RequestInit): Promise<Response> {
  return worker.fetch(new Request(`https://dashboard.cepformacion.com${path}`, init), env(), ctx())
}

async function handleCampus(path: string): Promise<Response> {
  return worker.fetch(new Request(`https://campus.cepformacion.com${path}`), env(), ctx())
}

describe('cepformacion.com worker', () => {
  const originalFetch = globalThis.fetch
  const memoryCache = new MemoryCache()

  function installFetch(
    impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  ): void {
    globalThis.fetch = impl as typeof fetch
  }

  beforeEach(() => {
    memoryCache.store.clear()
    // @ts-expect-error test double for CacheStorage
    globalThis.caches = { default: memoryCache }
    installFetch(async (input, init) => {
      const url = String(input instanceof Request ? input.url : input)
      const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined))
      if (url.includes('/api/public/v1/catalog')) {
        if (headers.get('authorization') !== 'Bearer test-token') return new Response('no', { status: 401 })
        return json(catalog)
      }
      if (url.includes('/api/health')) return json({ revision: 'live-container' })
      if (url.includes('/api/public/v1/health')) return json({ ok: true })
      if (url.includes('/api/leads') || url.includes('/api/track')) {
        return json({ ok: true, method, path: new URL(url).pathname }, 201)
      }
      if (url.startsWith('https://cepformacion.akademate.com/')) {
        const path = new URL(url).pathname
        if (path === '/' || path === '') return html(brandHome)
        if (path === '/p/contacto' || path === '/contacto') return html(brandInner)
        if (path === '/p/ciclos' || path === '/ciclos') return html(brandCiclos)
        return html(`<html><body>akademate ${path}</body></html>`)
      }
      if (url.startsWith('https://cepformacion-campus.akademate.com/')) {
        return html('<html><body>campus login</body></html>')
      }
      if (url.startsWith('https://cepformacion-app.akademate.com/')) {
        const path = new URL(url).pathname
        if (path === '/auth/login') {
          return new Response('', {
            status: 302,
            headers: {
              location: 'https://cepformacion-app.akademate.com/dashboard',
              'set-cookie': 'payload-token=abc; Path=/; Domain=.akademate.com; HttpOnly',
            },
          })
        }
        if (path === '/dashboard' || path.startsWith('/dashboard/')) {
          return html(`<html><body>ovh dashboard ${path}</body></html>`)
        }
        if (path === '/' || path === '') return html(brandHome)
        if (path === '/p/contacto' || path === '/contacto') return html(brandInner)
        if (path === '/p/ciclos' || path === '/ciclos') return html(brandCiclos)
        return html(`<html><body>ovh public ${path}</body></html>`)
      }
      return new Response(`unmocked ${url}`, { status: 404 })
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('blocks dashboard, admin and internal APIs', async () => {
    expect((await handle('/dashboard')).status).toBe(404)
    expect((await handle('/admin')).status).toBe(404)
    expect((await handle('/api/users')).status).toBe(404)
    expect((await handle('/api/v1/anything')).status).toBe(404)
    expect((await handle('/api/public/v1/catalog')).status).toBe(404)
    expect((await handle('/campus-virtual')).status).toBe(404)
  })

  it('returns 404 only for unpublished QA ciclos', async () => {
    expect((await handle('/ciclos/cfgm-farmacia-parafarmacia')).status).toBe(200)
    expect((await handle('/p/ciclos/cfgm-farmacia-parafarmacia')).status).toBe(301)
    expect((await handle('/ciclos/cfgs-higiene-bucodental')).status).toBe(200)
    expect((await handle('/p/ciclos/qa-ciclo-omega-persistencia')).status).toBe(404)
  })

  it('expands sitemap.xml from catalog entities and caches it', async () => {
    const response = await handle('/sitemap.xml')
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('max-age=3600')
    expect(body).toContain('https://cepformacion.com/cursos/canino')
    expect(body).toContain('https://cepformacion.com/ciclos/cfgm-farmacia-parafarmacia')
    expect(body).toContain('https://cepformacion.com/convocatorias/CONV-1')
    expect(body).not.toContain('/p/cursos/')
    expect(body).not.toContain('qa-ciclo-omega-persistencia')
  })

  it('rewrites home title and canonical for Santa Cruz SEO', async () => {
    const body = await (await handle('/')).text()
    expect(body).toContain('<title>CEP Formación | Cursos y FP en Tenerife</title>')
    expect(body).toContain('<link rel="canonical" href="https://cepformacion.com/">')
    expect(body).not.toContain('Plataforma Educativa')
  })

  it('injects a single Consent Mode gtag on inner pages', async () => {
    const body = await (await handle('/contacto')).text()
    expect(body).toContain('formulario de contacto')
    expect(body.split('gtag/js?id=G-ZPBEY6SHX9')).toHaveLength(2)
    expect(body.indexOf("gtag('consent', 'default'")).toBeLessThan(body.indexOf("gtag('config', 'G-ZPBEY6SHX9'"))
    expect(body).not.toContain('G-347NGFNZ90')
  })

  it('redirects legacy /p routes to the canonical path and keeps campaign parameters', async () => {
    const response = await handle('/p/cursos/canino?utm_source=meta&utm_medium=cpc&utm_campaign=yoga')
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe(
      'https://cepformacion.com/cursos/canino?utm_source=meta&utm_medium=cpc&utm_campaign=yoga',
    )
    const www = await worker.fetch(new Request('https://www.cepformacion.com/p/contacto'), env(), ctx())
    expect(www.status).toBe(301)
    expect(www.headers.get('location')).toBe('https://cepformacion.com/contacto')
    const http = await worker.fetch(new Request('http://cepformacion.com/cursos'), env(), ctx())
    expect(http.status).toBe(301)
    expect(http.headers.get('location')).toBe('https://cepformacion.com/cursos')
  })

  it('serves a favicon instead of the origin 404', async () => {
    const response = await handle('/favicon.ico')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/x-icon')
    const bytes = new Uint8Array(await response.arrayBuffer())
    expect(bytes[0]).toBe(0)
    expect(bytes[1]).toBe(0)
    expect(bytes.length).toBeGreaterThan(100)
  })

  it('redirects /preview to the live home', async () => {
    const response = await handle('/preview')
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://cepformacion.com/')
  })

  it('rewrites home Cursos from the Hetzner catalog as one readable column', async () => {
    const response = await handle('/')
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toContain('max-age=60')
    expect(response.headers.get('cdn-cache-control')).toContain('stale-while-revalidate=604800')
    expect(response.headers.get('x-cep-cache')).toBe('miss')
    expect(response.headers.get('x-cep-built-from')).toBe('hetzner')
    const csp = response.headers.get('content-security-policy') || ''
    const nonce = csp.match(/'nonce-([^']+)'/)?.[1] || ''
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
    expect(csp).not.toContain("script-src 'unsafe-inline'")
    expect(csp).toContain('sha256-sWTfQRrOVg0MvYlUME7okQM+jzchJ1bt4bAp0gQKHb4=')
    expect(nonce.length).toBeGreaterThan(8)
    expect(body).toContain(`nonce="${nonce}"`)
    expect(response.headers.get('x-cep-html-origin')).toBeNull()
    expect(response.headers.get('x-cep-data-origin')).toBeNull()
    expect(response.headers.get('x-powered-by')).toBeNull()
    expect(body).toContain('Hero akademate')
    expect(body).toContain('Convocatorias')
    expect(body).toContain('mx-auto max-w-3xl text-center text-3xl')
    expect(body).toContain('Oferta oficial con foco en empleabilidad y continuidad académica.')
    expect(body).toContain('Farmacia y parafarmacia')
    expect(body).toContain('Higiene bucodental')
    expect(body).not.toContain('qa-ciclo-omega-persistencia')
    expect(body).toContain('data-layout="stack"')
    expect(body).toContain('Adiestramiento canino I')
    expect(body).not.toContain('ADIESTRAMIENTO CANINO I')
    expect(body).toContain('Privados')
    expect(body).toContain('Trabajadores ocupados')
    expect(body).toContain('Trabajadores desempleados/as')
    expect(body).toContain('Ver&nbsp;curso')
    expect(body).toContain('Matrícula abierta')
    expect(body).toContain('100% gratuito')
    expect(body).toContain('Veterinaria')
    expect(body).toContain('Salud y deporte')
    expect(body).toContain('Empresa')
    expect(body).toContain('margin-top:40px')
    expect(body).toContain('data-cep-course-column="1"')
    expect(body).toContain('data-cep-course-table="1"')
    expect(body).toContain('data-cep-course-css="1"')
    expect(body).toContain('@media (max-width:767px)')
    expect(body).toContain('display:grid')
    expect(body).toContain('grid-template-areas:"name area campus start free open cta"')
    expect(body).toContain('data-cep-cell="cta"')
    expect(body).not.toContain('max-width:44rem')
    expect(body).toContain('Tatuaje online')
    expect(body).toContain('id="home-courses-teleformacion"')
    const visible = body.slice(body.indexOf('<body>'), body.indexOf('data-cep-home-courses-lock'))
    expect(visible).not.toContain('Buscar en cursos')
    expect(visible).not.toContain('/foto.jpg')
    expect(body).not.toContain('innerHTML')
    expect(body).toContain('data-cep-home-courses-lock="1"')
    expect(body).toContain('data-cep-course-list="1"')
    expect(body).toContain('align-items:center')
    expect(body).toContain('72 h · Presencial')
    expect(body).toContain('250 h · Presencial')
    expect(body).toContain('40 h · Teleformación')
    expect(body).toContain('data-cep-campus-nav-lock="1"')
    expect(body).toContain('data-cep-mobile-nav-lock="1"')
    expect(body).toContain('data-cep-bolsa-nav-lock="1"')
    expect(body).toContain('data-cep-chrome-nav-lock="1"')
    expect(body).toContain('data-cep-partners="1"')
    expect(body).toContain('Entidades y empresas colaboradoras')
    expect(body).toContain('>Certificaciones<')
    expect(body).toContain('/website/cep/partners/dkv.jpg')
    expect(body).toContain('overflow-y:auto')
    expect(body).toContain('>Ver campus</a>')
    expect(visible).not.toMatch(/class="brand-btn">Contacto/)
    expect(body).toContain('href="/contacto" class="top">info@cep.es</a>')
    expect(body).not.toContain('#2563eb')
    expect(body).toContain('G-ZPBEY6SHX9')
    expect(body).toContain("gtag('consent', 'default'")
    expect(body).toContain('analytics_storage')
    expect(body.split('gtag/js?id=G-ZPBEY6SHX9')).toHaveLength(2)
    expect(body).not.toContain('G-347NGFNZ90')
    expect(body).not.toContain('GTM-5D4839F3')
    expect(body).toContain('/images/sedes/sede-cep-sur.png')
    expect(body).not.toContain('campus-sur.svg')
    expect(body).toContain('[data-cep-chip="open"]{background:#16a34a')
  })

  it('rewrites live ciclo cards without duplicate chips', async () => {
    const response = await handle('/ciclos')
    const body = await response.text()
    const visible = body.slice(0, body.indexOf('data-cep-cards-lock="1"'))
    expect(response.status).toBe(200)
    expect(body).toContain('data-cep-cards="1"')
    expect(body).toContain('data-cep-cards-lock="1"')
    expect(body).toContain('data-cep-cycle-cards="1"')
    expect(body).toContain('farmacia-hero.png')
    expect(body).toContain('higiene-hero.png')
    expect(body).toContain('Farmacia y Parafarmacia')
    expect(body).toContain('Higiene Bucodental')
    expect(body).not.toContain('qa-ciclo-omega-persistencia')
    expect(visible).toContain('Ciclo medio')
    expect(visible).toContain('Centro autorizado MEC 38017275')
    expect(body).toContain('Ver ciclo')
    expect(visible).not.toContain('<em>')
    expect(visible).not.toContain('#16A34A')
    expect(body).not.toContain('innerHTML')
  })

  it('keeps other pages as the akademate HTML copy', async () => {
    const response = await handle('/cursos')
    expect(await response.text()).toContain('akademate /cursos')
  })

  it('stores a new lead once on OVH and does not post it again', async () => {
    const calls: Array<{ host: string; forwarded: string | null; userAgent: string | null; body: Record<string, unknown> }> = []
    installFetch(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/api/leads') {
        calls.push({
          host: url.host,
          forwarded: new Headers(init?.headers).get('x-forwarded-for'),
          userAgent: new Headers(init?.headers).get('user-agent'),
          body: JSON.parse(new TextDecoder().decode(init?.body as Uint8Array)) as Record<string, unknown>,
        })
        return json({ ok: true, path: url.pathname }, 201)
      }
      return new Response('no', { status: 404 })
    })
    const response = await handle('/api/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '203.0.113.8',
        'cf-ipcountry': 'ES',
        'user-agent': 'cep-lead-test',
        cookie: '_ga=GA1.1.111.222',
        referer: 'https://chatgpt.com/c/abc',
      },
      body: JSON.stringify({ email: 'a@b.c' }),
    })
    expect(response.status).toBe(201)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.host).toBe('origin.cepformacion.com')
    expect(calls[0]?.forwarded).toBe('203.0.113.8')
    expect(calls[0]?.userAgent).toBe('cep-lead-test')
    expect(calls[0]?.body.referrer).toBe('https://chatgpt.com/c/abc')
    expect(calls[0]?.body.country).toBe('es')
    const metadata = calls[0]?.body.lead_metadata as Record<string, unknown>
    expect(metadata.country).toBe('es')
    expect(metadata.ga_client_id).toBe('111.222')
    expect(response.headers.get('x-cep-lead')).toBe('ovh')
  })

  it('does not send the lead to Hetzner when OVH rejects it', async () => {
    const calls: string[] = []
    installFetch(async (input) => {
      const url = new URL(String(input))
      calls.push(url.host)
      return json({ ok: false }, 502)
    })
    const response = await handle('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c' }),
    })
    expect(response.status).toBe(502)
    expect(calls).toEqual(['origin.cepformacion.com'])
    expect(response.headers.get('x-cep-lead')).toBe('ovh')
  })

  it('rolls the apex back to coming-soon without pinning a SHA', async () => {
    const response = await handle('/', undefined, { MODE: 'coming-soon' })
    const body = await response.text()
    expect(body).toContain('Estamos preparando algo nuevo')
    expect(body).toContain('#f2014b')
    expect(body).not.toContain('G-ZPBEY6SHX9')
    expect(body).not.toContain('live-container')
    expect(body).not.toContain('data-cep-home-courses')
  })

  it('exposes origin revision as telemetry only', async () => {
    const response = await handle('/health')
    const body = (await response.json()) as {
      mode: string
      originRevision: string
      preview: string
      publicApp: string
      dataOrigin: string
    }
    expect(body.mode).toBe('origin-html')
    expect(body.originRevision).toBe('live-container')
    expect(body.preview).toBe('origin-html')
    expect(body.publicApp).toBe('https://cepformacion.akademate.com')
    expect(body.dataOrigin).toBe('https://cepformacion.akademate.com')
  })

  it('serves campus inside the public site chrome', async () => {
    const response = await handle('/campus')
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(body).toContain('<header>')
    expect(body).toContain('<footer>')
    expect(body).toContain('Sedes Santa Cruz Norte Cookies')
    expect(body).toContain('data-cep-campus-page="1"')
    expect(body).toContain('Próximamente acceso al nuevo campus')
    expect(body).toContain('Acceso a campus actual')
    expect(body).toContain('https://acaten.espacioaulavirtual.com/')
    expect(body).toContain('type="password"')
    expect(body).toContain('disabled')
    expect(body).toContain('>Ver campus</a>')
    expect(body).toContain('data-cep-campus-nav-lock="1"')
    expect(body).toContain('data-cep-mobile-nav-lock="1"')
    expect(body).toContain('data-cep-bolsa-nav-lock="1"')
    expect(body).toContain('data-cep-chrome-nav-lock="1"')
    expect(body).not.toContain('name="password"')
    expect(body).not.toContain('formulario de contacto')
    expect(body).not.toContain('Volver a la web')
    expect(
      body
        .replaceAll('https://acaten.espacioaulavirtual.com/', '')
        .replaceAll('/transparencia/acaten', ''),
    ).not.toContain('acaten')
    expect(body).toContain('#f2014b')
    expect(body).toContain('G-ZPBEY6SHX9')
    expect(body).toContain("gtag('consent', 'default'")
    expect(body).toContain('href="/contacto" class="top">info@cep.es</a>')
  })

  it('reads public HTML from ORIGIN_API_URL and strips the host noindex', async () => {
    const seen: string[] = []
    installFetch(async (input, init) => {
      const url = String(input instanceof Request ? input.url : input)
      seen.push(url)
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined))
      if (url.includes('/api/public/v1/catalog')) {
        if (headers.get('authorization') !== 'Bearer test-token') return new Response('no', { status: 401 })
        return json(catalog)
      }
      if (url.startsWith('https://origin.cepformacion.com/')) {
        return new Response(brandHome, {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'x-robots-tag': 'noindex, nofollow',
          },
        })
      }
      return new Response(`unmocked ${url}`, { status: 404 })
    })
    const response = await handle('/', undefined, { ORIGIN_API_URL: 'https://origin.cepformacion.com' })
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('x-robots-tag')).toBeNull()
    expect(response.headers.get('x-cep-built-from')).toBe('origin')
    expect(body).not.toMatch(/noindex/i)
    expect(seen.some((url) => url.startsWith('https://origin.cepformacion.com/'))).toBe(true)
    expect(seen.some((url) => url.startsWith('https://cepformacion.akademate.com/'))).toBe(false)
  })

  it('serves a first visit from the global edge copy without calling origin', async () => {
    const cachedAt = String(Date.now())
    const csp = "script-src 'nonce-edge-copy'"
    const page = '<!doctype html><html><head><title>Copia</title></head><body><p>borde</p></body></html>'
    const kv = {
      get: async (key: string) => {
        if (key === 'html-news21:/:csp') return csp
        if (key === 'html-news21:/:at') return cachedAt
        return null
      },
      getWithMetadata: async (key: string) => {
        if (key === 'html-news21:/') return { value: page, metadata: { builtFrom: 'origin', cachedAt } }
        return { value: null, metadata: null }
      },
      put: async () => undefined,
    } as WorkerEnv['HTML_EDGE']
    let fetches = 0
    installFetch(async () => {
      fetches += 1
      return new Response('no', { status: 404 })
    })
    const response = await handle('/', undefined, { HTML_EDGE: kv })
    const body = await response.text()
    expect(response.status).toBe(200)
    expect(response.headers.get('x-cep-cache')).toBe('edge')
    expect(response.headers.get('x-robots-tag')).toBeNull()
    expect(response.headers.get('content-security-policy')).toBe(csp)
    expect(body).toContain('borde')
    expect(fetches).toBe(0)
  })

  it('rewrites home Cursos from Hetzner HTML if the catalog API is down', async () => {
    const originDump = `<!doctype html><html><head><title>CEP</title></head><body>
<header><a href="/p/contacto" class="top">info@cep.es</a><a href="/p/contacto" class="brand-btn">Contacto</a></header>
<section id="nuevas-formaciones"><h2>Nuevas formaciones</h2><img src="/foto.jpg" alt="dump"><input placeholder="Buscar en cursos"></section>
<section class="bg-[#fff7fa]"><h2>Cursos</h2>
<p>Consulta de un vistazo todos los cursos que imparte CEP Formación, agrupados por tipo de formación.</p>
<a href="/p/cursos/adiestramiento-canino-i-priv"><span>Cursos privados</span><h3>Adiestramiento Canino I</h3><span>Matrícula abierta</span></a>
</section>
<section>
<h2>Ciclos formativos oficiales</h2>
<p>Texto previo no centrado.</p>
<div class="mt-10 grid gap-8 lg:grid-cols-2">
<a href="/ciclos/cfgm-farmacia-parafarmacia"><h3>Farmacia y Parafarmacia</h3><p>Grado medio</p></a>
</div>
</section>
</body></html>`
    installFetch(async (input) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.includes('/api/public/v1/catalog')) return new Response('down', { status: 503 })
      if (url.startsWith('https://cepformacion-app.akademate.com/')) return html(originDump)
      if (url.startsWith('https://cepformacion.akademate.com/')) return html(originDump)
      return new Response('no', { status: 404 })
    })
    const body = await (await handle('/')).text()
    const visible = body.slice(body.indexOf('<body>'), body.indexOf('data-cep-home-courses-lock'))
    expect(body).toContain('data-cep-home-courses="ovh"')
    expect(body).toContain('Adiestramiento canino I')
    expect(body).toContain('Farmacia y parafarmacia')
    expect(visible).not.toContain('Buscar en cursos')
    expect(visible).not.toContain('<section id="nuevas-formaciones"')
    expect(body).toContain('G-ZPBEY6SHX9')
  })

  it('does not let a stale KV catalog overwrite live Hetzner convocatoria dates', async () => {
    const originLive = `<!doctype html><html><head><title>CEP</title></head><body>
<a class="group flex min-w-0 xl:basis-[calc((100%_-_3rem)/3)]" href="/convocatorias/NOR-2026-009">
  <span>Matrícula abierta</span>
  <h3>Auxiliar Clinico Veterinario</h3>
  <dt>Inicio:</dt><dd>01 oct 2026</dd>
  <dt>Sede:</dt><dd>Sede Norte</dd>
</a>
</body></html>`
    await memoryCache.put(
      new Request('https://cepformacion.com/__cache/catalog'),
      json({
        ...catalog,
        data: {
          ...catalog.data,
          convocatorias: [
            {
              codigo: 'NOR-2026-009',
              status: 'enrollment_closed',
              startDate: '2026-09-10',
              enrollmentDeadline: '2026-09-01',
              course: { nombre: 'Stale ACV' },
            },
          ],
        },
      }),
    )
    installFetch(async (input) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.includes('/api/public/v1/catalog')) return new Response('Route not found', { status: 404 })
      if (url.startsWith('https://cepformacion.akademate.com/')) return html(originLive)
      return new Response('no', { status: 404 })
    })
    const response = await handle('/')
    const body = await response.text()
    const visible = body.slice(0, body.indexOf('data-cep-cards-lock="1"'))
    expect(response.headers.get('x-cep-data-origin')).toBeNull()
    expect(response.headers.get('x-cep-html-origin')).toBeNull()
    expect(visible).toContain('NOR-2026-009')
    expect(visible).toContain('01 oct 2026')
    expect(visible).toContain('Matrícula abierta')
    expect(visible).not.toContain('10 sept')
    expect(body).not.toContain('"NOR-2026-009","status":"enrollment_closed"')
  })

  it('proxies the canonical dashboard host to OVH and rewrites login redirects', async () => {
    const home = await handleDashboard('/')
    expect(home.status).toBe(307)
    expect(home.headers.get('location')).toBe('https://dashboard.cepformacion.com/dashboard')

    const page = await handleDashboard('/dashboard')
    expect(page.status).toBe(200)
    expect(page.headers.get('content-security-policy')).toBeNull()
    expect(await page.text()).toContain('ovh dashboard /dashboard')

    const login = await handleDashboard('/auth/login')
    expect(login.status).toBe(302)
    expect(login.headers.get('location')).toBe('https://dashboard.cepformacion.com/dashboard')
    expect(login.headers.get('set-cookie')).toContain('payload-token=abc')
    expect(login.headers.get('set-cookie')).not.toContain('Domain=')
  })

  it('serves campus.cepformacion.com from the live campus origin without moving the public site', async () => {
    const campus = await handleCampus('/')
    expect(campus.status).toBe(200)
    expect(await campus.text()).toContain('campus login')
    expect(campus.headers.get('location')).toBeNull()

    const home = await handle('/')
    expect(home.status).toBe(200)
    expect(home.headers.get('location')).toBeNull()
  })

  it('still 404s dashboard paths on the public apex', async () => {
    expect((await handle('/dashboard')).status).toBe(404)
  })

  it('serves the second anonymous page from the edge cache', async () => {
    const pending: Promise<unknown>[] = []
    const waiting = {
      waitUntil: (promise: Promise<unknown>) => {
        pending.push(promise)
      },
      passThroughOnException: () => undefined,
    } as ExecutionContext
    let originHits = 0
    const baseFetch = globalThis.fetch
    globalThis.fetch = (async (input, init) => {
      const target = String(input instanceof Request ? input.url : input)
      if (target.startsWith('https://cepformacion.akademate.com/contacto')) originHits += 1
      return baseFetch(input, init)
    }) as typeof fetch
    const first = await worker.fetch(new Request('https://cepformacion.com/contacto'), env(), waiting)
    await Promise.all(pending)
    expect(first.headers.get('x-cep-cache')).toBe('miss')
    expect(first.headers.get('cache-control')).toContain('max-age=60')
    const second = await worker.fetch(new Request('https://cepformacion.com/contacto?utm_source=facebook&utm_medium=paid'), env(), waiting)
    expect(second.headers.get('x-cep-cache')).toBe('hit')
    expect(originHits).toBe(1)
    expect(await second.text()).toContain('formulario de contacto')
  })

  it('answers probe paths at the edge and keeps real pages', async () => {
    let originHits = 0
    const baseFetch = globalThis.fetch
    globalThis.fetch = (async (input, init) => {
      const target = String(input instanceof Request ? input.url : input)
      if (target.startsWith('https://cepformacion.akademate.com/')) originHits += 1
      return baseFetch(input, init)
    }) as typeof fetch
    for (const path of ['/.env', '/.git/HEAD', '/wp-login.php', '/cgi-bin/test', '/server-status', '/actuator/health', '/foo/../.env']) {
      const response = await handle(path)
      expect(response.status).toBe(404)
      expect(await response.text()).toContain('No encontrado')
    }
    expect(originHits).toBe(0)
    expect((await handle('/.well-known/security.txt')).status).toBe(200)
    expect(await (await handle('/logos/cep.png')).text()).toContain('akademate /logos/cep.png')
    expect(await (await handle('/faq')).text()).toContain('akademate /faq')
    installFetch(async () => {
      throw new Error('origin down')
    })
    const down = await handle('/ayuda')
    expect(down.status).toBe(502)
    const downBody = await down.text()
    expect(downBody).toContain('https://cepformacion.com/')
    expect(downBody).not.toContain('cepformacion.akademate.com')
  })

  it('ignores a public cache refresh and honors the operator token', async () => {
    let originHits = 0
    const baseFetch = globalThis.fetch
    globalThis.fetch = (async (input, init) => {
      const target = String(input instanceof Request ? input.url : input)
      if (target.startsWith('https://cepformacion.akademate.com/sedes')) originHits += 1
      return baseFetch(input, init)
    }) as typeof fetch
    const first = await handle('/sedes')
    expect(first.headers.get('x-cep-cache')).toBe('miss')
    const forced = await handle('/sedes', { headers: { 'x-cep-refresh': '1' } })
    expect(forced.headers.get('x-cep-cache')).toBe('hit')
    expect(originHits).toBe(1)
    const allowed = await handle('/sedes', {
      headers: { 'x-cep-refresh': '1', 'x-cep-refresh-token': 'operator-secret' },
    }, { CEP_REFRESH_TOKEN: 'operator-secret' })
    expect(allowed.headers.get('x-cep-cache')).toBe('miss')
    expect(originHits).toBe(2)
  })

  it('drops a filled honeypot without calling the origin or spending the quota', async () => {
    let posts = 0
    installFetch(async (input) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.includes('/api/leads')) {
        posts += 1
        return json({ ok: true }, 201)
      }
      return new Response('no', { status: 404 })
    })
    const dropped = await handle('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c', cep_hp: 'http://spam.example' }),
    })
    expect(dropped.status).toBe(200)
    expect(dropped.headers.get('x-cep-lead')).toBe('drop')
    expect(posts).toBe(0)
    const real = await handle('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.c', cep_hp: '' }),
    })
    expect(real.status).toBe(201)
    expect(posts).toBe(1)
  })

  it('keeps dashboard chunks that live inside the Next flight', () => {
    const flight = '<script>self.__next_f.push("global-error-abc")</script><script src="/_next/static/chunks/app/global-error-abc.js"></script>'
    const kept = sealPublicHtml(flight)
    expect(kept.html).toContain('global-error-abc.js')
    expect(kept.csp).toContain("style-src 'self' 'unsafe-inline'")
    const loose = sealPublicHtml('<script src="/_next/static/chunks/app/global-error-abc.js"></script><script>keep()</script><p>Hola</p>')
    expect(loose.html).not.toContain('global-error-abc.js')
    expect(loose.html).toContain('keep()')
    expect(loose.html).toContain('Hola')
    const nonce = loose.csp.match(/'nonce-([^']+)'/)?.[1]
    expect(loose.html).toContain(`nonce="${nonce}"`)
  })

  it('limits lead posts and narrows the preflight', async () => {
    const store = new Map<string, string>()
    const kv = {
      get: async (key: string) => store.get(key) ?? null,
      put: async (key: string, value: string) => {
        store.set(key, value)
      },
    } as WorkerEnv['CEP_CACHE']
    let posts = 0
    installFetch(async (input) => {
      const url = String(input instanceof Request ? input.url : input)
      if (url.includes('/api/leads')) {
        posts += 1
        return json({ ok: true }, 201)
      }
      return new Response('no', { status: 404 })
    })
    const post = () => handle('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: 'a@b.c' }),
    }, { CEP_CACHE: kv })
    for (let i = 0; i < 20; i += 1) expect((await post()).status).toBe(201)
    const blocked = await post()
    expect(blocked.status).toBe(429)
    expect(await blocked.json()).toEqual({ error: 'Demasiados envíos. Espera unos minutos e inténtalo de nuevo.' })
    expect(posts).toBe(20)
    const preflight = await handle('/api/leads', {
      method: 'OPTIONS',
      headers: { origin: 'https://evil.example', 'access-control-request-method': 'POST' },
    })
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
    expect(preflight.headers.get('access-control-allow-origin')).toBeNull()
    expect(preflight.headers.get('access-control-allow-credentials')).toBeNull()
    expect(posts).toBe(20)
  })

  it('answers discovery files without calling the origin', async () => {
    const robots = await handle('/robots.txt')
    expect(await robots.text()).toContain('Disallow: /api')
    const security = await handle('/.well-known/security.txt')
    expect(security.status).toBe(200)
    expect(await security.text()).toContain('mailto:privacidad@cursostenerife.es')
    expect((await handle('/agents.txt')).status).toBe(404)
    expect((await handle('/ads.txt')).status).toBe(404)
  })
})
