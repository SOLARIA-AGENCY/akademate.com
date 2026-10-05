const FOOTER_LINK_CLASS = 'transition hover:text-slate-950'

function injectHeaderChrome(header: string): string {
  return header
    .replace(/<a href="\/aproem"[^>]*>\s*APROEM\s*<\/a>/g, '')
    .replace(/<a href="[^"]*nuevas-formaciones[^"]*"[^>]*>\s*Nuevas formaciones\s*<\/a>/gi, '')
    .replace(/<a\b[^>]*href="\/(?:p\/)?blog"[^>]*>\s*Blog\s*<\/a>/gi, '')
    .replace(/<a\b[^>]*href="\/(?:p\/)?noticias"[^>]*>\s*Noticias\s*<\/a>/gi, '')
    .replace(/<a\b[^>]*href="\/(?:p\/)?faq"[^>]*>\s*FAQ\s*<\/a>/gi, '')
    .replace(/<a\b[^>]*href="\/(?:p\/)?empleo"[^>]*>\s*Bolsa de (?:trabajo|empleo)\s*<\/a>/gi, '')
}

function stripHeaderLinks(html: string): string {
  return html.replace(/<header[\s\S]*?<\/header>/i, (header) => injectHeaderChrome(header))
}

export function placeCampusOnPortalNav(html: string): string {
  if (!html.includes('data-cep-transparency-page=')) return html
  return html.replace(/<header\b[\s\S]*?<\/header>/i, (header) => {
    const campusMatch = header.match(/<a\b[^>]*href="\/campus"[^>]*>[\s\S]*?<\/a>/i)
    if (!campusMatch || campusMatch.index === undefined) return header
    const navStart = header.indexOf('<nav')
    const navEnd = header.indexOf('</nav>')
    if (navStart < 0 || navEnd < 0) return header
    if (campusMatch.index > navStart && campusMatch.index < navEnd) return header
    return header.replace(campusMatch[0], '').replace('</nav>', `${campusMatch[0]}</nav>`)
  })
}

function stripLegalBlog(html: string): string {
  return html.replace(
    /(<nav aria-label="Páginas legales"[^>]*>)([\s\S]*?)(<\/nav>)/i,
    (_match, open: string, inner: string, close: string) =>
      `${open}${inner.replace(/<a href="\/(?:p\/)?blog"[^>]*>\s*Blog\s*<\/a>/g, '')}${close}`,
  )
}

function injectParticipaBlog(html: string): string {
  if (!/>Participa<\/h3>/.test(html)) return html
  return html.replace(
    /(<h3[^>]*>Participa<\/h3>\s*<ul[^>]*>)([\s\S]*?)(<\/ul>)/i,
    (_match, open: string, inner: string, close: string) => {
      let list = inner
      for (const [href, label] of [
        ['/blog', 'Blog'],
        ['/noticias', 'Noticias'],
        ['/faq', 'FAQ'],
      ] as const) {
        if (list.includes(`href="${href}"`) || list.includes(`>${label}<`)) continue
        list += `<li><a href="${href}" class="transition hover:text-[#f2014b]">${label}</a></li>`
      }
      return `${open}${list}${close}`
    },
  )
}

function injectInfoLinks(html: string): string {
  if (!/>\s*Información\s*<\/h3>/i.test(html)) return html
  return html.replace(
    /(<h3[^>]*>\s*Información\s*<\/h3>\s*<ul[^>]*>)([\s\S]*?)(<\/ul>)/i,
    (_match, open: string, inner: string, close: string) => {
      let list = inner
      if (!list.includes('href="/noticias"') && !list.includes('>Noticias<')) {
        const item = `<li><a href="/noticias" class="transition brand-hover">Noticias</a></li>`
        list = list.includes('href="/blog"')
          ? list.replace(/(<a\b[^>]*href="\/blog"[^>]*>\s*Blog\s*<\/a>\s*<\/li>)/i, `$1${item}`)
          : `${item}${list}`
      }
      if (!list.includes('href="/faq"') && !list.includes('>FAQ<')) {
        const item = `<li><a href="/faq" class="transition brand-hover">FAQ</a></li>`
        list = list.includes('href="/noticias"')
          ? list.replace(/(<a\b[^>]*href="\/noticias"[^>]*>\s*Noticias\s*<\/a>\s*<\/li>)/i, `$1${item}`)
          : `${item}${list}`
      }
      return `${open}${list}${close}`
    },
  )
}

