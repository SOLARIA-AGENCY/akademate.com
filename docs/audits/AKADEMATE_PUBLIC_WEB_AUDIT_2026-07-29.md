# Auditoría de la web pública de Akademate — 2026-07-29

## Estado y autoridad

- Superficie: `apps/web`.
- Dominios configurados: `akademate.com` y `www.akademate.com`; `www` redirige al dominio raíz.
- Servicio: `akademate-web`, puerto 3006, detrás de Traefik.
- Fuente del candidato local: `origin/main` en `64df89fd1f53372a01fc5f337a17d52ec55b1161`.
- Worktree: `/Users/carlosjperez/Documents/GitHub/akademate-public-web-audit`.
- Rama: `codex/akademate-public-web-audit`.
- Límite del documento: auditoría y candidato pre-release. La publicación debe vincularse después a un SHA mediante `/api/health` y verificación live independiente.

## Modelo de producto público

Akademate mantiene dos carriles paralelos que comparten base de producto, pero no identidad, contrato, datos ni despliegue:

1. `akademate.com`: superficie corporativa del SaaS general, todavía en preparación para futura apertura multitenant. No existe alta pública autoservicio claim-safe en este momento.
2. Plan Enterprise: instancia aislada por cliente bajo implantación y contrato específicos. `cepformacion.akademate.com` es la instancia Enterprise aislada de CEP Formación. Su identidad, DPA, textos y configuración no son plantilla pública ni autoridad automática para otros clientes.

## Baseline live observado antes del cambio

| Ruta/superficie | Evidencia live | Hallazgo |
|---|---|---|
| `/` | 200 | Coming soon con claims universales de pagos, analítica, multi-sede y MCP. |
| `/legal/*` | 404 en las cinco rutas | Sin información legal pública operativa. |
| `/privacidad`, `/terminos`, `/cookies` | 404 | Footer enlazaba rutas inexistentes. |
| `/contacto` | 200 | Teléfono/dirección ficticios, SLA no probado y falso CAPTCHA. |
| `/blog` | 200 | Tres tarjetas enlazaban artículos 404. |
| `/cursos` | 200 | Filtros, paginación y detalle sin flujo/rutas reales. |
| `/design-system` | 200 | Catálogo interno indexable desde la navegación pública. |
| `/accesos` | 200 | Gateway con `admin / 1234` y POSTs a `dev-login`. |

## Inventario de shadow sections

| Hallazgo | Clasificación | Resolución local |
|---|---|---|
| Gateway `admin / 1234` y `dev-login` | Debe ocultarse; riesgo P0 | Eliminado; `/accesos` redirige al login real. |
| Better Auth propio sin secreto válido en `apps/web` | Debe ocultarse; backend huérfano | Ruta y configuración eliminadas del dominio público. Login redirige a `app.akademate.com`. |
| Alta OAuth/14 días/migración/soporte | Requiere backend, plan y contrato | Autoservicio retirado; `/registro*` dirige a evaluación comercial. |
| Consentimiento marcado `true` sin acción | Implementable ahora | Cliente y servidor fail-closed; payload whitelist; honeypot no simulado como CAPTCHA. |
| Teléfono, Madrid, horario y respuesta <24 h | Debe ocultarse | Retirado. Solo canal general ya visible; privacidad específica queda pendiente. |
| Cursos/filtros/paginación/detalle ficticios | Requiere catálogo tenant real | Página convertida en explicación honesta: Akademate no vende cursos propios. |
| Artículos de blog inexistentes | Debe ocultarse/etiquetarse | Tarjetas retiradas; página indica biblioteca en preparación. |
| Equipo, 50+ academias y redes sociales | Debe ocultarse | Retirado por falta de fuente validada. |
| Cursos, alumnos, matrículas y leads | Implementable como claim acotado | Presentados como capacidades del producto con límite por configuración. |
| Pagos y facturación | Requiere integración/plan | Etiquetados “según plan e integración”; sin afirmar activación universal. |
| Analítica | Requiere datos/módulos | Etiquetada operativa; se retira “tiempo real”. |
| Multi-sede/entidad/campus | Requiere activación de autorización | Marcado “en validación controlada”; shadow CEP no equivale a RBAC activo. |
| MCP/IA | Implementación técnica + activación controlada | Se reconoce el servidor MCP sin prometer compatibilidad universal; límites y supervisión visibles. |
| Design system | Debe ocultarse en producción | Retirado de navegación/sitemap, `noindex` y 404 en build productivo. |
| Links de instructores, precios, FAQ y empleo | Debe ocultarse hasta tener ruta | Retirados del footer. |
| Identidad fiscal/domicilios/contacto privacidad | Requiere validación profesional | Config centralizada con estado pendiente explícito, sin valores inventados. |
| Subencargados concretos | Requiere inventario contractual validado | Página creada con categorías y límite; lista nominal queda bloqueada hasta validación. |

