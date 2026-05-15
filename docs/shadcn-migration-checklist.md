# Migración shadcn Akademate / CEP Formación

Estado generado por auditoría de código local. La meta es que toda UI operativa dependa de `@payload-config/components/ui` y de la capa de producto `@payload-config/components/akademate`, evitando cards, badges, botones, modales, tablas y formularios manuales en páginas.

## Estado actual

- shadcn base instalado en `apps/tenant-admin/components.json`.
- Componentes shadcn instalados: `button`, `card`, `badge`, `dialog`, `sheet`, `tabs`, `table`, `select`, `input`, `textarea`, `sidebar`, `avatar`, `separator`, `skeleton`, `alert`, `alert-dialog`, `checkbox`, `dropdown-menu`, `tooltip`, `toggle`, `toggle-group`, `progress`, `pagination`, `collapsible`, `accordion`.
- Biblioteca de producto existente en `apps/tenant-admin/@payload-config/components/akademate`.
- Deuda visual inicial detectada: 244 archivos con clases/markup manuales de UI.
- Auditoría posterior al primer bloque:
  - 10 páginas ya importan `@payload-config/components/akademate`.
  - 91 usos de `PageHeader` legacy siguen pendientes.
  - 57 usos de `<button>` manual siguen pendientes.
  - 17 textos/estados `Borrador` siguen pendientes de normalización por contexto.
- Áreas con más deuda:
  - Dashboard: 121 archivos.
  - Web pública: 34 archivos.
  - Auth: 4 archivos.
  - Campus: 7 archivos.
  - Componentes legacy internos: 54 archivos.

## Reglas obligatorias

