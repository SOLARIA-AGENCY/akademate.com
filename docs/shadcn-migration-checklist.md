# Migración shadcn Akademate / CEP Formación

Estado generado por auditoría de código local. La meta es que toda UI operativa dependa de `@payload-config/components/ui` y de la capa de producto `@payload-config/components/akademate`, evitando cards, badges, botones, modales, tablas y formularios manuales en páginas.

## Estado actual

- shadcn base instalado en `apps/tenant-admin/components.json`.
- Componentes shadcn instalados: `button`, `card`, `badge`, `dialog`, `sheet`, `tabs`, `table`, `select`, `input`, `textarea`, `sidebar`, `avatar`, `separator`, `skeleton`, `alert`, `alert-dialog`, `checkbox`, `dropdown-menu`, `tooltip`, `toggle`, `toggle-group`, `progress`, `pagination`, `collapsible`, `accordion`.
- Biblioteca de producto existente en `apps/tenant-admin/@payload-config/components/akademate`.
- Deuda visual inicial detectada: 244 archivos con clases/markup manuales de UI.
- Auditoría local 2026-05-18 tras bloque actual:
  - 15 imports directos de `@payload-config/components/akademate`.
  - 94 usos de `PageHeader` legacy siguen pendientes de codemod directo, pero ya heredan wrapper shadcn.
  - 0 usos operativos de `<button>` HTML en `apps/tenant-admin/app` y `apps/tenant-admin/@payload-config/components`.
  - 1 `<button>` residual en `@payload-config/components/ui/sidebar.tsx`, aceptado por ser primitive base shadcn.
  - 0 formularios públicos críticos con `<input>`, `<textarea>` o `<select>` manual.
  - 0 selects operativos manuales en dashboard crítico tras migrar inscripciones, campus, profesores y sedes.
  - Inputs residuales nativos clasificados como primitives shadcn (`Input`, `Textarea`) o controles técnicos `file/color` que no deben ocultar su semántica nativa.
  - 0 candidatos críticos conocidos de botones blancos/invisibles en CTAs migrados del bloque actual.
  - 0 textos/estados `Borrador` en dashboard/componentes internos.
- Iteración P6 2026-05-18:
  - `ViewToggle` migra a `ToggleGroup` / `ToggleGroupItem`.
  - `EmptyState` migra a `EmptyPanel` con soporte de icono en la capa Akademate.
  - `SedeListItem`, `PersonalListItem` y `CicloListItem` migran a composición `Card` / `CardContent` / `Badge` / `Button`.
  - `StaffCard` normaliza header/avatar con `CardHeader`, `CardTitle` y `Avatar`.
  - `CourseListItem` migra a composición `Card` / `CardContent` / `Badge` / `Button`.
  - `ResultsSummaryBar` migra a `Badge` y tokens semánticos.
  - `AppSidebar` y `DashboardLayout` eliminan botones HTML manuales del shell principal.
  - `Calendario citas` migra selects del modal de cita a `Select` shadcn.
  - `Programación detalle` migra formularios inline de sede/aula/horario, fechas y precio a `Select`, `Input`, `Checkbox`, `Label`.
  - Verificación estrecha: `corepack pnpm --filter tenant-admin typecheck`.
- Iteración P7 2026-05-18:
  - Formularios públicos sensibles migran a `Input`, `Textarea`, `Checkbox`, `Select`, `Button` sin cambiar payloads, tracking, Pixel ni UTMs.
  - `WebsiteRenderer` usa `Input` y `Textarea` shadcn en la sección de contacto renderizada.
  - CRM de inscripciones migra selects, fechas, checkboxes y verificación destructiva a componentes shadcn.
  - Campus virtual, profesor detalle, sedes y áreas eliminan selects/checkboxes operativos manuales.
  - Residual nativo aceptado: `input[type=file]`, `input[type=color]` y primitives internas de shadcn.
  - Verificación estrecha: `corepack pnpm --filter tenant-admin typecheck`.
- Iteración P8 2026-05-18:
  - Mocks de `Select` y `Avatar` actualizados para reflejar contratos shadcn accesibles en tests.
  - `Select` de test renderiza control nativo etiquetable y opciones válidas sin HTML inválido dentro de `option`.
  - `CourseListItem` conserva CTA rojo CEP con `hover:text-white`.
  - Verificación completa:
    - `corepack pnpm --filter tenant-admin test`: 123 suites, 1693 tests passed, 1 skipped.
    - `corepack pnpm --filter tenant-admin typecheck`.
    - `corepack pnpm --filter tenant-admin build`.
    - `git diff --check`.
- Áreas con más deuda:
  - Dashboard: 121 archivos.
  - Web pública: 34 archivos.
  - Auth: 4 archivos.
  - Campus: 7 archivos.
  - Componentes legacy internos: 54 archivos.

## Gate de despliegue

