# Contrato público CEP v1

El Worker de `cepformacion.com` sirve la **misma web Next** que `https://cepformacion.akademate.com/`.
No pinta un HTML propio. El admin canónico es `dashboard.cepformacion.com` (proxy al origen OVH `cepformacion-app.akademate.com`).

## Qué sirve el Worker

| Ruta | Origen |
| --- | --- |
| `/`, `/cursos`, `/ciclos`, `/p/*`, `/_next/*`, `/logos/*`, `/website/*` | HTML/CSS/JS de `cepformacion.akademate.com` |
| `/api/media/file/*` | el mismo origen HTML (copia visual) |
| `/api/leads`, `/api/track` | OVH `cepformacion-app.akademate.com` |
| `GET /health`, `POST /internal/purge` | Worker |
| `GET /campus` | HTML de la web (menú + pie) con el acceso al campus en el contenido |
| `/dashboard`, `/admin`, `/api/users`, `/api/v1`, `/campus-virtual` en el apex | 404 |
| `dashboard.cepformacion.com/` y rutas públicas (`/p/*`, `/blog`, …) | 307 a `/dashboard` |
| `dashboard.cepformacion.com/auth`, `/dashboard`, APIs | proxy al origen OVH |

El Worker reescribe `https://cepformacion.akademate.com` → `https://cepformacion.com` en HTML/RSC. Los assets relativos (`/_next/...`, `/logos/...`) pasan por el Worker.

## Catálogo OVH (sitemap / llms / purge)

| Método | Ruta | Auth |
| --- | --- | --- |
| GET | `/api/public/v1/health` | ninguna |
| GET | `/api/public/v1/catalog` | Bearer `catalog:read` |
| POST | `/api/leads` | pública |
| POST | `/api/track` | pública |
| POST | Worker `/internal/purge` | HMAC `x-webhook-signature` |

`GET /api/health` → `revision` es telemetría. El Worker no se pincha a un SHA.

## Home: cursos

`/` mantiene el HTML de `cepformacion.akademate.com` y **sustituye el bloque Cursos** por un listado de **una columna** leído de `GET /api/public/v1/catalog` en OVH:

1. Cursos privados
2. Cursos para ocupados
3. Cursos para desempleados

Las filas con **Matrícula abierta** llevan fondo verde claro (`#ecfdf5`) para marcar el curso en promoción.

`MODE=origin-html`: `cepformacion.com/` es la web real. `/preview` redirige a `/`.
El CTA del menú **Campus** sustituye a Contacto y apunta a `/campus`. Esa ruta usa el menú y el pie de la web pública y, en el contenido, muestra el acceso al nuevo campus en construcción (usuario, contraseña y recuperar contraseña, todo desactivado) y un acceso directo al campus actual. El destino del botón es `https://acaten.espacioaulavirtual.com/`; el texto público no nombra Acaten. `campus.cepformacion.com` sigue siendo el destino futuro y hoy no hay DNS ni app ahí.

En móvil el menú hamburguesa es un panel **scrollable** (`overflow-y: auto`). Las subpáginas (Cursos, Colabora) solo se despliegan al pulsar; Campus queda al final del listado.
`MODE=coming-soon`: rollback del apex a la página de próximamente.

## Marca

La marca la define el HTML de `cepformacion.akademate.com` (Next `WebsiteRenderer`). El Worker no aplica una piel paralela.
