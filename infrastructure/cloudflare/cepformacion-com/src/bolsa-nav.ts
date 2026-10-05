export function rewriteBolsaNav(html: string): string {
  if (html.includes('data-cep-bolsa-nav-lock="1"')) return html
  let next = html.replace(
    /(<a([^>]*)href="(?:\/p)?\/empleo"([^>]*)>)(\s*)Bolsa de empleo(\s*)(<\/a>)/gi,
    '$1$4Bolsa de trabajo$5$6',
  )
  next = next.replace(
    /<a href="\/empleo" class="text-sm font-medium text-gray-600 brand-hover transition-colors">Bolsa de trabajo<\/a>/g,
    '',
  )
  return injectBolsaLock(next)
}

function injectBolsaLock(html: string): string {
  const script = `<script data-cep-bolsa-nav-lock="1">
(function () {
  if (window.__cepBolsaNavLock) return;
  window.__cepBolsaNavLock = 1;
  function textOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }
  function hrefOf(el) {
    return String(el.getAttribute('href') || '');
  }
  function isEmpleo(href) {
    return href === '/empleo' || href === '/p/empleo';
  }
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('header nav > a, header [data-cep-header-tools] > a').forEach(function (link) {
      var label = textOf(link);
      if (!isEmpleo(hrefOf(link))) return;
      if (label === 'Bolsa de trabajo' || label === 'Bolsa de empleo') link.remove();
    });
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
    [80, 400, 1200].forEach(function (ms) { setTimeout(apply, ms); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}
