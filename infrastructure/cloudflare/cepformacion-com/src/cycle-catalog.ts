import { isHiddenPublicCycle } from './hidden-cycles'
import { displayCourseTitle } from './home-courses'
import { enrollmentByCycleSlug, enrollmentLabel, type PublicEnrollment } from './enrollment-state'
import type { CatalogSnapshot } from './render'

export type CycleTitleRow = {
  slug: string
  name: string
  href: string
  area: string
  enrollment: PublicEnrollment | 'none'
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    if (character === '&') return '&amp;'
    if (character === '<') return '&lt;'
    if (character === '>') return '&gt;'
    if (character === '"') return '&quot;'
    return '&#39;'
  })
}

export function cycleAreaLabel(level?: string | null): string {
  const key = String(level || '')
    .trim()
    .toLowerCase()
  if (key.includes('superior')) return 'Grado superior'
  if (key.includes('medio')) return 'Grado medio'
  return 'Ciclo formativo'
}

export function publicCycleRows(snapshot: CatalogSnapshot | null | undefined): CycleTitleRow[] {
  const enrollment = enrollmentByCycleSlug(snapshot)
  const rows: CycleTitleRow[] = []
  for (const cycle of snapshot?.data.cycles || []) {
    if (!cycle.slug || !cycle.name || isHiddenPublicCycle(cycle.slug, cycle.name)) continue
    rows.push({
      slug: cycle.slug,
      name: displayCourseTitle(cycle.name),
      href: `/p/ciclos/${cycle.slug}`,
      area: cycleAreaLabel(cycle.level),
      enrollment: enrollment[cycle.slug] || 'none',
    })
  }
  return rows.sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

const TITLE_TABLE_CSS = `[data-cep-cycle-table]{width:100%;border-collapse:separate;border-spacing:0;margin-top:8px}
[data-cep-cycle-table] th,[data-cep-cycle-table] td{padding:14px 16px;text-align:left;border-bottom:1px solid #e5e7eb;vertical-align:middle}
[data-cep-cycle-table] th{font-size:13px;font-weight:650;color:#0f172a;background:#fff}
[data-cep-cycle-table] td{font-size:15px;color:#0f172a}
[data-cep-cycle-table] tbody tr[data-cep-open="1"]{background:#ecfdf5}
[data-cep-sort]{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;padding:0;font:inherit;color:inherit;cursor:pointer}
[data-cep-sort] span{font-size:12px;color:#64748b}
[data-cep-chip="open"]{display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;background:#16a34a;color:#fff}
[data-cep-chip="closed"]{display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:600;background:#64748b;color:#fff}
[data-cep-home-cycles]{display:grid;gap:2rem}
@media (min-width:1024px){[data-cep-home-cycles]{grid-template-columns:repeat(2,minmax(0,1fr))}}
[data-cep-home-cycle-card]{display:flex;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;border-radius:1.5rem;background:#fff;color:inherit;text-decoration:none}
[data-cep-home-cycle-card] h3{margin:0;font-size:1.5rem;line-height:1.25;font-weight:650;color:#0f172a}
[data-cep-home-cycle-card] p{margin:12px 0 0;font-size:14px;line-height:1.6;color:#475569}
[data-cep-home-cycle-card] [data-cep-btn]{margin-top:auto;align-self:flex-start;display:inline-flex;align-items:center;height:2.75rem;padding:0 1.25rem;border-radius:999px;background:#f2014b;color:#fff;font-size:14px;font-weight:650}
`

function enrollmentChip(state: CycleTitleRow['enrollment']): string {
  if (state === 'open') return '<span data-cep-chip="open">Matrícula abierta</span>'
  if (state === 'closed') return '<span data-cep-chip="closed">Matrícula cerrada</span>'
  return '<span class="text-slate-500">Próximamente</span>'
}

function sortValue(row: CycleTitleRow, column: 'name' | 'area' | 'enrollment'): string {
  if (column === 'area') return row.area
  if (column === 'enrollment') return row.enrollment === 'open' ? '0' : row.enrollment === 'closed' ? '1' : '2'
  return row.name
}

export function renderCycleTable(rows: CycleTitleRow[]): string {
  const body = rows
    .map(
      (row) => `<tr data-cep-open="${row.enrollment === 'open' ? '1' : '0'}" data-name="${escapeHtml(row.name)}" data-area="${escapeHtml(row.area)}" data-enrollment="${escapeHtml(sortValue(row, 'enrollment'))}">
  <td><a href="${escapeHtml(row.href)}">${escapeHtml(row.name)}</a></td>
  <td>${escapeHtml(row.area)}</td>
  <td>${enrollmentChip(row.enrollment)}</td>
</tr>`,
    )
    .join('')

  return `<style data-cep-cycle-css="1">${TITLE_TABLE_CSS}</style>
<table data-cep-cycle-table="1">
  <thead>
    <tr>
      <th><button type="button" data-cep-sort="name" data-cep-dir="asc" aria-label="Ordenar por nombre">Nombre <span aria-hidden="true">↕</span></button></th>
      <th><button type="button" data-cep-sort="area" data-cep-dir="asc" aria-label="Ordenar por área">Área <span aria-hidden="true">↕</span></button></th>
      <th><button type="button" data-cep-sort="enrollment" data-cep-dir="asc" aria-label="Ordenar por matrícula">Matrícula <span aria-hidden="true">↕</span></button></th>
    </tr>
  </thead>
  <tbody>${body}</tbody>
</table>`
}

export function renderHomeCycleCards(rows: CycleTitleRow[]): string {
  const cards = rows
    .map(
      (row) => `<a href="${escapeHtml(row.href)}" data-cep-home-cycle-card="1">
  <div class="p-6">
    <h3>${escapeHtml(row.name)}</h3>
    <p>Ciclo formativo oficial</p>
    <span data-cep-btn>Ver ciclo</span>
  </div>
</a>`,
    )
    .join('')
  return `<style data-cep-cycle-css="1">${TITLE_TABLE_CSS}</style><div data-cep-home-cycles="1">${cards}</div>`
}

export function rewriteHomeCyclesHeading(html: string): string {
  return html.replace(
    /<h2([^>]*)>\s*Ciclos formativos oficiales\s*<\/h2>\s*<p([^>]*)>[\s\S]*?<\/p>/,
    '<h2 class="mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Ciclos formativos oficiales</h2>\n        <p class="mx-auto mt-3 max-w-3xl px-2 text-center text-lg leading-8 text-slate-600">Oferta oficial con foco en empleabilidad y continuidad académica.</p>',
  )
}

function elementEnd(html: string, openIndex: number): number {
  if (openIndex < 0) return -1
  const tagEnd = html.indexOf('>', openIndex)
  if (tagEnd === -1) return -1
  let depth = 1
  let cursor = tagEnd + 1
  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', cursor)
    const nextClose = html.indexOf('</div>', cursor)
    if (nextClose === -1) return -1
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1
      cursor = nextOpen + 4
      continue
    }
    depth -= 1
    if (depth === 0) return nextClose + 6
    cursor = nextClose + 6
  }
  return -1
}

