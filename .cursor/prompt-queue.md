# Cola de prompts — HOLD

Estado: **no ejecutar** hasta orden explícita (`ejecuta`, `procede`, `hazlo`, `aplica`).
Capturado: 2026-08-27

---

## P0 — Standing order
Anotar todos los prompts. No ejecutar nada hasta orden.

---

## P1 — Login: quitar descripción del formulario
**Acción:** eliminar
**Texto:** `Ingresa tus credenciales para acceder al sistema`
**Dónde:** `AuthShell` / `LoginPage` — `<p data-slot="auth-description" class="mt-2 text-sm leading-6 text-muted-foreground">`
**DOM:** columna derecha del login, debajo de «Iniciar sesión», encima de «Correo Electrónico»

## P2 — Login aside: quitar subtítulo
**Acción:** eliminar
**Texto:** `Organiza cursos, personas y la actividad diaria de tu centro desde un único espacio.`
**Dónde:** `AuthShell` aside — `<p class="mt-3 max-w-sm text-sm leading-6 text-white/75 lg:mt-4">`
**DOM:** panel izquierdo (imagen/marketing), debajo del H1

## P3 — Login aside: quitar tagline
**Acción:** eliminar
**Texto:** `Gestión inteligente para academias`
**Dónde:** `AuthShell` aside — `<div class="mt-6 flex items-center gap-2 text-xs text-white/60 lg:mt-8">`
**DOM:** panel izquierdo, debajo del subtítulo (incluye el punto azul)

## P4 — Login footer legal: enlaces reales + páginas con chrome
**Acción:** redirigir (no eliminar)
**Texto visible:** `Privacidad · Términos · Cookies`
**Dónde:** `AuthLegalFooter` dentro de `AuthShell` / `LoginPage`
**Requisito:**
- Cada enlace abre su página legal correspondiente (privacidad, términos, cookies).
- Esas páginas llevan menú superior + footer (no hoja suelta).
- Contenido/datos según superficie:
  - CEP / OVH: datos de **CEP**
  - `akademate.com` (SaaS): datos de **BRIK64 LLC**

## P5 — Rail colapsado: hover en iconos con hijas abre acordeón hacia abajo
**Acción:** cambiar comportamiento hover
**Dónde:** `AppSidebar` `nav[data-testid=dashboard-sidebar-nav]` — rail `w-[80px]`
**Requisito:** al hacer mouseover sobre iconos que tengan subpáginas, las subpáginas se despliegan **hacia abajo** igual que cuando el menú está expandido/descolapsado.
- No flyout lateral.
- Solo ítems con hijos.
- El rail permanece colapsado (80px); el bloque de hijos se abre in-flow debajo del icono (acordeón), no como menú flotante.

**Conflicto a resolver al ejecutar:** iteración previa pedía tooltip-only (nombre/sección) y prohibió descolapsar el rail al hover. P5 pide acordeón vertical de hijas sin expandir el rail. No reabrir flyouts ni `railExpanded = open || hover`.

## P6 — Home dashboard: viewport bajo no debe colapsar cards (audit + plan)
**Acción:** corregir layout (no implementar hasta orden)
**Dónde:** `data-slot=dashboard-main-inner` → `DashboardPageShell` (`DashboardHome`) → `data-testid=dashboard-glance`
**Síntoma:** al reducir altura, título/filtros ok-ish pero el pulso se corta arriba/abajo, profesorado/sedes/hoy/actividad se aplastan, no hay scroll, textos ilegibles.

### Causa (audit)
Cadena viewport-locked, todos `overflow-hidden` + `h-dvh` / `min-h-0`:

1. `DASHBOARD_SHELL_LOCKED_CLASS` (`h-dvh overflow-hidden`)
2. `DASHBOARD_CENTER_CLASS` / `DASHBOARD_LISTING_INSET_CLASS` / `main` / `DASHBOARD_LISTING_MAIN_INNER_CLASS`
3. `DASHBOARD_PAGE_SHELL_CLASS` (`overflow-hidden`)
4. Work surface `DASHBOARD_WORK_SURFACE_CLASS` (`flex-1 min-h-0 overflow-hidden`)
5. Home usa `scroll="region"` (default): el body va en `DASHBOARD_SCROLL_REGION_CLASS` (`overflow-y-auto`)

