import { CEP_CERTIFICATIONS, CEP_PARTNERS, CERTIFICATION_ASSET_PREFIX, PARTNER_ASSET_PREFIX } from './partners'

const ENTITIES_TITLE = 'Entidades y empresas colaboradoras'
const CERTS_TITLE = 'Certificaciones'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function partnerItem(name: string, file: string, prefix: string): string {
  return `<div class="cep-partner-item"><img src="${prefix}${escapeHtml(file)}" alt="${escapeHtml(name)}" width="280" height="160" loading="lazy" decoding="async"><span class="cep-partner-name">${escapeHtml(name)}</span></div>`
}

export function partnersCss(): string {
  return `<style data-cep-partners-css="1">
[data-cep-partners="1"]{background:#fff;padding:1.75rem 0 1.1rem}
[data-cep-partners="1"][data-cep-brand="entities"]{border-top:1px solid #eadadd;padding-top:2.25rem}
[data-cep-partners="1"][data-cep-brand="certs"]{border-bottom:1px solid #eadadd;padding-bottom:2.4rem}
[data-cep-partners="1"] .cep-partners-copy{max-width:72rem;margin:0 auto;padding:0 1rem;text-align:center}
[data-cep-partners="1"] .cep-partners-kicker{margin:0;color:#f2014b;font-size:.85rem;font-weight:600;letter-spacing:0;text-transform:none}
[data-cep-partners="1"] .cep-partners-title{margin:.65rem auto 0;max-width:38rem;color:#3E091A;font-size:clamp(1.35rem,2.4vw,1.85rem);line-height:1.25;font-weight:800}
[data-cep-partners="1"] .cep-partners-grid{max-width:72rem;margin:1.75rem auto 0;padding:0 1.25rem;display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem 1.75rem;align-items:flex-start}
[data-cep-partners="1"] .cep-partner-item{display:flex;flex:0 1 9.5rem;width:9.5rem;flex-direction:column;align-items:center;justify-content:flex-start;gap:.55rem;min-height:0;margin:0;padding:.75rem .45rem}
[data-cep-partners="1"] .cep-partner-item img{display:block;max-width:100%;max-height:3.8rem;width:auto;height:auto;object-fit:contain;object-position:center;transform:scale(1);transition:transform .2s ease}
[data-cep-partners="1"] .cep-partner-item:hover img{transform:scale(1.08)}
[data-cep-partners="1"] .cep-partner-name{margin:0;max-width:11rem;color:#3E091A;font-size:.78rem;font-weight:600;line-height:1.3;text-align:center}
</style>`
}

function brandSection(kind: 'entities' | 'certs', title: string, items: string): string {
  return `<section data-cep-partners="1" data-cep-brand="${kind}" aria-label="${title}">
  <div class="cep-partners-copy">
    <h2 class="cep-partners-title">${title}</h2>
  </div>
  <div class="cep-partners-grid" data-cep-partners-grid="1">${items}</div>
</section>`
}

function partnersSectionHtml(): string {
  const entities = CEP_PARTNERS.map((partner) => partnerItem(partner.name, partner.file, PARTNER_ASSET_PREFIX)).join('')
  const certs = CEP_CERTIFICATIONS.map((item) => partnerItem(item.name, item.file, CERTIFICATION_ASSET_PREFIX)).join('')
  return `${partnersCss()}${brandSection('entities', ENTITIES_TITLE, entities)}${brandSection('certs', CERTS_TITLE, certs)}`
}

