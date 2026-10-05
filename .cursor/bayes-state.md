## 2026-09-04 memory

- Observación: apex CEP live `MODE=origin-html` (`/preview` → `/`); `/campus` dentro del chrome público; `/campus-virtual` 404; sin DNS `campus.cepformacion.com`. Listado home sin overflow (ellipsis + badge «Idiomas»).

## 2026-09-02 S41

- Observación S41: Worker `cepformacion-com` v `d889ab2f-4306-4b0a-9171-2d8d6e22ef06` pinta HTML desde JSON (`preview: json-render`). Apex coming-soon 200. `/preview` 502 porque OVH `GET /api/public/v1/catalog` con Bearer devuelve Next 500 HTML (`originRevision` `7682f28`). Health y content-version 200. No se tocó OVH. Falta desplegar en cep-ovh la API catalog (website + media relativa + SQL fallback).



- Observación S40: OVH debe ser solo dashboard. Middleware: `cepformacion-app` `/` y `/p/*` → `/dashboard` salvo `x-cep-edge-fetch`. Worker ya envía el header. Tests middleware 19/19. Live app host aún sirve la web hasta que OVH despliegue esta imagen + `CEP_EDGE_FETCH_SECRET`.

## 2026-09-02 S39

- Observación S39: Usuario confirma DoD: web en Cloudflare = misma app dinámica del dashboard. Código proxy `/preview` en repo, live aún catalog JSON 278 B. Origin HTML `no-store` + `force-dynamic`. Deploy pendiente.

## 2026-09-02 S38

- Observación S38: Usuario aclara DoD: no rehacer la web pública. Copiar la que ya corre en Hetzner (`cepformacion.akademate.com` / `akademate-tenant`). Se construye y actualiza con datos del dashboard OVH. Worker no es el sitio.

## 2026-09-02 S37

- Observación S37: Origin live `cepformacion-app.akademate.com` `/api/health` 200 revision `4c54f50`. `/api/public/v1/*` sigue 401 AUTH_REQUIRED. Worker ya apunta a ese hostname, secretos ORIGIN/PREVIEW/PURGE presentes, MODE coming-soon. `/preview` HTML “Catálogo no disponible”. No se tocó OVH. Enganche al Host, no a un SHA.

## 2026-09-02 S36

- Observación S36: HOLD OVH. El usuario trabaja el despliegue en cep-ovh; no SSH, no compose, no `.env`, no docker load. Misión: cuando avise, conectar origin OVH al Worker `cepformacion.com` (coming-soon + `/preview`). Apex no pasa a `MODE=dynamic` hasta orden explícita. Dashboard/campus fuera de alcance.

## 2026-09-02 S35

- Observación S35: OVH `cep-tenant` se recreó a las 18:12 Europe/Madrid. Antes corría `cep-edge-api-20260902`; ahora `akademate-tenant:c002b8e` (source `cepformacion.akademate.com`). Staging también `c002b8e`. El mock-home local no tocó OVH. La imagen edge sigue en el host como `cep-edge-api-20260902` y `rollback-prod`.

## 2026-09-02 S34

- Observación S34: Edge CEP live. Origin `cepformacion-app.akademate.com` catalog 200, 190 cursos, 17 matrícula abierta. Worker `cepformacion-com` v `ea151bee-2d14-4870-9574-eea338c9f57d`: apex coming-soon, `/preview` 190 CTA, 17 pills verdes, grupos Privados/Desempleados/Ocupados/Teleformación, 0 Otros. Hotfix SQL montado en `/opt/cep/tenant-admin/hotfixes`. Imagen `cep-edge-api-20260902`. MODE no se cambió a dynamic. Leak `X-Api-Bearer-Token` sigue en la imagen hasta rebuild.

## 2026-09-02 S33

- Observación S33: Mock home `/p/mock-home` con filas shadcn `Item` + `Badge` + `Button` a una línea, 2 columnas, hueco fijo para matrícula abierta. Home de producción no sustituido.

## 2026-09-02 S32