El scroll **no aparece** porque el stack `#dashboard-glance` es hijo flex de esa región (`flex flex-col flex-1 min-h-0`). Flex shrink (default 1) **comprime el stack a la altura del viewport** en vez de dejar que crezca el contenido. Las cards recortan por `overflow-hidden`:

- Pulso: `EmptyPanel` = `flex min-h-0 overflow-hidden` + home pasa `className="min-h-0 w-full"` → se aplasta; `line-clamp-3` en descripción.
- Profesorado / Sedes: `h-full min-h-[12rem] overflow-hidden` → 12rem sigue siendo colapso; `h-full` estira y recorta.
- Hoy / Actividad reciente quedan fuera del recorte visual sin scrollbar.

Chrome (título + filtros) ya es `shrink-0` en `dashboard-page-chrome`. Eso se mantiene.

### Comportamiento objetivo
1. **Fijos (no scroll):** «Dashboard» + barra Rango/Sede/Tipo.
2. **Scroll vertical único** en el work surface (debajo de filtros) cuando el contenido no cabe.
3. **Cards con altura mínima intrínseca** (`h-auto` / `min-h-min` / `shrink-0`). No colapsar por debajo de título + cuerpo + CTAs. Textos siempre enteros (quitar clamp/clip).
4. Pulso comercial: no recortar icono/título/descripción/botones.
5. No scroll de documento ni de shell; topbar + rails siguen locked.

### Plan de implementación (cuando se ejecute)
1. Home glance: `shrink-0` (o `min-h-max`) para que el scroll region reciba overflow real.
2. EmptyPanel/EmptyState en home: quitar `min-h-0 overflow-hidden`; altura de contenido; sin `line-clamp` en este bloque.
3. Cards profesorado/sedes/hoy: `h-auto overflow-visible`, min-height de contenido no `h-full` + 12rem como techo de colapso.
4. Confirmar que `DASHBOARD_SCROLL_REGION_CLASS` es el único `overflow-y-auto` del home; padres `overflow-hidden` se quedan para lock de chrome.
5. Tests: viewport corto (p.ej. 700×500): chrome visible sin scroll; work surface `overflow-y: auto`; pulso no clip; scroll llega a «Actividad reciente».
6. Aplicar en CEP + SaaS (mismos shells).

## P7 — Programación: toolbar 1 línea + tabla de directorio (no filas custom)
**Acción:** unificar chrome + tabla (no implementar hasta orden)
**Dónde:** `AcademicPageShell` / `DashboardToolbar` / `SedeFilterControl` / lista `programacion-compact-table` (`ProgramacionColumnHeader` + `ProgramacionRunRow`)
**Página:** `/dashboard/programacion` vista Lista

### Síntoma
- Toolbar no es una sola línea: se ve «Sede» + «Sede» + «Todas» apilados (altura ~100px).
- Título y búsqueda deben quedar fijos; la tabla debe scroll vertical interno.
- La tabla no es la de Cursos / Convocatorias / Sedes (y programas si existe): es un listado custom de cards/filas.

### Causa (audit)
1. **Toolbar wrap:** `DashboardToolbar` usa `flex-row flex-wrap xl:flex-nowrap`. Por debajo de xl los filtros bajan de línea.
2. **SedeFilterControl es un bloque `w-full flex-wrap`:** label externo «Sede» + `SelectTrigger` con `aria-label="Sede"` (duplicado). `w-full` obliga a ocupar el slot de filtros entero y el wrap apila label encima del select. El trigger de directorio mete el prefijo dentro del trigger (`<span>Sede</span><SelectValue />`), no un label hermano.
3. **Lista distinta:** Cursos/Sedes/Convocatorias usan `PremiumDirectoryShell` → `Table` + `thead` sticky `[&_th]:bg-card` + `DASHBOARD_FILL_PANEL_*`. Programación Lista usa `ProgramacionColumnHeader` + `ProgramacionRunRow` (`PROGRAMMING_ROW_GRID`, `DASHBOARD_CARD_CLASS`) y paginación custom dentro del panel. `scroll="page"` ya está; el body fill existe, pero el *widget* no es la tabla de directorio.

