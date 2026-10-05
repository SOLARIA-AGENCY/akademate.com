export const OLD_CAMPUS_URL = 'https://acaten.espacioaulavirtual.com/'
export const NEW_CAMPUS_HOST = 'campus.cepformacion.com'

export function isCampusPath(pathname: string): boolean {
  return pathname === '/campus' || pathname === '/campus/'
}

const CAMPUS_NAV_LABEL = 'Ver campus'

function rewriteCampusFlight(html: string): string {
  const pairs: Array<[string, string]> = [
    ['"cta":{"label":"Contacto","href":"/contacto"}', `"cta":{"label":"${CAMPUS_NAV_LABEL}","href":"/campus"}`],
    ['"login":{"label":"Acceso","href":"/acceso"}', '"login":null'],
    [
      '\\"cta\\":{\\"label\\":\\"Contacto\\",\\"href\\":\\"/contacto\\"}',
      `\\"cta\\":{\\"label\\":\\"${CAMPUS_NAV_LABEL}\\",\\"href\\":\\"/campus\\"}`,
    ],
    [
      '\\"login\\":{\\"label\\":\\"Acceso\\",\\"href\\":\\"/acceso\\"}',
      '\\"login\\":null',
    ],
  ]
  let next = html
  for (const [from, to] of pairs) {
    if (next.includes(from)) next = next.split(from).join(to)
  }
  return next
}

export function rewriteCampusNav(html: string): string {
  let next = rewriteCampusFlight(html)
  next = next.replace(
    /<a\b[^>]*href="https:\/\/cepformacion-campus\.akademate\.com\/login"[^>]*>[\s\S]*?<\/a>/gi,
    '',
  )
  next = next.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, (header) =>
    header.replace(/<a\b[^>]*\bhref="\/acceso"[^>]*>\s*Acceso\s*<\/a>/gi, ''),
  )
  next = next.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, (footer) =>
    footer.replace(/<li\b[^>]*>\s*<a\b[^>]*\bhref="\/acceso"[^>]*>\s*Acceso\s*<\/a>\s*<\/li>/gi, ''),
  )
  next = next.replace(
    /<a([^>]*)href="(?:\/p)?\/contacto"([^>]*)>(\s*)Contacto(\s*)<\/a>/gi,
    `<a$1href="/campus"$2>$3${CAMPUS_NAV_LABEL}$4</a>`,
  )
  next = next.replace(
    /(<a\b[^>]*href="\/campus"[^>]*>)(\s*)(?:Campus|Acceso campus)(\s*)(<\/a>)/gi,
    `$1$2${CAMPUS_NAV_LABEL}$3$4`,
  )
  return injectCampusLock(next)
}

