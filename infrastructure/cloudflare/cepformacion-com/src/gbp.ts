import { placeLegalBesideInfo } from './chrome-nav'

export type GbpSlug = 'sede-santa-cruz' | 'sede-norte' | 'cep-sur'

export type GbpProfile = {
  slug: GbpSlug
  footerLabel: string
  mapsQuery: string
  profileUrl: string
  embedUrl: string
  directionsUrl: string
}

function encodeQuery(query: string): string {
  return encodeURIComponent(query)
}

function profile(slug: GbpSlug, footerLabel: string, mapsQuery: string): GbpProfile {
  return {
    slug,
    footerLabel,
    mapsQuery,
    profileUrl: `https://www.google.com/maps/search/?api=1&query=${encodeQuery(mapsQuery)}`,
    embedUrl: `https://www.google.com/maps?hl=es&q=${encodeQuery(mapsQuery)}&z=14&iwloc=&output=embed`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeQuery(mapsQuery)}`,
  }
}

/** Keep in sync with apps/tenant-admin/app/lib/public-google-business.ts */
export const GBP_PROFILES: readonly GbpProfile[] = [
  profile(
    'sede-santa-cruz',
    'CEP Santa Cruz',
    'CEP Formación Santa Cruz, Plaza José Antonio Barrios Olivero, 38005 Santa Cruz de Tenerife',
  ),
  profile(
    'sede-norte',
    'CEP Norte',
    'CEP Formación Norte, C.C. El Trompo, Molinos de Gofio 2, 38312 La Orotava',
  ),
  profile(
    'cep-sur',
    'CEP Sur',
    'CENTRO FORMACION CEP SUR, Calle Arguayoda 3, 38611 San Isidro',
  ),
]

const PIN_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 shrink-0" fill="none"><path d="M12 22s7-7.2 7-12.2A7 7 0 0 0 5 9.8C5 14.8 12 22 12 22Z" fill="#f2014b"/><circle cx="12" cy="9.5" r="2.4" fill="#fff"/></svg>'

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function sedeSlugFromPath(pathname: string): GbpSlug | null {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  const match = path.match(/\/(?:p|site)?\/?sedes\/([^/]+)$/i)
  if (!match) return null
  const slug = decodeURIComponent(match[1]).toLowerCase()
  if (slug === 'sede-santa-cruz' || slug === 'santa-cruz') return 'sede-santa-cruz'
  if (slug === 'sede-norte' || slug === 'norte') return 'sede-norte'
  if (slug === 'cep-sur' || slug === 'sede-cep-sur') return 'cep-sur'
  return null
}

function profileBySlug(slug: GbpSlug): GbpProfile {
  const found = GBP_PROFILES.find((item) => item.slug === slug)
  if (!found) throw new Error(`missing GBP profile ${slug}`)
  return found
}

function footerNavHtml(): string {
  const links = GBP_PROFILES.map(
    (item) =>
      `<a href="${escapeAttr(item.profileUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-[#f2014b]">${PIN_SVG}<span>Google, ${item.footerLabel}</span></a>`,
  ).join('')
  return `<nav aria-label="Perfiles de Google" data-cep-gbp-footer="1" class="mt-4 flex flex-col gap-2">${links}</nav>`
}

function sedeCardHtml(slug: GbpSlug): string {
  const item = profileBySlug(slug)
  const label = item.footerLabel
  return `<div data-cep-gbp-card="1" class="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">
<p class="text-xs font-semibold text-[#f2014b]">Google</p>
<h2 class="mt-1 text-lg font-semibold text-slate-950">Cómo llegar</h2>
<iframe data-cep-gbp-map="1" title="Mapa de ${label}" src="${escapeAttr(item.embedUrl)}" class="mt-4 w-full rounded-2xl border border-slate-200 bg-white" style="height:70vh;min-height:28rem;max-height:36rem" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
<a href="${escapeAttr(item.directionsUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 rounded-full bg-[#f2014b] px-5 py-3 text-sm font-semibold text-white">${PIN_SVG}Cómo llegar</a>
<a href="${escapeAttr(item.profileUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800">Ver ficha y reseñas</a>
</div>
</div>`
}

function sedesColumnHtml(): string {
  return `<div data-cep-sedes-footer="1"><h3 class="text-sm font-semibold text-slate-900">Sedes</h3><div class="mt-4 space-y-4 text-sm text-slate-700"><p><span class="block font-semibold text-slate-900">Santa Cruz</span>Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005</p><p><span class="block font-semibold text-slate-900">Norte</span>Molinos de Gofio 2, 38312 La Orotava (C.C. El Trompo, última planta)</p><p><span class="block font-semibold text-slate-900">CEP Sur</span>Calle Arguayoda 3, 38611 San Isidro, Santa Cruz de Tenerife</p></div></div>`
}

const SOCIAL_ASSET_PATHS = new Set([
  '/logos/social-facebook.png',
  '/logos/social-instagram.png',
  '/logos/social-linkedin.png',
])

export function isSocialAssetPath(pathname: string): boolean {
  return SOCIAL_ASSET_PATHS.has(pathname)
}

function socialNavHtml(): string {
  const links = [
    ['Facebook', 'https://www.facebook.com/cepsantacruz', '/logos/social-facebook.png'],
    ['Instagram', 'https://www.instagram.com/cep_formacion', '/logos/social-instagram.png'],
    ['LinkedIn', 'https://www.linkedin.com/company/cep-santa-cruz', '/logos/social-linkedin.png'],
  ]
    .map(
      ([label, href, src]) =>
        `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}"><img src="${src}" alt="${label}" width="36" height="36" style="display:block;width:36px;height:36px"></a>`,
    )
    .join('')
  return `<nav data-cep-social="1" aria-label="Redes sociales" class="mt-4 flex items-center gap-3">${links}</nav>`
}

