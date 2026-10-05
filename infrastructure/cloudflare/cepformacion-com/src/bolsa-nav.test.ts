import { describe, expect, it } from 'vitest'
import { rewriteBolsaNav } from './bolsa-nav'

const liveNav = `<nav class="hidden lg:flex items-center gap-3"><a href="/aproem" class="text-sm font-medium text-gray-600 brand-hover transition-colors">APROEM</a><div class="group relative"><a href="/colabora" class="inline-flex items-center gap-1 text-sm font-medium text-gray-600 brand-hover transition-colors">Colabora</a><div class="invisible absolute right-0 top-full z-50"><a href="/empleo" class="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">Bolsa de empleo</a></div></div><a href="/blog" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Blog</a><a href="/campus" class="text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors">Campus</a></nav>`

describe('rewriteBolsaNav', () => {
  it('keeps Bolsa out of the top nav', () => {
    const html = rewriteBolsaNav(`<body>${liveNav}</body>`)
    const visible = html.slice(0, html.indexOf('data-cep-bolsa-nav-lock="1"'))
    expect(visible).not.toContain(
      'class="text-sm font-medium text-gray-600 brand-hover transition-colors">Bolsa de trabajo</a>',
    )
    expect(visible).toContain('href="/empleo" class="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700">Bolsa de trabajo</a>')
    expect(visible).not.toContain('Bolsa de empleo')
    expect(html).toContain('link.remove()')
    expect(html).toContain('data-cep-bolsa-nav-lock="1"')
    expect(html).not.toContain('innerHTML')
  })

  it('does not duplicate the top-level item when origin already has it', () => {
    const already = liveNav.replace(
      '<a href="/blog" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Blog</a>',
      '<a href="/empleo" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Bolsa de trabajo</a><a href="/blog" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Blog</a>',
    )
    const html = rewriteBolsaNav(`<body>${already}</body>`)
    expect(html).not.toContain('class="text-sm font-medium text-gray-600 brand-hover transition-colors">Bolsa de trabajo</a>')
  })

  it('is idempotent', () => {
    const once = rewriteBolsaNav(`<body>${liveNav}</body>`)
    expect(rewriteBolsaNav(once)).toBe(once)
  })
})
