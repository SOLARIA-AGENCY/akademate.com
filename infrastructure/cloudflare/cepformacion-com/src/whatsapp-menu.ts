const LOGO = '/logos/cep-formacion-logo-rectangular.png'

const COURSE_LABEL = 'CEP trabajadores desempleados y ocupados'
const FROM_PAGE = 'Hola, vengo de la página de cepformacion.com.'

const BADGE = `<span data-cep-wa-badge="1" style="width:44px;height:44px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden"><img src="${LOGO}" alt="" width="32" height="14" style="display:block;width:32px;height:auto"/></span>`

function link(phone: string, text: string, label: string, displayPhone: string): string {
  return `<a data-cep-wa-menu="1" href="https://wa.me/${phone}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;text-decoration:none;color:#111;font-size:14px;transition:background 0.2s;background:#f9fafb;margin-bottom:6px">${BADGE}<span><strong>${label}</strong><br/><span style="font-size:12px;color:#6b7280">${displayPhone}</span></span></a>`
}

export const WHATSAPP_MENU_LINKS = [
  link(
    '34622416020',
    `${FROM_PAGE} Quiero información de CEP Formación Norte.`,
    'CEP Norte',
    '+34 622 41 60 20',
  ),
  link(
    '34618989648',
    `${FROM_PAGE} Quiero información de CEP Santa Cruz.`,
    'CEP Santa Cruz',
    '+34 618 98 96 48',
  ),
  link(
    '34620073492',
    `${FROM_PAGE} Quiero información de CEP Formación Sur.`,
    'CEP Sur',
    '+34 620 073 492',
  ),
  link(
    '34622736101',
    `${FROM_PAGE} Quiero información de cursos para trabajadores desempleados y ocupados.`,
    COURSE_LABEL,
    '+34 622 73 61 01',
  ),
].join('')

export function rewriteWhatsAppMenu(html: string): string {
  if (!html.includes('id="wa-popup"')) return html
  if (html.includes('data-cep-wa-menu-lock="1"') && html.includes(COURSE_LABEL)) {
    return html
  }
  const start = html.indexOf('id="wa-popup"')
  const pad = html.indexOf('style="padding:12px"', start)
  if (pad < 0) return injectLock(html)
  const open = html.indexOf('>', pad)
  const close = html.indexOf('</div></div>', open)
  if (open < 0 || close < 0) return injectLock(html)
  const next = html.slice(0, open + 1) + WHATSAPP_MENU_LINKS + html.slice(close)
  return injectLock(renameWhatsAppTitle(next))
}

function renameWhatsAppTitle(html: string): string {
  return html.replace(
    /(id="wa-popup"[\s\S]{0,500}?font-weight:\s*700[^>]*>)[^<]*(<\/p>)/i,
    '$1CEP Formación$2',
  )
}

function injectLock(html: string): string {
  if (html.includes('data-cep-wa-menu-lock="1"')) return html
  const script = `<script data-cep-wa-menu-lock="1">
(function () {
  if (window.__cepWaMenuLock) return;
  window.__cepWaMenuLock = 1;
  var markup = ${JSON.stringify(WHATSAPP_MENU_LINKS)};
  function contentPad(popup) {
    var pad = null;
    var kids = popup.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (!el || el.tagName !== 'DIV') continue;
      var style = el.getAttribute('style') || '';
      if (el.querySelector('a') || style.indexOf('padding') !== -1) pad = el;
    }
    return pad;
  }
  function menuReady(pad) {
    var labels = Array.prototype.map.call(pad.querySelectorAll('strong'), function (node) {
      return (node.textContent || '').replace(/\\s+/g, ' ').trim();
    });
    return labels.join('|') === 'CEP Norte|CEP Santa Cruz|CEP Sur|CEP trabajadores desempleados y ocupados' && pad.querySelector('[data-cep-wa-badge]');
  }
  function apply() {
    var popup = document.getElementById('wa-popup');
    if (!popup) return;
    var title = popup.querySelector('p');
    if (title && /akademate/i.test(title.textContent || '')) title.textContent = 'CEP Formación';
    var pad = contentPad(popup);
    if (!pad || menuReady(pad)) {
      bindToggle();
      return;
    }
    var frag = document.createRange().createContextualFragment(markup);
    while (pad.firstChild) pad.removeChild(pad.firstChild);
    pad.appendChild(frag);
    bindToggle();
  }
  function bindToggle() {
    var widget = document.getElementById('wa-widget');
    var button = widget && widget.querySelector('button');
    var popup = document.getElementById('wa-popup');
    if (!widget || !button || !popup || button.getAttribute('data-cep-wa-toggle') === '1') return;
    button.setAttribute('data-cep-wa-toggle', '1');
    button.addEventListener('click', function (event) {
      event.preventDefault();
      var open = widget.getAttribute('data-cep-wa-open') === '1';
      widget.setAttribute('data-cep-wa-open', open ? '0' : '1');
      popup.style.display = open ? 'none' : 'block';
    });
  }
  function watch() {
    var popup = document.getElementById('wa-popup');
    if (!popup || popup.getAttribute('data-cep-wa-watch') === '1' || typeof MutationObserver !== 'function') return;
    popup.setAttribute('data-cep-wa-watch', '1');
    var busy = false;
    new MutationObserver(function () {
      if (busy) return;
      busy = true;
      apply();
      busy = false;
    }).observe(popup, { childList: true, subtree: true });
  }
  apply();
  watch();
  [400, 1200, 3000, 8000].forEach(function (ms) { setTimeout(function () { apply(); watch(); }, ms); });
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  return html + script
}
