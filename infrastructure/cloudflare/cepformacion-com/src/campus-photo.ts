import { areaLabelsForTitles, areaTitleRules } from './home-course-areas'

const SUR_PHOTO = '/images/sedes/sede-cep-sur.png'

const SEDE_ASSET_PATHS = new Set([
  '/images/sedes/sede-cep-norte.png',
  '/images/sedes/sede-cep-santa-cruz.png',
  '/images/sedes/sede-cep-sur.png',
])

export function isSedeAssetPath(pathname: string): boolean {
  return SEDE_ASSET_PATHS.has(pathname)
}

const CAMPUS_GRID_CSS = `[data-cep-campus-grid="1"]{display:grid!important;width:100%;box-sizing:border-box;grid-template-columns:minmax(0,1fr);gap:1rem!important}
@media (min-width:768px){[data-cep-campus-grid="1"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media (min-width:1024px){[data-cep-campus-grid="1"]{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.85rem!important}}
[data-cep-campus-grid="1"]>article,[data-cep-campus-grid="1"]>a{min-width:0}
[data-cep-campus-grid="1"] .h-72,[data-cep-campus-grid="1"] .h-56,[data-cep-campus-grid="1"] .relative.h-72{height:10.5rem!important}
[data-cep-campus-grid="1"] .space-y-4.p-7,[data-cep-campus-grid="1"] .space-y-3.p-6{padding:.8rem .9rem .95rem!important}
[data-cep-campus-grid="1"] h3,[data-cep-campus-grid="1"] h2{font-size:1.05rem!important;line-height:1.25!important}
[data-cep-campus-grid="1"] .mt-2.text-base{margin-top:.15rem!important;font-size:.8125rem!important;line-height:1.35!important}
[data-cep-campus-grid="1"] .rounded-2xl.border-t{padding:.6rem .7rem!important}
[data-cep-campus-grid="1"] .grid.gap-3{gap:.35rem!important}
@media (min-width:1024px){[data-cep-campus-grid="1"] [class*="sm:grid-cols-[7rem"]{grid-template-columns:minmax(0,1fr)!important;gap:.1rem!important}}
[data-cep-campus-grid="1"] a.inline-flex.rounded-full{min-height:2.1rem;padding:.32rem .85rem!important;font-size:.78rem!important}
[data-cep-campus-grid="1"] .h-28{height:3.1rem!important}
[data-cep-campus-grid="1"] .rounded-3xl{border-radius:.85rem!important}
[data-cep-area-badges]{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.25rem}
[data-cep-area-badge]{display:inline-flex;align-items:center;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;padding:.25rem .75rem;font-size:11px;font-weight:600;line-height:1.3;color:#334155}`

function looksLikeCampusGrid(block: string): boolean {
  const folded = block.toLowerCase()
  const hits = ['cep sur', 'cep norte', 'santa cruz', 'sede-cep-sur', 'sede-cep-norte', 'sede-santa-cruz', 'cep-sur']
  return hits.filter((needle) => folded.includes(needle)).length >= 2
}

function rewriteGridClass(className: string): string {
  let next = className
    .replace(/\bxl:grid-cols-3\b/g, '')
    .replace(/\blg:grid-cols-3\b/g, '')
    .replace(/\bgap-8\b/g, 'gap-4')
    .replace(/\bgap-6\b/g, 'gap-4')
    .replace(/\s+/g, ' ')
    .trim()
  if (!/\bmd:grid-cols-2\b/.test(next) && !/\bmd:grid-cols-3\b/.test(next)) {
    next = `${next} md:grid-cols-2`
  }
  next = `${next} lg:grid-cols-3`
  return next.replace(/\s+/g, ' ').trim()
}

function compactGridOpenTag(open: string): string {
  const classMatch = open.match(/\bclass="([^"]*)"/)
  const className = rewriteGridClass(classMatch?.[1] || 'grid')
  if (open.includes('data-cep-campus-grid')) {
    return open.replace(/\bclass="[^"]*"/, `class="${className}"`)
  }
  return open
    .replace('<div ', '<div data-cep-campus-grid="1" ')
    .replace(/\bclass="[^"]*"/, `class="${className}"`)
}

export function compactCampusCards(html: string): string {
  const next = rewriteGridsNearSedesHeading(html)
  if (!next.includes('<div data-cep-campus-grid="1"')) return next
  return injectCampusGridLock(injectCampusGridCss(next))
}

