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
