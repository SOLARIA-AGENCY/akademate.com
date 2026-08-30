# Auditoria general de Akademate

Fecha: 2026-07-10

## Prompt optimizado

> Audita integralmente el repositorio y las superficies desplegables de Akademate. Separa seguridad, multitenencia, autenticacion/autorizacion, logica de negocio, fiabilidad, concurrencia, bucles, jobs, integraciones y experiencia funcional. Reconstruye primero el estado exacto del repositorio y fija un snapshot. Para seguridad, identifica entrada controlada por atacante, control esperado, control real, sink, impacto, precondiciones, contraprueba y confianza. Para funcionamiento, ejecuta typecheck y tests declarados, reproduce cada fallo y distingue bugs de producto, regresiones de tests y fallos del harness. No modifiques codigo. Clasifica P0-P3, conserva referencias archivo:linea y separa evidencia estatica, reproduccion local, estado desplegado y prueba autenticada. Entrega un resumen ejecutivo, inventario priorizado, cobertura, limitaciones y plan de remediacion por fases. No declares cierre total si el snapshot cambia o falta prueba de produccion.

## Resumen ejecutivo

Veredicto: **NO GO para considerar la plataforma lista para produccion sin una fase de remediacion de seguridad y estabilizacion del test harness**.

- Seguridad: 239 instancias pasan la politica estatica de reporte en el snapshot original. La confianza es alta en 1 y media en 238 porque no se verifico el despliegue vivo.
- Severidad estatica: 29 critical, 144 high, 51 medium y 15 low.
- Calidad funcional del HEAD posterior: TypeScript pasa; Vitest reporta 2.976 tests passing, 89 failing, 17 skipped, 25 suites fallidas y 1 error React no controlado.
- Bug funcional confirmado: Programacion intenta renderizar un objeto `profesor` como texto.
- Bucles: no se confirmo un bucle infinito en los `while (true)` revisados; tienen salida por paginacion, unicidad o limite. Los polls/SSE revisados limpian intervalos, aunque el polling async de notificaciones permite solapamiento si una consulta supera 3 segundos.
- Integridad de auditoria: el scan de seguridad se fijo en `1cdab25d66ce48e5ee2787bdf6590414872e4b83`, pero HEAD avanzo durante la ejecucion hasta `2eeedf2c...` y despues `5477a7c3...`. Codex Security rechazo correctamente sellar el informe como snapshot actual.

## Limite de evidencia

La seguridad se audito contra un snapshot pre-seal identificado por:

- revision: `1cdab25d66ce48e5ee2787bdf6590414872e4b83`
- snapshot digest: `codex-security-snapshot/v1:sha256:a7e5a676a5448e33c3c26171764bf7d07966cd5caa47c4fbecbdec1b8ad86058`
- inventario: 2.423 rutas
- discovery: cinco pasadas completas, seis revisores por pasada
- validacion: 246/246 candidatos cerrados
- attack path: 243/243 supervivientes analizados; 239 `report`, 4 `ignore`

El intento de sellado fallo con `Repository HEAD changed while the scan was running. Start a new scan.` Por tanto, los JSON y reportes son evidencia pre-seal, no certificacion del HEAD actual ni de produccion.

## Hallazgos prioritarios

### P0 - Identidad y sesion no confiables

La familia de mayor impacto permite construir o confiar en sesiones serializadas sin una verificacion criptografica equivalente antes de operaciones privilegiadas.

Rutas representativas:

- `apps/tenant-admin/app/api/auth/session/route.ts:46`
- `apps/tenant-admin/app/api/auth/impersonate/route.ts:9`
- `apps/tenant-admin/middleware.ts:240`
- `apps/tenant-admin/middleware.ts:378`

Impacto potencial: bypass de autenticacion, impersonacion y emision de JWT Payload valido para otro usuario. Requiere revalidacion HTTP contra un entorno desechable antes de afirmar explotacion productiva.

### P0 - Ruptura sistemica de aislamiento tenant

Se identificaron operaciones que aceptan tenant u objeto desde request sin demostrar binding con la identidad autenticada. Las familias incluyen configuracion, dominios, branding, usuarios, staff, notificaciones, pagos y contenido publico.

Rutas representativas:

- `apps/tenant-admin/app/api/config/route.ts:650`
- `apps/tenant-admin/app/api/billing/transactions/route.ts:50`
- `apps/tenant-admin/app/api/notifications/route.ts:49`
- `apps/tenant-admin/app/api/v1/staff/[id]/route.ts:13`
- `apps/tenant-admin/app/(public)/p/profesores/[slug]/page.tsx:33`

### P0 - Endpoints de desarrollo y auto-login fail-open

El codigo y la infraestructura contienen rutas `dev-login` y auto-login conectadas desde UI/scripts. Deben quedar inaccesibles por construccion en produccion, no solo por convencion o variable opcional.

Rutas representativas:

- `apps/tenant-admin/middleware.ts:274`
- `apps/web/app/login/LoginGateway.tsx:75`
- `infrastructure/scripts/deploy.sh:242`

### P1 - API de configuracion y operaciones sensibles

El inventario incluye mutaciones y lecturas de configuracion, feature flags, GDPR, invitaciones, gastos, uploads y operaciones SaaS con controles insuficientes o dependientes de middleware debil.

Rutas representativas:

- `apps/tenant-admin/app/api/feature-flags/route.ts:189`
- `apps/tenant-admin/app/api/gdpr/[userId]/export/route.ts:95`
- `apps/tenant-admin/app/api/internal/invitations/route.ts:202`
- `apps/admin-client/app/api/upload/route.ts:38`
- `apps/admin-client/app/api/ops/tenants/route.ts:53`

### P1 - Bug funcional reproducido en Programacion

`apps/tenant-admin/app/(app)/(dashboard)/programacion/page.tsx:912` usa un cast TypeScript:

```ts
profesor: (c.profesor as string) || 'Sin docente'
```

El cast no transforma el valor en runtime. Cuando la API devuelve un objeto staff, `formatTeacherNames()` lo entrega a React y provoca:

```text
Objects are not valid as a React child (found: object with keys {id, staff_type, first_name, last_name, full_name, email})
```

Reproduccion: `apps/tenant-admin/tests/components/programacion-page.test.tsx`.

### P1 - Test harness monorepo no aislado

La configuracion `apps/tenant-admin/vitest.config.ts` incluye patrones globales (`**/...`) y al ejecutarse desde la raiz recoge tests de Campus, Admin Client, Portal y packages con aliases de Tenant Admin. Resultado: suites con 0 tests o imports `@/...` resueltos contra la app incorrecta.

Ejemplos:

- `apps/admin-client/__tests__/api-keys-page.test.tsx`
- `apps/admin-client/tests/api/ops-service-health-route.test.ts`
- `apps/portal/__tests__/page.test.tsx`

Ademas, `apps/tenant-admin/app/api/v1/__tests__/internalFichaRoutes.test.ts:5` usa `process.cwd()`, por lo que falla cuando Vitest se lanza desde la raiz aunque los archivos existan dentro de `apps/tenant-admin`.

### P2 - Regresiones de expectativas y contratos UI

- Navegacion CEP: el producto muestra `Colabora`, mientras el test espera `Empleo`.
- Staff normalization: el resultado ahora incluye campos normalizados adicionales y el test exige igualdad exacta con el contrato antiguo.
- MediaGallery: el texto de dimensiones se fragmenta en nodos React y `getByText('1920x1080')` deja de coincidir.
- Programacion nueva, Campus hooks y API clients presentan fallos adicionales que requieren triage individual despues de arreglar el harness.

## Bucles, polling y concurrencia

No se confirmaron loops infinitos en los casos revisados:

- `BlogPosts/hooks/generateSlug.ts`: limite 100 y fallback timestamp.
- imports/sync CEP: salida por `totalPages`.
- generadores de codigos: progresion monotona sobre un set finito.

Riesgo residual:

- `apps/tenant-admin/app/api/notifications/stream/route.ts:25` usa `setInterval(async ...)`. Si una consulta dura mas de 3 segundos pueden coexistir iteraciones y aumentar carga/duplicar trabajo. La cancelacion limpia el intervalo, por lo que no es un loop sin salida, pero conviene usar un ciclo secuencial con `setTimeout` posterior a cada poll o un guard `inFlight`.

## Resultados de verificacion

| Control | Resultado |
| --- | --- |
| Tenant Admin TypeScript | PASS |
| Vitest global con config Tenant Admin | FAIL |
| Test files | 194 pass / 25 fail |
| Tests | 2.976 pass / 89 fail / 17 skip |
| Errores no controlados | 1 |
| Seguridad discovery | 2.423 rutas, saturacion alcanzada |
| Seguridad validation | 246/246 cerrados |
| Seguridad attack path | 239 report / 4 ignore |
| Sello Codex Security | FAIL por drift de HEAD |
| Produccion autenticada | no verificada |

## Plan recomendado

1. Congelar un SHA y repetir el scan diferencial sobre el HEAD definitivo antes de release.
2. Corregir primero la cadena sesion -> middleware -> impersonacion y desactivar dev-login por construccion en produccion.
3. Introducir un `VerifiedPrincipal` comun; derivar tenant del principal y prohibir tenant IDs de request en operaciones protegidas.
4. Exigir autorizacion handler-local y filtros tenant en cada acceso con `overrideAccess: true`.
5. Corregir el bug de Programacion con normalizacion estructurada de profesor/profesores/profesorRefs y test adversarial objeto/string/null.
6. Separar Vitest por workspace/app y eliminar `process.cwd()` de tests que dependen de rutas de una app.
7. Reejecutar tests por app; solo entonces triar los fallos restantes como regresion o expectation drift.
8. Validar en un entorno desechable las rutas P0 y despues realizar smoke autenticado de flujos criticos.

## Artefactos

- JSON canonicamente validado: `scan-manifest.json`, `findings.json`, `coverage.json` dentro del scan temporal.
- Portfolio: `hardening/hardening.md` dentro del scan temporal.
- Seis write-ups criticos con PoC local en `findings/` dentro del scan temporal.
- Informe de validacion: `artifacts/05_findings/validation_summary.md`.
- Informe de attack paths: `artifacts/05_findings/attack_path_analysis_report.md`.

## Conclusion

La plataforma tiene una base amplia y compila en Tenant Admin, pero la evidencia actual no permite recomendar lanzamiento sin remediacion. El riesgo dominante no son loops infinitos, sino controles de identidad y tenant dispersos, junto con un harness de tests que mezcla aplicaciones y oculta la diferencia entre regresiones reales y fallos de configuracion. La siguiente decision correcta es congelar el codigo, cerrar P0/P1 y repetir la auditoria diferencial con prueba runtime controlada.