const ENTITY_E = '(?:é|&eacute;|&#0*233;|&#x0*e9;)'
const ENTITY_O = '(?:ó|&oacute;|&#0*243;|&#x0*f3;)'
const FLEX_SPACE = '(?:\\s|&nbsp;|&#0*160;|&#x0*a0;|<[^>]*>)*'
const TESTIMONIAL_HEADING = new RegExp(
  `Qu${ENTITY_E}${FLEX_SPACE}dicen${FLEX_SPACE}sobre${FLEX_SPACE}CEP${FLEX_SPACE}Formaci${ENTITY_O}n`,
  'i',
)
const LEAD_HEADING = new RegExp(
  `(?:Solicita${FLEX_SPACE}informaci${ENTITY_O}n|Hablemos${FLEX_SPACE}de${FLEX_SPACE}tu${FLEX_SPACE}pr${ENTITY_O}xima${FLEX_SPACE}formaci${ENTITY_O}n|Atenci${ENTITY_O}n${FLEX_SPACE}personalizada)`,
  'i',
)

function isInsideIgnoredBlock(html: string, index: number): boolean {
  const blocks: Array<[string, string]> = [
    ['<script', '</script>'],
    ['<style', '</style>'],
    ['<!--', '-->'],
  ]
  for (const [open, close] of blocks) {
    const start = html.lastIndexOf(open, index)
    if (start === -1) continue
    const end = html.indexOf(close, start)
    if (end === -1 || end > index) return true
  }
  return false
}

function firstVisibleMatch(html: string, pattern: RegExp): number {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  const re = new RegExp(pattern.source, flags)
  for (const match of html.matchAll(re)) {
    if (typeof match.index === 'number' && !isInsideIgnoredBlock(html, match.index)) return match.index
  }
  return -1
}