function rewriteGridsNearSedesHeading(html: string): string {
  const heading = /<(h1|h2)[^>]*>\s*Nuestras sedes\s*<\/\1>/gi
  const matches = [...html.matchAll(heading)]
  let next = html
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const match = matches[i]
    if (match.index == null) continue
    const from = match.index + match[0].length
    const window = next.slice(from, from + 6000)
    const grid = window.match(/<div class="([^"]*\bgrid\b[^"]*)"/)
    if (!grid || grid.index == null) continue
    const abs = from + grid.index
    const probe = next.slice(abs, abs + 16000)
    if (!looksLikeCampusGrid(probe)) continue
    const openEnd = next.indexOf('>', abs)
    if (openEnd === -1) continue
    const open = next.slice(abs, openEnd + 1)
    next = next.slice(0, abs) + compactGridOpenTag(open) + next.slice(openEnd + 1)
  }
  return uppercaseCampusGridTitles(next)
}

function uppercaseCampusGridTitles(html: string): string {
  const needle = 'data-cep-campus-grid="1"'
  let idx = 0
  let next = html
  while (idx < next.length) {
    const found = next.indexOf(needle, idx)
    if (found === -1) break
    const from = found
    const windowEnd = Math.min(next.length, from + 18000)
    const slice = next.slice(from, windowEnd)
    const rewritten = slice
      .replace(/<(h2|h3)([^>]*)>(\s*)CEP Sur(\s*)<\/\1>/gi, '<$1$2>$3CEP SUR$4</$1>')
      .replace(/<(h2|h3)([^>]*)>(\s*)CEP Norte(\s*)<\/\1>/gi, '<$1$2>$3CEP NORTE$4</$1>')
      .replace(/<(h2|h3)([^>]*)>(\s*)CEP Santa Cruz(\s*)<\/\1>/gi, '<$1$2>$3CEP SANTA CRUZ$4</$1>')
      .replace(/\balt="CEP Sur"/gi, 'alt="CEP SUR"')
      .replace(/\balt="CEP Norte"/gi, 'alt="CEP NORTE"')
      .replace(/\balt="CEP Santa Cruz"/gi, 'alt="CEP SANTA CRUZ"')
    next = next.slice(0, from) + rewritten + next.slice(windowEnd)
    idx = from + rewritten.length
  }
  return next
}

function injectCampusGridCss(html: string): string {
  if (html.includes('data-cep-campus-grid-css="1"')) return html
  const tag = `<style data-cep-campus-grid-css="1">${CAMPUS_GRID_CSS}</style>`
  if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
  return tag + html
}

