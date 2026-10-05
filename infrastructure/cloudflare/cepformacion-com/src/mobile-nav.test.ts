import { describe, expect, it } from 'vitest'
import { rewriteMobileNav } from './mobile-nav'

describe('rewriteMobileNav', () => {
  it('injects a scrollable accordion lock without innerHTML', () => {
    const html = rewriteMobileNav('<body><button aria-label="Abrir menú">menu</button></body>')
    expect(html).toContain('data-cep-mobile-nav-lock="1"')
    expect(html).toContain('overflow-y:auto')
    expect(html).toContain('-webkit-overflow-scrolling:touch')
    expect(html).toContain('cep-mobile-nav')
    expect(html).toContain("label === 'APROEM'")
    expect(html).toContain("label === 'Nuevas formaciones'")
    expect(html).toContain('aria-expanded')
    expect(html).toContain('public-mobile-menu')
    expect(html).toContain("href: '/transparencia'")
    expect(html).not.toContain('innerHTML')
    expect(html).toContain('stopImmediatePropagation')
    expect(html.indexOf('data-cep-mobile-nav-lock="1"')).toBeGreaterThan(html.indexOf('<body>'))
  })

  it('does not duplicate the lock script', () => {
    const once = rewriteMobileNav('<body></body>')
    const twice = rewriteMobileNav(once)
    expect(twice.match(/data-cep-mobile-nav-lock="1"/g)?.length).toBe(1)
  })
})
