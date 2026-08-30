# Brief para agente local: wizard de matrícula + accesos + restos de auditoría

Léete este fichero entero antes de tocar código. Es la fuente de verdad del paquete pendiente.
No rehacer chrome A–D ni el scroll del sidebar. Implementa lo que falta, verifica, commit, push, actualiza PR.

## 0. Repo, rama, restricciones

- Repo: `github.com/SOLARIA-AGENCY/akademate.com`
- App: `apps/tenant-admin`
- Rama de trabajo (ya existe, úsala): `cursor/shadcn-tenant-chrome-a0a-e6bf`
- Base: `main`
- UI: español. Sin raya larga (em dash). shadcn New York.
- Sección 3.B SaaS: NO identidad CEP en chrome. No `applyCepHostIdentity`, no `CEP_DEFAULT_BRANDING`, no `#f2014b` / `#3E091A` en kebab `components/ui` ni en shell/dashboard.
- Marca: `TenantBranding` + CSS `--primary --ring --brand --sidebar --dashboard-canvas`.
- Referencia visual: Académico > Convocatorias (`PremiumDirectoryShell`).
- `components/` es symlink a `@payload-config/components`. Edita un solo fichero.
- Imports arriba del módulo. Switch sobre uniones: `default` con `never`.
- NO deploy. NO migraciones SQL. NO Traefik/DNS. NO `next build` en VPS vivo.
- NO merge. Commit + push + actualizar PR. Si `create_pr` dice "must be a collaborator", deja el branch pushed y no insistas.
- Vitest alias: `@payload-config/components/ui` → `apps/tenant-admin/tests/__mocks__/@payload-config/components/ui`. Si un test renderiza el wizard, mockea `radio-group`, `command`, `tooltip`, `collapsible`.
- `pnpm --filter tenant-admin` / cwd `apps/tenant-admin`. Si lockfile falla: `pnpm install --no-frozen-lockfile`.

APIs existentes (reutilizar, no inventar otras de matrícula):

- `GET /api/leads?limit=&q=` (credentials include)
- `GET /api/convocatorias` → `{ success, data: [{ id, cursoNombre, campusNombre, fechaInicio, plazasTotales, plazasOcupadas, precio, matricula, modalidad, estado }] }`
- `POST /api/leads/:id/enroll` body `{ courseRunId }`
- `POST /api/enrollments/direct` body `{ firstName, lastName, email, phone, courseRunId }`

Tipo de acceso SIN migración: inferir de modalidad.

- `online` | `virtual` → `virtual`
- `hibrido` | `hybrid` → `hibrido`
- resto → `fisico`

Eventos de acceso: JSON/memoria, no DB.

---

## 1. Checklist maestro (actualizar mentalmente al terminar)

### Ya hecho (committed). NO rehacer.

- [x] A0+A chrome tokenizado (`62653bea`): `components.json` `@shadcn`, branding Akademate `#0066CC` / `#0F2440`, shell `--sidebar`, canvas `--dashboard-canvas`, `PremiumDirectoryShell`, `SegmentedToggle`, `ViewToggle`, `Kbd`, Table sticky `bg-card`.
- [x] B–D (`3fbbb362`): `command`, `sonner`, `empty`, `CommandPalette`, `useToast` bridge, `EmptyState` wrap, un `SidebarProvider`, `SidebarInset`, `SidebarTrigger` `data-slot="sidebar-collapse-toggle"`, `SIDEBAR_WIDTH` 240px / `SIDEBAR_WIDTH_ICON` 80px.
- [x] Auditoría visual + sidebar scroll (`6c9d3540`):
  - canvas `md:mb-3 md:mr-3 md:mt-3 md:rounded-xl`
  - main `min-w-0 overflow-x-auto` (no `overflow-x-hidden` en layout)
  - `PremiumDirectoryShell`: search izq, controles `flex-wrap xl:ml-auto`, sin `lg:flex-nowrap`, ⌘K junto al search, `placeholder:truncate`
  - `SidebarContent` `min-h-0 flex-1 overflow-y-auto`, submenu `max-h-[2000px]` (no `max-h-96`)
  - `globals.css` oculta scrollbar (`scrollbar-width: none` / `::-webkit-scrollbar { display: none }`)
  - listings: cursos, profesores, leads, inscripciones, lista-espera, programacion, convocatorias, sedes, ciclos, alumnos

### Empezado, untracked, no cableado (en el working tree o que debes crear si no está)

