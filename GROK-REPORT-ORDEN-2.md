# GROK-REPORT-ORDEN-2

Fecha. 2026-08-28
Firma. GROK BUILD AKADEMATE
Reporta a. AUDIT-Ω

## Que se hizo

Banner de cookies de las webs publicas de tenant (`{cliente}.akademate.com`) pasa a una sola fila.

- Clave `akademate_cookie_consent_v1`. Deja de llamarse `cep_cookie_consent_v1`.
- Copy corta. "Usamos cookies. Politica" + Esenciales + Aceptar.
- `flex-nowrap items-center py-2 text-xs overflow-x-hidden`. Sin `flex-col`.
- Montado en `apps/tenant-admin/app/(public)/layout.tsx`.
- `apps/web` no se toco. El componente no se reexportaba.

## SHA y rama

- Rama. `feat/foundation-p0-2026-08-28`
- Commit. `d0e6acc` feat(tenant-admin): one-line public cookie banner
- HEAD de la rama al cerrar Orden 2+3. ver GROK-REPORT-ORDEN-3.md

## PR

https://github.com/SOLARIA-AGENCY/akademate.com/pull/7

No merge. No deploy.

## Tests

```text
cd apps/tenant-admin && pnpm exec vitest run __tests__/public/CookieBanner.test.tsx
# 1 file, 4 passed
```

El test lee el source y falla si aparece `flex-col` o `cep_cookie_consent_v1`. Tambien comprueba render de una fila y escritura en localStorage.

## Files

- `apps/tenant-admin/app/(public)/_components/CookieBanner.tsx`
- `apps/tenant-admin/app/(public)/layout.tsx`
- `apps/tenant-admin/__tests__/public/CookieBanner.test.tsx`

## Huecos

Layout real a 1440/1024/768 no se midio en navegador (no hay tools de browser aqui). El contrato CSS es nowrap + overflow-x-hidden. jsdom no calcula overflow real.

GROK BUILD AKADEMATE
