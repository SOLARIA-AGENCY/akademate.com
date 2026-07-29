# Akademate public web — auditoría y matriz shadow

Fecha: 2026-07-29
Superficie objetivo: `apps/web` (`akademate-web`, puerto 3006 en infraestructura)
Autoridad de partida: `origin/main` en `64df89fd1f53372a01fc5f337a17d52ec55b1161`
Referencia de lectura: worktree `codex/cep-multi-entity-scopes`; no se copiaron identidad, contrato, correos ni responsabilidades de CEP.

## Autoridad y límites

- `docs/ARCHITECTURE.md` y `infrastructure/docker/docker-compose.yml` asignan `akademate.com` a `apps/web`/`akademate-web:3006`. No existe un repositorio separado `www.akademate.com`.
- La web CEP pertenece a `apps/tenant-admin/app/(public)` y depende de Payload/tenant. Solo se usó para inventariar patrones de páginas.
- No se modificaron roles, permisos, datos, finanzas, infraestructura de producción ni deploy.
- Los datos registrales y de contacto definitivos de `SOLARIA AGENCY OÜ` no estaban confirmados en la autoridad revisada. Permanecen como placeholders explícitos.

## Auditoría de rutas antes/después

| Ruta | Antes | Después | Decisión |
|---|---|---|---|
| `/` | Coming soon aislado, sin navegación/footer común; cifras y claims fuertes | Portada SaaS general, navegación completa, alcance verificable y CTA honesto | Implementar |
| `/cursos` | Lista CMS con enlaces a detalle inexistente | Lista conservada y detalle `/cursos/[slug]` añadido; backend sigue siendo necesario | Implementar + requiere backend |
| `/blog` | Tres cards hacia artículos 404 | Temas en preparación sin enlaces ficticios | Reformular |
| `/sobre-nosotros` | Equipo, redes y `50+` no acreditados | Producto, operador y criterios de claims | Reformular |
| `/contacto` | Teléfono, dirección, correos y respuesta en 24 h inventados; anti-spam simulado | Placeholders legales, consentimiento explícito, honeypot y sin SLA ficticio | Implementar |
| `/registro` | Prueba gratuita/migración/soporte no acreditados; consentimiento implícito | Solicitud de demo sin activación; consentimiento fail-closed y marketing `false` | Implementar |
| `/registro/completar` | OAuth huérfano, consentimiento automático y redirect a ruta inexistente | Redirect seguro a `/registro` | Ocultar/reconducir |
| `/portal/login` | Login duplicado con redirects internos inexistentes | Redirect a portal configurado o `/accesos` | Ocultar/reconducir |
| `/design-system/**` | Indexable desde la web pública | `noindex, nofollow`, fuera de navegación/sitemap | Ocultar del índice |
| `/legal/*` | Inexistente en `apps/web` | Privacidad, términos, cookies, subencargados y transparencia IA | Implementar |
| `/privacidad`, `/terminos`, `/cookies` | Footer apuntaba a 404 | Redirects compatibles al centro legal | Implementar |
| `/robots.txt`, `/sitemap.xml` | Inexistentes | Inventario indexable y exclusión de APIs/accesos/internas | Implementar |

## Matriz shadow de secciones

