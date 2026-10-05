export const CEP_GA4_MEASUREMENT_ID = 'G-ZPBEY6SHX9'

export const FORBIDDEN_GA4_IDS = ['G-347NGFNZ90', 'G-XG7SZHEM8X'] as const
export const FORBIDDEN_GTM_IDS = ['GTM-5D4839F3', 'GTM-TKSVM638'] as const

const CONSENT_DEFAULT = `{
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
}`

export function googleTagSnippet(measurementId = CEP_GA4_MEASUREMENT_ID): string {
  const id = measurementId.replace(/[^A-Z0-9-]/g, '')
  return `<script data-cep-ga4="1">
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', ${CONSENT_DEFAULT});
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}" data-cep-ga4="1"></script>
<script data-cep-ga4="1">
gtag('js', new Date());
gtag('config', '${id}', { anonymize_ip: true, send_page_view: true });
(function () {
  if (window.__cepGa4Lock) return;
  window.__cepGa4Lock = 1;
  var ID = ${JSON.stringify(id)};
  function granted(on) { return on ? 'granted' : 'denied'; }
  function update(analytics, marketing) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      analytics_storage: granted(analytics),
      ad_storage: granted(marketing),
      ad_user_data: granted(marketing),
      ad_personalization: granted(marketing)
    });
  }
  function fromStorage() {
    try {
      var raw = window.localStorage.getItem('cep_cookie_consent_v1');
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (typeof parsed.analytics === 'boolean') update(parsed.analytics, parsed.marketing === true);
    } catch (e) {}
  }
  function dedupe() {
    if (!document.querySelectorAll) return;
    var seen = false;
    var bannedGtm = ['GTM-' + '5D4839F3', 'GTM-' + 'TKSVM638'];
    document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').forEach(function (node) {
      var src = node.getAttribute('src') || '';
      if (src.indexOf(ID) === -1) { node.parentNode && node.parentNode.removeChild(node); return; }
      if (seen) node.parentNode && node.parentNode.removeChild(node);
      else seen = true;
    });
    document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').forEach(function (node) {
      var src = node.getAttribute('src') || '';
      if (bannedGtm.some(function (id) { return src.indexOf(id) !== -1; })) {
        node.parentNode && node.parentNode.removeChild(node);
      }
    });
  }
  window.addEventListener('cep-consent-updated', function (event) {
    var detail = event && event.detail ? event.detail : {};
    update(detail.analytics === true, detail.marketing === true);
  });
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var button = target.closest('button');
    if (!button) return;
    var text = (button.textContent || '').replace(/\\s+/g, ' ').trim();
    if (/^aceptar$/i.test(text) || /^aceptar todas$/i.test(text)) update(true, true);
    if (/^solo esenciales$/i.test(text) || /^esenciales$/i.test(text)) update(false, false);
  }, true);
  fromStorage();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', dedupe);
  else dedupe();
})();
</script>`
}

function stripForbiddenTags(html: string): string {
  let next = html.replace(
    /<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=(?:G-347NGFNZ90|G-XG7SZHEM8X)"[^>]*><\/script>/gi,
    '',
  )
  next = next.replace(
    /<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=(?:GTM-5D4839F3|GTM-TKSVM638)[^"]*"[^>]*><\/script>/gi,
    '',
  )
  next = next.replace(/gtag\('config',\s*'(?:G-347NGFNZ90|G-XG7SZHEM8X)'[^;]*\);?/g, '')
  return next
}

export function hasCanonicalGoogleTag(html: string): boolean {
  return (
    html.includes(`gtag/js?id=${CEP_GA4_MEASUREMENT_ID}`) &&
    html.includes('analytics_storage') &&
    html.includes("gtag('consent', 'default'")
  )
}

function stripScriptsMatching(html: string, marker: RegExp): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => {
    if (script.includes('self.__next_f')) return script
    return marker.test(script) ? '' : script
  })
}

function stripCanonicalTagCopies(html: string): string {
  const withoutSrc = html.replace(
    /<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-ZPBEY6SHX9"[^>]*>\s*<\/script>/gi,
    '',
  )
  return stripScriptsMatching(
    stripScriptsMatching(withoutSrc, /gtag\(\s*'config'\s*,\s*'G-ZPBEY6SHX9'/),
    /gtag\(\s*'consent'\s*,\s*'default'/,
  )
}

export function injectGoogleTag(html: string): string {
  const stripped = stripCanonicalTagCopies(stripForbiddenTags(html))
  if (hasCanonicalGoogleTag(stripped)) return stripped
  const snippet = googleTagSnippet()
  if (/<head[^>]*>/i.test(stripped)) {
    return stripped.replace(/<head[^>]*>/i, (open) => `${open}${snippet}`)
  }
  if (stripped.includes('<html')) {
    return stripped.replace(/<html[^>]*>/i, (open) => `${open}<head>${snippet}</head>`)
  }
  return snippet + stripped
}