### Objetivo
- Una sola fila: búsqueda + filtros (Sede, Estado) + acciones, `nowrap` razonable; filtros como el resto (label dentro del trigger, no fila extra).
- Fijos: título «Programación académica» + toolbar (incluido search).
- Tabla Lista = mismo `PremiumDirectoryShell` / `Table` que Cursos-Convocatorias-Sedes: thead sticky, filas `TableRow`, scroll interno en `DASHBOARD_FILL_PANEL_BODY_CLASS`.
- Cronograma (Gantt) se queda como vista alternativa; no forzar Gantt a Table.

### Plan (cuando se ejecute)
1. Alinear `SedeFilterControl` al patrón de filtros de Cursos (prefix in-trigger, no `w-full` wrap).
2. Toolbar programación: una línea (`flex-nowrap` + overflow/min-width), no wrap a 100px de alto.
3. Sustituir `programacion-compact-table` / `ProgramacionRunRow` lista por `PremiumDirectoryShell` (columnas Formación, Sede, Aula, Docentes, Programación, Estado + acciones).
4. Conservar print/CSV/Lista/Cronograma en header actions.
5. Tests: toolbar una fila; lista usa `Table`/`PremiumDirectoryShell`; chrome shrink-0; body overflow-y-auto.
6. CEP + SaaS.

## P8 — Cursos empty: fondo card + CTA «+ Nuevo»
**Acción:** empty de directorio (Cursos)
**Dónde:** `PremiumDirectoryShell` empty `border-dashed` (sin `bg-card`)
**Requisito:**
- Fondo = color de cards (`bg-card`), como el panel de Programación (`EmptyPanel`/`Card`).
- Botón visible de crear curso; texto **«+ Nuevo»** igual que el del header (`Plus` + `Nuevo`, no solo «Nuevo»).
- Header Cursos ya usa `<Plus />` + `createLabel="Nuevo"`; empty usa el mismo label sin icono.

## P9 — Segments dark: `bg-slate-100/80` en todas las páginas
**Acción:** tokens dark (pidieron «corrígelo»; queda en cola hasta orden de lote)
**Dónde:** `PremiumDirectoryShell` track `rounded-lg bg-slate-100/80 p-1` (Ciclos, Cursos, y cualquier listing con `segments`)
**Duplicados:** `apps/tenant-admin/components/...` y `@payload-config/components/...` (CEP + SaaS)
**Causa:** pista light hardcodeada; selected pill `bg-card` sobre track claro. Dark se ve incorrecto.
**Objetivo:** track `bg-muted` (o equivalente token); selected/unselected contrastan en light y dark. No `bg-slate-100`.

## P10 — Ciclos empty: fondo card + botón crear ciclo
**Acción:** empty Programas/Ciclos
**Dónde:** mismo `PremiumDirectoryShell` dashed empty
**Causa:** `ciclos/page.tsx` pone «+ Nuevo» en `extraToolbar`, **no** pasa `onCreate`/`createLabel`. Empty solo pinta CTA si hay `onCreate` → «No se encontraron ciclos» sin botón.
**Requisito:**
- Fondo `bg-card` (mismo que P8; un solo empty en el shell).
- Botón crear ciclo en el empty (`+ Nuevo` / crear ciclo), cableado a `handleNuevoCiclo` (respetar `canCreateCycle`).