- Observación S32: El Worker apex sigue siendo coming-soon estático (`/health` HTML). OVH `cep-tenant` imagen `9344525` responde 401 en `/api/public/v1/*`. No hay `ORIGIN_SERVICE_TOKEN`. Para comunicar: build `akademate-tenant:cep-edge-api-20260902`, load en cep-ovh, API key `catalog:read`, secret Wrangler, deploy Worker.

## 2026-09-02 S31

- Observación S31: Contrato v1, API `/api/public/v1/{health,content-version,catalog}`, Worker preview/caché/purge, hook HMAC, consentimiento, SEO/llms y probes C-BIAS `cf-blackbox-http` están en el repo. Wrangler dry-run 15.52 KiB. Vitest 6 files / 73 passed. MODE sigue `coming-soon`. No se desplegó el apex ni se cambiaron dashboard/campus.

## 2026-09-02 S30

- Observación S30: Auditoría del contrato de contenido público tenant-admin. No existe `GET /api/public/v1/*`. Las páginas públicas leen Payload/Postgres en el servidor (`published-courses.ts`, `getTenantWebsite`, `payload.find`). `/api/v1/*` exige API key. Payload REST queda bloqueado por middleware 401. El Worker `cepformacion-com` sigue estático y no consume OVH.

# Estado operativo

## 2026-09-01

- Observación S23: Fleet ServerKit: cep-ovh online (CPU/RAM/disco/40 contenedores), onboarding `ready`, 6 apps y 6 dominios CEP, 6/6 health checks HTTP up. Gunicorn 32 threads. No nginx/Traefik escrito en OVH. IP pública la pisa el agente con 172.20.0.1 (NAT Docker).
- Observación S22: Página pública Kuma `estado` (sitio web, área de gestión, campus, API). URL `https://cepformacion-estado.akademate.com/` 200, 4/4 UP. Sin nombres internos. `status.cepformacion.akademate.com` no sirve en HTTPS (wildcard CF no cubre 3er nivel). Gateway :5000 por Host; dashboard Kuma solo Tailscale :3001.
- Observación S21: ServerKit OVH estaba offline. Causa: agent.key 600 root (proceso `serverkit` uid 1000) + crash loop; re-register en contenedor efímero cifraba el key a otro machine-id. Fix: hostname `cep-ovh` + `/etc/machine-id` + register en el mismo compose + exec=false. Fleet: 1/1 online, 8c/24GB/~36 contenedores, vault 10, umbrales CPU/RAM/disco. Prometheus 14/14. Kuma 14 UP + 1 paused. Loki site=cep-ovh. No onboarding.
- Observación S20: Portal 8088 con logos de marca (CEP, Grafana, Kuma, Prometheus, ServerKit, Sentry, GlitchTip, Loki) en las cards. Volume mount `./portal` entero.
- Observación S19: Portal 8088 ahora separa dashboard prod/staging (`/dashboard`) de webs públicas. Sesiones tenant abiertas. Paneles deep-link Grafana/Kuma/Prometheus/ServerKit/Sentry/GlitchTip/Loki/Campus.
- Observación S18: Kuma sesión abierta, 14/15 UP (closed-port pausado). ServerKit monitor 12 DOWN por UFW en :5000 desde 172.20.0.0/24; regla añadida y heartbeat 200. Status page `cep-formacion` con 14 monitores. Grafana 5 dashboards nuevos (traffic/security/containers/errors/capacity) live. Prometheus 14/14. ServerKit canonical_domain Tailscale.
- Observación: ServerKit cep-ovh configurado: grupo CEP OVH, vault 10 secretos (SSH ED25519 cep@37.59.119.219 cifrado), umbrales CPU/RAM/disco, ping 8c/24GB/36 contenedores. Agent exec=false. Onboarding no lanzado.
- Observación: DNS `cepformacion-glitchtip.akademate.com` A 37.59.119.219 proxied en Cloudflare (NAZCAMEDIA). HTTPS 200 login GlitchTip. Store público staging 200 event 8e04f688. DSN producción Sentry sin cambiar.
- Observación: rebuild C-BIAS/CEP cerrado. Snapshot 426865894, backups SHA256, núcleo 6/6 Prometheus UP, Kuma 9 monitores, ServerKit agent CEP autenticado, GlitchTip capturó evento staging. DNS glitchtip y DSN producción Sentry quedan fuera a propósito.
- Observación: la API de Hetzner funciona con una credencial almacenada en 1Password.
- Observación: `cbias-central` está `running` y recuperó una nueva IP Tailscale `100.113.169.104`; la identidad antigua `100.69.163.44` caducó.
- Observación: C-BIAS es un Hetzner CAX11 ARM64 con 2 vCPU, 4 GB RAM, 2 GB swap y 40 GB de disco.
- Observación: hay 17 contenedores activos y varios servicios de observabilidad/automatización ya instalados.
- Observación: la memoria disponible reportada es 2.2 GiB y el disco raíz está al 69%.
- Observación: `/opt/cbias/docker-compose.yml` declara 24 servicios; el proyecto separado `/opt/cbias/shannon/docker-compose.yml` declara Temporal y worker.
- Error de auditoría: el primer intento de medir volúmenes con una plantilla Docker/awk mal escapada no es evidencia válida; repetir con comandos simples.
- Observación: SSH funciona por la nueva IP Tailscale `100.113.169.104`; el host está en Ubuntu 24.04 aarch64 y lleva 8 minutos activo al auditar.
- Observación: C-BIAS ejecuta 17 contenedores; Uptime Kuma está declarado pero no activo, mientras `nazca-n8n-master` sí está activo en el puerto 5678.
- Observación: el puerto 3001 está ocupado por `digitalcircuitality-web`; el disco raíz está al 69%, con 4.57 GB de volúmenes y 4.57 GiB disponibles en Docker reclaimable según la primera lectura.
- Observación: la memoria disponible es 2.2 GiB de 3.7 GiB; Sentry oficial queda descartado y GlitchTip requiere validación de margen.
- Observación: el journal muestra referencias rotas a `pam_lastlog.so`; requiere corrección controlada para no bloquear el login de consola.
- Decisión pendiente: no instalar Sentry/GlitchTip ni eliminar n8n hasta inventariar proyectos, puertos, volúmenes y dependencias.
# Bayes state — auditoría visual SaaS + sorting listados + matrícula