function insertSocialNav(html: string): string {
  if (html.includes('data-cep-social="1"')) return html
  const nav = socialNavHtml()
  const logoColumn = html.replace(
    /(<footer\b[\s\S]*?<div class="[^"]*lg:items-start[^"]*">[\s\S]*?<\/p>)/i,
    `$1${nav}`,
  )
  if (logoColumn !== html) return logoColumn
  const afterLogo = html.replace(/(<footer\b[\s\S]*?<img\b[^>]*>[\s\S]*?<\/p>)/i, `$1${nav}`)
  if (afterLogo !== html) return afterLogo
  return html.replace(/<footer\b[^>]*>/i, (open) => `${open}${nav}`)
}

function placeFooterChrome(html: string): string {
  let next = insertSocialNav(html)
  const badgeRe =
    /<div class="flex flex-nowrap items-center justify-center gap-3 lg:justify-end mt-2" aria-label="Información regulatoria">[\s\S]*?<\/div>/i
  const badge = next.match(badgeRe)
  const legal = next.match(/(<h3[^>]*>Legal<\/h3>\s*<ul\b[^>]*>[\s\S]*?<\/ul>)/i)
  if (badge && legal && !legal[0].includes('Información regulatoria')) {
    const moved = badge[0].replace('lg:justify-end', 'justify-start')
    next = next.replace(badge[0], '')
    next = next.replace(legal[0], `${legal[0]}${moved}`)
  }
  return next
}

