import { homeRunBadge } from './enrollment-state'
import { homeCourseSectionKey, type HomeCourseSectionKey } from './home-courses'
import type { CatalogConvocatoria, CatalogSnapshot } from './render'
import { isUnpublishedRunCode } from './unpublished-runs'

type SedeKey = 'norte' | 'santa-cruz' | 'sur'
type KindKey = Extract<HomeCourseSectionKey, 'privados' | 'ocupados' | 'desempleados'>

const SEDE_ORDER: SedeKey[] = ['norte', 'santa-cruz', 'sur']
const KIND_ORDER: KindKey[] = ['privados', 'desempleados', 'ocupados']
const SEDE_TITLE: Record<SedeKey, string> = {
  norte: 'CEP NORTE',
  'santa-cruz': 'CEP SANTA CRUZ',
  sur: 'CEP SUR',
}
const KIND_TITLE: Record<KindKey, string> = {
  privados: 'Privados',
  desempleados: 'Trabajadores desempleados/as',
  ocupados: 'Trabajadores ocupados',
}

export type ActiveRun = {
  codigo: string
  title: string
  href: string
  image: string
  sede: SedeKey
  kind: KindKey
  start: string
  startLabel: string
  badge: 'open' | 'running'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function sedeOf(name: string | null | undefined): SedeKey | null {
  const folded = fold(name || '')
  if (/\bsur\b/.test(folded)) return 'sur'
  if (folded.includes('norte') || folded.includes('orotava')) return 'norte'
  if (/santa\s*cruz/.test(folded)) return 'santa-cruz'
  return null
}

function kindOf(conv: CatalogConvocatoria, snapshot: CatalogSnapshot): KindKey | null {
  const line = String(conv.trainingLine || '')
  if (/teleform|ciclo/i.test(line) || conv.cycle?.slug || conv.cycle?.name) return null
  const linked = (snapshot.data.courses || []).find((course) => course.slug && course.slug === conv.course?.slug)
  const slug = String(conv.course?.slug || linked?.slug || '')
  const code = String(conv.codigo || '')
  const kind =
    homeCourseSectionKey({ studyType: line }) ||
    homeCourseSectionKey(conv.course || {}) ||
    homeCourseSectionKey(linked || {}) ||
    (slug.endsWith('-des') || code.startsWith('DES-')
      ? 'desempleados'
      : slug.endsWith('-ocu')
        ? 'ocupados'
        : slug.endsWith('-priv') || code.startsWith('NOR-') || code.startsWith('SC-') || code.startsWith('PRIV-')
          ? 'privados'
          : null)
  if (kind === 'teleformacion') return null
  return kind
}

function formatStart(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return ''
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(date)
}

export function activeRuns(snapshot: CatalogSnapshot | null | undefined): ActiveRun[] {
  const runs: ActiveRun[] = []
  const seen = new Set<string>()
  for (const conv of snapshot?.data.convocatorias || []) {
    const badge = homeRunBadge(conv)
    if (badge !== 'open' && badge !== 'running') continue
    const sede = sedeOf(conv.campus?.name)
    const kind = snapshot ? kindOf(conv, snapshot) : null
    const codigo = String(conv.codigo || '')
    if (!sede || !kind || !codigo || isUnpublishedRunCode(codigo) || seen.has(codigo)) continue
    seen.add(codigo)
    runs.push({
      codigo,
      title: String(conv.course?.nombre || conv.cycle?.name || codigo),
      href: `/convocatorias/${encodeURIComponent(codigo)}`,
      image: String(conv.imageUrl || conv.course?.imageUrl || ''),
      sede,
      kind,
      start: String(conv.startDate || '').slice(0, 10),
      startLabel: formatStart(String(conv.startDate || '')),
      badge,
    })
  }
  return runs
}

const CONV_FICHA_CSS = `[data-cep-active-convocatorias]{--cep-open:#16a34a;--cep-run:#b8860b}
.cep-conv-toolbar{display:flex;justify-content:flex-end;margin:0 0 1.25rem}
.cep-conv-toolbar>div{display:inline-flex;border-radius:999px;background:#f1f5f9;padding:.25rem}
.cep-conv-toolbar button{display:inline-flex;align-items:center;justify-content:center;width:2.25rem;height:2.25rem;border:0;border-radius:999px;background:transparent;color:#334155;cursor:pointer}
.cep-conv-toolbar svg{width:1rem;height:1rem;display:block}
[data-cep-conv-view="grid"] [data-cep-conv-mode="grid"],[data-cep-conv-view="list"] [data-cep-conv-mode="list"]{background:#f2014b;color:#fff}
.cep-conv-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.5rem;align-items:stretch}
.cep-conv-rows{display:grid;gap:.65rem}
[data-cep-conv-view="grid"] .cep-conv-rows,[data-cep-conv-view="list"] .cep-conv-cards{display:none!important}
@media (max-width:767px){.cep-conv-cards{grid-template-columns:minmax(0,1fr)!important}}
.cep-conv-card,.cep-conv-row{color:inherit;text-decoration:none}
.cep-conv-card{display:flex;min-width:0;height:auto;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;border-radius:1rem;background:#fff;box-shadow:0 1px 2px rgb(15 23 42 / .05)}
.cep-conv-card.is-open{background:#ecfdf5;border-color:#a7f3d0}
.cep-conv-photo{position:relative;aspect-ratio:1;background:#f1f5f9}
.cep-conv-photo img{display:block;width:100%;height:100%;object-fit:cover}
.cep-conv-card .cep-conv-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.62),transparent 55%)}
.cep-conv-card .cep-conv-photo h3{position:absolute;z-index:2;right:1rem;bottom:1rem;left:1rem;margin:0;color:#fff;font-size:1.15rem;font-weight:700;line-height:1.25}
.cep-conv-badge{z-index:3;border-radius:999px;padding:.35rem .7rem;color:#fff;font-size:.75rem;font-weight:700;white-space:nowrap}
.cep-conv-card .cep-conv-badge{position:absolute;top:1rem;right:1rem}
.cep-conv-badge[data-cep-chip="open"]{background:#16a34a}
.cep-conv-badge[data-cep-chip="running"]{background:#b8860b}
.cep-conv-body{display:flex;flex:1;flex-direction:column;gap:.75rem;padding:1rem 1.1rem 1.15rem}
.cep-conv-kind,.cep-conv-code{margin:0}
.cep-conv-kind{color:#64748b;font-size:.8rem;font-weight:600}
.cep-conv-kind[data-kind="desempleados"]{display:inline-flex;width:fit-content;border-radius:999px;background:#1e3a8a;color:#fff;padding:.28rem .65rem}
.cep-conv-code{color:#64748b;font-family:ui-monospace,monospace;font-size:.75rem}
.cep-conv-facts{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
.cep-conv-fact{border:1px solid #e5e7eb;border-radius:.7rem;background:#fff;padding:.45rem .6rem}
.cep-conv-fact p{margin:0}
.cep-conv-fact p:first-child{color:#64748b;font-size:.72rem;font-weight:600}
.cep-conv-fact p+p{color:#150702;font-size:1.05rem;font-weight:800}
.cep-conv-free{display:inline-flex;width:fit-content;margin:.35rem 0 0;border-radius:999px;background:#ecfdf5;color:#166534;padding:.28rem .65rem;font-size:.78rem;font-weight:700}
.cep-conv-cta{display:inline-flex;width:100%;box-sizing:border-box;margin-top:.35rem;align-items:center;justify-content:center;border-radius:999px;background:#f2014b;padding:.6rem .9rem;color:#fff;font-size:.95rem;font-weight:600;text-align:center}
.cep-conv-row{display:grid;grid-template-columns:10.5rem minmax(0,1fr);overflow:hidden;min-height:7.25rem;border:1px solid #e5e7eb;border-radius:.85rem;background:#fff;box-shadow:0 1px 2px rgb(15 23 42 / .05)}
.cep-conv-row.is-open{background:#ecfdf5;border-color:#a7f3d0}
.cep-conv-row .cep-conv-photo{aspect-ratio:auto;height:100%;min-height:7.25rem}
.cep-conv-row .cep-conv-photo::after,.cep-conv-row .cep-conv-photo h3{display:none}
.cep-conv-row-body{display:flex;min-width:0;flex-direction:column;justify-content:center;gap:.45rem;padding:.85rem 1.15rem}
.cep-conv-row-head{display:flex;align-items:flex-start;justify-content:space-between;gap:.6rem}
.cep-conv-row-head h3{margin:0;color:#0f172a;font-size:1.35rem;font-weight:650;line-height:1.2}
.cep-conv-row .cep-conv-facts{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem 1.5rem}
.cep-conv-row .cep-conv-fact{border:0;background:transparent;padding:0}
.cep-conv-row .cep-conv-cta{width:auto;align-self:flex-start;margin-top:0;padding:.55rem 1.15rem}
@media (max-width:767px){.cep-conv-row{grid-template-columns:7.5rem minmax(0,1fr)}}`

const GRID_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z"/></svg>'
const LIST_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M1 2h14v2H1zm0 5h14v2H1zm0 5h14v2H1z"/></svg>'

function badgeHtml(run: ActiveRun): string {
  const chip = run.badge === 'running' ? 'running' : 'open'
  const label = run.badge === 'running' ? 'En curso' : 'Matrícula abierta'
  return `<span class="cep-conv-badge" data-cep-chip="${chip}">${label}</span>`
}

function photoHtml(run: ActiveRun, title: boolean): string {
  const img = run.image
    ? `<img src="${escapeHtml(run.image)}" alt="${escapeHtml(run.title)}" loading="lazy" decoding="async"/>`
    : ''
  const heading = title ? `${badgeHtml(run)}<h3>${escapeHtml(run.title)}</h3>` : ''
  return `<div class="cep-conv-photo">${img}${heading}</div>`
}

function factsHtml(run: ActiveRun): string {
  return `<div class="cep-conv-facts"><div class="cep-conv-fact"><p>Inicio</p><p>${escapeHtml(run.startLabel || '-')}</p></div><div class="cep-conv-fact"><p>Sede</p><p>${escapeHtml(SEDE_TITLE[run.sede])}</p></div></div>`
}

function kindLine(run: ActiveRun): string {
  const attr = run.kind === 'desempleados' ? ' data-kind="desempleados"' : ''
  const free = run.kind === 'privados' ? '' : `<span class="cep-conv-free">100% gratuito</span>`
  return `<p class="cep-conv-kind"${attr}>${escapeHtml(KIND_TITLE[run.kind])}</p>${free}`
}

function cardHtml(run: ActiveRun): string {
  const open = run.badge === 'open' ? ' is-open' : ''
  return `<a class="cep-conv-card${open}" href="${escapeHtml(run.href)}">${photoHtml(run, true)}<div class="cep-conv-body">${kindLine(run)}<p class="cep-conv-code">${escapeHtml(run.codigo)}</p>${factsHtml(run)}<span class="cep-conv-cta">Ver convocatoria</span></div></a>`
}

function rowHtml(run: ActiveRun): string {
  const open = run.badge === 'open' ? ' is-open' : ''
  return `<a class="cep-conv-row${open}" href="${escapeHtml(run.href)}">${photoHtml(run, false)}<div class="cep-conv-row-body"><div class="cep-conv-row-head"><h3>${escapeHtml(run.title)}</h3>${badgeHtml(run)}</div><p class="cep-conv-code">${escapeHtml(run.codigo)}</p>${factsHtml(run)}<span class="cep-conv-cta">Ver convocatoria</span></div></a>`
}

function toggleHtml(): string {
  return `<div class="cep-conv-toolbar"><div><button type="button" data-cep-conv-mode="grid" aria-label="Vista en cuadrícula" title="Vista en cuadrícula">${GRID_ICON}</button><button type="button" data-cep-conv-mode="list" aria-label="Vista de lista" title="Vista de lista">${LIST_ICON}</button></div></div>`
}

export function renderActiveConvocatorias(snapshot: CatalogSnapshot | null | undefined): string {
  const runs = activeRuns(snapshot)
  if (!runs.length) return ''
  const sections = SEDE_ORDER.map((sede) => {
    const sedeRuns = runs.filter((run) => run.sede === sede)
    const kinds = KIND_ORDER.map((kind) => {
      const cards = sedeRuns
        .filter((run) => run.kind === kind)
        .sort((left, right) => left.start.localeCompare(right.start))
      const body = cards.length
        ? `<div class="cep-conv-cards">${cards.map(cardHtml).join('')}</div><div class="cep-conv-rows">${cards.map(rowHtml).join('')}</div>`
        : '<p class="text-sm text-slate-500">No hay convocatorias activas.</p>'
      return `<div data-cep-kind-group="${kind}" class="mt-6"><h3 class="mb-3 text-lg font-semibold text-slate-950">${KIND_TITLE[kind]}</h3>${body}</div>`
    }).join('')
    return `<section data-cep-sede-group="${sede}"><div class="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 class="text-2xl font-black text-slate-950">${SEDE_TITLE[sede]}</h2><span class="mt-2 inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-[#f2014b]">${sedeRuns.length} convocatorias</span></div>${kinds}</section>`
  }).join('')
  return toggleHtml() + sections
}

function matchingDivEnd(html: string, innerStart: number): number {
  let depth = 1
  let index = innerStart
  while (index < html.length && depth > 0) {
    const nextOpen = html.toLowerCase().indexOf('<div', index)
    const nextClose = html.toLowerCase().indexOf('</div>', index)
    if (nextClose < 0) return -1
    const openIsTag = nextOpen !== -1 && (html[nextOpen + 4] === ' ' || html[nextOpen + 4] === '>')
    if (openIsTag && nextOpen < nextClose) {
      depth += 1
      index = nextOpen + 4
      continue
    }
    depth -= 1
    if (depth === 0) return nextClose
    index = nextClose + 6
  }
  return -1
}

export function replaceActiveConvocatorias(html: string, snapshot: CatalogSnapshot | null | undefined): string {
  const runs = activeRuns(snapshot)
  const body = renderActiveConvocatorias(snapshot)
  if (!body || !runs.length) return html
  const marker = '<div class="space-y-10">'
  const start = html.indexOf(marker)
  if (start < 0) return html
  const end = matchingDivEnd(html, start + marker.length)
  if (end < 0) return html
  const open = `<div class="space-y-10" data-cep-active-convocatorias="1" data-cep-active-count="${runs.length}" data-cep-conv-view="grid">`
  const next = html.slice(0, start) + open + body + html.slice(end)
  if (next.includes('data-cep-active-lock="1"')) return next
  const script = `<script data-cep-active-lock="1">
(function () {
  var RUNS = ${JSON.stringify(runs).replace(/</g, '\\u003c')};
  var SEDES = ['norte', 'santa-cruz', 'sur'];
  var KINDS = ['privados', 'desempleados', 'ocupados'];
  var SEDE_TITLE = { norte: 'CEP NORTE', 'santa-cruz': 'CEP SANTA CRUZ', sur: 'CEP SUR' };
  var KIND_TITLE = { privados: 'Privados', desempleados: 'Trabajadores desempleados/as', ocupados: 'Trabajadores ocupados' };
  var FICHA_CSS = ${JSON.stringify(CONV_FICHA_CSS)};
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function icon(kind) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('fill', 'currentColor');
    path.setAttribute('d', kind === 'grid' ? 'M1 1h6v6H1zm8 0h6v6H9zM1 9h6v6H1zm8 0h6v6H9z' : 'M1 2h14v2H1zm0 5h14v2H1zm0 5h14v2H1z');
    svg.appendChild(path);
    return svg;
  }
  function badge(run) {
    var span = el('span', 'cep-conv-badge', run.badge === 'running' ? 'En curso' : 'Matrícula abierta');
    span.setAttribute('data-cep-chip', run.badge === 'running' ? 'running' : 'open');
    return span;
  }
  function photo(run, withTitle) {
    var box = el('div', 'cep-conv-photo');
    if (run.image) {
      var img = document.createElement('img');
      img.src = run.image;
      img.alt = run.title;
      img.loading = 'lazy';
      box.appendChild(img);
    }
    if (withTitle) {
      box.appendChild(badge(run));
      box.appendChild(el('h3', '', run.title));
    }
    return box;
  }
  function facts(run) {
    var wrap = el('div', 'cep-conv-facts');
    [['Inicio', run.startLabel || '-'], ['Sede', SEDE_TITLE[run.sede]]].forEach(function (pair) {
      var cell = el('div', 'cep-conv-fact');
      cell.appendChild(el('p', '', pair[0]));
      cell.appendChild(el('p', '', pair[1]));
      wrap.appendChild(cell);
    });
    return wrap;
  }
  function card(run) {
    var link = el('a', 'cep-conv-card' + (run.badge === 'open' ? ' is-open' : ''));
    link.href = run.href;
    link.appendChild(photo(run, true));
    var body = el('div', 'cep-conv-body');
    var kind = el('p', 'cep-conv-kind', KIND_TITLE[run.kind]);
    if (run.kind === 'desempleados') kind.setAttribute('data-kind', 'desempleados');
    body.appendChild(kind);
    if (run.kind === 'ocupados' || run.kind === 'desempleados') body.appendChild(el('span', 'cep-conv-free', '100% gratuito'));
    body.appendChild(el('p', 'cep-conv-code', run.codigo));
    body.appendChild(facts(run));
    body.appendChild(el('span', 'cep-conv-cta', 'Ver convocatoria'));
    link.appendChild(body);
    return link;
  }
  function row(run) {
    var link = el('a', 'cep-conv-row' + (run.badge === 'open' ? ' is-open' : ''));
    link.href = run.href;
    link.appendChild(photo(run, false));
    var body = el('div', 'cep-conv-row-body');
    var head = el('div', 'cep-conv-row-head');
    head.appendChild(el('h3', '', run.title));
    head.appendChild(badge(run));
    body.appendChild(head);
    body.appendChild(el('p', 'cep-conv-code', run.codigo));
    body.appendChild(facts(run));
    body.appendChild(el('span', 'cep-conv-cta', 'Ver convocatoria'));
    link.appendChild(body);
    return link;
  }
  function toolbar() {
    var bar = el('div', 'cep-conv-toolbar');
    var group = el('div', '');
    ['grid', 'list'].forEach(function (mode) {
      var btn = el('button', '');
      btn.type = 'button';
      btn.setAttribute('data-cep-conv-mode', mode);
      btn.setAttribute('aria-label', mode === 'grid' ? 'Vista en cuadrícula' : 'Vista de lista');
      btn.setAttribute('title', mode === 'grid' ? 'Vista en cuadrícula' : 'Vista de lista');
      btn.appendChild(icon(mode));
      group.appendChild(btn);
    });
    bar.appendChild(group);
    return bar;
  }
  function ensureStyle() {
    if (document.querySelector('style[data-cep-conv-ficha]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-cep-conv-ficha', '1');
    style.textContent = FICHA_CSS;
    (document.head || document.documentElement).appendChild(style);
  }
  function paint() {
    ensureStyle();
    var box = document.querySelector('.space-y-10');
    if (!box || !RUNS.length) return;
    if (box.getAttribute('data-cep-active-count') === String(RUNS.length) && box.querySelector('[data-cep-sede-group="norte"]') && box.querySelectorAll('.cep-conv-card').length === RUNS.length && box.querySelector('.cep-conv-toolbar')) return;
    var view = box.getAttribute('data-cep-conv-view') || 'grid';
    while (box.firstChild) box.removeChild(box.firstChild);
    box.setAttribute('data-cep-active-convocatorias', '1');
    box.setAttribute('data-cep-active-count', String(RUNS.length));
    box.setAttribute('data-cep-conv-view', view);
    box.appendChild(toolbar());
    SEDES.forEach(function (sede) {
      var sedeRuns = RUNS.filter(function (run) { return run.sede === sede; });
      var section = el('section', '');
      section.setAttribute('data-cep-sede-group', sede);
      var head = el('div', 'mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm');
      head.appendChild(el('h2', 'text-2xl font-black text-slate-950', SEDE_TITLE[sede]));
      head.appendChild(el('span', 'mt-2 inline-flex rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-[#f2014b]', sedeRuns.length + ' convocatorias'));
      section.appendChild(head);
      KINDS.forEach(function (kind) {
        var block = el('div', 'mt-6');
        block.setAttribute('data-cep-kind-group', kind);
        block.appendChild(el('h3', 'mb-3 text-lg font-semibold text-slate-950', KIND_TITLE[kind]));
        var cards = sedeRuns.filter(function (run) { return run.kind === kind; }).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
        if (!cards.length) {
          block.appendChild(el('p', 'text-sm text-slate-500', 'No hay convocatorias activas.'));
        } else {
          var grid = el('div', 'cep-conv-cards');
          var rows = el('div', 'cep-conv-rows');
          cards.forEach(function (run) {
            grid.appendChild(card(run));
            rows.appendChild(row(run));
          });
          block.appendChild(grid);
          block.appendChild(rows);
        }
        section.appendChild(block);
      });
      box.appendChild(section);
    });
  }
  if (!window.__cepConvView) {
    window.__cepConvView = true;
    document.addEventListener('click', function (ev) {
      var node = ev.target;
      var btn = node && node.closest ? node.closest('[data-cep-conv-mode]') : null;
      if (!btn) return;
      var box = document.querySelector('[data-cep-active-convocatorias]');
      if (!box) return;
      box.setAttribute('data-cep-conv-view', btn.getAttribute('data-cep-conv-mode') || 'grid');
    }, true);
  }
  paint();
  [400, 1200, 3000].forEach(function (ms) { setTimeout(paint, ms); });
})();
</script>`
  const style = next.includes('data-cep-conv-ficha') ? '' : `<style data-cep-conv-ficha="1">${CONV_FICHA_CSS}</style>`
  const packed = style + script
  return next.includes('</body>') ? next.replace('</body>', `${packed}</body>`) : next + packed
}
