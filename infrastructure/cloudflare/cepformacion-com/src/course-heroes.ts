import { installAproemPhotoHero } from './aproem-a11y'

const HERO_SWAPS: Array<[string, string]> = [
  ['/website/cep/courses/fallback-privados.png', '/website/cep/hero/cursos-privados-v2.jpg'],
  ['/website/cep/courses/fallback-desempleados.png', '/website/cep/hero/cursos-desempleados-v2.jpg'],
  ['/website/cep/courses/fallback-ocupados.png', '/website/cep/hero/cursos-ocupados-v2.jpg'],
  ['/website/cep/courses/fallback-teleformacion.png', '/website/cep/hero/cursos-teleformacion-v2.jpg'],
  ['/website/akademate/fallback-privados.png', '/website/cep/hero/cursos-privados-v2.jpg'],
  ['/website/akademate/fallback-desempleados.png', '/website/cep/hero/cursos-desempleados-v2.jpg'],
  ['/website/akademate/fallback-ocupados.png', '/website/cep/hero/cursos-ocupados-v2.jpg'],
  ['/website/akademate/fallback-teleformacion.png', '/website/cep/hero/cursos-teleformacion-v2.jpg'],
]

const PAGE_HERO_SWAPS: Array<[string, string]> = [
  ['/website/akademate/hero-campus.svg', '/website/cep/hero/sedes-tenerife-hero-v2.png'],
]

const BLOG_HERO = '/website/cep/hero/blog-formacion-hero-v2.png'
const CICLOS_HERO = '/website/cep/hero/ciclos-formativos-hero-v2.png'
const CONV_HERO = '/website/cep/hero/convocatorias-hero-v3.png'
const SEDES_HERO = '/website/cep/hero/sedes-tenerife-hero-v2.png'

const MENU_HEROES: Record<string, string> = {
  '/colabora': '/website/cep/hero/colabora-hero-v1.png',
  '/p/colabora': '/website/cep/hero/colabora-hero-v1.png',
  '/empleo': '/website/cep/hero/empleo-hero-v1.png',
  '/p/empleo': '/website/cep/hero/empleo-hero-v1.png',
  '/agencia-colocacion': '/website/cep/hero/empleo-hero-v1.png',
  '/p/agencia-colocacion': '/website/cep/hero/empleo-hero-v1.png',
  '/faq': '/website/cep/hero/faq-hero-v1.png',
  '/p/faq': '/website/cep/hero/faq-hero-v1.png',
  '/quienes-somos': '/website/cep/hero/quienes-somos-hero-v1.png',
  '/p/quienes-somos': '/website/cep/hero/quienes-somos-hero-v1.png',
  '/noticias': '/website/cep/hero/noticias-hero-v1.png',
  '/p/noticias': '/website/cep/hero/noticias-hero-v1.png',
  '/contacto': '/website/cep/hero/contacto-hero-v1.png',
  '/p/contacto': '/website/cep/hero/contacto-hero-v1.png',
  '/aproem': '/website/cep/hero/aproem-hero-v2.png',
  '/p/aproem': '/website/cep/hero/aproem-hero-v2.png',
}

const HERO_PATHS = new Set([
  ...HERO_SWAPS.map(([, next]) => next),
  BLOG_HERO,
  CICLOS_HERO,
  CONV_HERO,
  SEDES_HERO,
  ...Object.values(MENU_HEROES),
])

function swapSharedHero(html: string, file: string): string {
  const sources = [
    '/website/akademate/hero-formacion.svg',
    '/website/akademate/hero-campus.svg',
    '/media/cep-formacion-tenerife-hero.webp',
  ]
  let next = html
  for (const from of sources) {
    next = next.split(from).join(file)
    next = next.split(from.replaceAll('/', '\\/')).join(file.replaceAll('/', '\\/'))
  }
  return next
}

export function isCourseHeroAssetPath(pathname: string): boolean {
  return HERO_PATHS.has(pathname)
}