Ruta: `apps/tenant-admin/app/(app)/(dashboard)/matriculas/wizard/`

- [ ] `types.ts` (7 pasos, `accessKindFromModality`, `payableAmount`, draft shape) — ya escrito si está en disco
- [ ] `draft.ts` localStorage `akademate.enrollment.draft.v1` — ya escrito
- [ ] `EnrollmentStepper.tsx` — ya escrito
- [ ] `EnrollmentCart.tsx` — ya escrito
- [ ] `steps.tsx` Identify/Personal/Course/Consent/Payment/Access/Review — ya escrito
- [ ] `radio-group.tsx` nativo en `components/ui` (symlink) — ya escrito
- [ ] **`EnrollmentWizard.tsx` NO EXISTE. Créalo.**
- [ ] **`/matriculas/nueva` NO EXISTE. Créalo.**
- [ ] **Redirects `/matriculas/portal` NO EXISTEN. Créalos.**

### Falta del todo

- [ ] Hub `/matriculas` apunta al wizard (hoy abre `NewEnrollmentDialog`)
- [ ] `/matriculas/planes`
- [ ] Sidebar submenu Matriculación
- [ ] Módulo Accesos: hub, Recepción, Pases, Histórico
- [ ] `GET+POST /api/accesos` (store JSON/memoria)
- [ ] Sidebar grupo Accesos
- [ ] CommandPalette rutas nuevas
- [ ] Ficha curso: quitar `article ... rounded-2xl bg-background` y badge `#f2014b`
- [ ] Ficha convocatoria: badge y barra `#f2014b` → `primary`
- [ ] `programacion/[id]`: credentials + Alert + Reintentar
- [ ] Calendario citas: credentials + Alert; botón no `bg-red-600`
- [ ] Analíticas: Alert 401 + Reintentar + CTA login
- [ ] Ficha profesor: Select shadcn, `min-w-0`, Alert de error
- [ ] Matrículas listado: Alert de error, quitar hex CEP del icono
- [ ] Tests del paquete nuevo
- [ ] Commit, push, actualizar PR

### Fuera de alcance. NO tocar.

- Identidad CEP en web pública, `CourseTemplateCard` PascalCase, migraciones
- Planner OccupancyMatrix, chat del agente
- Filtros Rango/Sede/Tipo del Dashboard (solo CEP)
- Merge, deploy, Traefik, `next build` en VPS

---

## 2. Qué implementar, fichero a fichero

### 2.1 Wizard orquestador

`apps/tenant-admin/app/(app)/(dashboard)/matriculas/wizard/EnrollmentWizard.tsx` (`'use client'`)

- Hidratar draft con `loadEnrollmentDraft()` al montar. Guardar con `saveEnrollmentDraft` en cada cambio.
- Query `leadId`: precargar ese lead desde `GET /api/leads` o `GET /api/leads/:id` si existe.
- Fetch personas: `GET /api/leads?limit=50&q=` con `credentials: 'include'`. Mapear con `mapLeadToPerson` de `steps.tsx`.
- Fetch convocatorias: `GET /api/convocatorias` credentials include. Mapear con `mapCourseRun`.
- Pasos: `identify → personal → course → consent → payment → access → review`.
- Validación Siguiente (tooltip si disabled, usa `NextDisabledTooltip`):
  - identify: persona seleccionada o modo nueva persona
  - personal: firstName, lastName, email, phone
  - course: convocatoria seleccionada
  - consent: `consentAccepted` (guardar `consentAt` ISO y `consentBy`)
  - payment: `paymentMethod`
  - access: fisico/hibrido → `accessPass`; virtual → `virtualSendChannel`
- Submit en review:
  - persona existente (`person.id`) → `POST /api/leads/:id/enroll { courseRunId }`
  - persona nueva → `POST /api/enrollments/direct { firstName, lastName, email, phone, courseRunId }`
  - después, `POST /api/accesos` con el pase generado (si el API ya existe en este mismo PR)
  - `clearEnrollmentDraft()`, toast éxito, `router.push('/matriculas')` o ficha
- Layout: `PageHeader` "Nueva matrícula" + stepper + grid `lg:grid-cols-[minmax(0,1fr)_320px]` (pasos | `EnrollmentCart`). Cart Collapsible ya está en `<lg`.
- Webcam en AccessStep: `getUserMedia`; si falla, `cameraError` y Reintentar. Fallback file input ya está en PersonalStep.
- En `steps.tsx`: si `React.ReactNode` se usa sin import, añade `import type { ReactNode } from 'react'`.

