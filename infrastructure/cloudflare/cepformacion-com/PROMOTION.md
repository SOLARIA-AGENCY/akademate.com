# Promoción CEP edge

## Sitio real

1. Worker en `MODE=origin-html`.
2. `https://cepformacion.com/` debe ser la misma web que `https://cepformacion.akademate.com/` (mismo CSS `/_next/static`, mismo hero, mismo layout Next).
3. `/preview` redirige a `/`.
4. `GET /health` incluye `preview: "origin-html"` y `publicAppHealth: 200`.

## Formularios

`POST /api/leads` y `POST /api/track` en el apex van a OVH (`cepformacion-app.akademate.com`).

## Canary

1. Dry-run Wrangler.
2. Probar `workers.dev`.
3. Comprobar CSS `/_next/static/css/*.css` y una ficha `/p/cursos` o `/cursos`.

## Rollback

1. `MODE=coming-soon`.
2. El apex vuelve a «próximamente».
3. No tocar `campus.cepformacion.com`. El admin canónico es `dashboard.cepformacion.com`.