const HERO_COPY = 'Programas orientados a empleabilidad real y formación aplicada en Canarias.'

const STUDY_TITLES: Array<{ eyebrow: string; title: string }> = [
  { eyebrow: 'Privados', title: 'Cursos privados' },
  { eyebrow: 'Ocupados', title: 'Cursos para trabajadores/as ocupados/as' },
  { eyebrow: 'Trabajadores/as ocupados/as', title: 'Cursos para trabajadores/as ocupados/as' },
  { eyebrow: 'Desempleados', title: 'Cursos para trabajadores/as desempleados/as' },
  { eyebrow: 'Trabajadores/as desempleados/as', title: 'Cursos para trabajadores/as desempleados/as' },
  { eyebrow: 'Teleformación', title: 'Cursos teleformación' },
]

/** Put the study-type name in the live course-section h1. */
export function rewriteStudyHeroCopy(html: string): string {
  let next = html
  for (const { eyebrow, title } of STUDY_TITLES) {
    const live =
      `<p class="text-meta font-semibold text-white/70">${eyebrow}</p><h1 class="mt-3 max-w-full text-balance break-words text-2xl font-semibold leading-snug tracking-tight text-white @min-[640px]:text-3xl @min-[1024px]:text-4xl">Cursos</h1>`
    const liveNext =
      `<p class="text-meta font-semibold text-white/70">${eyebrow}</p><h1 class="mt-3 max-w-full text-balance break-words text-2xl font-semibold leading-snug tracking-tight text-white @min-[640px]:text-3xl @min-[1024px]:text-4xl">${title}</h1>`
    if (next.includes(live)) next = next.split(live).join(liveNext)

    const oldLabel = `<p class="text-sm font-black text-rose-200">${eyebrow}</p>`
    if (next.includes(oldLabel)) next = next.split(oldLabel).join('')
    next = next.split(
      `[\\"$\\",\\"p\\",null,{\\"className\\":\\"text-sm font-black text-rose-200\\",\\"children\\":\\"${eyebrow}\\"}],`,
    ).join('')

    const prefixed = `${eyebrow}. ${HERO_COPY}`
    if (next.includes(prefixed)) {
      const heroOpen = 'tracking-tight text-white sm:text-6xl">'
      const heroClose = `</h1><p class="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">${prefixed}`
      next = next.split(`${heroOpen}Cursos${heroClose}`).join(
        `${heroOpen}${title}</h1><p class="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">${HERO_COPY}`,
      )
      const flight = `\\"children\\":\\"Cursos\\"}],[\\"$\\",\\"p\\",null,{\\"className\\":\\"mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl\\",\\"children\\":\\"${prefixed}\\"`
      const flightNext = `\\"children\\":\\"${title}\\"}],[\\"$\\",\\"p\\",null,{\\"className\\":\\"mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl\\",\\"children\\":\\"${HERO_COPY}\\"`
      next = next.split(flight).join(flightNext)
      next = next.split(prefixed).join(HERO_COPY)
    }
  }
  return injectStudyTitleLock(next)
}