function replaceMatchingElement(html: string, openIndex: number, replacement: string): string | null {
  if (openIndex < 0) return null
  const tagEnd = html.indexOf('>', openIndex)
  if (tagEnd === -1) return null
  let depth = 1
  let cursor = tagEnd + 1
  while (cursor < html.length && depth > 0) {
    const nextOpen = html.indexOf('<div', cursor)
    const nextClose = html.indexOf('</div>', cursor)
    if (nextClose === -1) return null
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1
      cursor = nextOpen + 4
      continue
    }
    depth -= 1
    if (depth === 0) return html.slice(0, openIndex) + replacement + html.slice(nextClose + 6)
    cursor = nextClose + 6
  }
  return null
}

function injectLock(html: string, script: string, marker: string): string {
  if (html.includes(marker)) return html
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

function tableLockScript(): string {
  return `<script data-cep-cycle-cards-lock="1">
(function () {
  if (window.__cepCycleCardsLock) return;
  window.__cepCycleCardsLock = 1;
  var markup = ${JSON.stringify(OFFICIAL_CYCLE_CARDS)};
  function apply() {
    var table = document.querySelector('main table, table');
    var cards = document.querySelector('[data-cep-cycle-cards="1"]');
    if (cards) {
      if (table && table.parentNode) table.parentNode.removeChild(table);
      return;
    }
    if (!table) return;
    var frag = document.createRange().createContextualFragment(markup);
    table.replaceWith(frag);
  }
  apply();
  [400, 1200, 3000, 8000].forEach(function (ms) { setTimeout(apply, ms); });
})();
</script>`
}

function homeCyclesHeadingLock(): string {
  return `<script data-cep-home-cycles-heading-lock="1">
(function () {
  if (window.__cepHomeCyclesHeadingLock) return;
  window.__cepHomeCyclesHeadingLock = 1;
  function apply() {
    var heading = Array.prototype.find.call(document.querySelectorAll('h2'), function (node) {
      return String(node.textContent || '').trim() === 'Ciclos formativos oficiales';
    });
    if (!heading) return;
    heading.className = 'mx-auto max-w-3xl text-center text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl';
    var intro = heading.nextElementSibling;
    if (intro && intro.tagName === 'P') {
      intro.className = 'mx-auto mt-3 max-w-3xl px-2 text-center text-lg leading-8 text-slate-600';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
  [400, 1200].forEach(function (ms) { setTimeout(apply, ms); });
})();
</script>`
}

export function rewriteHomeCycles(html: string, snapshot: CatalogSnapshot | null = null): string {
  let next = rewriteHomeCyclesHeading(html)
  next = injectLock(next, homeCyclesHeadingLock(), 'data-cep-home-cycles-heading-lock="1"')
  const rows = publicCycleRows(snapshot)
  if (!rows.length) return next
  const headingIndex = next.indexOf('Ciclos formativos oficiales')
  if (headingIndex === -1) return next
  const gridIndex = next.indexOf('lg:grid-cols-2', headingIndex)
  if (gridIndex === -1) return next
  const gridStart = next.lastIndexOf('<div', gridIndex)
  const gridEnd = elementEnd(next, gridStart)
  if (gridEnd !== -1 && next.slice(gridStart, gridEnd).includes('<img')) return next
  const replaced = replaceMatchingElement(gridStart >= 0 ? next : '', gridStart, renderHomeCycleCards(rows))
  return replaced || next
}

export function rowsFromListingHtml(html: string): CycleTitleRow[] {
  const rows: CycleTitleRow[] = []
  const seen = new Set<string>()
  for (const match of html.matchAll(/<article[\s\S]*?<\/article>/gi)) {
    const href = match[0].match(/href="(\/(?:p\/)?ciclos\/[^"#?]+)"/i)?.[1]
    if (!href) continue
    const slug = decodeURIComponent(href.split('/').pop() || '')
    if (!slug || isHiddenPublicCycle(slug) || seen.has(slug)) continue
    const name = match[0].match(/<h2[^>]*>([^<]+)<\/h2>/i)?.[1]?.trim()
    if (!name || isHiddenPublicCycle(slug, name)) continue
    const folded = match[0].toLowerCase()
    const area = folded.includes('grado superior')
      ? 'Grado superior'
      : folded.includes('grado medio')
        ? 'Grado medio'
        : cycleAreaLabel(null)
    const enrollment: CycleTitleRow['enrollment'] = folded.includes('matrícula abierta')
      ? 'open'
      : folded.includes('matrícula cerrada')
        ? 'closed'
        : 'none'
    seen.add(slug)
    rows.push({
      slug,
      name: displayCourseTitle(name),
      href: href.startsWith('/p/') ? href : `/p${href}`,
      area,
      enrollment,
    })
  }
  return rows.sort((left, right) => left.name.localeCompare(right.name, 'es'))
}

const CYCLE_CARDS_CSS = `<style data-cep-cycle-cards-css="1">[data-cep-cycle-cards="1"]{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:1.25rem!important}[data-cep-cycle-cards="1"] .relative{height:12rem!important}[data-cep-cycle-cards="1"] h3{font-size:1.35rem!important;line-height:1.25!important}@media (min-width:768px){[data-cep-cycle-cards="1"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}}</style>`

const OFFICIAL_CYCLE_CARDS = `<div class="grid grid-cols-1 gap-6 md:grid-cols-2" data-cep-cycle-cards="1"><a class="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl" href="/ciclos/cfgm-farmacia-parafarmacia"><div class="relative h-72 overflow-hidden"><img src="/api/media/file/farmacia-hero.png" alt="Farmacia y Parafarmacia" loading="lazy" decoding="async" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div><div class="absolute bottom-5 left-5 right-5"><p class="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-black" style="background-color:#e0f2fe;color:#075985">Ciclo medio</p><h3 class="text-3xl font-black leading-tight text-white">Farmacia y Parafarmacia</h3></div></div><div class="flex flex-1 flex-col space-y-4 p-6"><p class="text-sm leading-6 text-slate-700">Ciclo Formativo de Grado Medio (LOE) · Ref. SANMS · Semipresencial</p><div class="flex flex-wrap gap-2"><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Régimen LOE</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Titulación oficial reconocida por el Ministerio de Educación</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Modalidad semipresencial (1 día/semana presencial)</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">500h de prácticas en empresa</span></div><span class="mt-auto inline-flex w-fit items-center rounded-full bg-[#f2014b] px-5 py-2.5 text-sm font-black text-white shadow-sm">Ver ciclo</span></div></a><a class="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-2xl" href="/ciclos/cfgs-higiene-bucodental"><div class="relative h-72 overflow-hidden"><img src="/api/media/file/higiene-hero.png" alt="Higiene Bucodental" loading="lazy" decoding="async" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div><div class="absolute bottom-5 left-5 right-5"><p class="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-black" style="background-color:#fde8ee;color:#9f1239">Ciclo superior</p><h3 class="text-3xl font-black leading-tight text-white">Higiene Bucodental</h3></div></div><div class="flex flex-1 flex-col space-y-4 p-6"><p class="text-sm leading-6 text-slate-700">Ciclo Formativo de Grado Superior (LOE) · Ref. SANSS · Semipresencial</p><div class="flex flex-wrap gap-2"><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Régimen LOE</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Titulación oficial reconocida por el Ministerio de Educación</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">Modalidad semipresencial (1 día/semana presencial)</span><span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">500h de prácticas en empresa</span></div><span class="mt-auto inline-flex w-fit items-center rounded-full bg-[#f2014b] px-5 py-2.5 text-sm font-black text-white shadow-sm">Ver ciclo</span></div></a></div>`

export function renderOfficialCycleCards(): string {
  return OFFICIAL_CYCLE_CARDS
}

export function rewriteCycleCatalog(html: string, snapshot: CatalogSnapshot | null = null): string {
  if (html.includes('data-cep-cycle-cards-lock="1"')) return html
  const rows = publicCycleRows(snapshot)
  const effective = rows.length ? rows : rowsFromListingHtml(html)
  if (!effective.length && !html.includes('<table') && !html.includes('<article')) return html
  const table = OFFICIAL_CYCLE_CARDS
  let next = html
  if (next.includes('Próximamente disponibles')) {
    next = next.replace(
      /<div class="py-16 text-center[\s\S]*?Próximamente disponibles[\s\S]*?<\/div>/,
      table,
    )
  } else {
    const gridIndex = next.search(/<div class="grid grid-cols-1 gap-6 lg:grid-cols-2/)
    if (gridIndex !== -1) {
      next = replaceMatchingElement(next, gridIndex, table) || next
    } else if (next.includes('<article')) {
      next = next.replace('<article', `${table}<article`)
    } else if (next.includes('</main>')) {
      next = next.replace('</main>', `${table}</main>`)
    } else if (next.includes('</body>')) {
      next = next.replace('</body>', `${table}</body>`)
    }
  }
  if (!next.includes('data-cep-cycle-cards-css="1"')) {
    next = next.includes('</head>') ? next.replace('</head>', `${CYCLE_CARDS_CSS}</head>`) : CYCLE_CARDS_CSS + next
  }
  return injectLock(next, tableLockScript(), 'data-cep-cycle-cards-lock="1"')
}
