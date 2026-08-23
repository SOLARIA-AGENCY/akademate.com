# Cloudflare dashboard — public host redirects (akademate.com)

Worker deploy does **not** create these canonical redirects. Set them in the Cloudflare dashboard for the `akademate.com` zone. Do not point the marketing host at a third-party origin.

Canonical public host: **`https://akademate.com`** (apex). `hreflang` x-default is `/en`. Spanish visitors are sent to `/es` by the Worker middleware.

## 1. HTTP → HTTPS (301)

Scan (2026-08-23): `http://akademate.com` and `http://www.akademate.com` returned **200 HTML** with no `Location` to HTTPS.

In the zone:

1. **SSL/TLS → Overview:** encryption mode **Full (strict)**.
2. **SSL/TLS → Edge Certificates:** **Always Use HTTPS** = On.
3. Confirm a 301:

```bash
curl -sI http://akademate.com/ | grep -iE 'HTTP/|location:'
# Expected: 301 and Location: https://akademate.com/
```

HSTS is already sent by the Worker (`max-age=31536000; includeSubDomains`). HTTPS redirect must happen **before** the HTML response.

## 2. www ↔ apex (301)

Scan: `https://www.akademate.com/` and `https://akademate.com/` both 200 with twin HTML (duplicate host).

**Rules → Redirect Rules** (or a single dynamic redirect):

| From | To | Status |
| --- | --- | --- |
| `https://www.akademate.com/*` | `https://akademate.com/${path}` | 301 |

Keep the Worker route on both `akademate.com/*` and `www.akademate.com/*` so the redirect still runs on Cloudflare, then drop the duplicate index.

```bash
curl -sI https://www.akademate.com/en | grep -iE 'HTTP/|location:'
# Expected: 301 and Location: https://akademate.com/en
```

Do **not** add a reverse apex→www rule. Sitemap, `metadataBase` and canonicals use apex.

## 3. After the rules are live

- `http://akademate.com` → `https://akademate.com/`
- `http://www.akademate.com` → `https://akademate.com/` (HTTPS first, then www→apex, or a combined rule)
- `https://www.akademate.com/es/pricing` → `https://akademate.com/es/pricing`

These dashboard rules are required for GTM/SEO hygiene. They are not implied by `wrangler deploy`.