function injectFooter(html: string): string {
  if (/<[a-z][^>]*\sdata-cep-(?:gbp|sedes)-footer="1"/i.test(html)) return html
  if (/>Sedes<\/h3>/i.test(html)) return html
  const gridInsert = html.replace(
    /(<div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-)(\d+)( lg:px-8">\s*<div class="flex flex-col items-center lg:items-start">[\s\S]*?<\/div>)/i,
    (_, open, cols, rest) => `${open}${Number(cols) + 1}${rest}${sedesColumnHtml()}`,
  )
  if (gridInsert !== html) return gridInsert
  const ofertaInsert = html.replace(
    /(<div>\s*<h3[^>]*>Oferta formativa<\/h3>)/i,
    `${sedesColumnHtml()}$1`,
  )
  if (ofertaInsert !== html) return ofertaInsert
  const grid = html.match(/<div class="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-5 lg:px-8">/i)
  if (grid && grid.index !== undefined) {
    const openEnd = html.indexOf('>', grid.index) + 1
    const firstClose = html.indexOf('</div>', openEnd)
    if (firstClose !== -1) {
      const at = firstClose + '</div>'.length
      return html.slice(0, grid.index)
        + html.slice(grid.index, openEnd).replace('lg:grid-cols-5', 'lg:grid-cols-6')
        + html.slice(openEnd, at)
        + sedesColumnHtml()
        + html.slice(at)
    }
  }
  if (!/<\/footer>/i.test(html)) return html
  return html.replace(/<\/footer>/i, `${sedesColumnHtml()}</footer>`)
}

function injectSedeMap(html: string, slug: GbpSlug): string {
  if (/data-cep-gbp-map="1"/i.test(html) || /data-cep-gbp-card="1"/i.test(html)) return html
  const card = sedeCardHtml(slug)
  const replacedBox = html.replace(
    /<div class="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8">\s*<h2[^>]*>Cómo llegar<\/h2>\s*<div[\s\S]*?<\/div>\s*<\/div>/i,
    card,
  )
  if (replacedBox !== html) return replacedBox
  return html.replace(/(<h2[^>]*>Cómo llegar<\/h2>)/i, `${card}$1`)
}

function openMapLayoutCss(): string {
  return `<style data-cep-gbp-open="1">section:has([data-cep-gbp-card]){grid-template-columns:1fr!important}iframe[data-cep-gbp-map]{width:100%;height:70vh;min-height:28rem;max-height:36rem}
footer .bg-slate-50.py-12{padding-top:2.25rem;padding-bottom:2.25rem}
@media (min-width:768px){
  footer div.mx-auto.grid[class*="lg:grid-cols-6"]{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1.5rem 2rem!important;align-items:start!important}
  footer div.mx-auto.grid[class*="lg:grid-cols-5"]{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:1.5rem 2rem!important;align-items:start!important}
  footer .flex.flex-col.items-center{align-items:flex-start!important}
}
@media (min-width:768px) and (max-width:1099px){
  footer [data-cep-footer="info"]{grid-column:3;grid-row:2}
}
@media (min-width:1100px){
  footer div.mx-auto.grid[class*="lg:grid-cols-6"]{grid-template-columns:repeat(6,minmax(0,1fr))!important}
  footer div.mx-auto.grid[class*="lg:grid-cols-5"]{grid-template-columns:repeat(5,minmax(0,1fr))!important}
  footer [data-cep-footer="info"]{grid-column:auto;grid-row:auto}
}</style>`
}

function injectLock(html: string): string {
  if (html.includes('data-cep-gbp-lock="1"')) return html
  const profilesJson = JSON.stringify(GBP_PROFILES)
  const script = `${openMapLayoutCss()}<script data-cep-gbp-lock="1">
(function () {
  if (window.__cepGbpLock) return;
  window.__cepGbpLock = 1;
  var PROFILES = ${profilesJson};
  function pinSvg() {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'h-4 w-4 shrink-0');
    var path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M12 22s7-7.2 7-12.2A7 7 0 0 0 5 9.8C5 14.8 12 22 12 22Z');
    path.setAttribute('fill', '#f2014b');
    var circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '9.5');
    circle.setAttribute('r', '2.4');
    circle.setAttribute('fill', '#fff');
    svg.appendChild(path);
    svg.appendChild(circle);
    return svg;
  }
  function slugFromPath() {
    var path = (location.pathname || '').replace(/\\/+$/, '') || '/';
    var match = path.match(/\\/(?:p|site)?\\/?sedes\\/([^/]+)$/i);
    if (!match) return null;
    var slug = decodeURIComponent(match[1]).toLowerCase();
    if (slug === 'sede-santa-cruz' || slug === 'santa-cruz') return 'sede-santa-cruz';
    if (slug === 'sede-norte' || slug === 'norte') return 'sede-norte';
    if (slug === 'cep-sur' || slug === 'sede-cep-sur') return 'cep-sur';
    return null;
  }
  function profileBySlug(slug) {
    for (var i = 0; i < PROFILES.length; i += 1) {
      if (PROFILES[i].slug === slug) return PROFILES[i];
    }
    return null;
  }
  function addressParagraph(name, line) {
    var p = document.createElement('p');
    var strong = document.createElement('span');
    strong.className = 'block font-semibold text-slate-900';
    strong.textContent = name;
    p.appendChild(strong);
    p.appendChild(document.createTextNode(line));
    return p;
  }
  function googleNav() {
    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Perfiles de Google');
    nav.setAttribute('data-cep-gbp-footer', '1');
    nav.className = 'mt-4 flex flex-col gap-2';
    for (var i = 0; i < PROFILES.length; i += 1) {
      var item = PROFILES[i];
      var link = document.createElement('a');
      link.setAttribute('href', item.profileUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.className = 'inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-[#f2014b]';
      link.appendChild(pinSvg());
      var label = document.createElement('span');
      label.textContent = 'Google, ' + item.footerLabel;
      link.appendChild(label);
      nav.appendChild(link);
    }
    return nav;
  }
  function buildSedesColumn() {
    var col = document.createElement('div');
    col.setAttribute('data-cep-sedes-footer', '1');
    var title = document.createElement('h3');
    title.className = 'text-sm font-semibold text-slate-900';
    title.textContent = 'Sedes';
    var list = document.createElement('div');
    list.className = 'mt-4 space-y-4 text-sm text-slate-700';
    list.appendChild(addressParagraph('Santa Cruz', 'Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005'));
    list.appendChild(addressParagraph('Norte', 'Molinos de Gofio 2, 38312 La Orotava (C.C. El Trompo, última planta)'));
    list.appendChild(addressParagraph('CEP Sur', 'Calle Arguayoda 3, 38611 San Isidro, Santa Cruz de Tenerife'));
    col.appendChild(title);
    col.appendChild(list);
    return col;
  }
  function footerGrid() {
    var footer = document.querySelector('footer');
    if (!footer) return null;
    var grids = footer.querySelectorAll('div.mx-auto.grid, div[class*="lg:grid-cols-"]');
    for (var i = 0; i < grids.length; i += 1) {
      if (grids[i].querySelector('h3')) return grids[i];
    }
    return null;
  }
  function ensureFooter() {
    var existing = document.querySelector('[data-cep-sedes-footer="1"]');
    var grid = footerGrid();
    if (existing) {
      if (grid && existing.parentNode !== grid) {
        var oferta = null;
        Array.prototype.forEach.call(grid.children, function (child) {
          if (oferta) return;
          var h3 = child.querySelector && child.querySelector('h3');
          if (h3 && (h3.textContent || '').replace(/\\s+/g, ' ').trim() === 'Oferta formativa') oferta = child;
        });
        if (oferta) grid.insertBefore(existing, oferta);
        else if (grid.children.length > 1) grid.insertBefore(existing, grid.children[1]);
        else grid.appendChild(existing);
      }
      return;
    }
    var heading = null;
    Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
      if (heading) return;
      if ((node.textContent || '').replace(/\\s+/g, ' ').trim() === 'Sedes') heading = node;
    });
    if (!heading) {
      if (!grid) return;
      var col = buildSedesColumn();
      var ofertaCol = null;
      Array.prototype.forEach.call(grid.children, function (child) {
        if (ofertaCol) return;
        var h3 = child.querySelector && child.querySelector('h3');
        if (h3 && (h3.textContent || '').replace(/\\s+/g, ' ').trim() === 'Oferta formativa') ofertaCol = child;
      });
      if (ofertaCol) grid.insertBefore(col, ofertaCol);
      else if (grid.children.length > 1) grid.insertBefore(col, grid.children[1]);
      else grid.appendChild(col);
    }
  }
  function ensureSedeMap() {
    if (document.querySelector('[data-cep-gbp-map="1"]')) return;
    var slug = slugFromPath();
    var item = slug ? profileBySlug(slug) : null;
    if (!item) return;
    var heading = null;
    Array.prototype.forEach.call(document.querySelectorAll('h2'), function (node) {
      if (heading) return;
      if ((node.textContent || '').replace(/\\s+/g, ' ').trim() === 'Cómo llegar') heading = node;
    });
    if (!heading || !heading.parentNode) return;
    var parent = heading.parentNode;
    var sibling = heading.nextElementSibling;
    while (sibling) {
      var remove = sibling;
      sibling = sibling.nextElementSibling;
      if (remove.parentNode) remove.parentNode.removeChild(remove);
    }
    var iframe = document.createElement('iframe');
    iframe.setAttribute('data-cep-gbp-map', '1');
    iframe.setAttribute('title', 'Mapa de ' + item.footerLabel);
    iframe.setAttribute('src', item.embedUrl);
    iframe.setAttribute('class', 'mt-4 w-full rounded-2xl border border-slate-200 bg-white');
    iframe.setAttribute('style', 'height:70vh;min-height:28rem;max-height:36rem');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allowfullscreen', '');
    parent.appendChild(iframe);
    var actions = document.createElement('div');
    actions.className = 'mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap';
    var dir = document.createElement('a');
    dir.setAttribute('href', item.directionsUrl);
    dir.setAttribute('target', '_blank');
    dir.setAttribute('rel', 'noopener noreferrer');
    dir.className = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#f2014b] px-5 py-3 text-sm font-semibold text-white';
    dir.appendChild(pinSvg());
    dir.appendChild(document.createTextNode('Cómo llegar'));
    var reviews = document.createElement('a');
    reviews.setAttribute('href', item.profileUrl);
    reviews.setAttribute('target', '_blank');
    reviews.setAttribute('rel', 'noopener noreferrer');
    reviews.className = 'inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800';
    reviews.textContent = 'Ver ficha y reseñas';
    actions.appendChild(dir);
    actions.appendChild(reviews);
    parent.appendChild(actions);
    parent.setAttribute('data-cep-gbp-card', '1');
  }
  function openLayout() {
    var card = document.querySelector('[data-cep-gbp-card="1"]');
    if (!card) return;
    var section = card.closest('section');
    if (section) section.style.setProperty('grid-template-columns', '1fr', 'important');
    var map = document.querySelector('[data-cep-gbp-map="1"]');
    if (map) {
      map.style.height = '70vh';
      map.style.minHeight = '28rem';
      map.style.maxHeight = '36rem';
      map.style.width = '100%';
    }
  }
  function placeSocial() {
    if (document.querySelector('[data-cep-social="1"]')) return;
    var footer = document.querySelector('footer');
    if (!footer) return;
    var logo = footer.querySelector('.lg\\\\:items-start');
    if (!logo) {
      var img = footer.querySelector('img');
      logo = img && img.parentElement ? img.parentElement : footer;
    }
    var nav = document.createElement('nav');
    nav.setAttribute('data-cep-social', '1');
    nav.setAttribute('aria-label', 'Redes sociales');
    nav.className = 'mt-4 flex items-center gap-3';
    var items = [
      ['Facebook', 'https://www.facebook.com/cepsantacruz', '/logos/social-facebook.png'],
      ['Instagram', 'https://www.instagram.com/cep_formacion', '/logos/social-instagram.png'],
      ['LinkedIn', 'https://www.linkedin.com/company/cep-santa-cruz', '/logos/social-linkedin.png']
    ];
    for (var i = 0; i < items.length; i += 1) {
      var link = document.createElement('a');
      link.setAttribute('href', items[i][1]);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('aria-label', items[i][0]);
      var img = document.createElement('img');
      img.setAttribute('src', items[i][2]);
      img.setAttribute('alt', items[i][0]);
      img.setAttribute('width', '36');
      img.setAttribute('height', '36');
      img.setAttribute('style', 'display:block;width:36px;height:36px');
      link.appendChild(img);
      nav.appendChild(link);
    }
    logo.appendChild(nav);
  }
  function placeMarks() {
    var marks = document.querySelector('[aria-label="Información regulatoria"]');
    if (!marks) return;
    var legal = null;
    Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
      if (legal) return;
      if ((node.textContent || '').replace(/\\s+/g, ' ').trim() === 'Legal') legal = node;
    });
    if (!legal || !legal.parentNode) return;
    if (marks.parentNode === legal.parentNode) return;
    marks.className = String(marks.className || '').replace('lg:justify-end', 'justify-start');
    legal.parentNode.appendChild(marks);
  }
  function ensureInfoColumn() {
    var col = null;
    Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
      if (col) return;
      if ((node.textContent || '').replace(/\\s+/g, ' ').trim() === 'Información' && node.parentNode) col = node.parentNode;
    });
    if (!col) return;
    col.setAttribute('data-cep-footer', 'info');
    var list = col.querySelector('ul');
    if (!list) return;
    var found = false;
    Array.prototype.forEach.call(list.querySelectorAll('a'), function (link) {
      var href = String(link.getAttribute('href') || '').split('?')[0];
      var text = (link.textContent || '').replace(/\\s+/g, ' ').trim();
      if (href === '/transparencia' || text === 'Transparencia') found = true;
    });
    if (found) return;
    var item = document.createElement('li');
    var link = document.createElement('a');
    link.setAttribute('href', '/transparencia');
    link.textContent = 'Transparencia';
    var sample = list.querySelector('a');
    link.className = sample && sample.className ? sample.className : 'transition brand-hover';
    item.appendChild(link);
    list.appendChild(item);
  }
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('[data-cep-gbp-footer="1"]').forEach(function (nav) {
      if (nav.parentNode) nav.parentNode.removeChild(nav);
    });
    ensureFooter();
    ensureInfoColumn();
    var infoCol = document.querySelector('footer [data-cep-footer="info"]');
    var legalHeading = null;
    Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
      if (legalHeading) return;
      if ((node.textContent || '').replace(/\\s+/g, ' ').trim() === 'Legal') legalHeading = node;
    });
    if (infoCol && legalHeading && legalHeading.parentElement && legalHeading.parentElement !== infoCol && !infoCol.contains(legalHeading)) {
      var legalBlock = legalHeading.parentElement;
      legalBlock.style.marginTop = '';
      if (infoCol.nextElementSibling !== legalBlock && infoCol.parentNode) infoCol.parentNode.insertBefore(legalBlock, infoCol.nextSibling);
    }
    placeSocial();
    placeMarks();
    ensureSedeMap();
    openLayout();
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [400, 1200, 3000, 8000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 12000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

function markInfoColumn(html: string): string {
  const marked = html.replace(
    /(<div\b)([^>]*)(>\s*<h3\b[^>]*>\s*Información\s*<\/h3>)/i,
    (full, open: string, attrs: string, rest: string) => (
      /data-cep-footer=/.test(attrs) ? full : `${open}${attrs} data-cep-footer="info"${rest}`
    ),
  )
  return marked.replace(
    /(<h3\b[^>]*>\s*Información\s*<\/h3>\s*<ul\b[^>]*>)([\s\S]*?)(<\/ul>)/i,
    (full, open: string, inner: string, close: string) => (
      inner.includes('href="/transparencia"') || />\s*Transparencia\s*</.test(inner)
        ? full
        : `${open}${inner}<li><a href="/transparencia" class="transition brand-hover">Transparencia</a></li>${close}`
    ),
  )
}

export function rewriteGoogleBusiness(html: string, pathname = ''): string {
  if (html.includes('data-cep-gbp-lock="1"')) return html
  let next = placeLegalBesideInfo(markInfoColumn(placeFooterChrome(injectFooter(html))))
  next = next.replace(/<nav\b[^>]*data-cep-gbp-footer="1"[^>]*>[\s\S]*?<\/nav>/gi, '')
  const slug = sedeSlugFromPath(pathname)
  if (slug) next = injectSedeMap(next, slug)
  return injectLock(next)
}
