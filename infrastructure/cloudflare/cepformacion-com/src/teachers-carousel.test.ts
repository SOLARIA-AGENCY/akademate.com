import { describe, expect, it } from 'vitest'
import { parseTeachers, rewriteTeachersCarousel } from './teachers-carousel'

const liveSection = `<section class="bg-white"><div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><h2 class="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Equipo docente</h2><p class="mt-3 max-w-3xl text-lg leading-8 text-slate-600">Conoce a nuestro equipo docente y su experiencia profesional por áreas.</p><div class="teacher-carousel-track"><div class="teacher-carousel-loop">
<article class="w-[220px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div class="flex justify-center bg-slate-50 p-5"><img src="https://cepformacion.com/api/media/file/abraham-portocarrero.webp" alt="Abraham Portocarrero" class="h-32 w-32 rounded-full object-cover ring-4 ring-white"/></div><div class="p-4"><span class="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold">Docente</span><h3 class="mt-4 min-h-[2.75rem] text-sm font-black">Abraham Portocarrero</h3><p class="mt-3 text-[11px] font-black text-slate-400">Imparte</p><p class="mt-1 text-sm font-semibold">Quiromasaje Holístico</p></div></article>
<article class="w-[220px]"><img src="https://cepformacion.com/api/media/file/17-1783516354592.webp" alt="Angie Rodríguez Pérez"/><span>Docente</span><h3>Angie Rodríguez Pérez</h3><p>Imparte</p><p>Docente</p></article>
<article class="w-[220px]"><img src="https://cepformacion.com/api/media/file/pilates.webp" alt="Cristina Suárez"/><span>Docente</span><h3>Cristina Suárez</h3><p>Imparte</p><p>Instructor o Instructora de Pilates</p></article>
<article class="w-[220px]"><img src="https://cepformacion.com/api/media/file/epifanio.webp" alt="Epifanio"/><span>Docente</span><h3>Epifanio Jesús Hernández Delgado</h3><p>Imparte</p><p>Auxiliar de Enfermeria</p></article>
</div></div></section><section class="bg-slate-950">reviews</section>`

