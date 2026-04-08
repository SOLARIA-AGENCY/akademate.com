# Informe de Estado y Auditoria de Despliegue

**Fecha:** 2026-04-08  
**Proyecto:** Akademate SaaS multitenant  
**Scope:** estado global del repo, branch actual y produccion `cepformacion.akademate.com`

## Resumen ejecutivo

- ✓ El producto ya opera en produccion sobre un stack multitenant compartido en Hetzner.
- ✓ `cepformacion.akademate.com` esta publicado y responde correctamente por HTTPS.
- ✓ La rama actual `feat/better-auth-integration` concentra el trabajo funcional principal y esta **195 commits por delante** de `main`.
- ⚠ CEP no esta desplegado como infraestructura dedicada. Sigue montado sobre el contenedor compartido `akademate-tenant`.
- ⚠ El servidor de produccion tiene deuda de hardening: secretos expuestos en compose/`.env` y permisos de lectura demasiado abiertos.
- ⚠ El contenedor `akademate-tenant` registra errores recurrentes en el admin de Payload.
- 📌 Si CEP va a seguir siendo cliente cero y plantilla del SaaS, hay que separar lo especifico de CEP de lo reutilizable por tenant antes de cerrar la generalizacion del producto.

## 1. Estado actual del proyecto

### 1.1 Lo ya construido

- ✓ Base SaaS multitenant: dominio a tenant, aislamiento por `tenantId`, theming, dashboards y estructura de packages.
- ✓ Frontends activos: `web`, `tenant-admin`, `admin-client`, `campus`, `payload`, `portal`.
- ✓ Despliegue productivo real en Hetzner documentado en [README.md](/Users/carlosjperez/Documents/GitHub/akademate.com/README.md) y [claude.md](/Users/carlosjperez/Documents/GitHub/akademate.com/claude.md).
- ✓ Roadmaps y backlog consolidados en [TASKS_TODO.md](/Users/carlosjperez/Documents/GitHub/akademate.com/TASKS_TODO.md), [docs/STATUS_REPORT.md](/Users/carlosjperez/Documents/GitHub/akademate.com/docs/STATUS_REPORT.md) y [docs/PROJECT_MILESTONES.md](/Users/carlosjperez/Documents/GitHub/akademate.com/docs/PROJECT_MILESTONES.md).
- ✓ La rama actual contiene una expansion grande del producto: CRM leads v2, interacciones, notificaciones, landings publicas, integracion Meta, email, branding y multiples ajustes de produccion.

### 1.2 Lo pendiente o incompleto

- ⚠ Infra dedicada CEP Fase 1: sigue documentada, pero no implementada en produccion.
- ⚠ White-label general del SaaS: todavia hay restos CEP en metadata, assets, copys y defaults de `tenant-admin`.
- ⚠ Features Enterprise prometidas pero no cerradas: SSO/SAML/OIDC, webhooks maduros, audit logs completos, quotas/validators por plan.
- ⚠ Hardening operativo: externalizacion completa de secretos, permisos de archivos, trazabilidad de despliegues y rotacion de credenciales.
- ⚠ Cierre de homogenizacion UX/UI cross-tenant y automatizacion de QA visual.

## 2. Auditoria especifica de `cepformacion.akademate.com`

### 2.1 Infra y routing observados

- ✓ Dominio activo: `https://cepformacion.akademate.com`
- ✓ Redirect legado activo: `https://cepcomunicacion.akademate.com` devuelve `308` a `cepformacion.akademate.com`
- ✓ `https://cursos.cepcomunicacion.com` sigue apuntando al mismo tenant container
- ✓ El routing en Traefik confirma que CEP usa el mismo servicio compartido `akademate-tenant:3009`
- ✗ No existe stack dedicado CEP en `/opt/akademate/cep`; el directorio esta vacio

**Prueba operativa**

- `curl -I https://cepformacion.akademate.com` -> `307` a `/auth/login?redirect=%2F`, luego `200`
- `curl -I https://cepformacion.akademate.com/admin` -> `200`
- `docker ps` en produccion:
  - `akademate-tenant`
  - `akademate-web`
  - `akademate-ops`
  - `akademate-db`
  - `traefik`
  - auxiliares: `akademate-mail`, `paperclip`, `uptime-kuma`

### 2.2 Estado del codigo desplegado

- ✓ La imagen activa de `akademate-tenant` fue creada el `2026-04-07T13:10:47Z`
- ✓ El contenedor arranco el `2026-04-07T13:11:28Z`
- ⚠ El arbol desplegado en `/opt/akademate/repo` es una copia de codigo, no un checkout Git operativo
- ⚠ Eso impide auditar en el servidor con precision que commit exacto esta en produccion

### 2.3 Hallazgos criticos de configuracion y seguridad

**P0**

- ✗ En el servidor, `/opt/akademate/tenant-admin/docker-compose.yml` contiene secretos SMTP embebidos en texto plano.
- ✗ `/opt/akademate/tenant-admin/.env` y `/opt/akademate/mail/.env` son legibles por otros usuarios del sistema (`-rw-r--r--`).
- ✗ El compose de `tenant-admin` usa `PAYLOAD_PUBLIC_SERVER_URL` orientado todavia a `cepcomunicacion.akademate.com`, no al dominio canonico actual.

