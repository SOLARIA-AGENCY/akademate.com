# CEP Formación: Worker público

Worker para `cepformacion.com`, `www.cepformacion.com` y el admin canónico
`dashboard.cepformacion.com`.

La web pública es la misma aplicación que `https://cepformacion.akademate.com/`
(HTML, CSS y JS de Next). No genera una web alternativa desde JSON.

Formularios (`/api/leads`, `/api/track`) van al origen OVH
`https://cepformacion-app.akademate.com`.

`dashboard.cepformacion.com` hace reverse proxy de todo el admin (login, Payload,
`/dashboard`) hacia ese mismo origen OVH. El apex público sigue devolviendo 404
en `/dashboard`. `campus.cepformacion.com` sigue reservado.

## Modos

| MODE | `/` | `/preview` |
| --- | --- | --- |
| `origin-html` (producción) | HTML de `cepformacion.akademate.com` | 302 a `/` |
| `coming-soon` | página estática de rollback | 302 a `/` |

## Secretos (wrangler)

```bash
npx wrangler secret put ORIGIN_SERVICE_TOKEN --config infrastructure/cloudflare/cepformacion-com/wrangler.jsonc
npx wrangler secret put PREVIEW_TOKEN --config infrastructure/cloudflare/cepformacion-com/wrangler.jsonc
npx wrangler secret put PURGE_HMAC --config infrastructure/cloudflare/cepformacion-com/wrangler.jsonc
```

KV `CEP_CACHE` es opcional.

## Publicación

```bash
npx wrangler deploy --config infrastructure/cloudflare/cepformacion-com/wrangler.jsonc --dry-run
npx wrangler deploy --config infrastructure/cloudflare/cepformacion-com/wrangler.jsonc
```

Rollback: `MODE=coming-soon` (solo el apex público). No cambiar `campus.cepformacion.com`.