## P11 — Convocatorias empty + pie de listado siempre visible (todas las páginas directorio)
**Acción:** empty Convocatorias + contrato de panel para **todas** las listings `PremiumDirectoryShell` (Cursos, Ciclos, Convocatorias, Sedes, etc.)
**Dónde:** empty dashed `No hay convocatorias` / `Nueva`; pie `directoryRangeLabel` + paginación ahora **dentro** del panel y **desaparece** en empty (`rows.length === 0` no renderiza Table ni footer).

**Empty (igual P8/P10):**
- Fondo `bg-card` (no canvas).
- CTA crear: **«+ Nueva»** con `Plus`, mismo patrón que header (`createLabel="Nueva"` hoy sin icono en empty).

**Con items (y también con 0):**
- Título + toolbar fijos (ya `shrink-0`).
- Panel work: **responsive vertical**.
- **Pie siempre visible:** recuento («Mostrando x–y de n …») + filas/página + paginación. Aunque empty (0 convocatorias / 0 cursos / 0 ciclos).
- Si las filas no caben: **scroll vertical interno** solo en el cuerpo (thead sticky); el pie no se va con el scroll.

**Causa:** empty es un `div` dashed a pantalla completa que sustituye `DASHBOARD_FILL_PANEL` + Table + footer. El footer vive al final del panel de tabla, no como chrome fijo del work surface.

**Plan (cuando se ejecute):** un solo panel `bg-card`: cuerpo scroll (`flex-1 overflow-y-auto`) + footer `shrink-0` siempre. Empty va en el cuerpo, no reemplaza el panel entero.

**Incluye Sedes** (`SedesPage`, mismo empty dashed + segments `Todas / Físicas / Virtuales`):
- Empty: `bg-card`; CTA **«+ Nueva sede»** (hoy `extraToolbar` disabled, sin `onCreate` → empty sin botón, igual que Ciclos).
- Segments: mismo P9 (`bg-slate-100/80` → tokens).
- Pie + scroll interno: mismo P11.

## P12 — CTA crear: «+ Nuevo {entidad}» en header y empty (todas las listings)
**Acción:** copy del botón (toolbar + empty). El `Plus` ya está; el texto no puede ser solo «Nuevo».
**Patrón:** `+ Nuevo ciclo` · `+ Nuevo curso` · `+ Nuevo docente` · y el resto igual (género: Nueva convocatoria, Nueva sede, Nueva matrícula…).
**Hoy:**
- Ciclos `extraToolbar`: `Nuevo`
- Cursos `createLabel`: `Nuevo`
- Convocatorias: `Nueva`
- Profesores: `Nuevo Profesor`
- Administrativo: `Nuevo administrativo`
- Sedes toolbar: `Nueva sede` (empty sin CTA)

**Alcance:** Cursos, Ciclos/Programas, Convocatorias, Sedes, Docentes/Profesores, Administrativo, Alumnos, Leads, Matrículas, y cualquier listing con botón crear. Header y empty **misma etiqueta**.

---

Pendiente de lote:
- P1–P3 login textos
- P4 legales CEP vs BRIK64 LLC
- P5 acordeón hijas rail colapsado
- P6 home: chrome fijo + cards min-height + scroll vertical
- P7 programación: toolbar 1 línea + tabla directorio
- P8/P10/P11 empties + pie + scroll (Cursos, Ciclos, Convocatorias, Sedes)
- P9 segments dark
- P12 CTAs «+ Nuevo {entidad}»

## P13 — Profesores: segments + fondo del panel inferior
**Acción:** igual que P9 + P8/P11, página Docentes
**Dónde:** segments `Todos / Activos / En Clase / En Permiso / Inactivos` (`bg-slate-100/80`)
**Abajo:** work surface empty/dashed (canvas, no `bg-card`) — mismo empty de `PremiumDirectoryShell`.
**Requisito:** track de segments con tokens dark; panel inferior color card + pie visible + scroll interno (P11). CTA header/empty: **«+ Nuevo docente»** (P12).

---

Pendiente de lote: P1–P13.
Cuando digas ejecutar: aplicar P1–P13.