| Patrón observado en CEP | Decisión Akademate general | Resultado |
|---|---|---|
| Identidad y datos legales del centro | No copiar. Centralizar `SOLARIA AGENCY OÜ` con campos pendientes visibles | Implementado en `apps/web/lib/public-site.ts` |
| Privacidad, términos y cookies | Reescribir para la web SaaS general | Implementado |
| Subencargados | No inferir proveedores desde dependencias o despliegues históricos | Registro público con estado pendiente/condicional |
| Banner de cookies | No mostrar si no existen trackers opcionales | Oculto; configuración por env no puede activar trackers |
| Catálogo y ficha de curso | Reutilizar el contrato CMS general | Implementado; requiere Payload accesible |
| Sedes y oferta por sede | No copiar contenido CEP; presentar solo modelado general | Claim reformulado; aislamiento granular no prometido |
| Testimonios, cifras, reseñas y equipo | Ocultar sin evidencia | Eliminado |
| Precios, prueba gratuita, soporte y migración incluidos | Requieren contrato/comercial backend | Reformulado como solicitud sin compromiso |
| Pagos/facturación | Stripe existe en código, pero no demuestra activación universal | Texto condicional; sin automatización prometida |
| Analítica | Existen dashboards/rutas, no una garantía universal en tiempo real | Reformulado como informes sobre datos disponibles |
| IA/MCP | Existe `packages/mcp-server`, pero no prueba integración pública general | Solo transparencia y límites; activación queda en backlog |
| Badges regulatorios | Deben orientar, no certificar | Badge accesible “Información regulatoria · No es una certificación” |

## Auditoría de claims contra código

| Área | Evidencia estructural | Claim público permitido |
|---|---|---|
| Cursos/convocatorias | `Courses.ts`, `CourseRuns.ts` | Gestión y catálogo según configuración |
| Alumnado/matrículas | `Students.ts`, `Enrollments.ts` | Seguimiento administrativo y académico disponible |
| Roles/permisos | `src/access/tenantAccess.ts` | Acceso por tenant/rol; no aislamiento completo por sede |
| Multi-sede | `Campuses.ts` y relaciones de planificación | Modelado de sedes; seguridad granular depende del despliegue |
| Pagos | `@payload-config/lib/stripe.ts` y flujos de billing | Integraciones condicionales, no facturación automática universal |
| Analítica/reportes | rutas dashboard y `packages/reports` | Vistas/exportaciones según datos y módulos |
| IA/MCP | `packages/mcp-server` separado de `apps/web` | No anunciar ejecución por asistentes como capacidad general activa |

## Trackers, consentimiento y seguridad de formularios

- No se detectaron loaders de Google Tag Manager/Analytics, Meta Pixel, PostHog o Clarity en `apps/web`.
- `NEXT_PUBLIC_TRACKERS` queda fail-closed: cualquier valor se registra como bloqueado y no carga código.
- No se muestra banner sin trackers opcionales. Si se añade uno, deben llegar en el mismo cambio loader, inventario nominal, política y consentimiento granular previo.
- Contacto, demo y waitlist rechazan consentimiento ausente; marketing permanece `false`.
- Tres intentos adversariales por contrato: borde/valor vacío, condición fail-closed y variación no prevista (env malformado, honeypot, mensaje sobredimensionado, email inválido).

## Backlog no bloqueante

1. Sustituir placeholders legales solo con documentos confirmados: registro, identificación fiscal, domicilio y email legal.
2. Confirmar y publicar proveedores/subencargados contractuales, ubicaciones y salvaguardas.
3. Conectar el catálogo a un Payload público con smoke autenticado/negativo y política de caché definida.
4. Activar trackers únicamente mediante cambio separado con consentimiento granular y pruebas de no carga previa.
5. Publicar precios, pagos, SLA, soporte, migración, analítica o IA/MCP solo tras verificar configuración y despliegue concretos.
6. Actualizar el lockfile global: actualmente no refleja `postgres@^3.4.9` en `packages/jobs/package.json`.
7. Restaurar el runner Playwright local instalando el browser de la versión vigente; el QA visual se completó con el navegador integrado.

## Evidencia local

- Typecheck `apps/web`: limpio.
- ESLint `apps/web`: limpio.
- Tests adversariales: `12/12` en `vitest.public.config.ts`.
- Build Next.js: correcto, 62 páginas generadas; aviso local de Better Auth sin secreto durante el primer build, no fallo.
- QA integrado: portada desktop/mobile, cinco rutas legales, menú móvil, consola sin errores/warnings y recursos de red limitados a `localhost:3016`.
- Runner Playwright de repo: bloqueado antes de ejecutar por ausencia de `chromium_headless_shell-1234`; no es un fallo funcional de la aplicación.