`apps/tenant-admin/app/(app)/(dashboard)/matriculas/nueva/page.tsx`

```tsx
'use client'
import { EnrollmentWizard } from '../wizard/EnrollmentWizard'
export default function NuevaMatriculaPage() {
  return <EnrollmentWizard />
}
```

Redirects (App Router, server):

- `matriculas/portal/page.tsx` → `redirect('/matriculas/nueva')`
- `matriculas/portal/[...slug]/page.tsx` → `redirect('/matriculas/nueva')`

Si hay `leadId` en search params del portal, reenvíalo: `/matriculas/nueva?leadId=`.

### 2.2 Hub matrículas + planes + sidebar

`matriculas/page.tsx`:

- CTA "Nueva Matrícula" → `router.push('/matriculas/nueva')`, no dialog.
- `?nueva=1` (+ `leadId`) → `router.replace('/matriculas/nueva?leadId=...')`.
- `loadError`: `Alert` shadcn + Reintentar. Quitar el div rojo plano.
- Quitar `style={{ color: '#F2014B' }}` del icono. Usar `text-primary`.
- Acciones extra: links a `/matriculas/planes` y `/accesos`.
- `NewEnrollmentDialog` puede quedar importado pero no debe ser el flujo principal. Preferible dejar de abrirlo.

`matriculas/planes/page.tsx` (`'use client'`):

- Fetch `/api/convocatorias` credentials include.
- Listado/cards: curso, sede, modalidad, `accessKind`, precio, matrícula, plazas.
- Chrome: `PageHeader` + `PremiumDirectoryShell` o cards al estilo Convocatorias.
- Error: Alert + Reintentar. Vacío: `EmptyState`.

`components/layout/AppSidebar.tsx` (y el path symlink):

Sustituir el item plano Matriculacion por submenu:

```
Matriculacion
  Solicitudes        /matriculas
  Nueva matrícula    /matriculas/nueva
  Planes y tarifas   /matriculas/planes
```

Añadir grupo Accesos (junto a Matriculación, iconos lucide `ScanLine` / `IdCard` / `ClipboardList`):

```
Accesos
  Recepción   /accesos/recepcion
  Pases       /accesos/pases
  Histórico   /accesos/historico
```

`components/layout/CommandPalette.tsx` añadir:

- Nueva matrícula `/matriculas/nueva`
- Planes y tarifas `/matriculas/planes`
- Recepción `/accesos/recepcion`
- Pases `/accesos/pases`
- Histórico `/accesos/historico`

### 2.3 Control de accesos

Store testeable (sin DB):

`apps/tenant-admin/app/api/accesos/_lib/store.ts`

```ts
export type AccessKind = 'fisico' | 'virtual' | 'hibrido'
export type AccessPass = 'credential' | 'temporary' | 'visitor' | 'magic_link'
export type AccessDirection = 'in' | 'out'
export interface AccessEvent {
  id: string
  tenantId: number
  personName: string
  personId: string | null
  enrollmentId: string | null
  courseRunId: string | null
  campusName: string
  kind: AccessKind
  pass: AccessPass
  channel: 'email' | 'sms' | 'qr' | 'webcam' | 'manual'
  direction: AccessDirection
  at: string
  note: string
}
```

Persistir en memoria + fichero `/tmp/akademate-accesos.json` (o similar). Funciones exportadas: `listEvents(tenantId)`, `addEvent(input)`, `resetStore()` para tests.

`apps/tenant-admin/app/api/accesos/route.ts`

- Auth: `getAuthenticatedUserContext` de `app/api/leads/_lib/auth.ts`. 401 si no hay sesión.
- GET: lista del tenant, query opcional `kind`, `q`.
- POST: crea evento. Validar `personName`, `kind`, `pass`.

Páginas (todas `'use client'`, español, shadcn Card/Table/Badge/Alert/EmptyState/PageHeader):

- `/accesos` hub: 3 cards a Recepción, Pases, Histórico + copy físico/virtual/híbrido.
- `/accesos/recepcion`: buscar persona (leads), elegir kind/pase, registrar entrada/salida `POST /api/accesos`. Webcam opcional; si falla, Alert y pase temporal.
- `/accesos/pases`: crear/listar pases (credencial QR, temporal, visitante, magic link email/sms).
- `/accesos/historico`: tabla de eventos, filtros kind/sede, truncado `min-w-0 overflow-x-auto`.

