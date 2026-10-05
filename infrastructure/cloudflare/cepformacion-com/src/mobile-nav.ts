export function rewriteMobileNav(html: string): string {
  if (html.includes('data-cep-mobile-nav-lock="1"')) return html
  const script = `<script data-cep-mobile-nav-lock="1">
(function () {
  var PANEL_ID = 'cep-mobile-nav';
  var open = false;
  var expanded = '';
  function desktop() {
    return document.querySelector('header nav');
  }
  function hamburger() {
    return document.querySelector('header button[aria-controls="public-mobile-menu"], header button[aria-label="Abrir menú"], header button[aria-label="Menu"], header button.lg\\\\:hidden');
  }
  function labelOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }
  function parseItems() {
    var nav = desktop();
    if (!nav) return [];
    var items = [];
    Array.prototype.forEach.call(nav.children, function (child) {
      if (child.tagName === 'A') {
        var href = child.getAttribute('href') || '/';
        var label = labelOf(child);
        if (label === 'APROEM' || href === '/aproem') return;
        if (label === 'Nuevas formaciones' || href.indexOf('nuevas-formaciones') !== -1) return;
        items.push({ label: label, href: href, kids: [], cta: (child.getAttribute('class') || '').indexOf('brand-btn') !== -1 });
        return;
      }
      if (child.tagName !== 'DIV') return;
      var parent = child.querySelector(':scope > a');
      if (!parent) return;
      var kids = [];
      var sub = child.querySelector(':scope > div');
      if (sub) {
        Array.prototype.forEach.call(sub.querySelectorAll('a'), function (link) {
          kids.push({ label: labelOf(link), href: link.getAttribute('href') || '/' });
        });
      }
      items.push({ label: labelOf(parent), href: parent.getAttribute('href') || '/', kids: kids, cta: false });
    });
    var seenTransparency = false;
    items.forEach(function (item) { if (item.href === '/transparencia') seenTransparency = true; });
    if (!seenTransparency) items.push({ label: 'Transparencia', href: '/transparencia', kids: [], cta: false });
    return items;
  }
  function hideReactMenu() {
    var el = document.getElementById('public-mobile-menu');
    if (!el) return;
    el.setAttribute('hidden', '');
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
  }
  function headerOffset() {
    var header = document.querySelector('header');
    return header ? Math.ceil(header.getBoundingClientRect().height) : 56;
  }
  function panel() {
    return document.getElementById(PANEL_ID);
  }
  function ensurePanel() {
    var current = panel();
    if (current) return current;
    var node = document.createElement('div');
    node.id = PANEL_ID;
    node.setAttribute('hidden', '');
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-label', 'Menú');
    document.body.appendChild(node);
    return node;
  }
  function stylePanel(node) {
    node.style.cssText = 'position:fixed;left:0;right:0;bottom:0;top:' + headerOffset() + 'px;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;background:#fff;z-index:60;padding:8px 16px 48px;display:' + (open ? 'block' : 'none');
  }
  function rowStyle() {
    return 'display:flex;align-items:center;justify-content:space-between;width:100%;min-height:48px;padding:12px 4px;border-bottom:1px solid #eadadd;background:none;border-left:0;border-right:0;border-top:0;font:inherit;font-size:16px;font-weight:650;color:#3E091A;text-align:left;text-decoration:none;';
  }
  function subStyle() {
    return 'display:block;padding:10px 12px;margin:4px 0;border-radius:12px;color:#3E091A;text-decoration:none;font-size:15px;font-weight:600;';
  }
  function render() {
    var node = ensurePanel();
    stylePanel(node);
    while (node.firstChild) node.removeChild(node.firstChild);
    if (!open) {
      node.setAttribute('hidden', '');
      return;
    }
    node.removeAttribute('hidden');
    parseItems().forEach(function (item) {
      if (item.kids.length) {
        var wrap = document.createElement('div');
        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', item.label === expanded ? 'true' : 'false');
        toggle.style.cssText = rowStyle();
        var name = document.createElement('span');
        name.textContent = item.label;
        var chevron = document.createElement('span');
        chevron.textContent = item.label === expanded ? '▾' : '▸';
        chevron.setAttribute('aria-hidden', 'true');
        toggle.appendChild(name);
        toggle.appendChild(chevron);
        toggle.addEventListener('click', function () {
          expanded = expanded === item.label ? '' : item.label;
          render();
        });
        wrap.appendChild(toggle);
        if (item.label === expanded) {
          var list = document.createElement('div');
          list.style.cssText = 'padding:4px 0 12px 8px;';
          item.kids.forEach(function (kid) {
            var link = document.createElement('a');
            link.href = kid.href;
            link.textContent = kid.label;
            link.style.cssText = subStyle();
            list.appendChild(link);
          });
          wrap.appendChild(list);
        }
        node.appendChild(wrap);
        return;
      }
      var link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      link.style.cssText = rowStyle() + (item.cta ? 'margin-top:16px;justify-content:center;border-radius:12px;background:#f2014b;color:#fff;border-bottom:0;' : '');
      node.appendChild(link);
    });
  }
  function setOpen(next) {
    open = next;
    if (!open) expanded = '';
    var btn = hamburger();
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }
    document.body.style.overflow = open ? 'hidden' : '';
    hideReactMenu();
    render();
  }
  function onDocClick(event) {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      if (open) setOpen(false);
      return;
    }
    var raw = event.target;
    if (raw && raw.nodeType === 3) raw = raw.parentNode;
    var btn = raw && raw.closest ? raw.closest('header button[aria-controls="public-mobile-menu"], header button[aria-label="Abrir menú"], header button[aria-label="Cerrar menú"], header button[aria-label="Menu"]') : null;
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    setOpen(!open);
  }
  function start() {
    if (!document.body) return;
    document.addEventListener('click', onDocClick, true);
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1024px)').matches && open) setOpen(false);
      else if (open) stylePanel(ensurePanel());
    });
    hideReactMenu();
    var obs = new MutationObserver(hideReactMenu);
    obs.observe(document.body, { childList: true, subtree: true });
    hideReactMenu();
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
