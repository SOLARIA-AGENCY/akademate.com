# Akademate public HTTP scan

Scan date: 2026-08-23 (UTC). Method: curl + WebFetch. Public GET only. No exploits.

## Host reachability

| URL | HTTPS | Status | Notes |
| --- | --- | --- | --- |
| https://akademate.com/ | yes | 200 | Cloudflare, HSTS `max-age=31536000; includeSubDomains`, Next.js marketing site |
| https://www.akademate.com/ | yes | 200 | Same content signature as apex (identical HTML size); no canonical host redirect observed |
| http://akademate.com/ | no | 200 | Serves HTML over HTTP; **no HTTP→HTTPS Location redirect** observed (HSTS present on responses) |
| http://www.akademate.com/ | no | 200 | Same as apex HTTP: 200 without redirect to HTTPS |
| https://cepformacion.akademate.com/ | yes | 200 | Live academy tenant (CEP Formación); Next.js; HSTS with `preload` |
| https://academy.akademate.com/ | — | DNS fail | Host does not resolve (`Could not resolve host`) |
| https://app.akademate.com/auth/login | yes | 503 | Target of `/login` redirect; unavailable at scan time |

## Redirect map (first hop)

| From | Status | To |
| --- | --- | --- |
| https://akademate.com/privacidad | 307 | https://akademate.com/legal/privacidad |
| https://akademate.com/cookies | 307 | https://akademate.com/legal/cookies |
| https://akademate.com/terminos | 307 | https://akademate.com/legal/terminos |
| https://akademate.com/login | 307 | https://app.akademate.com/auth/login |
| https://www.akademate.com/cookies | 200 (after follow) | https://www.akademate.com/legal/cookies |
| https://www.akademate.com/login | 503 (after follow) | https://app.akademate.com/auth/login |
| cepformacion `/privacidad`, `/privacy`, `/cookies`, `/aviso-legal`, `/login` | 200 (after follow) | `/auth/login?redirect=…` (auth gate, not public legal HTML) |
| cepformacion `/robots.txt`, `/sitemap.xml` | 200 (after follow) | `/auth/login?redirect=…` (not true robots/sitemap) |

No apex↔www redirect and no HTTP→HTTPS redirect observed on first hop.

## Live URLs (marketing / legal / product)

### akademate.com (marketing)

| URL | Status | Title / H1 (where captured) |
| --- | --- | --- |
| https://akademate.com/ | 200 | Title: `The operating system for academies`. H1: `Run the whole academy.` |
| https://www.akademate.com/ | 200 | Same title/H1 as apex |
| https://akademate.com/en | 200 | Locale home (sitemap priority 1) |
| https://akademate.com/es | 200 | Locale home |
| https://akademate.com/pricing | 200 | Title ends with `Akademate pricing and plans \| Akademate`. H1: `A clear operating scope for every stage.` |
| https://akademate.com/contacto | 200 | Title: `Contact \| Akademate`. H1: `See your academy differently.` |
| https://akademate.com/cursos | 200 | Reachable |
| https://akademate.com/en/features | 200 | Reachable |
| https://akademate.com/en/sobre-nosotros | 200 | Reachable |
| https://akademate.com/legal/privacidad | 200 | `Privacy policy \| Akademate` (last updated 29 July 2026; marked under professional review) |
| https://akademate.com/legal/cookies | 200 | `Cookie policy \| Akademate` |
| https://akademate.com/legal/terminos | 200 | `Terms of use \| Akademate` |
| https://akademate.com/en/legal/privacidad | 200 | Locale legal |
| https://akademate.com/en/legal/terminos | 200 | Locale legal |
| https://akademate.com/en/legal/cookies | 200 | Locale legal |
| https://akademate.com/en/legal/subencargados | 200 | `Subprocessors and providers \| Akademate` |
| https://akademate.com/en/legal/ia | 200 | `AI transparency \| Akademate` |
| https://akademate.com/es/legal/* (sitemap) | listed in sitemap | `/es/legal/privacidad`, `/terminos`, `/cookies`, `/subencargados`, `/ia` |

Homepage footer/legal hrefs present in HTML: `/en/legal/privacidad`, `/en/legal/cookies`, `/en/legal/terminos`, `/en/legal/subencargados`, `/en/legal/ia`.

### cepformacion.akademate.com (tenant)

| URL | Status | Title / H1 |
| --- | --- | --- |
| https://cepformacion.akademate.com/ | 200 | Title: `CEP FORMACION — Plataforma Educativa`. H1: `Impulsa tu futuro profesional` |
| https://cepformacion.akademate.com/campus | 200 | Reachable |
| https://cepformacion.akademate.com/cursos | 200 | Reachable |
| https://cepformacion.akademate.com/p/legal/privacidad | 200 | Linked from site as `/p/legal/privacidad` |
| https://cepformacion.akademate.com/p/legal/cookies | 200 | Linked |
| https://cepformacion.akademate.com/p/legal/terminos | 200 | Linked |
| https://cepformacion.akademate.com/p/legal | linked | Present in href set (`/p/legal`, `/p/legal/ia`, `/p/legal/subencargados`) |