época: 2026-08-31 | SaaS worktree | CEP OVH no tocado

| id | claim | prior | last_obs | posterior | next_probe |
|----|-------|-------|----------|-----------|------------|
| S1 | UI chrome without CEP seed | 75 | fallback genérico; EntityThumb canoniza `/media/` | 90 | empty tenant dashboard |
| S2 | 11 módulos visual-audit en código SaaS | 50 | ficha convocatoria + Editar Profesor 7 puntos | 75 | login app.akademate.com /profesores/:id/editar |
| S3 | Ficha convocatoria Estado ≠ Matrícula | 40 | toggle único fuera del header | 75 | conv 125 live tras deploy |
| S4 | Editar Profesor sin banner ni label foto | 50 | contrato chrome + RTL 24/24; sin "Sede base" ni "Bloqueado:" | 75 | abrir /profesores/272/editar en tenant |
| S5 | Listados ordenan en 3 estados al clic | 25 | listings limit=100/500 en memoria; SortableTableHead + useCycleSort cableado | 75 | clic Formación en /programacion lista live |
| S6 | Wizard de matrícula vive en DashboardLayout | 40 | isEnrollmentFocusPath siempre false; sidebar/header/footer fijos; CTA Nueva matrícula | 75 | abrir /matriculas/nueva?paso=1 con sesión |
| S8 | Editar Profesor: required + sede base vs adicional | 40 | auditoría CEP: un solo `*`, dos Asignar sede, guardar sin inline | 75 | abrir /profesores/:id/editar y guardar vacío |
| S9 | Fallback fotográfico /stock en thumbs | 40 | 4 JPGs mapeadas a 7 tipos; EntityThumb ya no usa Lucide como primer fallback | 75 | listado sin foto en cursos/sedes/alumnos |

