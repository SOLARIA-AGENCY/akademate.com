# CEP Formación — Estado de Dominios y Tracking

## cepcomunicacion.com

### Cloudflare
- **Zone ID:** `47c5baea8aa5acbf66a84cad238bcb88`
- **Cuenta:** NAZCAMEDIA (`522997f4f57193b06db3286d8d6f2778`)
- **Estado:** `active` — Cloudflare maneja DNS ✅
- **NS:** `dina.ns.cloudflare.com` / `sam.ns.cloudflare.com`
- **Plan:** Free
- **Registrar original:** Name SRS AB (NameCheap)
- **Añadido a CF:** 2025-09-06

### Hosting actual
- **Tipo:** Cloudflare Pages (sitio estático)
- **NO conectado a servidor NEMESIS (176.84.6.230)**
- **Origen real:** Cloudflare CDN / Pages

### DNS actual
| Tipo | Host | Destino | Proxy |
|------|------|---------|-------|
| A | `cepcomunicacion.com` | Cloudflare proxy | 🟠 Proxied |
| A | `www.cepcomunicacion.com` | Cloudflare proxy | 🟠 Proxied |
| MX | — | `SMTP.GOOGLE.com` (Google Workspace) | — |

### Tracking (cepcomunicacion.com)
- **GA4:** `G-347NGFNZ90`
- **GTM:** `GTM-5D4839F3`
- **Facebook Pixel:** No detectado en el sitio estático actual
- **Cloudflare Pages Analytics token:** `c7902239337b45f5b02869fa4fdead91`

### Worker API
- **URL:** `cep-api-fallback.nazcamedia.workers.dev`
- **Estado:** Operational ✅
- **Endpoints:** `/api/health`, `/api/curso-preinscripcion`, `/api/webhook/lead`, `/api/formsubmit-proxy`, `/api/test/email`

### Subdomains (CT logs — ninguno resuelve actualmente)
- `api.cepcomunicacion.com` → NXDOMAIN
- `cursos.cepcomunicacion.com` → NXDOMAIN
- `www.cepcomunicacion.com` → Cloudflare Pages

---

## cursostenerife.es

### Hosting
- **Tipo:** WordPress 6.9.1 en LucusHost (LiteSpeed)
- **IP servidor:** `178.33.192.73`
- **NS:** `ns1.lucushost.com` / `ns2.lucushost.com` / `ns3.lucushost.com`
- **NO está en Cloudflare**
- **Última actualización WP:** 2026-02-10

### Tracking (cursostenerife.es)
- **GA4:** `G-KFVWD6LVCB`
- **Facebook Pixel ID:** `831036194188836`
- **Plugin:** PixelYourSite Free v11.2.0.3
- **Google Search Console verification:** `yVOF9sQUnFBqK3RMhie4jUHJD9Xz_Oz250ogyeuwpeA`
- **GDPR plugin:** GDPR Cookie Compliance (Moove)

### Redes Sociales (extraído del schema.org)
- **Facebook:** `https://www.facebook.com/cepsantacruz/`
- **Instagram:** `https://www.instagram.com/cep_santacruz/`
- **YouTube:** `https://www.youtube.com/user/frandelamo`

### Email activo
- Subdomains mail.cursostenerife.es, imap, pop3, smtp, webmail → LucusHost

### Subdomains activos (CT logs)
- `mail.cursostenerife.es`, `webmail.cursostenerife.es`, `correoweb.cursostenerife.es`
- `formacion.cursostenerife.es`
- `backup.cursostenerife.es`

---

## Servidor NEMESIS (Coolify)
- **IP pública:** `176.84.6.230`
- **Tailscale:** `100.99.60.106`
- **Ningún dominio del cliente apunta aquí todavía**

---

## Relación entre dominios
| Dominio | Propósito | Plataforma | Conectado a Akademate |
|---------|-----------|------------|----------------------|
| cepcomunicacion.com | Web oficial/marketing | Cloudflare Pages | ❌ |
| cursostenerife.es | Web SEO secundaria | WordPress/LucusHost | ❌ |
| akademate.com | SaaS platform | Cloudflare + NEMESIS | ✅ |