## Common-path probe (https://akademate.com)

| Path | Status | Final URL |
| --- | --- | --- |
| /privacidad | 200 after 307 | /legal/privacidad |
| /privacy | 404 | /privacy |
| /aviso-legal | 404 | /aviso-legal |
| /cookies | 200 after 307 | /legal/cookies |
| /terminos | 200 after 307 | /legal/terminos |
| /legal | 404 | /legal (index missing; child paths live) |
| /legal/aviso-legal | 404 | /legal/aviso-legal |
| /contacto | 200 | /contacto |
| /precios | 404 | /precios |
| /pricing | 200 | /pricing |
| /cursos | 200 | /cursos |
| /product | 404 | /product |
| /about | 404 | /about |
| /nosotros | 404 | /nosotros (use `/en/sobre-nosotros` / `/es/sobre-nosotros`) |
| /demo | 404 | /demo |
| /solicitar-demo | 404 | /solicitar-demo |
| /login | 307 → 503 | app.akademate.com/auth/login |
| /campus | 404 | /campus |
| /terms | 404 | /terms |
| /cookie-policy | 404 | /cookie-policy |
| /politica-de-privacidad | 404 | /politica-de-privacidad |
| /politica-cookies | 404 | /politica-cookies |
| /gdpr | 404 | /gdpr |
| /book-demo | 404 | /book-demo |
| /book-a-demo | 404 | /book-a-demo |

## Missing / not found legal & marketing aliases

Facts only — paths that returned **404** (or are absent from sitemap/HTML):

- `/aviso-legal`, `/legal/aviso-legal`, `/en/legal/aviso-legal` (not in sitemap; no dedicated “aviso legal” / legal notice URL found)
- English aliases: `/privacy`, `/terms`, `/cookie-policy`
- Spanish aliases: `/politica-de-privacidad`, `/politica-cookies`, `/precios`, `/nosotros`, `/solicitar-demo`
- Marketing aliases: `/product`, `/about`, `/demo`, `/book-demo`, `/book-a-demo`, `/campus` (on marketing host)
- `/legal` index (404) while `/legal/{privacidad,cookies,terminos}` and locale variants exist
- Dedicated public demo URL not found under common paths (demo CTA present on homepage content; contact form covers “Product demo”)

Note: live legal pages themselves state they are **“Working legal information under professional review”** and that final registry/tax/address/privacy contact details will be published after documentary validation (content fact, not a missing URL).

## robots.txt and sitemap.xml

### https://akademate.com/robots.txt — 200

```
User-Agent: *
Allow: /
Disallow: /design-system/
Disallow: /registro/completar/
Sitemap: https://akademate.com/sitemap.xml
```

### https://akademate.com/sitemap.xml — 200

- 56 `<loc>` entries
- Locales: `/en` and `/es` mirrors
- Includes: features, solutions (+ verticals), pricing, cursos, download, sobre-nosotros, blog, news, contacto
- Legal locs: `/en|es/legal/privacidad`, `terminos`, `cookies`, `subencargados`, `ia`
- Does **not** list `/aviso-legal` or English `/privacy`/`/terms`

### cepformacion robots/sitemap

- Requesting `/robots.txt` and `/sitemap.xml` follows to login redirect pages (not usable public robots/sitemap at those paths).

## HTML metadata (homepage samples)

### https://akademate.com/ (and www)

| Field | Value |
| --- | --- |
| `lang` | `en` |
| Title | The operating system for academies |
| H1 | Run the whole academy. |
| OG | Present (8 tags): `og:title`, `og:description`, `og:url`=`https://akademate.com/en`, `og:site_name`=Akademate, `og:locale`=`en_GB`, `og:image`, `og:image:alt`, `og:type`=`website` |
| schema.org / JSON-LD | **Not present** in homepage HTML (`application/ld+json` false; `schema.org` false) |
| Cookie/privacy/terms links in HTML | Yes — footer links to `/en/legal/{privacidad,cookies,terminos,subencargados,ia}` |

### https://cepformacion.akademate.com/

| Field | Value |
| --- | --- |
| `lang` | `es` |
| Title | CEP FORMACION — Plataforma Educativa |
| H1 | Impulsa tu futuro profesional |
| OG | Present: title, description, url, site_name=`CEP FORMACION`, locale=`es_ES`, image (+ w/h/alt), type=`website` |
| schema.org / JSON-LD | **Not present** |
| Legal links in HTML | `/p/legal`, `/p/legal/privacidad`, `/p/legal/cookies`, `/p/legal/terminos`, `/p/legal/subencargados`, `/p/legal/ia` |

## Security headers observed (marketing HTTPS)

- `strict-transport-security`, `content-security-policy`, `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy`
- Server: Cloudflare

## References seen in marketing copy (not live DNS)

- Marketing UI references `academy.akademate.com/creative-leadership` as an example course URL; hostname **does not resolve** at scan time.
- Marketing copy references live academy CEP Formación on Akademate (matches reachable `cepformacion.akademate.com`).