function injectFooterLinks(html: string): string {
  let next = stripLegalBlog(html)
  next = injectParticipaBlog(next)
  next = injectInfoLinks(next)
  next = next.replace(
    /<a\b[^>]*href="\/legal\/ia"[^>]*>\s*Transparencia y AI Act\s*<\/a>/gi,
    `<a href="/transparencia" class="${FOOTER_LINK_CLASS}">Transparencia</a>`,
  )
  next = next.replaceAll('aria-label="Transparencia y AI Act"', 'aria-label="AI Act"')
  return parkLegalColumn(next)
}

const ACCESSIBILITY_DECLARATIONS: Array<[string, string, string]> = [
  ['Declaración de Accesibilidad APROEM', '/transparencia/aproem/10-otros/declaracion-de-accesibilidad.pdf', '/transparencia/aproem/10-otros/declaracion-de-accesibilidad.odt'],
  ['Declaración de Accesibilidad ACATEN 2020 SL', '/transparencia/acaten/10-otros/declaracion-de-accesibilidad.pdf', '/transparencia/acaten/10-otros/declaracion-de-accesibilidad.odt'],
]

function appendAccessibilityDeclarations(list: string): string {
  let next = list
  for (const [label, pdf, odt] of ACCESSIBILITY_DECLARATIONS) {
    if (next.includes(`href="${pdf}"`)) continue
    next += `<li>${label} <a href="${pdf}" class="transition brand-hover">(PDF)</a> <a href="${odt}" class="transition brand-hover">(ODT)</a></li>`
  }
  return next
}

const LEGAL_COLUMN_LINKS: Array<[string, string]> = [
  ['/legal', 'Centro legal'],
  ['/transparencia', 'Transparencia'],
  ['/legal/privacidad', 'Privacidad'],
  ['/legal/terminos', 'Términos'],
  ['/legal/cookies', 'Cookies'],
  ['/legal/subencargados', 'Subencargados'],
  ['/legal/accesibilidad', 'Accesibilidad'],
]

function parkLegalColumn(html: string): string {
  const nav = html.match(/<nav aria-label="Páginas legales"[^>]*>[\s\S]*?<\/nav>/i)
  const cookie = nav?.[0].match(/<button\b[^>]*>\s*Preferencias de cookies\s*<\/button>/i)?.[0] || ''
  let next = html
  if (/>\s*Legal\s*<\/h3>/.test(next)) {
    next = next.replace(
      /(<h3[^>]*>\s*Legal\s*<\/h3>\s*<ul[^>]*>)([\s\S]*?)(<\/ul>)/i,
      (_match, open: string, inner: string, close: string) => {
        let list = inner
        for (const [href, label] of LEGAL_COLUMN_LINKS) {
          if (list.includes(`href="${href}"`) || list.includes(`href="/p${href}"`)) continue
          list += `<li><a href="${href}" class="transition brand-hover">${label}</a></li>`
        }
        if (cookie && !list.includes('Preferencias de cookies')) list += `<li>${cookie}</li>`
        list = appendAccessibilityDeclarations(list)
        return `${open}${list}${close}`
      },
    )
  }
  return placeLegalBesideInfo(next.replace(/<nav aria-label="Páginas legales"[^>]*>[\s\S]*?<\/nav>/i, ''))
}

function endOfDiv(html: string, openStart: number): number {
  let depth = 0
  let cursor = openStart
  while (cursor < html.length) {
    const nextOpen = html.indexOf('<div', cursor)
    const nextClose = html.indexOf('</div>', cursor)
    if (nextClose < 0) return -1
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1
      cursor = nextOpen + 4
      continue
    }
    depth -= 1
    cursor = nextClose + '</div>'.length
    if (depth === 0) return cursor
  }
  return -1
}

function columnBlock(block: string): string {
  return block
    .replace(/^<div class="mt-8">/, '<div>')
    .replace(/^<div style="margin-top:\s*2rem;?">/, '<div>')
}