## Cookies y trackers

No se encontró código de GA4, GTM, Meta Pixel, Hotjar, Clarity o Segment en `apps/web`. El inventario de Browser del candidato local observó 17 recursos: fuentes, imágenes, CSS, JavaScript y prefetches, todos `127.0.0.1:3006`.

Decisión: no añadir consent manager sin finalidades no esenciales. Un test adversarial falla ante firmas de trackers conocidas. La política de cookies exige consentimiento granular, previo y fail-closed antes de introducir analítica o marketing.

## Identidad y textos legales

- Prestador central: `SOLARIA AGENCY OÜ`.
- Pendiente de validación: registry code, VAT, domicilio social en Estonia, dirección operativa en Malmö y canal específico de privacidad.
- Canal general provisional: `hola@akademate.com`.
- Todos los documentos se identifican como borrador informativo pendiente de revisión profesional.
- No se publica el contrato/DPA específico de CEP como documento genérico.
- No se usan logos oficiales de UE, RGPD o Reglamento de IA.
- Los badges muestran en texto visible: “Información regulatoria; no constituye certificación ni sello oficial”.

## Scorecard de diseño

Preset: `landing-page` con énfasis `accessibility-heavy`.

| Área | Baseline live | Candidato local | Estado |
|---|---:|---:|---|
| Propósito y posicionamiento | 2/5 | 5/5 | Distingue SaaS futuro y Enterprise aislado. |
| Confianza y claims | 1/5 | 4/5 | Sin cifras/identidades ficticias; quedan datos legales pendientes. |
| Interacción y navegación | 1/5 | 4/5 | CTAs reales, rutas legales 200 y redirects coherentes. |
| Accesibilidad | 3/5 | 4/5 | Skip link, landmarks, menú ARIA, targets móviles 44–50 px. |
| Responsive | 3/5 | 5/5 | Sin overflow a 1440×1000 y 390×844. |
| Producción/console/network | 1/5 | 4/5 | Consola limpia y red same-origin local; falta artefacto servido live. |

Resultado local: **4.3/5**. Baseline live estimado: **1.8/5**.

## Verificación local

- Vitest: 14/14.
- TypeScript: `tsc --noEmit`, sin errores.
- Next build: compilación y generación de 62 rutas completadas.
- Playwright/Chrome: 5/5.
- Browser desktop: 1440×1000, sin overflow; navegación completa visible.
- Browser móvil: 390×844, sin overflow; menú operativo y targets adecuados.
- Browser consola: 0 warnings/errores en portada, contacto y privacidad.
- Browser recursos: 0 trackers/recursos externos observados en portada.
- Rutas locales: páginas públicas/legales 200; legacy legales 307; design system y API auth 404; accesos/registro redirigen a flujos honestos.

## Bloqueos y siguientes decisiones

1. Validar profesionalmente registro/VAT/domicilios/contacto de privacidad.
2. Validar y publicar el inventario contractual real de subencargados por modelo SaaS y Enterprise.
3. Definir gates de apertura del SaaS multitenant: alta, planes, RLS/RBAC, operación, soporte y facturación.
4. Mantener CEP como instancia Enterprise específica; no fusionar su identidad, DPA ni permisos shadow con el producto general.
5. Vincular commit, push, despliegue y artefacto servido mediante el mismo `APP_REVISION`; no inferir producción desde el estado de la rama.
6. Definir rate limiting en edge/origen para `/api/leads` y `/api/waitlist` antes de un despliegue público; el candidato ya valida tamaño, schema, consentimiento y honeypot, pero no demuestra una cuota distribuida.
