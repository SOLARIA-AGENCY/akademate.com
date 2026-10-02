import { sedeSlugFromPath, type GbpSlug } from './gbp'

export type CampusWeb = {
  host: string
  href: string
}

const WEB_BY_SLUG: Record<GbpSlug, CampusWeb> = {
  'sede-santa-cruz': { host: 'cursostenerife.es', href: 'https://cursostenerife.es/' },
  'sede-norte': { host: 'cursostenerife.es', href: 'https://cursostenerife.es/' },
  'cep-sur': { host: 'cepsur.es', href: 'https://cepsur.es/' },
}

export function campusWebFromName(name: string): CampusWeb | null {
  const folded = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/\bsur\b/.test(folded)) return WEB_BY_SLUG['cep-sur']
  if (/\bnorte\b/.test(folded) || /\borotava\b/.test(folded)) return WEB_BY_SLUG['sede-norte']
  if (/\bsanta\s*cruz\b/.test(folded)) return WEB_BY_SLUG['sede-santa-cruz']
  return null
}

export function campusWebFromPath(pathname: string): CampusWeb | null {
  const slug = sedeSlugFromPath(pathname)
  return slug ? WEB_BY_SLUG[slug] : null
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function cardWebRow(web: CampusWeb): string {
  return `<div data-cep-campus-web="1" class="grid gap-1 sm:grid-cols-[7rem_1fr]"><span class="font-black text-slate-950">Web</span><a href="${escapeAttr(web.href)}" target="_blank" rel="noopener noreferrer" class="font-bold text-[#f2014b] hover:underline">${web.host}</a></div>`
}

function sedeWebRow(web: CampusWeb): string {
  return `<div data-cep-campus-web="1"><dt class="text-slate-500">Web</dt><dd class="mt-1 font-semibold text-slate-900"><a href="${escapeAttr(web.href)}" target="_blank" rel="noopener noreferrer" class="hover:underline">${web.host}</a></dd></div>`
}

function listingWebRow(web: CampusWeb): string {
  return `<p data-cep-campus-web="1" class="text-sm text-slate-700"><span class="font-semibold">Web:</span> <a href="${escapeAttr(web.href)}" target="_blank" rel="noopener noreferrer" class="font-semibold text-[#f2014b] hover:underline">${web.host}</a></p>`
}

function headingName(block: string): string {
  const match = block.match(/<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/i)
  return (match?.[2] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function injectCardWeb(html: string): string {
  return html.replace(/<article\b[\s\S]*?<\/article>/gi, (article) => {
    if (/data-cep-campus-web="1"/.test(article)) return article
    const web = campusWebFromName(headingName(article))
    if (!web) return article
    if (/>Horario</.test(article)) {
      const withGrid = article.replace(
        /(<div class="grid gap-1 sm:grid-cols-\[7rem_1fr\]"><span class="font-black text-slate-950">Horario<\/span>[\s\S]*?<\/div>)/,
        `${cardWebRow(web)}$1`,
      )
      if (withGrid !== article) return withGrid
    }
    if (/<span class="font-semibold">Horario:<\/span>/.test(article) || /<span class="font-semibold">Teléfono:<\/span>/.test(article)) {
      const afterPhone = article.replace(
        /(<p class="text-sm text-slate-700"><span class="font-semibold">Teléfono:<\/span>[\s\S]*?<\/p>)/,
        `$1${listingWebRow(web)}`,
      )
      if (afterPhone !== article) return afterPhone
      return article.replace(
        /(<p class="text-sm text-slate-700"><span class="font-semibold">Horario:<\/span>)/,
        `${listingWebRow(web)}$1`,
      )
    }
    return article
  })
}

function injectSedePageWeb(html: string, pathname: string): string {
  const web = campusWebFromPath(pathname)
  if (!web) return html
  if (/Información de la sede/i.test(html) && /data-cep-campus-web="1"/.test(html)) return html
  if (!/Información de la sede/i.test(html)) return html
  const afterEmail = html.replace(
    /(<dt[^>]*>Email<\/dt>\s*<dd[^>]*>[\s\S]*?<\/dd>\s*<\/div>)/i,
    `$1${sedeWebRow(web)}`,
  )
  if (afterEmail !== html) return afterEmail
  return html.replace(
    /(<dt[^>]*>Horario<\/dt>\s*<dd[^>]*>[\s\S]*?<\/dd>\s*<\/div>)/i,
    `${sedeWebRow(web)}$1`,
  )
}

function injectLock(html: string): string {
  if (html.includes('data-cep-campus-web-lock="1"')) return html
  const profiles = JSON.stringify(WEB_BY_SLUG)
  const script = `<script data-cep-campus-web-lock="1">
(function () {
  if (window.__cepCampusWebLock) return;
  window.__cepCampusWebLock = 1;
  var WEB = ${profiles};
  function webFromName(name) {
    var folded = String(name || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    if (/\\bsur\\b/.test(folded)) return WEB['cep-sur'];
    if (/\\bnorte\\b/.test(folded) || /\\borotava\\b/.test(folded)) return WEB['sede-norte'];
    if (/\\bsanta\\s*cruz\\b/.test(folded)) return WEB['sede-santa-cruz'];
    return null;
  }
  function webFromPath() {
    var path = (location.pathname || '').replace(/\\/+$/, '') || '/';
    var match = path.match(/\\/(?:p|site)?\\/?sedes\\/([^/]+)$/i);
    if (!match) return null;
    var slug = decodeURIComponent(match[1]).toLowerCase();
    if (slug === 'sede-santa-cruz' || slug === 'santa-cruz') return WEB['sede-santa-cruz'];
    if (slug === 'sede-norte' || slug === 'norte') return WEB['sede-norte'];
    if (slug === 'cep-sur' || slug === 'sede-cep-sur') return WEB['cep-sur'];
    return null;
  }
  function makeLink(web, className) {
    var link = document.createElement('a');
    link.setAttribute('href', web.href);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    link.className = className;
    link.textContent = web.host;
    return link;
  }
  function cardRow(web) {
    var row = document.createElement('div');
    row.setAttribute('data-cep-campus-web', '1');
    row.className = 'grid gap-1 sm:grid-cols-[7rem_1fr]';
    var label = document.createElement('span');
    label.className = 'font-black text-slate-950';
    label.textContent = 'Web';
    row.appendChild(label);
    row.appendChild(makeLink(web, 'font-bold text-[#f2014b] hover:underline'));
    return row;
  }
  function listingRow(web) {
    var p = document.createElement('p');
    p.setAttribute('data-cep-campus-web', '1');
    p.className = 'text-sm text-slate-700';
    var label = document.createElement('span');
    label.className = 'font-semibold';
    label.textContent = 'Web:';
    p.appendChild(label);
    p.appendChild(document.createTextNode(' '));
    p.appendChild(makeLink(web, 'font-semibold text-[#f2014b] hover:underline'));
    return p;
  }
  function sedeRow(web) {
    var wrap = document.createElement('div');
    wrap.setAttribute('data-cep-campus-web', '1');
    var dt = document.createElement('dt');
    dt.className = 'text-slate-500';
    dt.textContent = 'Web';
    var dd = document.createElement('dd');
    dd.className = 'mt-1 font-semibold text-slate-900';
    dd.appendChild(makeLink(web, 'hover:underline'));
    wrap.appendChild(dt);
    wrap.appendChild(dd);
    return wrap;
  }
  function fillCards() {
    document.querySelectorAll('article').forEach(function (article) {
      if (article.querySelector('[data-cep-campus-web="1"]')) return;
      var heading = article.querySelector('h1,h2,h3');
      var web = webFromName(heading ? heading.textContent : '');
      if (!web) return;
      var horario = null;
      Array.prototype.forEach.call(article.querySelectorAll('span'), function (node) {
        if ((node.textContent || '').trim() === 'Horario') horario = node.parentNode;
      });
      if (horario && horario.parentNode) {
        horario.parentNode.insertBefore(cardRow(web), horario);
        return;
      }
      var phone = null;
      Array.prototype.forEach.call(article.querySelectorAll('p'), function (node) {
        if (phone) return;
        var span = node.querySelector('span');
        if (span && (span.textContent || '').trim() === 'Teléfono:') phone = node;
      });
      if (phone && phone.parentNode) phone.parentNode.insertBefore(listingRow(web), phone.nextSibling);
    });
  }
  function fillSedePage() {
    var web = webFromPath();
    if (!web) return;
    var section = null;
    document.querySelectorAll('h2').forEach(function (node) {
      if (section) return;
      if ((node.textContent || '').replace(/\\s+/g, ' ').trim() === 'Información de la sede') section = node.parentNode;
    });
    if (!section || section.querySelector('[data-cep-campus-web="1"]')) return;
    var email = null;
    Array.prototype.forEach.call(section.querySelectorAll('dt'), function (node) {
      if (email) return;
      if ((node.textContent || '').trim() === 'Email') email = node.parentNode;
    });
    var horario = null;
    Array.prototype.forEach.call(section.querySelectorAll('dt'), function (node) {
      if (horario) return;
      if ((node.textContent || '').trim() === 'Horario') horario = node.parentNode;
    });
    var row = sedeRow(web);
    if (email && email.parentNode) email.parentNode.insertBefore(row, email.nextSibling);
    else if (horario && horario.parentNode) horario.parentNode.insertBefore(row, horario);
  }
  function apply() {
    if (!document.body) return;
    fillCards();
    fillSedePage();
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
    [400, 1200, 3000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

export function rewriteCampusWebsites(html: string, pathname = ''): string {
  if (html.includes('data-cep-campus-web-lock="1"')) return html
  let next = injectCardWeb(html)
  next = injectSedePageWeb(next, pathname)
  return injectLock(next)
}