**P1**

- ⚠ Logs del contenedor `akademate-tenant` muestran errores repetidos del admin de Payload:
  - `TypeError: Cannot destructure property 'routes' of '{}' as it is undefined.`
- ⚠ La configuracion productiva de CEP sigue siendo una mezcla de branding, dominio y correo especificos de un cliente dentro del tenant compartido.
- ⚠ El host de produccion se identifica como `mail.cepcomunicacion.com`, lo que refuerza que la plataforma aun arrastra naming operacional de CEP.

### 2.4 Accesos y credenciales localizados

- ✓ Acceso SSH root operativo via alias `akademate-prod`
- ✓ Clave local disponible en `~/.ssh/akademate-prod`
- ✓ Secretos de app localizados en:
  - `/opt/akademate/tenant-admin/.env`
  - `/opt/akademate/tenant-admin/docker-compose.yml`
  - `/opt/akademate/mail/.env`
- 📌 No se incluyen valores en este informe. Requieren rotacion y posterior externalizacion.

## 3. Implicaciones para el objetivo SaaS multitenant

### 3.1 Lo correcto del enfoque actual

- ✓ Usar CEP como cliente cero ha acelerado producto real, datos reales y casos reales.
- ✓ El branch actual ya contiene piezas reutilizables para el core SaaS: CRM, interacciones, branding, public web y panel tenant.

### 3.2 Lo que falta para “subirlo al master” de forma general

- ⚠ Separar defaults CEP de configuracion tenant.
- ⚠ Mover branding, metadata, dominios y plantillas email a fuentes de datos por tenant.
- ⚠ Dejar la infraestructura de produccion libre de secretos y naming cliente-especifico.
- ⚠ Garantizar trazabilidad entre commit, imagen e instancia desplegada.
- ⚠ Completar el backlog Enterprise solo cuando la base multitenant reusable quede limpia.

## 4. Plan recomendado

### P0 inmediato

- 1. Rotar todas las credenciales expuestas en el servidor.
- 2. Sacar secretos embebidos del compose y moverlos a `.env` protegidos o secret manager.
- 3. Corregir permisos de archivos de entorno a `600`.
- 4. Corregir `PAYLOAD_PUBLIC_SERVER_URL` y revisar consistencia de dominios canonicos.
- 5. Diagnosticar y corregir el error del admin de Payload en produccion.

### P1 siguiente iteracion

- 1. Hacer que todo branding CEP salga de datos de tenant y no de hardcodes.
- 2. Crear trazabilidad de deploy: commit SHA -> imagen -> contenedor.
- 3. Limpiar naming operacional CEP del host, compose y artefactos donde no sea estrictamente necesario.
- 4. Ejecutar smoke suite minima post-deploy para `web`, `tenant-admin`, `admin-client` y `payload`.

### P1 Enterprise CEP

- 1. Decidir si CEP sigue en stack compartido o si se ejecuta Fase 1 dedicada de Hetzner.
- 2. Si sigue compartido: cerrar white-label y hardening multitenant antes de abrir mas clientes.
- 3. Si pasa a dedicado: materializar `infrastructure/docker-cep-dedicated/` y bridge con dashboard central.

### P2 producto

- 1. SSO/SAML/OIDC
- 2. Audit logs completos
- 3. Webhooks maduros
- 4. API quotas y validators por plan
- 5. QA transversal visual y funcional

## 5. Estado Git al momento de la auditoria

- Rama auditada: `feat/better-auth-integration`
- Estado local: cambio pendiente solo en `.gitignore`
- Divergencia frente a `main`: `0` commits en `main` no incluidos en la rama, `195` commits de la rama no incluidos en `main`

## 6. Validacion tecnica ejecutada

- ⚠ Comando ejecutado: `corepack pnpm --filter @akademate/tenant-admin exec tsc --noEmit --pretty false`
- ✗ Resultado: fallo

### Principales bloques con errores

- `@payload-config/components/ui/__tests__/*`: matchers de Testing Library no tipados
- `@payload-config/lib/stripe.ts`: tipado Stripe incompatible tras upgrade
- `app/api/billing/*` y `app/api/webhooks/stripe/route.ts`: incompatibilidades de tipos Drizzle duplicados
- `app/(app)/(dashboard)/cursos/page.tsx`: import roto a `types`
- `app/(public)/p/cursos/[slug]/page.tsx`: contrato `Course` inconsistente
- `middleware.ts`: desajuste de tipos en config de rate limiting

### Lectura ejecutiva

- ⚠ La rama es funcionalmente muy rica, pero **no esta lista para declararse type-safe**.
- ⚠ Antes de considerar esta linea como base estable de `main`, conviene abrir un frente corto de estabilizacion tecnica centrado en `tenant-admin`.

## Conclusion

- ✓ El proyecto ya es una base SaaS operativa seria.
- ⚠ Produccion CEP valida producto, pero todavia esta mezclada con el core compartido.
- ✗ No se puede considerar “Enterprise dedicado CEP” implementado.
- 📌 La prioridad correcta no es sumar mas features cliente-especificas, sino cerrar hardening, desacoplar CEP del core y dejar listo el patron reutilizable para todos los tenants.
