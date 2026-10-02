import { EMPLEO_OFFICE_ALT, EMPLEO_OFFICE_IMAGE, UNKNOWN_EMPLEO_PORTRAIT } from './empleo-image'

const TRACKED_PAIR =
  /\s*(?:uppercase\s+tracking-\[[^\]]+\]|tracking-\[[^\]]+\]\s+uppercase|uppercase\s+tracking-(?:wide|wider|widest)|tracking-(?:wide|wider|widest)\s+uppercase)/g
const POSITIVE_TRACKING = /\s*tracking-\[[0-9.]+em\]/g
const TITLE_EM = /<title>([^<]*?)\s*(?:—|–)\s*([^<]*)<\/title>/g
const CF_EMAIL = /<a[^>]*data-cfemail="([a-f0-9]+)"[^>]*>\s*\[email&#160;protected\]\s*<\/a>/gi
const CF_EMAIL_ALT = /<a[^>]*data-cfemail="([a-f0-9]+)"[^>]*>\s*\[email protected\]\s*<\/a>/gi

export function decodeCfEmail(hex: string): string {
  const key = Number.parseInt(hex.slice(0, 2), 16)
  if (!Number.isFinite(key)) return ''
  let email = ''
  for (let i = 2; i < hex.length; i += 2) {
    const code = Number.parseInt(hex.slice(i, i + 2), 16) ^ key
    if (!Number.isFinite(code)) return ''
    email += String.fromCharCode(code)
  }
  return email
}

export function stripTrackedCapsClasses(html: string): string {
  return html.replace(TRACKED_PAIR, '').replace(POSITIVE_TRACKING, '')
}

function restoreEmails(html: string): string {
  const replace = (_match: string, hex: string) => {
    const email = decodeCfEmail(hex)
    if (!email || !email.includes('@')) return _match
    return `<a href="mailto:${email}">${email}</a>`
  }
  return html.replace(CF_EMAIL, replace).replace(CF_EMAIL_ALT, replace).replaceAll('[email protected]', 'info@cursostenerife.es')
}

function rewriteCopy(html: string): string {
  return html
    .replace(TITLE_EM, '<title>$1, $2</title>')
    .replaceAll('CEP FORMACION — Plataforma Educativa', 'CEP Formación')
    .replaceAll('CEP FORMACION', 'CEP Formación')
    .replaceAll('2 Sedes en Tenerife', '3 campus en Tenerife')
    .replaceAll('Sedes en Tenerife', 'Campus en Tenerife')
    .replace(/>2<\/p>(\s*<p[^>]*>Campus en Tenerife)/g, '>3</p>$1')
    .replace(/<\/p>2Campus en Tenerife<\/p>/g, '</p><p class="mt-1 text-sm text-white/80">Campus en Tenerife</p>')
    .replace(
      '>98%</p><p class="mt-1 text-sm text-white/80">Inserción laboral</p>',
      '>Autorizada</p><p class="mt-1 text-sm text-white/80">Agencia de colocación</p>',
    )
    .replaceAll('\\"children\\":\\"98%\\"', '\\"children\\":\\"Autorizada\\"')
    .replaceAll('\\"children\\":\\"Inserción laboral\\"', '\\"children\\":\\"Agencia de colocación\\"')
    .replaceAll(
      '\\"children\\":\\"2\\"}],[\\"$\\",\\"p\\",null,{\\"className\\":\\"mt-1 text-sm text-white/80\\",\\"children\\":\\"Campus en Tenerife\\"',
      '\\"children\\":\\"3\\"}],[\\"$\\",\\"p\\",null,{\\"className\\":\\"mt-1 text-sm text-white/80\\",\\"children\\":\\"Campus en Tenerife\\"',
    )
    .replaceAll('>ISO 18000<', '>ISO 14001<')
    .replaceAll('ISO 18000', 'ISO 14001')
    .replaceAll('4.9/5 valoración', '')
    .replaceAll('Líderes en Canarias', 'en Tenerife')
    .replaceAll(
      'En APROEM no solo concedemos becas. Creamos oportunidades.',
      'En APROEM concedemos becas a quien no puede pagar el curso entero.',
    )
    .replaceAll('Formamos profesionales. Transformamos personas.', 'Formamos profesionales en Tenerife.')
    .replaceAll('Creemos en el talento. Apostamos por las personas.', 'Becas y orientación para estudiar en CEP.')
    .replaceAll('Únete a la academia líder en Canarias', 'Reserva plaza o pide el dossier')
    .replaceAll('¡Empezar hoy mismo!', 'Solicitar información')
    .replaceAll('© 2026 Akademate', '© 2026 CEP FORMACION Y COMUNICACION')
    .replaceAll('© 2026 CEP Formación y Comunicación', '© 2026 CEP FORMACION Y COMUNICACION')
    .replace(/© 2026 CEP FORMACIÓN(?! Y COMUNICACION)/g, '© 2026 CEP FORMACION Y COMUNICACION')
    .replace(/© 2026 CEP Formación(?! y Comunicación)/g, '© 2026 CEP FORMACION Y COMUNICACION')
    .replaceAll(UNKNOWN_EMPLEO_PORTRAIT, EMPLEO_OFFICE_IMAGE)
    .replaceAll('alt="Akademate"', 'alt="CEP Formación"')
    .replaceAll('>Akademate<', '>CEP Formación<')
    .replaceAll('<!-- -->Akademate<!-- -->', '<!-- -->CEP Formación<!-- -->')
    .replaceAll('\\"Akademate\\"', '\\"CEP Formación\\"')
    .replaceAll('alt="Orientación laboral y empleabilidad en CEP Formación"', `alt="${EMPLEO_OFFICE_ALT}"`)
}

function unslopCss(): string {
  return `<style data-cep-unslop-css="1">
footer h3{letter-spacing:0!important;text-transform:none!important;font-weight:600!important}
.uppercase{text-transform:none!important}
[class*="tracking-[0"]{letter-spacing:0!important}
.tracking-wide,.tracking-wider,.tracking-widest{letter-spacing:0!important}
.cep-partners-kicker{letter-spacing:0!important;text-transform:none!important;font-weight:600!important;font-size:.85rem!important;color:#f2014b}
[data-cep-campus-page] .eyebrow{letter-spacing:0!important;text-transform:none!important;font-weight:600!important;font-size:.85rem!important}
#por-que-cep{--cep-brand:#f2014b}
#por-que-cep article{border-radius:1.5rem!important;border:1px solid #e2e8f0!important;background:#fff!important;box-shadow:0 1px 2px rgb(15 23 42 / .08)!important}
#por-que-cep article:hover{transform:translateY(-4px)!important;box-shadow:0 20px 25px -5px rgb(15 23 42 / .16)!important;border-color:#ffe4e6!important}
#por-que-cep article:hover span{background:#f2014b!important;color:#fff!important}
a.animate-bounce{animation:none!important}
svg[viewBox="0 0 1440 120"]{display:none!important}
.bg-indigo-600{display:none!important}
a[class*="border-white"][class*="rounded-full"]{border:0!important;background:transparent!important;border-radius:0!important;text-decoration:underline!important;text-underline-offset:4px;box-shadow:none!important}
.fixed.bottom-20 a[class*="rounded-full"]{border-radius:999px!important;background:#fff!important;color:#150702!important;border:1px solid #e7e5e4!important;text-decoration:none!important;box-shadow:0 12px 30px rgb(21 7 2 / .16)!important}
.fixed.bottom-20 a[class*="rounded-full"]>span{color:#150702!important;text-decoration:none!important}
.fixed.bottom-20 a[class*="rounded-full"] .brand-btn{background:#f2014b!important;color:#fff!important;border-radius:999px!important;text-decoration:none!important}
.hero-copy-subtitle{text-shadow:0 2px 18px rgba(0,0,0,.8);color:#fff!important}
.hero-copy-enter span[class*="rounded-full"]{border-radius:0!important;background:transparent!important;padding:0!important;color:#fff!important;font-size:.85rem!important;font-weight:600!important}
#por-que-cep h2,#por-que-cep h3{font-weight:600!important;letter-spacing:0!important}
.font-black{font-weight:600!important}
section.bg-slate-950.text-white [class*="md:grid-cols-3"]>div{min-width:0;overflow:hidden}
section.bg-slate-950.text-white [class*="md:grid-cols-3"] p,section.bg-slate-950.text-white [class*="md:grid-cols-3"] a{overflow-wrap:anywhere;word-break:break-word;max-width:100%}
[data-cep-teachers] button,button[class~="h-2"],button[class~="w-2"]{min-width:24px!important;min-height:24px!important}
</style>`
}

function injectCss(html: string): string {
  if (html.includes('data-cep-unslop-css="1"')) return html
  const tag = unslopCss()
  if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
  return tag + html
}

function injectLock(html: string): string {
  if (html.includes('data-cep-unslop-lock="1"')) return html
  const script = `<script data-cep-unslop-lock="1">
(function () {
  if (window.__cepUnslopLock) return;
  window.__cepUnslopLock = 1;
  function cleanClass(el) {
    if (!el || !el.className || typeof el.className !== 'string') return;
    el.className = el.className
      .replace(/uppercase/g, '')
      .replace(/tracking-\\[[^\\]]+\\]/g, '')
      .replace(/tracking-(?:wide|wider|widest)/g, '')
      .replace(/\\s+/g, ' ')
      .trim();
  }
  function isChromeLabel(el) {
    var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return text.length > 0 && text.length < 42;
  }
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('[class*="tracking-["], .uppercase.tracking-wide, .uppercase.tracking-wider, .uppercase.tracking-widest, .uppercase').forEach(function (el) {
      if (!isChromeLabel(el) && !(el.tagName === 'H3' && el.closest('footer'))) return;
      cleanClass(el);
      el.style.letterSpacing = '0';
      el.style.textTransform = 'none';
    });
    document.querySelectorAll('footer h3').forEach(function (el) {
      cleanClass(el);
      el.style.letterSpacing = '0';
      el.style.textTransform = 'none';
      el.style.fontWeight = '600';
    });
    document.querySelectorAll('.cep-partners-kicker').forEach(function (el) {
      cleanClass(el);
      el.style.letterSpacing = '0';
      el.style.textTransform = 'none';
    });
    document.querySelectorAll('a.__cf_email__, [data-cfemail]').forEach(function (el) {
      var hex = el.getAttribute('data-cfemail') || '';
      var key = parseInt(hex.slice(0, 2), 16);
      if (!hex || !key && key !== 0) return;
      var email = '';
      for (var i = 2; i < hex.length; i += 2) email += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
      if (email.indexOf('@') === -1) return;
      el.textContent = email;
      if (el.tagName === 'A') el.setAttribute('href', 'mailto:' + email);
    });
    document.querySelectorAll('a, span, p, div').forEach(function (el) {
      if ((el.textContent || '').trim() === '[email protected]') el.textContent = 'info@cursostenerife.es';
    });
    document.querySelectorAll('div.text-center').forEach(function (el) {
      Array.prototype.forEach.call(el.childNodes, function (node) {
        if (node.nodeType !== 3) return;
        var value = (node.nodeValue || '').replace(/^\\s+|\\s+$/g, '');
        if (value !== '2Campus en Tenerife' && value !== '2 Sedes en Tenerife') return;
        var label = document.createElement('p');
        label.className = 'mt-1 text-sm text-white/80';
        label.textContent = 'Campus en Tenerife';
        el.replaceChild(label, node);
      });
    });
    document.querySelectorAll('img[alt="Akademate"]').forEach(function (el) {
      el.setAttribute('alt', 'CEP Formación');
    });
    document.querySelectorAll('h1, p, span, div, li').forEach(function (el) {
      if (el.childNodes.length !== 1 || el.childNodes[0].nodeType !== 3) return;
      var text = el.textContent || '';
      if (text.indexOf('2 Sedes en Tenerife') !== -1) el.textContent = text.replace('2 Sedes en Tenerife', '3 campus en Tenerife');
      if (text.indexOf('2Campus en Tenerife') !== -1) el.textContent = 'Campus en Tenerife';
      if (text.trim() === 'Sedes en Tenerife' || text.trim() === 'Campus en Tenerife') {
        el.textContent = 'Campus en Tenerife';
        var parent = el.parentNode;
        if (parent) Array.prototype.forEach.call(parent.querySelectorAll('p,span'), function (node) {
          if ((node.textContent || '').trim() === '2') node.textContent = '3';
        });
      }
      if (text.trim() === '98%') el.textContent = 'Autorizada';
      if (text.trim() === 'Inserción laboral') el.textContent = 'Agencia de colocación';
      if (text.indexOf('ISO 18000') !== -1) el.textContent = text.replace('ISO 18000', 'ISO 14001');
      if (text.trim() === '4.9/5 valoración' && el.parentNode) el.parentNode.style.display = 'none';
      if (text.trim() === 'Líderes en Canarias') el.textContent = 'en Tenerife';
      if (text.indexOf('© 2026 Akademate') !== -1 || text.trim() === '© 2026 CEP Formación' || text.trim() === '© 2026 CEP FORMACIÓN' || text.trim() === '© 2026 CEP Formación y Comunicación') {
        el.textContent = '© 2026 CEP FORMACION Y COMUNICACION';
      }
      Array.prototype.forEach.call(el.childNodes, function (node) {
        if (node.nodeType !== 3) return;
        if ((node.nodeValue || '').replace(/^\\s+|\\s+$/g, '') === 'Akademate') node.nodeValue = 'CEP Formación';
      });
    });
    document.querySelectorAll('input:not([aria-label]):not([id])').forEach(function (el) {
      var ph = el.getAttribute('placeholder') || '';
      if (!ph) return;
      if (/Juan P|example\\.com|600 000/.test(ph)) {
        if (el.getAttribute('type') === 'email') el.setAttribute('aria-label', 'Email');
        else if (el.getAttribute('type') === 'tel') el.setAttribute('aria-label', 'Teléfono');
        else el.setAttribute('aria-label', 'Nombre');
      } else {
        el.setAttribute('aria-label', ph);
      }
    });
    if (document.title.indexOf('—') !== -1 || document.title.indexOf('–') !== -1) {
      document.title = document.title.replace(/\\s*[—–]\\s*/g, ', ').replace(/CEP FORMACION/g, 'CEP Formación');
    }
    document.querySelectorAll('img').forEach(function (img) {
      var src = img.getAttribute('src') || '';
      if (src.indexOf('admin-1.jpg') === -1) return;
      img.setAttribute('src', '${EMPLEO_OFFICE_IMAGE}');
      img.setAttribute('alt', '${EMPLEO_OFFICE_ALT}');
    });
    document.querySelectorAll('a, span, button').forEach(function (el) {
      if (el.childNodes.length !== 1 || el.childNodes[0].nodeType !== 3) return;
      var text = (el.textContent || '').replace(/\\s+/g, ' ').trim();
      if (text === 'Ver ciclo →' || text === 'Ver convocatoria →' || text === 'Reservar plaza →') {
        el.textContent = text.replace(' →', '');
      }
    });
    document.querySelectorAll('section').forEach(function (section) {
      if (!section.querySelector('h1')) return;
      var ghosts = [];
      Array.prototype.forEach.call(section.querySelectorAll('a'), function (link) {
        if (/border-white/.test(link.className) && /rounded-full/.test(link.className)) ghosts.push(link);
      });
      ghosts.forEach(function (link) {
        link.style.border = '0';
        link.style.background = 'transparent';
        link.style.borderRadius = '0';
        link.style.textDecoration = 'underline';
        link.style.textUnderlineOffset = '4px';
        link.style.paddingLeft = '0.15rem';
      });
    });
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
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

function alignAccessibleNames(html: string): string {
  return html.replace(/\saria-label="Ver cursos de [^"]*"/g, '')
}

function dropFalseSeals(html: string): string {
  return html.replace(
    /<div class="mt-12 flex flex-wrap justify-center gap-8 opacity-50[\s\S]*?<\/div>/g,
    '',
  )
}

function linkAccessibility(html: string): string {
  if (html.includes('href="/legal/accesibilidad"')) return html
  const withList = html.replace(
    /(<a\b[^>]*href="\/(?:p\/)?legal\/transparencia"[^>]*>[\s\S]*?<\/a>\s*<\/li>)/g,
    '$1<li><a href="/legal/accesibilidad">Accesibilidad</a></li>',
  )
  if (withList !== html) return withList
  return html.replace(
    '<a href="/legal/subencargados" class="transition hover:text-slate-950">Subencargados</a>',
    '<a href="/legal/subencargados" class="transition hover:text-slate-950">Subencargados</a><a href="/legal/accesibilidad" class="transition hover:text-slate-950">Accesibilidad</a>',
  )
}

export function rewriteAntiSlop(html: string): string {
  if (!html.includes('<html') && !html.includes('<body')) return html
  let next = stripTrackedCapsClasses(html)
  next = restoreEmails(next)
  next = rewriteCopy(next)
  next = alignAccessibleNames(next)
  next = dropFalseSeals(next)
  next = linkAccessibility(next)
  next = injectCss(next)
  return injectLock(next)
}
