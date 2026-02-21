# Tenant Dashboard — Master Plan de Homogeneización Visual (Ralph Loop)

Fecha: 2026-02-21
Scope: `apps/tenant-admin/app/(dashboard)`
Objetivo: estandarizar TODAS las páginas con el mismo patrón shadcn, densidad informativa controlada y consistencia de spacing/tipografía.

## 1. Estándar objetivo (Definition of Done por página)
- Usa `PageHeader` con estructura uniforme: `title`, `description`, `badge`, `actions`, `filters`.
- Elimina bloques redundantes de KPIs cuando no añaden decisión operativa.
- Filtros principales en una sola fila responsive (sin doble línea innecesaria en desktop).
- Cards/listados en formato compacto (jerarquía clara, CTA principal único, metadata secundaria en badges).
- Color/tokenización por tema (sin hardcodes de color de marca dentro de páginas).
- Estados consistentes: loading, empty, error.
- Sin regresión técnica: `pnpm --filter @akademate/tenant-admin exec tsc --noEmit --pretty false --incremental false` en verde.

## 2. Estado por módulos

### Wave A — Core académico (en curso)
- [x] `/programacion`
- [x] `/cursos`
- [x] `/cursos/[id]`
- [x] `/sedes`
- [x] `/ciclos-medio`
- [ ] `/ciclos-superior`
- [ ] `/ciclos`
- [ ] `/ciclos/[id]`
- [ ] `/planner`
- [ ] `/alumnos`
- [ ] `/matriculas`
- [ ] `/lista-espera`

### Wave B — Personal y estructura operativa
- [ ] `/personal`
- [ ] `/personal/[id]`
- [ ] `/profesores`
- [ ] `/profesores/[id]`
- [ ] `/profesores/[id]/editar`
- [ ] `/profesores/nuevo`
- [ ] `/administrativo`
- [ ] `/administrativo/[id]`
- [ ] `/administrativo/[id]/editar`
- [ ] `/administrativo/nuevo`

### Wave C — Comercial y marketing
- [ ] `/leads`
- [ ] `/campanas`
- [ ] `/creatividades`
- [ ] `/marketing`
- [ ] `/marketing/campanas`
- [ ] `/marketing/creatividades`

### Wave D — Campus virtual / LMS
- [ ] `/campus-virtual`
- [ ] `/campus-virtual/inscripciones`
- [ ] `/campus-virtual/progreso`
- [ ] `/campus-virtual/contenido`
- [ ] `/campus-virtual/certificados`

### Wave E — Admin / configuración / soporte
- [ ] `/dashboard`
- [ ] `/administracion`
- [ ] `/administracion/usuarios`
- [ ] `/administracion/roles`
- [ ] `/administracion/actividad`
- [ ] `/administracion/impersonar`
- [ ] `/administracion/suscripcion`
- [ ] `/configuracion`
- [ ] `/configuracion/general`
- [ ] `/configuracion/apis`
- [ ] `/configuracion/areas`
- [ ] `/configuracion/dominios`
- [ ] `/configuracion/flags`
- [ ] `/configuracion/gdpr`
- [ ] `/configuracion/personalizacion`
- [ ] `/facturacion`
- [ ] `/estado`
- [ ] `/analiticas`
- [ ] `/ayuda`
- [ ] `/perfil`
- [ ] `/perfil/editar`

### Wave F — Contenido web
- [ ] `/contenido/blog`
- [ ] `/contenido/faqs`
- [ ] `/contenido/formularios`
- [ ] `/contenido/medios`
- [ ] `/contenido/paginas`
- [ ] `/contenido/testimonios`
- [ ] `/contenido/visitantes`
- [ ] `/web/cursos`
- [ ] `/web/ciclos/medio`
- [ ] `/web/ciclos/superior`

## 3. Estrategia Ralph Loop (auto-ejecución)
1. Seleccionar 1 página por iteración (atómica).
2. Aplicar patrón visual estándar (header+filtros+cards/tabla+estados).
3. Gate técnico: typecheck de `tenant-admin`.
4. Registrar evidencia en `TASKS_TODO.md` y `LOGS.md`.
5. Commit/push.
6. Deploy incremental en NEMESIS (`docker compose build tenant && up -d tenant`).
7. Verificación mínima HTTP + visual.

## 4. Orden de ejecución automático (próximas iteraciones)
1. `/ciclos-superior`
2. `/ciclos`
3. `/personal`
4. `/profesores`
5. `/dashboard`
6. `/campus-virtual`
7. `/leads`
8. `/analiticas`
9. `/facturacion`
10. `/contenido/medios`

## 5. Riesgos y mitigación
- Riesgo: regressión funcional por simplificación de UI.
  - Mitigación: no tocar contratos de API ni lógica de negocio; solo composición visual.
- Riesgo: tiempos de build en despliegues iterativos.
  - Mitigación: lotes pequeños y deploy sólo tras validación local de typecheck.
- Riesgo: inconsistencia residual entre módulos legacy.
  - Mitigación: checklist de cobertura total por rutas (este documento).