function stripPartnersMarkup(html: string): string {
  return html
    .replace(/<style\b[^>]*data-cep-partners-css="1"[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<section\b[^>]*data-cep-partners="1"[^>]*>[\s\S]*?<\/section>/gi, '')
}

/** Slot after testimonials (and their wrapper), immediately before the lead form. */
function findPartnersSlot(html: string): number | null {
  const reviewsAt = firstVisibleMatch(html, TESTIMONIAL_HEADING)
  if (reviewsAt < 0) return null
  const sectionClose = html.indexOf('</section>', reviewsAt)
  if (sectionClose < 0) return null
  let slot = sectionClose + '</section>'.length
  const wrapped = html.slice(slot).match(/^\s*<\/div>/i)
  if (wrapped) {
    const afterWrap = slot + wrapped[0].length
    const leadAt = firstVisibleMatch(html.slice(afterWrap, afterWrap + 6000), LEAD_HEADING)
    if (leadAt >= 0) return afterWrap
  }
  return slot
}

function injectPartnersSection(html: string): string {
  const cleaned = stripPartnersMarkup(html)
  const section = partnersSectionHtml()
  const slot = findPartnersSlot(cleaned)
  if (slot !== null) return `${cleaned.slice(0, slot)}${section}${cleaned.slice(slot)}`
  if (/<footer\b/i.test(cleaned)) return cleaned.replace(/<footer\b/i, `${section}<footer`)
  if (cleaned.includes('</main>')) return cleaned.replace('</main>', `</main>${section}`)
  if (cleaned.includes('</body>')) return cleaned.replace('</body>', `${section}</body>`)
  return cleaned + section
}


function injectPartnersLock(html: string): string {
  const script = `<script data-cep-partners-lock="1">
(function () {
  if (window.__cepPartnersLock) return;
  window.__cepPartnersLock = 1;
  var PARTNERS = ${JSON.stringify(CEP_PARTNERS)};
  var CERTS = ${JSON.stringify(CEP_CERTIFICATIONS)};
  var PREFIX = ${JSON.stringify(PARTNER_ASSET_PREFIX)};
  var CERT_PREFIX = ${JSON.stringify(CERTIFICATION_ASSET_PREFIX)};
  function makeItem(partner, prefix) {
    var wrap = document.createElement('div');
    wrap.className = 'cep-partner-item';
    var img = document.createElement('img');
    img.setAttribute('src', prefix + partner.file);
    img.setAttribute('alt', partner.name);
    img.setAttribute('width', '280');
    img.setAttribute('height', '160');
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    wrap.appendChild(img);
    var name = document.createElement('span');
    name.className = 'cep-partner-name';
    name.textContent = partner.name;
    wrap.appendChild(name);
    return wrap;
  }
  function headingText(node) {
    return (node.textContent || '').replace(/\\s+/g, ' ').trim();
  }
  function findSectionWithHeading(pattern) {
    var nodes = document.querySelectorAll('h1,h2,h3,span');
    for (var i = 0; i < nodes.length; i++) {
      if (!pattern.test(headingText(nodes[i]))) continue;
      var found = nodes[i].closest('section');
      if (found) return found;
    }
    return null;
  }
  function placeSection(section) {
    if (!section || !document.body) return;
    var reviews = findSectionWithHeading(/Qu[eé] dicen sobre CEP Formaci[oó]n/i);
    var lead = findSectionWithHeading(/^Solicita informaci[oó]n$/i)
      || findSectionWithHeading(/Hablemos de tu pr[oó]xima formaci[oó]n/i)
      || findSectionWithHeading(/Atenci[oó]n personalizada/i);
    if (reviews && lead && reviews !== lead) {
      var reviewsHost = reviews.parentNode;
      var leadHost = lead.parentNode;
      if (reviewsHost && leadHost && reviewsHost.parentNode && reviewsHost.parentNode === leadHost.parentNode) {
        leadHost.parentNode.insertBefore(section, leadHost);
        return;
      }
      if (reviews.parentNode) {
        reviews.parentNode.insertBefore(section, reviews.nextSibling);
        return;
      }
    }
    if (lead && lead.parentNode) {
      lead.parentNode.insertBefore(section, lead);
      return;
    }
    var footer = document.querySelector('footer');
    if (footer && footer.parentNode) footer.parentNode.insertBefore(section, footer);
    else if (document.querySelector('main')) document.querySelector('main').appendChild(section);
    else document.body.appendChild(section);
  }
  function ensureCss() {
    if (document.querySelector('[data-cep-partners-css="1"]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-cep-partners-css', '1');
    style.textContent = ${JSON.stringify(partnersCss().replace(/^<style[^>]*>/, '').replace(/<\/style>$/, ''))};
    document.head.appendChild(style);
  }
  function buildSection(kind, label, list, prefix) {
    var section = document.createElement('section');
    section.setAttribute('data-cep-partners', '1');
    section.setAttribute('data-cep-brand', kind);
    section.setAttribute('aria-label', label);
    var copy = document.createElement('div');
    copy.className = 'cep-partners-copy';
    var title = document.createElement('h2');
    title.className = 'cep-partners-title';
    title.textContent = label;
    copy.appendChild(title);
    var grid = document.createElement('div');
    grid.className = 'cep-partners-grid';
    grid.setAttribute('data-cep-partners-grid', '1');
    list.forEach(function (partner) { grid.appendChild(makeItem(partner, prefix)); });
    section.appendChild(copy);
    section.appendChild(grid);
    return section;
  }
  function ensureSections() {
    var entities = document.querySelector('[data-cep-brand="entities"]');
    var certs = document.querySelector('[data-cep-brand="certs"]');
    document.querySelectorAll('[data-cep-partners="1"]').forEach(function (node) {
      if (node !== entities && node !== certs && node.parentNode) node.parentNode.removeChild(node);
    });
    if (!entities) entities = buildSection('entities', ${JSON.stringify(ENTITIES_TITLE)}, PARTNERS, PREFIX);
    if (!certs) certs = buildSection('certs', ${JSON.stringify(CERTS_TITLE)}, CERTS, CERT_PREFIX);
    ensureCss();
    placeSection(entities);
    if (entities.parentNode && entities.nextSibling !== certs) entities.parentNode.insertBefore(certs, entities.nextSibling);
  }
  function apply() {
    if (!document.body) return;
    ensureSections();
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true });
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

export function rewritePartnersBanner(html: string): string {
  if (html.includes('data-cep-partners-lock="1"')) return html
  return injectPartnersLock(injectPartnersSection(html))
}