function injectStudyTitleLock(html: string): string {
  if (html.includes('data-cep-study-hero-lock="1"')) return html
  if (!html.includes('text-meta font-semibold text-white/70')) return html
  const map = JSON.stringify(
    Object.fromEntries(STUDY_TITLES.map((item) => [item.eyebrow, item.title])),
  )
  const script = `<script data-cep-study-hero-lock="1">
(function () {
  if (window.__cepStudyHeroLock) return;
  window.__cepStudyHeroLock = 1;
  var TITLES = ${map};
  function apply() {
    document.querySelectorAll('p.text-meta.font-semibold.text-white\\\\/70, p.text-meta').forEach(function (eyebrow) {
      var label = (eyebrow.textContent || '').replace(/\\s+/g, ' ').trim();
      var title = TITLES[label];
      if (!title) return;
      var h1 = eyebrow.nextElementSibling;
      if (!h1 || h1.tagName !== 'H1') return;
      if ((h1.textContent || '').replace(/\\s+/g, ' ').trim() === title) return;
      h1.textContent = title;
    });
  }
  function start() {
    apply();
    var obs = new MutationObserver(function () { apply(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [400, 1200, 3000].forEach(function (ms) { setTimeout(apply, ms); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  return html + script
}

function rewritePageHeroes(html: string, pathname = ''): string {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  let next = html
  if (path === '/aproem' || path === '/p/aproem') next = installAproemPhotoHero(next)
  const menuHero = MENU_HEROES[path]
  if (menuHero) {
    next = swapSharedHero(next, menuHero)
  } else if (path === '/blog' || path === '/p/blog') {
    next = next.split('/website/akademate/hero-formacion.svg').join(BLOG_HERO)
    next = next.split('\\/website\\/akademate\\/hero-formacion.svg').join(BLOG_HERO.replace(/\//g, '\\/'))
  } else if (path === '/sedes' || path === '/p/sedes') {
    next = next.split('/website/akademate/hero-campus.svg').join(SEDES_HERO)
    next = next.split('\\/website\\/akademate\\/hero-campus.svg').join(SEDES_HERO.replace(/\//g, '\\/'))
  } else if (path === '/convocatorias' || path === '/p/convocatorias') {
    next = next.split('/website/akademate/hero-formacion.svg').join(CONV_HERO)
    next = next.split('\\/website\\/akademate\\/hero-formacion.svg').join(CONV_HERO.replace(/\//g, '\\/'))
  } else if (path === '/ciclos' || path === '/p/ciclos') {
    next = next.split('/website/akademate/hero-formacion.svg').join(CICLOS_HERO)
    next = next.split('\\/website\\/akademate\\/hero-formacion.svg').join(CICLOS_HERO.replace(/\//g, '\\/'))
  } else {
    for (const [from, to] of PAGE_HERO_SWAPS) {
      if (next.includes(from)) next = next.split(from).join(to)
      const escapedFrom = from.replace(/\//g, '\\/')
      const escapedTo = to.replace(/\//g, '\\/')
      if (next.includes(escapedFrom)) next = next.split(escapedFrom).join(escapedTo)
    }
  }
  return next
}

const HERO_PHOTO_CSS = `<style data-cep-hero-photo="1">
body:not(.payload-admin) section.relative.isolate>img.object-cover{object-position:center center!important}
body:not(.payload-admin) section.relative.isolate [class*="from-slate-950/95"]{background-image:linear-gradient(to right,rgb(2 6 23/.42),rgb(2 6 23/.12) 42%,transparent 72%)!important}
body:not(.payload-admin) section.relative.isolate [class*="from-slate-950/55"]{background-image:linear-gradient(to top,rgb(2 6 23/.18),transparent 42%)!important}
body:not(.payload-admin) section.relative.isolate h1,body:not(.payload-admin) section.relative.isolate .max-w-3xl>p{text-shadow:0 1px 14px rgb(2 6 23/.72)}
</style>`

/** Point each course-section and listing hero at the photographic file the worker serves. */
export function rewriteCourseHeroes(html: string, pathname = ''): string {
  let next = rewriteStudyHeroCopy(html)
  next = rewritePageHeroes(next, pathname)
  for (const [from, to] of HERO_SWAPS) {
    if (next.includes(from)) next = next.split(from).join(to)
    const escapedFrom = from.replace(/\//g, '\\/')
    const escapedTo = to.replace(/\//g, '\\/')
    if (next.includes(escapedFrom)) next = next.split(escapedFrom).join(escapedTo)
  }
  if (!next.includes('data-cep-hero-photo="1"') && next.includes('from-slate-950/95')) {
    next = next.includes('</head>') ? next.replace('</head>', `${HERO_PHOTO_CSS}</head>`) : HERO_PHOTO_CSS + next
  }
  return next
}