Observación 2026-08-31: ordenación client-side (no paginan). Texto A-Z, número mayor→menor, fecha antigua→nueva, 3er clic restaura orden API. Reset al cambiar filtro/búsqueda.

| S10 | Dashboard leads no tumba el resto de widgets | 40 | COUNT leads envuelto; fetch `/api/leads` aislado; fallback Payload | 75 | abrir dashboard tenant y ver Actividad Reciente |
| S11 | Listados: campus real, badges sin overlap, sort glyphs hover | 40 | campusNombre null en vez de "Sin sede"; overflow-hidden; opacity-0 group-hover | 75 | /programacion y /ciclos live |

Observación 2026-08-31 S10: "No se pudo cargar leads." venía de un fetch aislado (CEP) o de COUNT SQL sin try. SaaS ahora aísla `/api/leads` y no reemplaza el dashboard entero.

Observación 2026-09-01 S12: tabla compartida tenía `overflow-x-hidden` y cabecera `h-11 py-3`; ahora usa `overflow-x-auto`, anchos mínimos en las tablas afectadas y `h-9 py-2`. EntityThumb usa iniciales para persona/estudiante/admin sin foto. Alta de campus crea aula principal; migración 20260901 backfillea sedes sin aulas.
Observación 2026-09-01 S13: GlitchTip DSN estaba en loopback; se normalizó a HTTPS público con claves preservadas, se añadieron DSN runtime prod/staging al compose y ambos tenants reiniciaron healthy. Sentry y GlitchTip aceptaron probes separados para ambos entornos. La imagen tenant no contiene `@sentry/*` ni inicialización SDK, por lo que el wiring no activa captura automática de errores de aplicación sin rebuild.
Observación 2026-09-01 S14: Snapshot C-BIAS `426910538` y backups C-BIAS/OVH pasan SHA256. C-BIAS queda con 14/14 targets UP, 16 reglas Prometheus sin errores y Grafana provisiona `cep-ovh-overview`.
Observación 2026-09-01 S15: OVH exporters node/cAdvisor/Traefik/CrowdSec responden 200 desde el host y C-BIAS los scrapea. CrowdSec procesa 215 líneas Traefik y 9 líneas SSH. No se instaló bouncer ni bloqueo automático.
Observación 2026-09-01 S16: Promtail OVH entrega logs por el gateway privado `/loki` en el canal autorizado de ServerKit. El staging sintético devolvía HTTP 500 por `course_runs.location_id` ausente en `cepformacion_staging`; se aplicó la migración 20260831_operating_model. Ahora `/` responde 200 y `probe_success=1`.
Observación 2026-09-01 S17: Portal CEP Formación vivo en Tailscale `http://100.113.169.104:8088/`.
Observación 2026-09-02 S18: decisión del usuario confirma que Akademate SaaS debe ser completamente serverless y Cloudflare-native. Analytics Engine es la analítica oficial; Umami queda limitado a CEP OVH, que mantiene infraestructura clásica con Docker y PostgreSQL de analítica separado. Se incorporó la decisión en `IMPLEMENTATION_PLAN.md`.
Observación 2026-09-02 S19: Umami CEP quedó desplegado en OVH con `cep-umami` y PostgreSQL 15 aislado, ambos healthy. `cep-traefik` ahora publica :443 con Let's Encrypt y conserva la ruta CEP existente operativa. El hostname `cepformacion-umami.akademate.com` sigue en NXDOMAIN, por lo que ACME no puede emitir certificado ni el tracking HTTPS puede activarse hasta crear el registro DNS. La app local ya incluye el script CEP condicionado por `CEP_UMAMI_WEBSITE_ID` y el enlace `Abrir Umami` en Analíticas, pero el contenedor OVH aún usa una imagen anterior.
Observación 2026-09-02 S20: Cloudflare DNS ya contiene `cepformacion-umami.akademate.com` como A proxied a `37.59.119.219`. Umami responde públicamente por HTTPS con `/` y `/api/heartbeat` en 200, y el website `CEP Formación` fue creado con ID almacenado fuera del repositorio. La imagen CEP todavía no se pudo reconstruir porque Docker local falló con EIO en `metadata_v2.db`; el código del tracker y el botón del dashboard están preparados, pero no desplegados. La instancia Umami sigue requiriendo rotación de las credenciales iniciales antes de considerarse lista para producción.
Observación 2026-09-02 S21: `cepformacion-app.akademate.com` responde 200, pero los tres contenedores `akademate-tenant-candidate-*` apuntan a `postgres:5432/akademate`; no existe una base `akademate_staging` en el servidor. La BD compartida contiene 1 tenant, 5 campuses, 194 courses, 2 cycles y 36 course_runs, pero no contiene `locations`, `course_runs.location_id` ni `campuses_rels.locations_id`. No aplicar migraciones ni desplegar código nuevo en ese destino hasta aislar staging.
Observación 2026-09-02 S22: Se creó `akademate_staging` mediante clon controlado y se sanitizó: conserva el catálogo operativo, con 0 usuarios, 0 students, 0 leads y 0 enrollments. El origen OVH no tiene router para `cepformacion-app.akademate.com` ni `cepformacion-staging.akademate.com`; el HTTP 200 observado por Cloudflare no prueba que lleguen al contenedor candidato. El build amd64 de la imagen corregida se bloquea en `next build` tanto en Docker limpio como local; el build local además falla al cabo de 184 s por `.babelrc` y `cmdk`. No publicar URL de aprobación hasta completar imagen y routing.
Observación 2026-09-02 S23: El usuario aclara que no quiere una BD staging separada: la web pública y el dashboard deben ser despliegues separados, pero ambos deben leer el catálogo de la base canónica CEP ya disponible en Hetzner. La base `akademate_staging` queda fuera del objetivo y no se usará para promoción. El nuevo release público debe apuntar a la misma `DATABASE_URL` canónica; el dashboard conserva su contenedor actual.
Observación 2026-09-02 S24: Se crea y publica el Worker independiente `cepformacion-com` en la cuenta NAZCAMEDIA. `https://cepformacion.com/` responde 200 desde Cloudflare con página coming soon estática, logo CEP remoto y enlace a `https://cepformacion.akademate.com/`; el deploy también acepta `www.cepformacion.com`, pero ese hostname aún no resuelve por DNS. El Worker no consulta OVH, PostgreSQL ni el dashboard.
Observación 2026-09-02 S25: La propagación de DNS terminó durante la verificación: `cepformacion.com` y `www.cepformacion.com` resuelven a Cloudflare; el apex y `workers.dev` responden 200, y el sitio operativo de destino responde 200. La incidencia DNS de `www` queda cerrada.
Observación 2026-09-02 S26: La resolución de `www.cepformacion.com` es intermitente entre consultas locales: `dig` devuelve IPs Cloudflare, pero una consulta HTTPS posterior con curl recibió NXDOMAIN. No se debe considerar `www` verificado hasta obtener una respuesta HTTP 200 estable; el apex continúa verificado.
Observación 2026-09-02 S27: El build del runner público `akademate-tenant:cep-public-20260902-v2` falla en Dockerfile.tenant-public-runner: `npm install sharp` se ejecuta dentro del standalone y npm intenta interpretar dependencias `workspace:*`, devolviendo `EUNSUPPORTEDPROTOCOL`. No afecta al Worker serverless recién publicado; el runner OVH queda sin promover.
Observación 2026-09-02 S28: El Worker `cepformacion-com` se actualiza a la versión `d43df04d-2952-4444-ba10-0794b587c282`: favicon circular rojo, logo CEP, foto real de la sede Santa Cruz y acceso discreto con foco accesible. El apex sirve los tres activos desde URLs CEP que responden 200; el enlace visible y el acceso discreto apuntan al sitio operativo actual.
Observación 2026-09-02 S29: A petición del usuario, la versión `306cfdef-23a0-4db9-92ab-f52d92f65ed8` sustituye la foto central por el logo CEP dentro de un círculo y reduce el acceso discreto a un punto rojo casi invisible, conservando etiqueta accesible y enlace al sitio operativo. El apex sirve la nueva versión tras propagación de caché; dry-run y deploy pasan.