export function placeLegalBesideInfo(html: string): string {
  const infoMatch = html.match(/<h3[^>]*>\s*Información\s*<\/h3>/i)
  const legalMatch = html.match(/<h3[^>]*>\s*Legal\s*<\/h3>/i)
  if (!infoMatch || !legalMatch || infoMatch.index === undefined || legalMatch.index === undefined) return html
  const infoOpen = html.lastIndexOf('<div', infoMatch.index)
  const infoEnd = endOfDiv(html, infoOpen)
  const legalOpen = html.lastIndexOf('<div', legalMatch.index)
  const legalEnd = endOfDiv(html, legalOpen)
  if (infoOpen < 0 || infoEnd < 0 || legalOpen < 0 || legalEnd < 0) return html
  if (legalOpen >= infoOpen && legalEnd <= infoEnd) return html
  const beside = legalOpen >= infoEnd && html.slice(infoEnd, legalOpen).trim() === ''
  if (beside) {
    const current = html.slice(legalOpen, legalEnd)
    const cleaned = columnBlock(current)
    if (cleaned === current) return html
    return html.slice(0, legalOpen) + cleaned + html.slice(legalEnd)
  }
  const block = columnBlock(html.slice(legalOpen, legalEnd))
  const without = html.slice(0, legalOpen) + html.slice(legalEnd)
  const infoMatch2 = without.match(/<h3[^>]*>\s*Información\s*<\/h3>/i)
  if (!infoMatch2 || infoMatch2.index === undefined) return html
  const infoOpen2 = without.lastIndexOf('<div', infoMatch2.index)
  const infoEnd2 = endOfDiv(without, infoOpen2)
  if (infoEnd2 < 0) return html
  return without.slice(0, infoEnd2) + block + without.slice(infoEnd2)
}

const HEADER_STEADY_CSS = `<style data-cep-chrome-nav-css="1">
header.fixed{transform:none!important;transition:none!important}
header a[href="/aproem"],header a[href="/p/aproem"],header a[href*="nuevas-formaciones"]{display:none!important}
header nav{flex:1 1 auto;min-width:0;justify-content:flex-end}
header [data-cep-header-tools]{display:flex;align-items:center;gap:.75rem;flex:0 0 auto;margin-left:.75rem;background:#fff;position:relative;z-index:5}
html[data-cep-transparency-page] header.fixed{position:sticky!important;top:0}
html[data-cep-transparency-page] header.fixed ~ main{padding-top:0!important}
html[data-cep-transparency-page] header div.flex.h-12{height:auto!important;min-height:3.5rem;flex-wrap:wrap;align-items:center;row-gap:.35rem;padding-top:.35rem;padding-bottom:.4rem}
html[data-cep-transparency-page] header div.flex.h-12 > a:first-child{order:1}
html[data-cep-transparency-page] header div.flex.h-12 > [data-cep-header-tools]{order:2;margin-left:auto}
@media (min-width: 1024px){
html[data-cep-transparency-page] header div.flex.h-12 > button{display:none!important}
html[data-cep-transparency-page] header div.flex.h-12 > nav{order:4;display:flex!important;flex:1 0 100%;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:.4rem .85rem;min-width:0;overflow:visible;padding:.15rem 0 .1rem}
}
html[data-cep-transparency-page] header div.flex.h-12 > nav > a,html[data-cep-transparency-page] header div.flex.h-12 > nav > .group{white-space:nowrap}
header a[href="/transparencia"]{white-space:nowrap}
header form[data-cep-header-search]{display:flex;align-items:center}
header form[data-cep-header-search] input{width:9.5rem;height:2rem;border:1px solid #e4e4e7;border-radius:.5rem;padding:0 .65rem;font:inherit;font-size:.85rem;color:#150702;background:#fff}
@media (max-width: 1023px){
header [data-cep-header-tools]{flex:1 1 auto;min-width:0;justify-content:flex-end;gap:.4rem}
header [data-cep-header-tools] > a[href="/transparencia"]{display:none!important}
header form[data-cep-header-search]{flex:1 1 8rem;min-width:6.5rem;max-width:9.5rem}
header form[data-cep-header-search] input{width:100%;min-width:0}
header [data-cep-header-tools] a[href="/campus"]{flex:0 0 auto;white-space:nowrap}
}
#public-mobile-menu{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;pointer-events:none!important}
header nav .group>div{visibility:hidden!important;opacity:0!important;pointer-events:none!important;transform:translateY(8px)!important}
header nav .group:hover>div{visibility:visible!important;opacity:1!important;pointer-events:auto!important;transform:none!important}
</style>`