- [ ] Usar `Button`, nunca `<button className=...>` salvo overlays técnicos inevitables.
- [ ] Usar `CardHeader`, `CardContent`, `CardFooter`, no `div.rounded-xl.border...`.
- [ ] Usar `Badge`, no `span.inline-flex...`.
- [ ] Usar `Separator`, no `border-t` manual para divisores.
- [ ] Usar `Skeleton`, no `animate-pulse` manual.
- [ ] Usar `Alert`, `EmptyPanel`, `LoadingPanel`, `ErrorPanel` para estados.
- [ ] Usar `Dialog`, `Sheet`, `AlertDialog` para overlays.
- [ ] Usar `Label`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` en formularios.
- [ ] Usar tokens semánticos (`primary`, `muted`, `foreground`, `card`, `destructive`) y no paletas crudas dispersas.
- [ ] Evitar `space-y-*`; usar `flex flex-col gap-*`.
- [ ] Mantener `tenant_id` y no tocar tracking/campañas/formularios públicos al migrar UI.

## P0 - Biblioteca base

- [x] `FieldCard`
- [x] `InfoRow`
- [x] `InfoGrid`
- [x] `DocumentCard`
- [x] `EntityMetricCard`
- [x] `StatusBadge`
- [x] `EmptyPanel`
- [x] `LoadingPanel`
- [x] `ErrorPanel`
- [x] `FormSection`
- [x] `CoursePrintSheet`
- [x] `AkadematePageShell`
- [x] `DashboardPageHeader`
- [x] `DashboardSection`
- [x] `EntityHeroCard`
- [x] `EntitySummaryCard`
- [x] `ActionFooter`
- [x] `EntityStatusBadge`
- [x] `CampaignStatusBadge`
- [x] `SubsidizedTrainingBadge`
- [x] `MediaBadge`
- [x] `PdfManagerCard`
- [x] `AuthShell`
- [x] `AuthError`
- [x] `AuthDivider`
- [x] `AuthLegalFooter`

## P1 - Auth

- [x] `/auth/login` migra a `AuthShell`.
- [x] `/login` hereda `/auth/login`.
- [x] `/auth/forgot-password`.
- [x] `/auth/signup`.
- [x] `/auth/accept-invite`.
- [x] Revisar estados error/loading y accesibilidad.

## P2 - Dashboard shell

- [ ] Unificar `AppSidebar` con `akademate/dashboard/DashboardSidebar`.
- [ ] Migrar aside wrapper a componente shadcn `Sidebar`.
- [ ] Migrar header dashboard a componente `DashboardTopbar`.
- [ ] Migrar búsqueda a patrón reutilizable.
- [ ] Migrar usuario/notificaciones a `DropdownMenu`, `Avatar`, `Badge`.
- [ ] Revisar modo colapsado y mobile.

## P3 - Dashboard académico

- [x] Cursos listado usa `CourseDashboardCard` / `CourseDashboardListItem`.
- [x] Curso detalle usa `CoursePrintSheet`.
- [x] Curso detalle corrige impresión directa con `CoursePrintSheet`.
- [x] Curso detalle elimina CTA duplicado de edición y centra `Ver curso`.
- [x] Crear convocatoria desde curso bloquea el programa origen y muestra foto/metadatos.
- [x] Curso ficha usa `PdfManagerCard`.
- [x] Curso ficha separa descarga/sustitución/subida de PDF del header.
- [x] Curso ficha mejora convocatorias asociadas con información visual.
- [ ] Curso detalle debe usar `EntityHeroCard`, `FieldCard`, `EntitySummaryCard`.
- [ ] Curso ficha debe completar migración a `EntitySummaryCard`.
- [ ] Curso editar/nuevo.
- [ ] Ciclos listado.
- [ ] Ciclo detalle.
- [ ] Ciclo ficha.
- [ ] Programación listado.
- [ ] Programación detalle.
- [ ] Programación ficha.
- [ ] Calendario citas.
- [ ] Leads.
- [ ] Inscripciones.
- [ ] Lista espera.
- [ ] Matrículas.
- [ ] Sedes/aulas.
- [ ] Profesores/personal.

## P4 - Web pública

- [x] Base de `CoursePublicCard` / `CoursePublicListItem`.
- [x] Base de cards públicas de entidad.
- [ ] Home completo.
- [ ] Catálogo `/p/cursos`.
- [ ] Landing `/p/cursos/[slug]`.
- [ ] Landing `/p/convocatorias/[slug]`.
- [ ] Ciclos públicos.
- [ ] Áreas.
- [ ] Sedes.
- [ ] Profesores.
- [ ] Blog.
- [ ] Empleo/agencia colocación.
- [ ] Formularios públicos sin tocar payload/tracking.

## P5 - Campus

- [ ] Login campus.
- [ ] Navbar campus.
- [ ] Dashboard campus.
- [ ] Curso/lección.
- [ ] Logros.

## P6 - Componentes legacy a reemplazar

- [ ] `CourseListItem`
- [ ] `CourseTemplateCard`
- [ ] `CicloCard`
- [ ] `CicloListItem`
- [ ] `ConvocationCard`
- [ ] `CursoCicloCard`
- [ ] `StaffCard`
- [ ] `SedeListItem`
- [ ] `PersonalListItem`
- [ ] `EmptyState`
- [ ] `PageHeader`
- [ ] `ViewToggle`
- [ ] `ResultsSummaryBar`
- [ ] `PlanLimitModal`
- [ ] `DeleteCourseDialog`
- [ ] `ConvocationGeneratorModal`

## Verificación requerida antes de producción

- [ ] `corepack pnpm --filter tenant-admin typecheck`
- [ ] `corepack pnpm --filter tenant-admin build`
- [ ] `git diff --check`
- [ ] Verificación local `/login`.
- [ ] Verificación local `/dashboard`.
- [ ] Verificación local `/dashboard/cursos`.
- [ ] Verificación local `/dashboard/cursos/187`.
- [ ] Verificación local `/dashboard/cursos/187/ficha`.
- [ ] Verificación local `/p/cursos`.
- [ ] Verificación local home pública.
- [ ] Verificación producción post deploy.