Tipo híbrido: misma persona puede tener credencial física y envío virtual.

### 2.4 Restos de auditoría visual

| Fichero | Cambio |
|---|---|
| `cursos/[id]/ficha/page.tsx` | `article` sin `rounded-2xl bg-background`. Badge `#f2014b` → `bg-primary text-primary-foreground`. |
| `programacion/[id]/ficha/page.tsx` | Badge y barra ocupación `#f2014b` → `bg-primary`. |
| `programacion/[id]/page.tsx` | `fetch(..., { credentials: 'include', cache: 'no-store' })`. Extrae `loadConv` con retry. Error: `Alert` + Reintentar, no Card de texto plano. |
| `calendario-citas/page.tsx` | credentials include en fetches. Error: `Alert` + Reintentar. Botón Nueva cita `default` primary, no `bg-red-600`. Iconos KPI `text-primary`, no `text-red-600`. |
| `analiticas/page.tsx` | Sustituir el div de error (~línea 1029) por `Alert` + Reintentar. Si el mensaje es sesión expirada, Button a `/auth/login`. Ya tiene 401 detectado. |
| `profesores/[id]/page.tsx` | Native `<select>` → `Select` shadcn. Contenedor `min-w-0 overflow-x-auto`. `assignError` → `Alert`. |
| `matriculas/page.tsx` | Ya cubierto en 2.2. |

---

## 3. Tests mínimos

Añade un bloque en `apps/tenant-admin/app/(app)/(dashboard)/__tests__/chrome-phase-a.test.ts` o un fichero nuevo `matriculas-accesos.contract.test.ts` (source `readFileSync`, estable):

- Existen `EnrollmentWizard.tsx`, `nueva/page.tsx`, `planes/page.tsx`, `portal/page.tsx`.
- Existen `accesos/page.tsx`, `recepcion`, `pases`, `historico`, `api/accesos/route.ts`.
- Sidebar contiene `/matriculas/nueva`, `/matriculas/planes`, `/accesos/recepcion`.
- CommandPalette contiene esas rutas.
- Ficha curso no contiene `rounded-2xl bg-background` ni `#f2014b`.
- Ficha convocatoria no contiene `#f2014b`.
- Calendario no contiene `bg-red-600`.
- `matriculas/page.tsx` navega a `/matriculas/nueva` y usa `Alert`.

Unit (sin mocks de UI):

- `accessKindFromModality('online') === 'virtual'`, `'hibrido' === 'hibrido'`, `'presencial' === 'fisico'`
- `payableAmount` resta descuento
- `draft.ts` load/save/clear con localStorage mock del setup
- store accesos: add + list, `resetStore` aísla tests

No datos reales. No secretos. No hace falta e2e autenticado (el entorno cloud no tiene sesión CEP).

Correr:

```
cd apps/tenant-admin && pnpm exec vitest run app/(app)/(dashboard)/__tests__/chrome-phase-a.test.ts app/(app)/(dashboard)/matriculas tests/components/AppSidebar.test.tsx
```

Amplía `AppSidebar.test.tsx` para esperar "Nueva matrícula" / "Recepción" si el menú ya no es un link plano (puede hacer falta expandir el acordeón; si el test renderiza textos de items hijos, comprueba que existen).

---

## 4. Git

```
git add -A  # solo lo de este paquete, no secretos
git commit -m "feat(tenant-admin): enrollment wizard, access control, visual audit leftovers"
git push -u origin cursor/shadcn-tenant-chrome-a0a-e6bf
```

Actualiza el PR existente de esa rama. Draft OK. No merge.

---

## 5. Orden de trabajo recomendado (no cortes a mitad de un bloque)

1. `EnrollmentWizard.tsx` + `/matriculas/nueva` + redirects portal
2. Hub matrículas + `/matriculas/planes` + sidebar Matriculación + CommandPalette
3. Store + `/api/accesos` + páginas Accesos + sidebar Accesos
4. Parches de auditoría visual (ficha/hex/Alert/credentials)
5. Tests
6. Commit, push, PR

Si el contexto se acaba: commit parcial de un bloque completo (p. ej. wizard ya navegable) y sigue. Nunca dejes `EnrollmentWizard` a medias sin página.

## 6. Criterio de terminado

Todo el checklist de la sección 1 "Falta del todo" + "Empezado no cableado" en `[x]`. `vitest` de los ficheros tocados en verde. Branch pushed. PR actualizado. Resumen final: tabla hecho vs no hecho, honesta.