const DROPPED_HEADER_NAV: Array<[string, string]> = [
  ['Nuevas formaciones', '/#nuevas-formaciones'],
  ['APROEM', '/aproem'],
  ['Blog', '/blog'],
  ['Noticias', '/noticias'],
  ['FAQ', '/faq'],
]

function dropEscapedNavItem(html: string, label: string, href: string): string {
  const item = `{\\"label\\":\\"${label}\\",\\"href\\":\\"${href}\\",\\"kind\\":\\"link\\",\\"source\\":\\"$undefined\\",\\"children\\":\\"$undefined\\"}`
  return html.split(`,${item}`).join('').split(`${item},`).join('')
}

/** Header HTML already drops these links. The flight must drop them too, or React paints them back. */
function rewriteChromeFlight(html: string): string {
  let next = html
  for (const [label, href] of DROPPED_HEADER_NAV) next = dropEscapedNavItem(next, label, href)
  next = next.split(',{\\"label\\":\\"Bolsa de empleo\\",\\"href\\":\\"/empleo\\"}').join('')
  next = next.split('{\\"label\\":\\"Bolsa de empleo\\",\\"href\\":\\"/empleo\\"},').join('')
  next = next.split(',{\\"label\\":\\"Bolsa de trabajo\\",\\"href\\":\\"/empleo\\"}').join('')
  next = next.split('{\\"label\\":\\"Bolsa de trabajo\\",\\"href\\":\\"/empleo\\"},').join('')
  next = next.split(',{\\"children\\":\\"Bolsa de empleo\\"}').join('')
  next = next.split(',{\\"children\\":\\"Bolsa de trabajo\\"}').join('')
  return next
}

export function rewriteChromeNav(html: string): string {
  if (html.includes('data-cep-chrome-nav-lock="1"')) return html
  let next = stripHeaderLinks(rewriteChromeFlight(html))
  next = injectFooterLinks(next)
  next = next.includes('</head>')
    ? next.replace('</head>', `${HEADER_STEADY_CSS}</head>`)
    : HEADER_STEADY_CSS + next
  return injectLock(next)
}