function injectCampusGridLock(html: string): string {
  if (html.includes('data-cep-campus-grid-lock="1"')) return html
  const script = `<script data-cep-campus-grid-lock="1">
(function () {
  if (window.__cepCampusGridLock) return;
  window.__cepCampusGridLock = 1;
  var RULES = ${JSON.stringify(areaTitleRules()).replace(/</g, '\\u003c')};
  function foldTitle(value) {
    return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
  }
  function areaOf(title) {
    var key = foldTitle(title);
    for (var i = 0; i < RULES.length; i++) {
      if (new RegExp(RULES[i].source, RULES[i].flags).test(key)) return RULES[i].label;
    }
    return '';
  }
  function paintAreas(article) {
    article.querySelectorAll('div.flex.flex-wrap.gap-2').forEach(function (box) {
      var links = box.querySelectorAll('a');
      if (!links.length) return;
      var seen = {};
      Array.prototype.forEach.call(links, function (link) {
        var label = areaOf(link.textContent || '');
        if (label) seen[label] = 1;
      });
      var ordered = [];
      RULES.forEach(function (rule) { if (seen[rule.label]) ordered.push(rule.label); });
      if (!ordered.length) return;
      box.setAttribute('data-cep-area-badges', 'campus');
      while (box.firstChild) box.removeChild(box.firstChild);
      ordered.forEach(function (label) {
        var chip = document.createElement('span');
        chip.setAttribute('data-cep-area-badge', '1');
        chip.className = 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700';
        chip.textContent = label;
        box.appendChild(chip);
      });
    });
  }
  function rewriteClass(value) {
    var next = String(value || '')
      .replace(/\\bxl:grid-cols-3\\b/g, '')
      .replace(/\\blg:grid-cols-3\\b/g, '')
      .replace(/\\bgap-8\\b/g, 'gap-4')
      .replace(/\\bgap-6\\b/g, 'gap-4')
      .replace(/\\s+/g, ' ')
      .trim();
    if (next.indexOf('md:grid-cols-2') === -1 && next.indexOf('md:grid-cols-3') === -1) next += ' md:grid-cols-2';
    next += ' lg:grid-cols-3';
    return next.replace(/\\s+/g, ' ').trim();
  }
  function looksLikeCampus(grid) {
    var text = (grid.textContent || '').toLowerCase();
    var hits = 0;
    if (text.indexOf('sur') !== -1) hits += 1;
    if (text.indexOf('norte') !== -1) hits += 1;
    if (text.indexOf('santa cruz') !== -1) hits += 1;
    return hits >= 2;
  }
  function mark(grid) {
    if (!grid || !looksLikeCampus(grid)) return;
    grid.setAttribute('data-cep-campus-grid', '1');
    grid.className = rewriteClass(grid.className);
    grid.querySelectorAll('.h-72,.h-56').forEach(function (el) {
      el.className = String(el.className || '').replace(/\\bh-72\\b/g, 'h-40').replace(/\\bh-56\\b/g, 'h-40');
    });
    grid.querySelectorAll('.p-7').forEach(function (el) {
      el.className = String(el.className || '').replace(/\\bp-7\\b/g, 'p-4');
    });
    grid.querySelectorAll('h3.text-2xl').forEach(function (el) {
      el.className = String(el.className || '').replace(/\\btext-2xl\\b/g, 'text-lg');
    });
    grid.querySelectorAll('h2,h3').forEach(function (el) {
      var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      if (/^CEP Sur$/i.test(text)) el.textContent = 'CEP SUR';
      else if (/^CEP Norte$/i.test(text)) el.textContent = 'CEP NORTE';
      else if (/^CEP Santa Cruz$/i.test(text)) el.textContent = 'CEP SANTA CRUZ';
    });
    grid.querySelectorAll('article').forEach(ensureSurCard);
  }
  function ensureSurCard(article) {
    var heading = article.querySelector('h2,h3');
    var name = heading ? (heading.textContent || '').replace(/\\s+/g, ' ').trim() : '';
    if (!/^CEP SUR$/i.test(name)) return;
    article.querySelectorAll('[data-cep-area-badges="sur"]').forEach(function (row) {
      if (row.parentNode) row.parentNode.removeChild(row);
    });
    if (!article.querySelector('img')) {
      var img = document.createElement('img');
      img.src = '/images/sedes/sede-cep-sur.png';
      img.alt = 'CEP SUR';
      img.className = 'h-56 w-full object-cover';
      article.insertBefore(img, article.firstChild);
    }
  }
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('h1,h2').forEach(function (heading) {
      if ((heading.textContent || '').replace(/\\s+/g, ' ').trim() !== 'Nuestras sedes') return;
      var root = heading.closest('section') || heading.parentElement;
      if (!root) return;
      var grid = root.querySelector('div[class*="grid"]');
      if (grid) mark(grid);
    });
    document.querySelectorAll('[data-cep-campus-grid="1"]').forEach(mark);
    document.querySelectorAll('article').forEach(function (article) {
      ensureSurCard(article);
      paintAreas(article);
    });
  }
  var painting = false;
  var pending = false;
  function paintSur() {
    if (!document.body) return;
    if (painting) { pending = true; return; }
    painting = true;
    try {
      document.querySelectorAll('article').forEach(function (article) {
        ensureSurCard(article);
        paintAreas(article);
      });
    }
    finally {
      painting = false;
      if (pending) { pending = false; paintSur(); }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
  [400, 1200, 2500].forEach(function (ms) { setTimeout(apply, ms); });
  var root = document.documentElement;
  if (root) new MutationObserver(function () { paintSur(); }).observe(root, { childList: true, subtree: true });
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

const SEDE_HERO_PHOTO: Record<string, string> = {
  'cep-sur': '/images/sedes/sede-cep-sur.png',
  'sede-cep-sur': '/images/sedes/sede-cep-sur.png',
  'sede-norte': '/images/sedes/sede-cep-norte.png',
  norte: '/images/sedes/sede-cep-norte.png',
  'sede-santa-cruz': '/images/sedes/sede-cep-santa-cruz.png',
  'santa-cruz': '/images/sedes/sede-cep-santa-cruz.png',
}

function sedeHeroPhoto(pathname: string): string | null {
  const slug = pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || ''
  return SEDE_HERO_PHOTO[slug] ?? null
}

function pinSedeHeroPhoto(html: string, photo: string): string {
  const generic = '/website/cep/campus-identity-physical.jpg'
  let next = html.replace(
    /(<section\b[^>]*class="[^"]*bg-slate-950[^"]*"[^>]*>\s*<img\b[^>]*\bsrc=")([^"]+)(")/i,
    `$1${photo}$3`,
  )
  next = next.split(generic).join(photo)
  next = next.split(generic.replace(/\//g, '\\/')).join(photo.replace(/\//g, '\\/'))
  return next
}

function sedeHeroLock(photo: string): string {
  return `<script data-cep-sede-hero-photo="1">
(function () {
  var photo = ${JSON.stringify(photo)};
  function pin() {
    var img = document.querySelector('section.bg-slate-950 > img');
    if (!img || img.getAttribute('src') === photo) return;
    img.setAttribute('src', photo);
  }
  pin();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pin);
  [400, 1200, 2500].forEach(function (ms) { setTimeout(pin, ms); });
  var root = document.documentElement;
  if (root) new MutationObserver(pin).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
})();
</script>`
}

const SEDE_HERO_CSS = `section.relative.overflow-hidden.bg-slate-950:has(> img.opacity-45){height:420px!important;min-height:420px!important;max-height:420px!important;padding:0!important;box-sizing:border-box!important;isolation:isolate}
@media (min-width:640px){section.relative.overflow-hidden.bg-slate-950:has(> img.opacity-45){height:480px!important;min-height:480px!important;max-height:480px!important}}
section.relative.overflow-hidden.bg-slate-950 > img.opacity-45{opacity:1!important;object-position:center 22%!important}
section.relative.overflow-hidden.bg-slate-950 > .absolute.inset-0.bg-gradient-to-r{background-image:linear-gradient(90deg,rgba(15,23,42,.72) 0%,rgba(15,23,42,.28) 42%,rgba(15,23,42,.08) 100%)!important}
section.relative.overflow-hidden.bg-slate-950:has(> img.opacity-45) > .relative{min-height:0!important;height:100%!important;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;padding:2.5rem 1.5rem 2.25rem!important;box-sizing:border-box}
section.relative.overflow-hidden.bg-slate-950:has(> img.opacity-45) > .relative > h1,
section.relative.overflow-hidden.bg-slate-950:has(> img.opacity-45) > .relative > p{max-width:36rem}
[data-cep-brand]{position:static!important;clear:both;margin-top:2.75rem}
[data-cep-brand] h2{margin:0 0 1rem;color:#0f172a;font-size:1.5rem;font-weight:800;line-height:1.25}
[data-cep-brand] .grid{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(7.25rem,1fr))!important;gap:1rem 1.35rem!important}
[data-cep-brand] a{border:0!important;box-shadow:none!important;background:transparent!important;min-height:0!important;padding:.25rem!important;transform:none!important;border-radius:0!important}
[data-cep-brand] img{max-height:3.4rem!important;width:auto!important;margin:0 auto;object-fit:contain!important;filter:none!important}
[role="list"][aria-label$="de esta sede"]{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(17rem,1fr))!important;gap:1.25rem!important;align-items:stretch}
[role="list"][aria-label$="de esta sede"] article{display:flex!important;flex-direction:column!important;grid-template-columns:minmax(0,1fr)!important;height:100%!important;min-height:0!important;background:#fff!important;transform:none!important}
[role="list"][aria-label$="de esta sede"] article>:first-child{width:100%!important;height:12.5rem!important;max-height:12.5rem!important;aspect-ratio:auto!important;flex:none!important}
[role="list"][aria-label$="de esta sede"] article>:first-child img{width:100%!important;height:100%!important;object-fit:cover!important}`

const SEDE_ORGS_SCRIPT = `<script data-cep-sede-orgs="1">
(function () {
  var EXTRAS = {
    cursos: {
      entities: [
        ['ADDANCA','/website/cep/partners/addanca.jpg'],
        ['ADEPAC','/website/cep/partners/adepac.jpg'],
        ['Animal Club','/website/cep/partners/animal-club.jpg'],
        ['APANOT','/website/cep/partners/apanot.jpg'],
        ['La Esperanza del Sur','/website/cep/partners/la-esperanza-del-sur.jpg'],
        ['SOS Felina','/website/cep/partners/sos-felina.jpg'],
        ['Valle Colino','/website/cep/partners/valle-colino.jpg']
      ],
      certs: []
    },
    sur: {
      entities: [['ASHOTEL','/website/cep/partners/ashotel.jpg']],
      certs: [['ISO 14001','/website/cep/certifications/iso-14001.jpg']]
    }
  };
  function bucket() {
    var path = location.pathname || '';
    if (path.indexOf('cep-sur') !== -1) return 'sur';
    if (path.indexOf('sede-norte') !== -1 || path.indexOf('sede-santa-cruz') !== -1) return 'cursos';
    return '';
  }
  function source() {
    return bucket() === 'sur' ? 'https://cepsur.es/' : 'https://cursostenerife.es/';
  }
  function makeLink(name, src) {
    var link = document.createElement('a');
    link.href = source();
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', name + '. Ver fuente oficial');
    var img = document.createElement('img');
    img.src = src;
    img.alt = name;
    img.loading = 'lazy';
    link.appendChild(img);
    return link;
  }
  function sectionShell(kind, title, id) {
    var section = document.createElement('section');
    section.setAttribute('data-cep-brand', kind);
    section.setAttribute('aria-labelledby', id);
    var heading = document.createElement('h2');
    heading.id = id;
    heading.textContent = title;
    var grid = document.createElement('div');
    grid.className = 'grid';
    section.appendChild(heading);
    section.appendChild(grid);
    return section;
  }
  function hasName(section, name) {
    var text = (section.textContent || '') + ' ' + (section.innerHTML || '');
    return text.indexOf(name) !== -1;
  }
  function addExtras(section, items) {
    if (!section) return;
    var grid = section.querySelector('.grid');
    if (!grid) return;
    items.forEach(function (item) {
      if (hasName(section, item[0])) return;
      grid.appendChild(makeLink(item[0], item[1]));
    });
  }
  function ctaSection() {
    var cta = null;
    document.querySelectorAll('h2').forEach(function (node) {
      if (cta) return;
      if (node.closest('[data-cep-brand]')) return;
      var text = (node.textContent || '').replace(/\\s+/g, ' ').trim();
      if (text.indexOf('Quieres información') !== -1) cta = node.closest('section');
    });
    return cta;
  }
  function place(entities, certs) {
    var cta = ctaSection();
    if (!cta || !cta.parentNode || !entities || !certs) return;
    cta.parentNode.insertBefore(entities, cta.nextSibling);
    entities.parentNode.insertBefore(certs, entities.nextSibling);
  }
  function split() {
    var key = bucket();
    var extras = EXTRAS[key] || { entities: [], certs: [] };
    var entities = document.querySelector('[data-cep-brand="entities"]');
    var certs = document.querySelector('[data-cep-brand="certs"]');
    var old = document.querySelector('[aria-labelledby="campus-organizations-title"]');
    if (old && old !== entities && old !== certs && entities && entities.querySelector('a')) {
      if (old.parentNode) old.parentNode.removeChild(old);
      old = null;
    }
    if (old && old !== entities && old !== certs) {
      entities = entities || sectionShell('entities', 'Entidades y empresas colaboradoras', 'campus-entities-title');
      certs = certs || sectionShell('certs', 'Certificaciones', 'campus-certifications-title');
      old.querySelectorAll('h3').forEach(function (heading) {
        var host = heading.parentElement;
        var links = host ? host.querySelectorAll('a') : [];
        var target = /certific/i.test(heading.textContent || '') ? certs : entities;
        var grid = target.querySelector('.grid');
        links.forEach(function (link) { if (grid) grid.appendChild(link); });
      });
      if (old.parentNode) {
        old.parentNode.insertBefore(entities, old);
        old.parentNode.insertBefore(certs, old);
        old.parentNode.removeChild(old);
      }
    }
    addExtras(entities, extras.entities);
    addExtras(certs, extras.certs);
    place(entities, certs);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', split);
  else split();
  [400, 1200, 2500].forEach(function (ms) { setTimeout(split, ms); });
})();
</script>`

export function brightenSedeHero(html: string, pathname = ''): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (!/\/sedes\/[^/]+$/.test(path)) return html
  const photo = sedeHeroPhoto(path)
  let next = photo ? pinSedeHeroPhoto(html, photo) : html
  if (!next.includes('data-cep-sede-hero="1"')) {
    const style = `<style data-cep-sede-hero="1">${SEDE_HERO_CSS}</style>`
    next = next.includes('</head>') ? next.replace('</head>', `${style}</head>`) : style + next
  }
  if (photo && !next.includes('data-cep-sede-hero-photo="1"')) {
    const lock = sedeHeroLock(photo)
    next = next.includes('</body>') ? next.replace('</body>', `${lock}</body>`) : next + lock
  }
  if (next.includes('data-cep-sede-orgs="1"')) return next
  if (next.includes('</body>')) return next.replace('</body>', `${SEDE_ORGS_SCRIPT}</body>`)
  return next + SEDE_ORGS_SCRIPT
}

function areaChip(label: string): string {
  return `<span data-cep-area-badge="1" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">${label}</span>`
}

function replaceCourseChipRow(inner: string): string {
  return inner.replace(/<div class="flex flex-wrap gap-2">([\s\S]*?)<\/div>/gi, (full, chips: string) => {
    if (!/href="\/(?:cursos|ciclos)\//.test(chips) || chips.includes('data-cep-area-badge')) return full
    const titles = [...chips.matchAll(/<a\b[^>]*>([^<]*)<\/a>/gi)].map((match) => match[1].replace(/&amp;/g, '&').trim())
    const labels = areaLabelsForTitles(titles)
    if (!labels.length) return full
    return `<div data-cep-area-badges="campus" class="flex flex-wrap gap-2">${labels.map(areaChip).join('')}</div>`
  })
}

function fillSurCampusCards(html: string): string {
  return html.replace(/<article\b([^>]*)>([\s\S]*?)<\/article>/gi, (full, attrs: string, inner: string) => {
    if (!/CEP\s+(SUR|NORTE|SANTA CRUZ)\b/i.test(inner)) return full
    let body = replaceCourseChipRow(inner)
    if (!/CEP\s+SUR\b/i.test(body)) return `<article${attrs}>${body}</article>`
    if (!/<img\b/i.test(body)) {
      body = `<img src="${SUR_PHOTO}" alt="CEP SUR" class="h-56 w-full object-cover"/>${body}`
    }
    body = body.replace(/<div\b[^>]*data-cep-area-badges="sur"[^>]*>[\s\S]*?<\/div>/gi, '')
    return `<article${attrs}>${body}</article>`
  })
}

export function keepSedesCards(html: string, pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path !== '/sedes' && path !== '/p/sedes' && path !== '/ciclos' && path !== '/p/ciclos') return html
  return html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (full, attrs: string) => {
      if (/data-cep-/i.test(attrs)) return full
      if (/type=["']application\/ld\+json["']/i.test(attrs)) return full
      if (/__next|\/_next\//i.test(full)) return ''
      return full
    })
    .replace(/<script\b[^>]*src="[^"]*\/_next\/[^"]*"[^>]*>\s*<\/script>/gi, '')
    .replace(/<link\b[^>]*rel="(?:module)?preload"[^>]*\/_next\/[^>]*>/gi, '')
}

export function rewriteCampusPhotos(html: string): string {
  let next = fillSurCampusCards(html.split('/api/media/file/campus-sur.svg').join(SUR_PHOTO))
  next = next.replace(
    /(<img\b[^>]*\balt="CEP Sur"[^>]*\bsrc=")([^"]+)(")/gi,
    `$1${SUR_PHOTO}$3`,
  )
  next = next.replace(
    /(<img\b[^>]*\bsrc=")([^"]+)("[^>]*\balt="CEP Sur")/gi,
    `$1${SUR_PHOTO}$3`,
  )
  next = next.split('https://cepformacion.app.akademate.com').join('https://cepformacion.com')
  next = next.split('https://cepformacion.akademate.com/api/media/file/').join('/api/media/file/')
  return compactCampusCards(next)
}
