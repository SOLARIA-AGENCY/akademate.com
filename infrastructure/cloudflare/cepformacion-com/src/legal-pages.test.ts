import { describe, expect, it } from 'vitest'
import { isTransparencyHub, isTransparencyPortalPath, legalPageId, rewriteLegalPages, rewriteTransparencyAssets } from './legal-pages'

const shell = `<!doctype html><html><body>
<header>CEP</header>
<main class="flex-1"><section class="rounded-2xl border border-amber-200 bg-amber-50"><h2>Inventario verificable</h2><p>SOLARIA AGENCY OÜ. Esta política no afirma que todos los proveedores configurables estén activos.</p></section></main>
<script src="/_next/static/chunks/app/(public)/p/legal/privacidad/page.js"></script>
<script>self.__next_f.push(1)</script>
<footer>Información regulatoria; no constituye certificación.</footer>
</body></html>`

describe('legal pages', () => {
  it('recognizes public and internal legal paths', () => {
    expect(legalPageId('/legal')).toBe('index')
    expect(legalPageId('/legal/privacidad')).toBe('privacidad')
    expect(legalPageId('/p/legal/cookies/')).toBe('cookies')
    expect(legalPageId('/legal/transparencia')).toBe('transparencia')
    expect(legalPageId('/legal/accesibilidad')).toBe('accesibilidad')
    expect(legalPageId('/legal/portal')).toBeNull()
    expect(isTransparencyHub('/transparencia')).toBe(true)
    expect(isTransparencyPortalPath('/transparencia/aproem')).toBe(true)
    expect(isTransparencyPortalPath('/legal/transparencia')).toBe(false)
    expect(legalPageId('/cursos')).toBeNull()
  })

  it('replaces the legal main with continuous text and drops Solaria and warning boxes', () => {
    const html = rewriteLegalPages(shell, '/legal/cookies')
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
    expect(main).toContain('Política de cookies')
    expect(main).toContain('Google Analytics 4')
    expect(main).toContain('Píxel de Meta')
    expect(main).not.toContain('Inventario verificable')
    expect(main).not.toContain('amber-')
    expect(main).not.toContain('SOLARIA')
    expect(main).not.toContain('proveedores configurables')
    expect(html).not.toContain('no constituye certificación')
    expect(html).toContain('data-cep-legal-lock="1"')
    expect(html).not.toContain('/_next/static/chunks/')
    expect(html).not.toContain('__next_f')
    expect(main).toContain('cep_cookie_consent_v1')
    expect(main).toContain('_fbp')
    expect(main).toContain('G-ZPBEY6SHX9')
  })

  it('leaves the designed transparency portal and its scripts in place', () => {
    const html = rewriteLegalPages(shell, '/transparencia')
    expect(html).toContain('/_next/static/chunks/')
    expect(html).toContain('__next_f')
    expect(html).not.toContain('data-cep-legal-lock')
    const withAssets = rewriteTransparencyAssets(html, 'https://cepformacion-app.akademate.com')
    expect(withAssets).toContain('https://cepformacion-app.akademate.com/_next/static/chunks/')
    expect(rewriteLegalPages(shell, '/transparencia/aproem')).toContain('__next_f')
  })

  it('names Brevo, the 14-day withdrawal and unpublished subsidy documents', () => {
    const privacy = rewriteLegalPages(shell, '/legal/privacidad')
    const terms = rewriteLegalPages(shell, '/legal/terminos')
    const providers = rewriteLegalPages(shell, '/legal/subencargados')
    const transparency = rewriteLegalPages(shell, '/legal/transparencia')
    const access = rewriteLegalPages(shell, '/legal/accesibilidad')
    expect(privacy).toContain('artículo 7 de la Ley Orgánica 3/2018')
    expect(privacy).toContain('APROEM, que gestiona esa subvención')
    expect(terms).toContain('14 días naturales')
    expect(terms).toContain('tomo 3660')
    expect(providers).toContain('Brevo (Sendinblue)')
    expect(transparency).toContain('mailto:info@cursostenerife.es')
    expect(transparency).toContain('no se publican en esta web')
    expect(transparency).not.toContain('cep-redacted')
    expect(transparency).not.toContain('no constan todavía')
    expect(access).toContain('parcialmente conforme')
    expect(access).toContain('WCAG 2.2')
    expect(access).toContain('EFQM 500')
    expect(access).toContain('ISO 18000')
    expect(access).not.toContain('No es un sello') 
    expect(`${privacy}${terms}${providers}${transparency}${access}`).not.toMatch(/SOLARIA|Solaria/)
  })

  it('renders transparency when the origin page has no main', () => {
    const html = rewriteLegalPages('<html><body><h1>404</h1></body></html>', '/legal/transparencia')
    expect(html).toContain('data-cep-legal-rendered="transparencia"')
    expect(html).toContain('mailto:info@cursostenerife.es')
  })

  it('removes the Next.js 404 screen from a legal page', () => {
    const shell = `<html><head><meta name="robots" content="noindex"/><title>404: This page could not be found.</title></head><body><div style="font-family:system-ui;height:100vh;text-align:center;display:flex"><div><h1 class="next-error-h1">404</h1><div><h2>This page could not be found.</h2></div></div></div></body></html>`
    const html = rewriteLegalPages(shell, '/legal/transparencia')
    expect(html).not.toContain('next-error-h1')
    expect(html).not.toContain('This page could not be found')
    expect(html).not.toContain('noindex')
    expect(html).toContain('Transparencia de la formación subvencionada | CEP Formación')
    expect(html).toContain('mailto:info@cursostenerife.es')
  })

  it('does not duplicate the lock', () => {
    const once = rewriteLegalPages(shell, '/legal/privacidad')
    const twice = rewriteLegalPages(once, '/legal/privacidad')
    expect(twice.match(/data-cep-legal-lock="1"/g)?.length).toBe(1)
    expect(twice).toContain('B70729272')
    expect(twice).toContain('ACATEN 2020 S.L.')
    expect(twice).not.toMatch(/SOLARIA|Solaria/)
  })
})