function injectLock(html: string): string {
  const script = `<script data-cep-chrome-nav-lock="1">
(function () {
  if (window.__cepChromeNavLock) return;
  window.__cepChromeNavLock = 1;
  function textOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }
  function hrefOf(el) {
    var href = String(el.getAttribute('href') || '');
    var path = href.split('?')[0];
    return path;
  }
  function isHeaderDrop(label, href) {
    if (label === 'APROEM' || href === '/aproem' || href === '/p/aproem') return true;
    if (label === 'Blog' || href === '/blog' || href === '/p/blog') return true;
    if (label === 'Noticias' || href === '/noticias' || href === '/p/noticias') return true;
    if (label === 'FAQ' || href === '/faq' || href === '/p/faq') return true;
    if (label === 'Nuevas formaciones' || href.indexOf('nuevas-formaciones') !== -1) return true;
    return false;
  }
  function ensureFooterLink(nav, href, label, beforeHrefs) {
    var found = false;
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (link) {
      if (hrefOf(link) === href || textOf(link) === label) found = true;
    });
    if (found) return;
    var link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = label;
    var sample = nav.querySelector('a');
    link.className = sample && sample.className ? sample.className : '${FOOTER_LINK_CLASS}';
    var before = null;
    var candidates = beforeHrefs || [];
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (item) {
      if (before) return;
      for (var i = 0; i < candidates.length; i += 1) {
        if (hrefOf(item) === candidates[i]) {
          before = item;
          break;
        }
      }
    });
    if (before) nav.insertBefore(link, before);
    else nav.appendChild(link);
  }
  function removeLegalBlog(nav) {
    Array.prototype.slice.call(nav.querySelectorAll('a')).forEach(function (link) {
      if (hrefOf(link) !== '/blog' && hrefOf(link) !== '/p/blog' && textOf(link) !== 'Blog') return;
      if (link.parentNode) link.parentNode.removeChild(link);
    });
  }
  function ensureParticipaBlog() {
    var heading = null;
    Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
      if (heading) return;
      if (textOf(node) === 'Participa') heading = node;
    });
    if (!heading) return;
    var list = heading.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;
    function ensureItem(href, label) {
      var found = false;
      Array.prototype.forEach.call(list.querySelectorAll('a'), function (link) {
        if (hrefOf(link) === href || textOf(link) === label) found = true;
      });
      if (found) return;
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = label;
      var sample = list.querySelector('a');
      link.className = sample && sample.className ? sample.className : 'transition hover:text-[#f2014b]';
      item.appendChild(link);
      list.appendChild(item);
    }
    ensureItem('/blog', 'Blog');
    ensureItem('/noticias', 'Noticias');
    ensureItem('/faq', 'FAQ');
  }
  function ensureInfoLinks() {
    var heading = null;
    Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
      if (heading) return;
      if (textOf(node) === 'Información') heading = node;
    });
    if (!heading) return;
    var list = heading.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;
    function ensureAfter(href, label, afterHref) {
      var found = false;
      Array.prototype.forEach.call(list.querySelectorAll('a'), function (link) {
        if (hrefOf(link) === href || textOf(link) === label) found = true;
      });
      if (found) return;
      var item = document.createElement('li');
      var link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = label;
      var sample = list.querySelector('a');
      link.className = sample && sample.className ? sample.className : 'transition brand-hover';
      item.appendChild(link);
      var after = null;
      Array.prototype.forEach.call(list.querySelectorAll('a'), function (node) {
        if (!after && hrefOf(node) === afterHref) after = node;
      });
      if (after && after.parentNode && after.parentNode.parentNode === list) list.insertBefore(item, after.parentNode.nextSibling);
      else list.appendChild(item);
    }
    ensureAfter('/noticias', 'Noticias', '/blog');
    ensureAfter('/faq', 'FAQ', '/noticias');
  }
  function filterHomeCourses() {
    var params = new URLSearchParams(window.location.search);
    var q = (params.get('buscar') || '').trim().toLowerCase();
    var input = document.querySelector('header form[data-cep-header-search] input');
    if (input && document.activeElement !== input && input.value !== (params.get('buscar') || '')) input.value = params.get('buscar') || '';
    if (window.location.pathname !== '/' && window.location.pathname !== '') return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-cep-course-row]'), function (row) {
      var hay = (row.textContent || '').toLowerCase();
      row.hidden = Boolean(q) && hay.indexOf(q) === -1;
    });
  }
  function bindHeaderSearch(form) {
    if (!form || form.getAttribute('data-cep-search-bound') === '1') return;
    form.setAttribute('data-cep-search-bound', '1');
    var input = form.querySelector('input');
    form.addEventListener('submit', function (event) {
      if (window.location.pathname !== '/' && window.location.pathname !== '') return;
      event.preventDefault();
      var url = new URL(window.location.href);
      var value = input ? (input.value || '').trim() : '';
      if (value) url.searchParams.set('buscar', value);
      else url.searchParams.delete('buscar');
      window.history.replaceState(null, '', url.pathname + url.search);
      filterHomeCourses();
    });
  }
  function barLink(header) {
    var tools = header.querySelector('[data-cep-header-tools]');
    var owned = tools ? tools.querySelector('a[href="/transparencia"]') : null;
    if (owned && !owned.closest('#public-mobile-menu')) return owned;
    var links = header.querySelectorAll('a[href="/transparencia"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].closest('#public-mobile-menu')) continue;
      return links[i];
    }
    return null;
  }
  function headerToolsSettled() {
    var header = document.querySelector('header');
    if (!header) return false;
    var tools = header.querySelector('[data-cep-header-tools]');
    var link = barLink(header);
    var form = header.querySelector('form[data-cep-header-search]');
    if (!tools || !link || !form) return false;
    if (link.parentNode !== tools || form.parentNode !== tools || link.nextElementSibling !== form) return false;
    var campus = header.querySelector('a[href="/campus"]');
    var nav = header.querySelector('nav');
    var portalNav = document.documentElement.getAttribute('data-cep-transparency-page') === '1';
    if (campus && portalNav && nav) {
      if (campus.parentNode !== nav || form.nextElementSibling) return false;
    } else if (campus) {
      if (campus.parentNode !== tools || form.nextElementSibling !== campus) return false;
    } else if (form.nextElementSibling) {
      return false;
    }
    var button = header.querySelector('button[aria-label="Abrir menú"]');
    if (button && button.parentNode) return tools.parentNode === button.parentNode && tools.nextElementSibling === button;
    if (nav && nav.parentNode) return tools.parentNode === nav.parentNode && nav.nextElementSibling === tools;
    return tools.parentNode === header;
  }

  function ensureHeaderChrome() {
    var header = document.querySelector('header');
    if (!header) return;
    var tools = header.querySelector('[data-cep-header-tools]');
    if (!tools) {
      tools = document.createElement('div');
      tools.setAttribute('data-cep-header-tools', '1');
    }
    var link = barLink(header);
    if (!link) {
      link = document.createElement('a');
      link.setAttribute('href', '/transparencia');
      link.textContent = 'Transparencia';
      link.className = 'text-sm font-medium text-gray-600 brand-hover transition-colors';
    }
    var form = header.querySelector('form[data-cep-header-search]');
    if (!form) {
      form = document.createElement('form');
      form.setAttribute('data-cep-header-search', '1');
      form.setAttribute('action', '/');
      form.setAttribute('method', 'get');
      form.setAttribute('role', 'search');
      var input = document.createElement('input');
      input.setAttribute('id', 'cep-buscar');
      input.setAttribute('name', 'buscar');
      input.setAttribute('type', 'search');
      input.setAttribute('placeholder', 'Buscar');
      input.setAttribute('aria-label', 'Buscar');
      form.appendChild(input);
    }
    bindHeaderSearch(form);
    if (headerToolsSettled()) {
      filterHomeCourses();
      return;
    }
    var campus = header.querySelector('a[href="/campus"]');
    var nav = header.querySelector('nav');
    var portalNav = document.documentElement.getAttribute('data-cep-transparency-page') === '1';
    tools.appendChild(link);
    tools.appendChild(form);
    if (campus && portalNav && nav) nav.appendChild(campus);
    else if (campus) tools.appendChild(campus);
    var button = header.querySelector('button[aria-label="Abrir menú"]');
    if (button && button.parentNode) button.parentNode.insertBefore(tools, button);
    else {
      if (nav && nav.parentNode) nav.parentNode.insertBefore(tools, nav.nextSibling);
      else header.appendChild(tools);
    }
    filterHomeCourses();
  }
    function parkLegalBar() {
      var nav = document.querySelector('footer nav[aria-label="Páginas legales"]');
      var heading = null;
      Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
        if (heading) return;
        if (textOf(node) === 'Legal') heading = node;
      });
      var list = heading && heading.nextElementSibling && heading.nextElementSibling.tagName === 'UL'
        ? heading.nextElementSibling
        : null;
      if (list) {
        var wanted = [
          ['/legal', 'Centro legal'],
          ['/transparencia', 'Transparencia'],
          ['/legal/privacidad', 'Privacidad'],
          ['/legal/terminos', 'Términos'],
          ['/legal/cookies', 'Cookies'],
          ['/legal/subencargados', 'Subencargados'],
          ['/legal/accesibilidad', 'Accesibilidad']
        ];
        wanted.forEach(function (pair) {
          var found = false;
          Array.prototype.forEach.call(list.querySelectorAll('a'), function (link) {
            if (hrefOf(link) === pair[0] || hrefOf(link) === '/p' + pair[0]) found = true;
          });
          if (found) return;
          var item = document.createElement('li');
          var link = document.createElement('a');
          link.setAttribute('href', pair[0]);
          link.textContent = pair[1];
          link.className = 'transition brand-hover';
          item.appendChild(link);
          list.appendChild(item);
        });
        function addDeclaration(name, pdf, odt) {
          if (list.querySelector('a[href="' + pdf + '"]')) return;
          var item = document.createElement('li');
          item.appendChild(document.createTextNode(name + ' '));
          var pdfLink = document.createElement('a');
          pdfLink.setAttribute('href', pdf);
          pdfLink.textContent = '(PDF)';
          pdfLink.className = 'transition brand-hover';
          item.appendChild(pdfLink);
          item.appendChild(document.createTextNode(' '));
          var odtLink = document.createElement('a');
          odtLink.setAttribute('href', odt);
          odtLink.textContent = '(ODT)';
          odtLink.className = 'transition brand-hover';
          item.appendChild(odtLink);
          list.appendChild(item);
        }
        addDeclaration('Declaración de Accesibilidad APROEM', '/transparencia/aproem/10-otros/declaracion-de-accesibilidad.pdf', '/transparencia/aproem/10-otros/declaracion-de-accesibilidad.odt');
        addDeclaration('Declaración de Accesibilidad ACATEN 2020 SL', '/transparencia/acaten/10-otros/declaracion-de-accesibilidad.pdf', '/transparencia/acaten/10-otros/declaracion-de-accesibilidad.odt');
        if (nav) {
          var cookie = nav.querySelector('button');
          if (cookie && textOf(cookie) === 'Preferencias de cookies' && !list.querySelector('button')) {
            var cookieItem = document.createElement('li');
            cookieItem.appendChild(cookie);
            list.appendChild(cookieItem);
          }
        }
      }
      if (nav && nav.parentNode) nav.parentNode.removeChild(nav);
    }
    function placeLegalBesideInfo() {
      var info = document.querySelector('footer [data-cep-footer="info"]');
      if (!info) {
        Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
          if (info) return;
          if (textOf(node) === 'Información') info = node.parentElement;
        });
      }
      var heading = null;
      Array.prototype.forEach.call(document.querySelectorAll('footer h3'), function (node) {
        if (heading) return;
        if (textOf(node) === 'Legal') heading = node;
      });
      if (!info || !heading || !heading.parentElement) return;
      var block = heading.parentElement;
      if (block === info || info.contains(block)) return;
      block.style.marginTop = '';
      if (info.nextElementSibling === block) return;
      if (info.parentNode) info.parentNode.insertBefore(block, info.nextSibling);
    }
    function apply() {
    if (!document.body) return;
    ensureHeaderChrome();
    document.querySelectorAll('header nav a, header #public-mobile-menu a').forEach(function (link) {
      if (!isHeaderDrop(textOf(link), hrefOf(link))) return;
      var wrap = link.parentNode;
      if (wrap && wrap !== link.closest('nav') && wrap.tagName === 'DIV' && wrap.querySelectorAll('a').length === 1) {
        wrap.parentNode && wrap.parentNode.removeChild(wrap);
      } else if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    Array.prototype.slice.call(document.querySelectorAll('footer a')).forEach(function (link) {
      var href = hrefOf(link);
      var label = textOf(link);
      if (href !== '/legal/ia' && label !== 'Transparencia y AI Act') return;
      if (link.querySelector('img')) {
        link.setAttribute('aria-label', 'AI Act');
        return;
      }
      link.setAttribute('href', '/transparencia');
      link.textContent = 'Transparencia';
    });
    Array.prototype.slice.call(document.querySelectorAll('a[aria-label="Transparencia y AI Act"]')).forEach(function (link) {
      link.setAttribute('aria-label', 'AI Act');
    });
    parkLegalBar();
    placeLegalBesideInfo();
    ensureParticipaBlog();
    ensureInfoLinks();
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var root = document.documentElement;
    if (!root) return;
    new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
    [240, 700, 1500].forEach(function (ms) { setTimeout(apply, ms); });
  }
  function afterHydration(fn) {
    function run() {
      requestAnimationFrame(function () { requestAnimationFrame(fn); });
    }
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run);
  }
  afterHydration(start);
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}