function injectCampusLock(html: string): string {
  if (html.includes('data-cep-campus-nav-lock="1"')) return html
  const script = `<script data-cep-campus-nav-lock="1">
(function () {
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('a[href="https://cepformacion-campus.akademate.com/login"]').forEach(function (link) {
      if (link.parentNode) link.parentNode.removeChild(link);
    });
    document.querySelectorAll('a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var campusHref = '/p' + '/contacto';
      var text = (link.textContent || '').replace(/\\s+/g, ' ').trim();
      if (href === '/acceso' && text === 'Acceso') {
        var chrome = link.closest && (link.closest('header') || link.closest('footer'));
        if (chrome && link.parentNode) {
          var parent = link.parentNode;
          if (parent.tagName === 'LI' && parent.parentNode) parent.parentNode.removeChild(parent);
          else parent.removeChild(link);
        }
        return;
      }
      if (href !== '/contacto' && href !== campusHref && href !== '/campus') return;
      if (text !== 'Contacto' && text !== 'Campus' && text !== 'Campus Virtual' && text !== 'Acceso campus' && text !== '${CAMPUS_NAV_LABEL}') return;
      if (!(link.closest && link.closest('header'))) return;
      if (href === '/campus' && text === '${CAMPUS_NAV_LABEL}') return;
      link.setAttribute('href', '/campus');
      if (text !== '${CAMPUS_NAV_LABEL}') link.textContent = '${CAMPUS_NAV_LABEL}';
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
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [400, 1200, 3000, 8000].forEach(function (ms) { setTimeout(apply, ms); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

const CAMPUS_SHELL_PATH = '/p/contacto'
const CAMPUS_TITLE = 'Campus virtual | CEP Formación'
const CAMPUS_DESCRIPTION = 'Campus virtual de CEP Formación. El nuevo campus está en construcción.'
const CAMPUS_CANONICAL = 'https://cepformacion.com/campus'

const CAMPUS_PAGE_CSS = `[data-cep-campus-page]{padding:3rem 1.25rem 4.5rem;background:#fff7fa}
[data-cep-campus-page] .cep-campus-wrap{width:min(100%,28rem);margin:0 auto}
[data-cep-campus-page] .card,[data-cep-campus-page] .current-card{padding:1.75rem;border:1px solid #eadadd;border-radius:1.5rem;background:rgba(255,255,255,.92)}
[data-cep-campus-page] .current-card{margin-top:1.25rem;padding:1.5rem;background:#fff;text-align:center}
[data-cep-campus-page] .eyebrow{margin:0 0 .7rem;color:#f2014b;font-size:.85rem;font-weight:600;letter-spacing:0;text-transform:none}
[data-cep-campus-page] h1{margin:0;font-size:clamp(1.6rem,4vw,1.85rem);line-height:1.15;letter-spacing:-.03em;font-weight:780;color:#3E091A}
[data-cep-campus-page] .soon{display:inline-flex;margin:1rem 0 0;padding:.4rem .75rem;border-radius:999px;background:rgba(242,1,75,.08);color:#f2014b;font-size:.82rem;font-weight:700}
[data-cep-campus-page] form{margin:1.5rem 0 0;display:grid;gap:.9rem}
[data-cep-campus-page] label{display:grid;gap:.4rem;font-size:.82rem;font-weight:700;color:#3E091A}
[data-cep-campus-page] input{width:100%;min-height:2.75rem;padding:.7rem .9rem;border:1px solid #eadadd;border-radius:.9rem;background:#f6f1f2;color:#3E091A;font:inherit;opacity:.72;cursor:not-allowed;box-sizing:border-box}
[data-cep-campus-page] .row{display:flex;justify-content:flex-end}
[data-cep-campus-page] .recover,[data-cep-campus-page] .enter,[data-cep-campus-page] .current{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;border-radius:999px;font:inherit;font-weight:700}
[data-cep-campus-page] .recover{padding:0;border:0;background:none;color:#6f5d60;font-size:.85rem;cursor:not-allowed;opacity:.7}
[data-cep-campus-page] .enter{width:100%;border:0;background:#f2014b;color:#fff;opacity:.55;cursor:not-allowed}
[data-cep-campus-page] .current-card img{height:2.5rem;width:auto;object-fit:contain}
[data-cep-campus-page] .current{width:100%;margin-top:1.1rem;background:#3E091A;color:#fff;text-decoration:none}
@media (max-width:767px){[data-cep-campus-page]{padding:2rem 1rem 3.5rem}}
`

export function campusShellPath(): string {
  return CAMPUS_SHELL_PATH
}

function campusPageCssTag(): string {
  return `<style data-cep-campus-css="1">${CAMPUS_PAGE_CSS}</style>`
}

export function campusPageInner(logoUrl: string): string {
  return `<div data-cep-campus-page="1">
  <div class="cep-campus-wrap">
    <section class="card" aria-labelledby="campus-login-title">
      <p class="eyebrow">Campus virtual</p>
      <h1 id="campus-login-title">Acceso al campus</h1>
      <p class="soon">Próximamente acceso al nuevo campus</p>
      <form action="#" method="post" autocomplete="off" novalidate onsubmit="return false">
        <label>Usuario o correo
          <input type="email" inputmode="email" placeholder="david.c@example.com" disabled readonly tabindex="-1" aria-disabled="true">
        </label>
        <label>Contraseña
          <input type="password" placeholder="••••••••" disabled readonly tabindex="-1" aria-disabled="true">
        </label>
        <div class="row">
          <button class="recover" type="button" disabled tabindex="-1">Recuperar contraseña</button>
        </div>
        <button class="enter" type="button" disabled tabindex="-1">Entrar</button>
      </form>
    </section>
    <section class="current-card">
      <img src="${logoUrl}" alt="CEP Formación">
      <a class="current" href="${OLD_CAMPUS_URL}" rel="noopener noreferrer">Acceso a campus actual</a>
    </section>
  </div>
</div>`
}

function hasSiteChrome(html: string): boolean {
  const lower = html.toLowerCase()
  return lower.includes('<header') && lower.includes('<footer')
}

function stripAppRuntime(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/>/gi, '')
    .replace(/<link\b[^>]*rel="(?:module)?preload"[^>]*>/gi, '')
}

function replaceMainInner(html: string, inner: string): string | null {
  const open = html.match(/<main\b[^>]*>/i)
  if (!open || open.index === undefined) return null
  const start = open.index + open[0].length
  const close = html.toLowerCase().indexOf('</main>', start)
  if (close === -1) return null
  return html.slice(0, start) + inner + html.slice(close)
}

function insertAfterHeader(html: string, block: string): string | null {
  const lower = html.toLowerCase()
  const close = lower.indexOf('</header>')
  if (close === -1) return null
  const at = close + '</header>'.length
  return html.slice(0, at) + block + html.slice(at)
}

function applyCampusSeo(html: string): string {
  let next = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${CAMPUS_TITLE}</title>`)
  if (!/<title>/i.test(next)) {
    next = next.replace(/<head[^>]*>/i, (open) => `${open}<title>${CAMPUS_TITLE}</title>`)
  }
  if (/rel=["']canonical["']/i.test(next)) {
    next = next.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${CAMPUS_CANONICAL}">`)
  } else {
    next = next.replace(/<head[^>]*>/i, (open) => `${open}<link rel="canonical" href="${CAMPUS_CANONICAL}">`)
  }
  if (/name=["']description["']/i.test(next)) {
    next = next.replace(/<meta\b[^>]*name=["']description["'][^>]*>/i, `<meta name="description" content="${CAMPUS_DESCRIPTION}">`)
  } else {
    next = next.replace(/<head[^>]*>/i, (open) => `${open}<meta name="description" content="${CAMPUS_DESCRIPTION}">`)
  }
  return next
}

function injectHead(html: string, snippet: string): string {
  if (html.includes('</head>')) return html.replace('</head>', `${snippet}</head>`)
  if (html.includes('<head>')) return html.replace('<head>', `<head>${snippet}`)
  return snippet + html
}

function injectCampusPageLock(html: string, logoUrl: string): string {
  if (html.includes('data-cep-campus-page-lock="1"')) return html
  const script = `<script data-cep-campus-page-lock="1">
(function () {
  var logo = ${JSON.stringify(logoUrl)};
  var css = ${JSON.stringify(CAMPUS_PAGE_CSS)};
  var applying = false;
  function ensureCss() {
    if (document.querySelector('style[data-cep-campus-css="1"]')) return;
    var tag = document.createElement('style');
    tag.setAttribute('data-cep-campus-css', '1');
    tag.textContent = css;
    (document.head || document.documentElement).appendChild(tag);
  }
  function pageOk() {
    var pass = document.querySelector('[data-cep-campus-page] input[type="password"]');
    return Boolean(document.querySelector('header') && document.querySelector('footer') && document.querySelector('[data-cep-campus-page="1"]') && document.querySelector('#campus-login-title') && pass && !pass.getAttribute('name'));
  }
  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }
  function build() {
    var root = el('div');
    root.setAttribute('data-cep-campus-page', '1');
    var wrap = el('div', 'cep-campus-wrap');
    var card = el('section', 'card');
    card.setAttribute('aria-labelledby', 'campus-login-title');
    var eyebrow = el('p', 'eyebrow');
    eyebrow.textContent = 'Campus virtual';
    var title = el('h1');
    title.id = 'campus-login-title';
    title.textContent = 'Acceso al campus';
    var soon = el('p', 'soon');
    soon.textContent = 'Próximamente acceso al nuevo campus';
    var form = el('form');
    form.action = '#';
    form.method = 'post';
    form.setAttribute('autocomplete', 'off');
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (event) { event.preventDefault(); });
    var userLabel = el('label');
    userLabel.appendChild(document.createTextNode('Usuario o correo'));
    var user = document.createElement('input');
    user.type = 'email';
    user.inputMode = 'email';
    user.placeholder = 'david.c@example.com';
    user.disabled = true;
    user.readOnly = true;
    user.tabIndex = -1;
    user.setAttribute('aria-disabled', 'true');
    userLabel.appendChild(user);
    var passLabel = el('label');
    passLabel.appendChild(document.createTextNode('Contraseña'));
    var pass = document.createElement('input');
    pass.type = 'password';
    pass.placeholder = '••••••••';
    pass.disabled = true;
    pass.readOnly = true;
    pass.tabIndex = -1;
    pass.setAttribute('aria-disabled', 'true');
    passLabel.appendChild(pass);
    var row = el('div', 'row');
    var recover = el('button', 'recover');
    recover.type = 'button';
    recover.disabled = true;
    recover.tabIndex = -1;
    recover.textContent = 'Recuperar contraseña';
    row.appendChild(recover);
    var enter = el('button', 'enter');
    enter.type = 'button';
    enter.disabled = true;
    enter.tabIndex = -1;
    enter.textContent = 'Entrar';
    form.appendChild(userLabel);
    form.appendChild(passLabel);
    form.appendChild(row);
    form.appendChild(enter);
    card.appendChild(eyebrow);
    card.appendChild(title);
    card.appendChild(soon);
    card.appendChild(form);
    var current = el('section', 'current-card');
    var img = document.createElement('img');
    img.src = logo;
    img.alt = 'CEP Formación';
    var link = el('a', 'current');
    link.href = ${JSON.stringify(OLD_CAMPUS_URL)};
    link.rel = 'noopener noreferrer';
    link.textContent = 'Acceso a campus actual';
    current.appendChild(img);
    current.appendChild(link);
    wrap.appendChild(card);
    wrap.appendChild(current);
    root.appendChild(wrap);
    return root;
  }
  function apply() {
    if (applying || !document.body) return;
    ensureCss();
    if (pageOk()) return;
    applying = true;
    try {
      var next = build();
      var main = document.querySelector('main');
      if (main) {
        while (main.firstChild) main.removeChild(main.firstChild);
        main.appendChild(next);
        return;
      }
      var header = document.querySelector('header');
      if (header && header.parentNode) {
        var shell = document.createElement('main');
        shell.className = 'flex-1 pt-12 sm:pt-14 md:pt-[5.5rem]';
        shell.appendChild(next);
        header.insertAdjacentElement('afterend', shell);
      }
    } finally {
      applying = false;
    }
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

export function embedCampusInSite(html: string, logoUrl: string): string | null {
  if (!hasSiteChrome(html)) return null
  let next = stripAppRuntime(html)
  const inner = campusPageInner(logoUrl)
  next = replaceMainInner(next, inner) || insertAfterHeader(next, `<main class="flex-1 pt-12 sm:pt-14 md:pt-[5.5rem]">${inner}</main>`)
  if (!next) return null
  next = applyCampusSeo(next)
  next = injectHead(next, campusPageCssTag())
  return injectCampusPageLock(next, logoUrl)
}

export function campusLandingHtml(logoUrl: string, faviconUrl: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Campus virtual de CEP Formación. El nuevo campus está en construcción.">
    <meta name="theme-color" content="#fff8f9">
    <meta name="robots" content="noindex,nofollow">
    <link rel="canonical" href="https://cepformacion.com/campus">
    <link rel="icon" href="${faviconUrl}" type="image/svg+xml">
    <title>Campus virtual | CEP Formación</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
      :root { color-scheme: light; --ink: #3E091A; --muted: #6f5d60; --pink: #f2014b; --line: #eadadd; --paper: #fffdfd; }
      * { box-sizing: border-box; }
      html, body { min-height: 100%; }
      body {
        margin: 0;
        background: radial-gradient(circle at 18% 16%, rgba(242, 1, 75, .08), transparent 28rem), linear-gradient(145deg, #fff8f9 0%, var(--paper) 52%, #fff 100%);
        color: var(--ink);
        font-family: Manrope, ui-sans-serif, sans-serif;
      }
      a { color: inherit; }
      header { width: min(100%, 28rem); margin: 0 auto; padding: 1.5rem 1.25rem 0; display: flex; justify-content: space-between; align-items: center; }
      header img { height: 2.25rem; width: auto; object-fit: contain; }
      header a.home { color: var(--muted); font-size: .9rem; font-weight: 600; text-decoration: none; }
      main { width: min(100%, 28rem); margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
      .card { padding: 1.75rem; border: 1px solid var(--line); border-radius: 1.5rem; background: rgba(255,255,255,.86); }
      .eyebrow { margin: 0 0 .7rem; color: var(--pink); font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 1.85rem; line-height: 1.15; letter-spacing: -.03em; font-weight: 780; }
      .soon { display: inline-flex; margin: 1rem 0 0; padding: .4rem .75rem; border-radius: 999px; background: rgba(242, 1, 75, .08); color: var(--pink); font-size: .82rem; font-weight: 700; }
      form { margin: 1.5rem 0 0; display: grid; gap: .9rem; }
      label { display: grid; gap: .4rem; font-size: .82rem; font-weight: 700; color: var(--ink); }
      input {
        width: 100%; min-height: 2.75rem; padding: .7rem .9rem; border: 1px solid var(--line); border-radius: .9rem;
        background: #f6f1f2; color: var(--ink); font: inherit; opacity: .72; cursor: not-allowed;
      }
      .row { display: flex; justify-content: flex-end; }
      .recover, .enter, .current { display: inline-flex; align-items: center; justify-content: center; min-height: 2.75rem; border-radius: 999px; font: inherit; font-weight: 700; }
      .recover { padding: 0; border: 0; background: none; color: var(--muted); font-size: .85rem; cursor: not-allowed; opacity: .7; }
      .enter { width: 100%; border: 0; background: var(--pink); color: #fff; opacity: .55; cursor: not-allowed; }
      .current-card { margin-top: 1.25rem; padding: 1.5rem; border: 1px solid var(--line); border-radius: 1.5rem; background: #fff; text-align: center; }
      .current-card img { height: 2.5rem; width: auto; object-fit: contain; }
      .current { width: 100%; margin-top: 1.1rem; background: var(--ink); color: #fff; text-decoration: none; }
    </style>
  </head>
  <body>
    <header>
      <a href="/"><img src="${logoUrl}" alt="CEP Formación"></a>
      <a class="home" href="/">Volver a la web</a>
    </header>
    <main>
      <section class="card" aria-labelledby="campus-login-title">
        <p class="eyebrow">Campus virtual</p>
        <h1 id="campus-login-title">Acceso al campus</h1>
        <p class="soon">Próximamente acceso al nuevo campus</p>
        <form action="#" method="post" autocomplete="off" novalidate onsubmit="return false">
          <label>Usuario o correo
            <input type="email" inputmode="email" placeholder="david.c@example.com" disabled readonly tabindex="-1" aria-disabled="true">
          </label>
          <label>Contraseña
            <input type="password" placeholder="••••••••" disabled readonly tabindex="-1" aria-disabled="true">
          </label>
          <div class="row">
            <button class="recover" type="button" disabled tabindex="-1">Recuperar contraseña</button>
          </div>
          <button class="enter" type="button" disabled tabindex="-1">Entrar</button>
        </form>
      </section>
      <section class="current-card">
        <img src="${logoUrl}" alt="CEP Formación">
        <a class="current" href="${OLD_CAMPUS_URL}" rel="noopener noreferrer">Acceso a campus actual</a>
      </section>
    </main>
  </body>
</html>`
}