describe('rewriteTeachersCarousel', () => {
  it('parses unique teachers and drops placeholder courses', () => {
    const teachers = parseTeachers(`<body>${liveSection}</body>`)
    expect(teachers).toEqual([
      {
        name: 'Abraham Portocarrero',
        image: 'https://cepformacion.com/api/media/file/abraham-portocarrero.webp',
        course: 'Quiromasaje Holístico',
      },
      {
        name: 'Angie Rodríguez Pérez',
        image: 'https://cepformacion.com/api/media/file/17-1783516354592.webp',
        course: null,
      },
      {
        name: 'Cristina Suárez',
        image: 'https://cepformacion.com/api/media/file/pilates.webp',
        course: 'Pilates',
      },
      {
        name: 'Epifanio Jesús Hernández Delgado',
        image: 'https://cepformacion.com/api/media/file/epifanio.webp',
        course: 'Auxiliar de Enfermería',
      },
    ])
  })

  it('replaces the SaaS cards with red-ring portraits, Docente, area and an infinite loop', () => {
    const html = rewriteTeachersCarousel(`<!doctype html><html><body>${liveSection}</body></html>`)
    const visible = html.slice(0, html.indexOf('data-cep-teachers-lock="1"'))
    expect(visible).toContain('data-cep-teachers="1"')
    expect(visible).toContain('cep-teachers-loop')
    expect(visible).toContain('cep-teacher-marquee')
    expect(visible).not.toContain('animation-play-state:paused')
    expect(visible).toContain('data-cep-teacher-ring="1"')
    expect(visible).toContain('background:#f2014b')
    expect(visible).toContain('Abraham Portocarrero')
    expect(visible).toContain('Quiromasaje Holístico')
    expect(visible).toContain('Angie Rodríguez Pérez')
    expect(visible).toContain('border-radius:50%')
    expect(visible).toContain('white-space:nowrap')
    expect(visible).toContain('text-align:center')
    expect(visible).toContain('reviews')
    expect(visible.match(/class="cep-teachers-card"/g)?.length).toBe(8)
    expect(visible.match(/class="cep-teachers-role">Docente<\/p>/g)?.length).toBe(8)
    expect(visible).toContain('>Pilates</p>')
    expect(visible).toContain('Auxiliar de Enfermería')
    expect(visible).not.toContain('Instructor o Instructora')
    expect(visible.match(/<h3 title="Abraham Portocarrero">Abraham Portocarrero<\/h3>/g)?.length).toBe(2)
    expect(visible).not.toContain('Imparte')
    expect(visible).not.toContain('hover:-translate-y-1')
    expect(visible).not.toContain('aspect-ratio:3/4')
    expect(visible).not.toContain('teacher-carousel-track')
    expect(visible).not.toContain('experiencia profesional por áreas')
    expect(html).toContain('data-cep-teachers-lock="1"')
    expect(html).not.toContain('innerHTML')
  })

  it('breaks the marquee out to full bleed with left and right paper fades', () => {
    const html = rewriteTeachersCarousel(`<!doctype html><html><body>${liveSection}</body></html>`)
    const visible = html.slice(0, html.indexOf('data-cep-teachers-lock="1"'))
    expect(visible).toContain('data-cep-teachers-bleed="1"')
    expect(visible).toContain('cep-teachers-fade-left')
    expect(visible).toContain('cep-teachers-fade-right')
    expect(visible).toContain('pointer-events:none')
    expect(visible).toContain('linear-gradient(90deg,#fff 0%,rgba(255,255,255,0) 100%)')
    expect(visible).toContain('linear-gradient(270deg,#fff 0%,rgba(255,255,255,0) 100%)')
    expect(visible).toContain('.cep-teachers-bleed{position:relative;width:100%')
    expect(visible).toContain('overflow-x:hidden')
    expect(visible).toContain('.cep-teachers-copy{max-width:72rem')
    expect(visible).toContain('[data-cep-teachers="1"] .cep-teachers-fade{width:3.5rem}')
    expect(visible).toMatch(/cep-teachers-copy[\s\S]*<h2>Equipo docente<\/h2>\s*<\/div>\s*<div class="cep-teachers-bleed"/)
    expect(visible).toContain('data-cep-teacher-ring="1"')
    expect(visible).toContain('cep-teachers-loop')
    expect(visible).toContain('cep-teacher-marquee')
    expect(visible).not.toContain('animation-play-state:paused')
    expect(visible).toContain('translateX(-50%)')
    expect(visible.match(/class="cep-teachers-card"/g)?.length).toBe(8)
  })

  it('upgrades a previous Worker carousel that was trapped in the copy column', () => {
    const old = `<!doctype html><html><head></head><body>
<style data-cep-teachers-css="1">[data-cep-teachers="1"] .cep-teachers-copy{max-width:72rem}</style>
<section data-cep-teachers="1" aria-label="Equipo docente">
  <div class="cep-teachers-copy">
    <h2>Equipo docente</h2>
    <div class="cep-teachers-mask"><div class="cep-teachers-loop">
      <article class="cep-teachers-card"><span class="cep-teachers-ring" data-cep-teacher-ring="1"><img src="https://cepformacion.com/api/media/file/abraham-portocarrero.webp" alt="Abraham Portocarrero"></span><h3>Abraham Portocarrero</h3><p class="cep-teachers-role">Docente</p><p class="cep-teachers-area">Quiromasaje Holístico</p></article>
    </div></div>
  </div>
</section>
<script data-cep-teachers-lock="1">window.__cepTeachersLock=1</script>
</body></html>`
    const html = rewriteTeachersCarousel(old)
    const visible = html.slice(0, html.indexOf('data-cep-teachers-lock="1"'))
    expect(visible).toContain('data-cep-teachers-bleed="1"')
    expect(visible).toContain('cep-teachers-fade-left')
    expect(visible).toContain('cep-teachers-fade-right')
    expect(visible).toContain('cep-teachers-loop')
    expect(visible).toContain('data-cep-teacher-ring="1"')
    expect(visible).toMatch(/cep-teachers-copy[\s\S]*<h2>Equipo docente<\/h2>\s*<\/div>\s*<div class="cep-teachers-bleed"/)
    expect(html).toContain('data-cep-teachers-lock="1"')
    expect(html.match(/<script data-cep-teachers-lock="1">/g)?.length).toBe(1)
    expect(html.match(/<style data-cep-teachers-css="1">/g)?.length).toBe(1)
  })

  it('is idempotent', () => {
    const once = rewriteTeachersCarousel(`<!doctype html><html><body>${liveSection}</body></html>`)
    expect(rewriteTeachersCarousel(once)).toBe(once)
  })

  it('leaves a teacher section without photos unchanged', () => {
    const ovh = `<section><h2>Equipo docente</h2><article class="space-y-1 p-4 text-center"><h3>Abraham Portocarrero</h3><p>Docente</p><p>Imparte</p></article></section>`
    expect(rewriteTeachersCarousel(ovh)).toBe(ovh)
  })
})