- [ ] No desplegar a Hetzner hasta que este checklist esté al 100%.
- [ ] No hacer `push` de producción ni reinicio remoto mientras queden checks pendientes.
- [ ] Cada bloque se implementa con ciclo `ralph-loop`: cambio pequeño, verificación barata, ajuste, siguiente cambio.
- [ ] Al final, ejecutar checks completos y verificación visual local antes de cualquier despliegue.

## Reglas obligatorias

- [x] Usar `Button`, nunca `<button className=...>` salvo overlays técnicos inevitables.
- [ ] Usar `CardHeader`, `CardContent`, `CardFooter`, no `div.rounded-xl.border...`.
- [ ] Usar `Badge`, no `span.inline-flex...`.
- [ ] Usar `Separator`, no `border-t` manual para divisores.
- [ ] Usar `Skeleton`, no `animate-pulse` manual.
- [ ] Usar `Alert`, `EmptyPanel`, `LoadingPanel`, `ErrorPanel` para estados.
- [ ] Usar `Dialog`, `Sheet`, `AlertDialog` para overlays.
- [x] Usar `Label`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` en formularios operativos.
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

- [x] `PageHeader` legacy queda convertido en wrapper shadcn/Akademate compatible.
- [ ] Codemod progresivo de imports `PageHeader` a `DashboardPageHeader` cuando la página se migre por completo.
- [x] `AppSidebar` usa `Button` shadcn en toggles de navegación.
- [ ] Unificar `AppSidebar` con `akademate/dashboard/DashboardSidebar`.
- [ ] Migrar aside wrapper a componente shadcn `Sidebar`.
- [ ] Migrar header dashboard a componente `DashboardTopbar`.
- [x] Búsqueda del topbar elimina botones HTML manuales.
- [ ] Migrar búsqueda a patrón reutilizable.
- [x] Usuario/notificaciones usan `DropdownMenu`, `Avatar`, `Badge`/componentes shadcn existentes.
- [ ] Revisar modo colapsado y mobile.

## P3 - Dashboard académico

- [x] Cursos listado usa `CourseDashboardCard` / `CourseDashboardListItem`.
- [x] Curso detalle usa `CoursePrintSheet`.
- [x] Curso detalle corrige impresión directa con `CoursePrintSheet`.
- [x] Curso detalle elimina CTA duplicado de edición y centra `Ver curso`.
- [x] Crear convocatoria desde curso bloquea el programa origen y muestra foto/metadatos.
- [x] Selector principal de líneas de cursos usa cards enlazadas sin `<button>` manual.
- [x] Estados visibles de curso/convocatoria/ciclo normalizados a `Sin publicar` y `Publicado`.
- [x] Blog/FAQ del dashboard usan `Button asChild` en enlaces de acción.
- [x] Botones manuales restantes en público migrados a `Button` sin cambiar formularios ni tracking.
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
- [x] Programación detalle: edición de sede/aula/horario, fechas y precio usa formularios shadcn.
- [ ] Programación ficha.
- [x] Calendario citas: modal principal usa `Input`, `Textarea`, `Select`, `Dialog`, `Button`.
- [ ] Leads.
- [x] Inscripciones.
- [ ] Lista espera.
- [ ] Matrículas.
- [x] Sedes/aulas.
- [x] Profesores/personal.

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
- [x] Formularios públicos sin tocar payload/tracking.

## P5 - Campus

- [ ] Login campus.
- [ ] Navbar campus.
- [ ] Dashboard campus.
- [ ] Curso/lección.
- [ ] Logros.

## P6 - Componentes legacy a reemplazar

- [x] `CourseListItem`
- [x] `CourseTemplateCard`
- [x] `CicloCard`
- [x] `CicloListItem`
- [x] `ConvocationCard`
- [x] `CursoCicloCard`
- [x] `StaffCard`
- [x] `SedeListItem`
- [x] `PersonalListItem`
- [x] `EmptyState`
- [x] `PageHeader`
- [x] `ViewToggle`
- [x] `ResultsSummaryBar`
- [x] `PlanLimitModal`
- [x] `DeleteCourseDialog`
- [x] `ConvocationGeneratorModal`

## Verificación requerida antes de producción

- [x] `corepack pnpm --filter tenant-admin typecheck`
- [x] `corepack pnpm --filter tenant-admin test`
- [x] `corepack pnpm --filter tenant-admin build`
- [x] `git diff --check`
- [ ] Verificación local `/login`.
- [ ] Verificación local `/dashboard`.
- [ ] Verificación local `/dashboard/cursos`.
- [ ] Verificación local `/dashboard/cursos/187`.
- [ ] Verificación local `/dashboard/cursos/187/ficha`.
- [ ] Verificación local `/p/cursos`.
- [ ] Verificación local home pública.
- [ ] Verificación producción post deploy.
