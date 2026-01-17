# Definition of Done — Akademate 100%

**Fecha:** 17 Enero 2026

## Global (requerido para 100%)
- Build, typecheck, unit y E2E en verde.
- CI/CD con lint, typecheck, tests, build, security scan y artifacts.
- GDPR completo (API + UI + jobs + auditoria).
- Multitenancy core aplicado (tenant_id en todo + RLS + claims).
- Documentacion minima (ADRs + runbooks).

---

## 1) TS Strict / Calidad base
**Done cuando:**
- `pnpm -r exec tsc --noEmit` sin errores.
- No hay errores de JSX/strict en packages criticos.

## 2) GDPR
**Done cuando:**
- Endpoints export/delete/consent funcionando con auth.
- UI en tenant-admin con consent + export + delete.
- Jobs de retention activos.
- Tests unitarios + E2E para flujos.

## 3) CI/CD
**Done cuando:**
- Workflows en `.github/workflows` incluyen lint, typecheck, test, e2e, build, security.
- Variables y secretos documentados.
- Artifacts publicados.

## 4) E2E
**Done cuando:**
- Playwright ejecuta flujos criticos (auth, campus, admin, billing, GDPR).
- Data seeding estable.
- `pnpm test:e2e` verde.

## 5) Multitenancy core
**Done cuando:**
- Resolucion dominio->tenant (subdominio y custom).
- JWT con tenant_id + roles.
- RLS hooks en Payload + SDK filtrando tenant_id.
- Theming por tenant via CSS vars.
- Assets en R2/MinIO namespaced por tenant.

## 6) Auth + Seguridad
**Done cuando:**
- Cookies httpOnly/secure, CORS por tenant.
- RBAC por tenant aplicado.
- MFA TOTP para ops.
- Auditoria en operaciones sensibles.

## 7) Billing & Stripe
**Done cuando:**
- Checkout + portal + webhooks server-side.
- Metering basico + suspension por impago.
- UI billing integrada a backend real.

## 8) Jobs/Infra
**Done cuando:**
- Workers email, webhooks, search sync en BullMQ.
- Observabilidad OTEL basica.

## 9) Storage & Media
**Done cuando:**
- R2/MinIO con presigned uploads.
- Media manager en tenant-admin.
- Thumbs opcionales operativos.

## 10) Feature Flags
**Done cuando:**
- Flags por tenant/plan.
- UI de rollout (% + kill switch).

## 11) Apps producto
**Done cuando:**
- Ops dashboard funcional (tenants, domains, billing, metrics).
- Dashboard cliente con CRM, branding, domains, catalog CRUD.
- Front publica con SEO, forms UTM/captcha.
- Campus con inscripcion, progreso, certificados.

## 12) Documentacion
**Done cuando:**
- ADRs iniciales escritos.
- Runbooks base (backup/restore, incident, deploy).

## 13) Verificacion final
**Done cuando:**
- Checklist final ejecutado.
- Smoke tests en apps criticas.
- Security checklist OK.
- `COMPLETION.txt` creado.
