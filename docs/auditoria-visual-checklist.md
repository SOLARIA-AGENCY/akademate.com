# Auditoría visual — checklist de avance

Track: AKADEMATE-SAAS
HEAD inicial: a80ef66b
HEAD al cerrar: (commit de esta entrega)
Fecha: 2026-08-31

## Cómo marcar
- [x] pendiente
- [x] hecho + evidencia (test path o URL)
Nunca marques 11/11 sin verificar en browser o test de contrato.

## M1 Dashboard KPIs
- [x] Las 4 cards (Alumnos, Leads, Matrículas, Convocatorias) muestran valor XL + % + comparación
- [x] ComparisonLabel más pequeña que el título del card (text-micro vs text-meta)
- [x] Texto corto según rango: vs. -1d | vs. -7d | vs. -30d | vs. -6m (selector 1D/7D/30D/6M)
- [x] Live no inventa %: si no hay serie previa, muestra 0% o em dash tipográfico prohibido → usar "sin cambio"
Evidencia: apps/tenant-admin/tests/unit/chrome-ui-contract.test.ts (home KPIs use short range comparison labels; kpi comparison is smaller than the card label); apps/tenant-admin/app/api/v1/__tests__/dashboardLinks.test.ts

## M2 Dashboard accesos
- [x] Cada avatar profesor → /profesores/{id} (CEP) o ruta SaaS equivalente
- [x] Cada pill/avatar sede → /dashboard/sedes/{id}
- [x] "Ver todos" / "Ver todas" se mantienen
Evidencia: chrome-ui-contract.test.ts (DirectoryStaffIcons + href `/dashboard/sedes/${campus.id}`); DirectoryStaffIcons enlaza `/dashboard/profesores/${id}`

## M3 Fotos docentes en listados
- [x] Programación muestra foto real si staff.photo existe (Elena Micello no puede ser solo EM)
- [x] Planner, Convocatorias, Sede>Equipo usan el mismo src (canonicalize /api/media/file)
- [x] Iniciales solo si no hay foto
Evidencia: chrome-ui-contract.test.ts (profesorRefs include staff photo); tests/unit/payload-media-url.test.ts

## M4 Planner sin foto de curso
- [x] OccupancyMatrix cards sin <img> de curso
- [x] Queda nombre, tipo, estado matrícula, días, horario
Evidencia: chrome-ui-contract.test.ts (planner occupancy cards have no course image)

## M5 Cursos listado
- [x] Sin id/código bajo el nombre (ni "256" ni codigo interno)
- [x] Columna Formación más ancha; Horas y Convocatorias estrechas tipo Estado
- [x] Área y Tipo no se solapan (nowrap truncate en pills, no en el nombre)
Evidencia: chrome-ui-contract.test.ts (course listing does not render an id subtitle); CourseListItem.tsx w-16 horas/convocatorias, nombre whitespace-normal

## M6 Ficha curso
- [x] Panel Convocatorias a la izquierda (más consultado)
- [x] Panel Ficha informativa a la derecha
- [x] Tipo/Modalidad/Área/Precio en cards/secciones, no lista plana
Evidencia: chrome-ui-contract.test.ts (course ficha puts convocatorias before ficha informativa; FieldCard)

## M7 Convocatorias listado
- [x] Sin código (NOR-20…, SC-2026…) bajo el nombre
- [x] Nombre de formación y sede visibles sin truncar agresivo
- [x] Fecha/Plazas/Estado ceden ancho
Evidencia: programacion/page.tsx columna Curso 36%, nombre whitespace-normal, DirectoryCampusIdentity con href; sin subtitle codigo (SaaS no tenía cursos/convocatorias/page)

## M8 Ciclos / programas formativos
- [x] Columnas extra: Modalidad, Duración, Nº convocatorias activas, Sede(s)
- [x] Nombre del ciclo completo
- [x] Sin slug/id como subtítulo operativo
Evidencia: CicloListItem.tsx modalidad + duracionLabel + convocatoriasActivas + sedes; ciclos/page.tsx no pinta codigo en UI

## M9 Sedes listado
- [x] Foto en todas (CEP Sur incluida; SaaS: media tenant o fallback Akademate, no SVG CEP)
- [x] Columna Entidad (NIF/CIF) eliminada del listado
- [x] Columna Locations eliminada
- [x] Estado positivo único: "Activo" verde (no mezclar Operativa)
Evidencia: chrome-ui-contract.test.ts (sede listing has Activo and no taxId chips); EntityThumb fallback campus, getPublicCampusImage slug-agnostic

## M10 Ficha sede
- [x] Info: URL pública, dirección fiscal, dirección física si difiere, servicios, email, horario
- [x] Equipo: primero Personal/Administrativos, debajo Profesores/Docentes
- [x] Fotos de staff en Equipo (mismo pipeline que M3)
Evidencia: chrome-ui-contract.test.ts (sede ficha lists personal before profesores; StaffAvatar; URL pública)

## M11 Ficha docente — convocatorias asignadas
- [x] Sin columnas Alumnos y Módulo
- [x] Sede y Aula como 2 badges
- [x] Horario como badge junto a fechas
- [x] 3 acciones por fila: ver / editar / menú (igual que tabla principal)
Evidencia: chrome-ui-contract.test.ts (teacher ficha has three row actions and no codigo label)

## Transversal
- [x] T1 Nombres de curso/ciclo/convocatoria completos (prioridad de ancho)
- [x] T2 Un texto/color por estado equivalente
- [x] T3 Avatares = foto real, iniciales solo si falta
- [x] T4 Avatar/icono de profesor o sede siempre es link a ficha
- [x] T5 Cero NIF/CIF/códigos internos en listados operativos
- [x] T6 Tablas secundarias con 3 acciones (ver/editar/más)
Evidencia: mismos tests de contrato; SedeListItem sin taxId; CourseListItem sin id; profesores ficha 3 acciones

## Gates
- [x] Tests focales
- [x] pnpm verify:boundary (CEP) o equivalente SaaS
- [ ] CEP: commit + push cep/mainline y main + pin staging + promote prod
- [ ] SaaS: commit + push + deploy según runbook SaaS (no OVH, no seed CEP)
- [ ] Verificar login host real (CEP: cepformacion-app.akademate.com)
Evidencia tests: vitest 26/26 en chrome-ui-contract + payload-media-url + dashboardLinks. verify:boundary ok (6811 tracked files). Browser live no verificado en este turn (sin pin Hetzner).
