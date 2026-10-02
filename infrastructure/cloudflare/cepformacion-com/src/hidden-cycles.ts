function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function isHiddenPublicCycle(slug?: string | null, name?: string | null): boolean {
  const slugKey = fold(slug || '')
  const nameKey = fold(name || '')
  return slugKey.includes('qa-ciclo') || slugKey.startsWith('qa-') || nameKey.includes('qa ciclo')
}

export function isHiddenPublicCyclePath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '')
  const match = path.match(/\/(?:p\/)?ciclos\/([^/?#]+)/i)
  if (!match) return false
  try {
    return isHiddenPublicCycle(decodeURIComponent(match[1]))
  } catch {
    return isHiddenPublicCycle(match[1])
  }
}

function blockContainsHiddenCycle(block: string): boolean {
  const hrefs = [...block.matchAll(/href="([^"]*ciclos\/[^"#?]+)"/gi)].map((item) => item[1])
  for (const href of hrefs) {
    if (isHiddenPublicCyclePath(href)) return true
  }
  const heading = block.match(/<h[123][^>]*>([^<]+)<\/h[123]>/i)
  if (heading && isHiddenPublicCycle(null, heading[1])) return true
  return false
}

export function hideTestCycles(html: string): string {
  let next = html.replace(/<(article|a)(\s[^>]*)?>[\s\S]*?<\/\1>/gi, (block) => {
    return blockContainsHiddenCycle(block) ? '' : block
  })
  next = next.replace(/<a\b[^>]*href="[^"]*\/(?:p\/)?ciclos\/qa-[^"]+"[^>]*>[\s\S]*?<\/a>/gi, '')
  return injectHideLock(next)
}

function injectHideLock(html: string): string {
  if (html.includes('data-cep-hidden-cycles-lock="1"')) return html
  const script = `<script data-cep-hidden-cycles-lock="1">
(function () {
  if (window.__cepHiddenCyclesLock) return;
  window.__cepHiddenCyclesLock = 1;
  function hiddenHref(href) {
    var value = String(href || '').split('?')[0];
    var parts = value.split('/');
    var slug = decodeURIComponent(parts[parts.length - 1] || '').toLowerCase();
    if (!slug) return false;
    if (slug.indexOf('qa-ciclo') !== -1 || slug.indexOf('qa-') === 0) return true;
    return false;
  }
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('a[href*="/ciclos/"]').forEach(function (link) {
      if (!hiddenHref(link.getAttribute('href'))) return;
      var card = link.closest('article') || link;
      if (card && card.parentNode) card.parentNode.removeChild(card);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}
