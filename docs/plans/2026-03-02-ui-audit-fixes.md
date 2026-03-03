# UI Audit Fixes — AKADEMATE Admin Dashboard (Plan Completo)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corregir todos los problemas de consistencia visual detectados en la auditoría UI: jerarquía tipográfica, badges en inglés con colores negros, textos flotantes, botones agresivos y estados vacíos.

**Architecture:** Primero crear los 3 componentes/utilidades fundacionales (estados.ts, EmptyState, ResultsSummaryBar) que son usados por el resto. Luego aplicar cambios globales (PageHeader, botones Actualizar). Finalmente página a página en orden de prioridad. Un commit por tarea.

**Tech Stack:** React + TypeScript + Tailwind CSS + shadcn/ui (cva, class-variance-authority) + Lucide Icons. Next.js 15 App Router. Path alias `@payload-config` → `apps/tenant-admin/@payload-config/`.

---

## TAREA 1 — COMP-05: Crear `lib/estados.ts` + variantes semánticas en `badge.tsx`

> Fundacional. Bloquea todas las tareas de traducción de badges.

**Archivos:**
- Crear: `apps/tenant-admin/@payload-config/lib/estados.ts`
- Modificar: `apps/tenant-admin/@payload-config/components/ui/badge.tsx`

### Paso 1: Crear `estados.ts`

```typescript
// apps/tenant-admin/@payload-config/lib/estados.ts

export type BadgeSemanticVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral'

export interface EstadoConfig {
  label: string
  variant: BadgeSemanticVariant
}

const ESTADOS: Record<string, EstadoConfig> = {
  // Publicación / contenido
  published:         { label: 'Publicado',    variant: 'success'  },
  draft:             { label: 'Borrador',     variant: 'neutral'  },
  // Matrícula / inscripción
  active:            { label: 'Activo',       variant: 'success'  },
  inactive:          { label: 'Inactivo',     variant: 'neutral'  },
  completed:         { label: 'Completado',   variant: 'info'     },
  pending:           { label: 'Pendiente',    variant: 'warning'  },
  confirmed:         { label: 'Confirmado',   variant: 'info'     },
  cancelled:         { label: 'Cancelado',    variant: 'destructive' },
  enrollment_open:   { label: 'Abierta',      variant: 'success'  },
  enrollment_closed: { label: 'Cerrada',      variant: 'neutral'  },
  in_progress:       { label: 'En curso',     variant: 'info'     },
  // Campañas
  activa:            { label: 'Activa',       variant: 'success'  },
  pausada:           { label: 'Pausada',      variant: 'warning'  },
  finalizada:        { label: 'Finalizada',   variant: 'info'     },
  archivada:         { label: 'Archivada',    variant: 'neutral'  },
  // Matrículas
  aceptada:          { label: 'Aceptada',     variant: 'success'  },
  rechazada:         { label: 'Rechazada',    variant: 'destructive' },
  // Convocatorias
  abierta:           { label: 'Abierta',      variant: 'success'  },
  planificada:       { label: 'Planificada',  variant: 'info'     },
  lista_espera:      { label: 'Lista de espera', variant: 'warning' },
  cerrada:           { label: 'Cerrada',      variant: 'neutral'  },
}

export function traducirEstado(estado: string): EstadoConfig {
  return ESTADOS[estado] ?? { label: estado, variant: 'outline' }
}
```

### Paso 2: Añadir variantes semánticas a `badge.tsx`

```typescript
// apps/tenant-admin/@payload-config/components/ui/badge.tsx
// Reemplazar el archivo completo con:

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@payload-config/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Semánticas nuevas
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        warning:
          "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        neutral:
          "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

### Paso 3: Commit

```bash
git add apps/tenant-admin/@payload-config/lib/estados.ts \
        apps/tenant-admin/@payload-config/components/ui/badge.tsx
git commit -m "feat(ui): sistema de badges semántico + función traducirEstado()"
```

---

## TAREA 2 — COMP-03 + COMP-04: Crear `EmptyState` y `ResultsSummaryBar`

**Archivos:**
- Crear: `apps/tenant-admin/@payload-config/components/ui/EmptyState.tsx`
- Crear: `apps/tenant-admin/@payload-config/components/ui/ResultsSummaryBar.tsx`

### Paso 1: Crear `EmptyState.tsx`

```tsx
// apps/tenant-admin/@payload-config/components/ui/EmptyState.tsx
'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Button } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

### Paso 2: Crear `ResultsSummaryBar.tsx`

```tsx
// apps/tenant-admin/@payload-config/components/ui/ResultsSummaryBar.tsx
'use client'

import * as React from 'react'

interface ResultsSummaryBarProps {
  count: number
  entity: string
  extra?: string
  className?: string
}

export function ResultsSummaryBar({ count, entity, extra, className = '' }: ResultsSummaryBarProps) {
  return (
    <div className={`flex items-center gap-2 bg-muted rounded-md px-4 py-2 text-sm text-muted-foreground ${className}`}>
      <span>
        <span className="font-medium text-foreground">{count}</span>{' '}
        {entity}
        {extra && (
          <>
            {' · '}
            {extra}
          </>
        )}
      </span>
    </div>
  )
}
```

### Paso 3: Commit

```bash
git add apps/tenant-admin/@payload-config/components/ui/EmptyState.tsx \
        apps/tenant-admin/@payload-config/components/ui/ResultsSummaryBar.tsx
git commit -m "feat(ui): añadir componentes EmptyState y ResultsSummaryBar"
```

---

## TAREA 3 — G-01: PageHeader H1 text-3xl

**Archivo:** `apps/tenant-admin/@payload-config/components/ui/PageHeader.tsx`

### Paso 1: Buscar la línea

En el archivo (línea 91), localizar:
```tsx
<h1 className="text-xl font-bold tracking-tight">{title}</h1>
```

### Paso 2: Reemplazar

```tsx
<h1 className="text-3xl font-bold tracking-tight">{title}</h1>
```

### Paso 3: Commit

```bash
git add apps/tenant-admin/@payload-config/components/ui/PageHeader.tsx
git commit -m "fix(ui): aumentar H1 de PageHeader a text-3xl (G-01)"
```

---

## TAREA 4 — G-02: Eliminar botones Actualizar/Refrescar

**Archivos a leer primero (para ubicar el botón exacto):**
- `apps/tenant-admin/app/(dashboard)/page.tsx` — buscar `RefreshCw` o `Actualizar`
- `apps/tenant-admin/app/(dashboard)/campus-virtual/page.tsx` — buscar `Refrescar`

### Paso 1: Dashboard — eliminar botón "Actualizar"

En `apps/tenant-admin/app/(dashboard)/page.tsx`, buscar el `actions` prop del PageHeader que contiene el `Button` con `RefreshCw`. Eliminarlo completamente junto con el import de `RefreshCw` de lucide-react.

Buscar:
```tsx
actions={(
  <Button
    variant="ghost"
    ...
    onClick={() => { void refresh(); void refreshCampusSummary() }}
  >
    <RefreshCw className="mr-2 h-4 w-4" />
    Actualizar
  </Button>
)}
```
Eliminar ese prop `actions` del PageHeader o reemplazar por `undefined`.

También buscar en el import:
```tsx
import { ..., RefreshCw, ... } from 'lucide-react'
```
Eliminar `RefreshCw` del import.

### Paso 2: Campus Virtual — evaluar botón "Refrescar"

Leer `apps/tenant-admin/app/(dashboard)/campus-virtual/page.tsx` y buscar `Refrescar`. Si no tiene acción funcional real (solo re-fetch de datos que ya carga automáticamente), eliminarlo.

### Paso 3: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/page.tsx \
        apps/tenant-admin/app/(dashboard)/campus-virtual/page.tsx
git commit -m "fix(ui): eliminar botones Actualizar/Refrescar redundantes (G-02)"
```

---

## TAREA 5 — Dashboard: D-03 + D-04 (badge LMS + strings inglés)

**Archivo:** `apps/tenant-admin/app/(dashboard)/page.tsx`

**Imports a añadir:**
```tsx
import { traducirEstado } from '@payload-config/lib/estados'
```

### Paso 1: Fix D-03 — Badge "LMS" negro

Buscar en el archivo:
```tsx
<Badge variant="outline">LMS</Badge>
// o simplemente
<Badge>LMS</Badge>
```
Reemplazar por:
```tsx
<Badge variant="outline" className="pointer-events-none cursor-default">
  Campus Virtual
</Badge>
```

### Paso 2: Fix D-04 — Convocatorias en inglés

Buscar el lugar donde se renderizan badges de `conv.status` y aplicar `traducirEstado`:
```tsx
// Antes:
<Badge>{conv.status}</Badge>

// Después:
<Badge variant={traducirEstado(conv.status).variant}>
  {traducirEstado(conv.status).label}
</Badge>
```

Hacer lo mismo para `campaign.status` en el bloque de "Campañas de Marketing".

### Paso 3: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/page.tsx
git commit -m "fix(dashboard): traducir badges al español y corregir badge LMS (D-03, D-04)"
```

---

## TAREA 6 — P-01 + P-02 + P-03: Programación

**Archivo:** `apps/tenant-admin/app/(dashboard)/programacion/page.tsx`

**Imports a añadir:**
```tsx
import { ResultsSummaryBar } from '@payload-config/components/ui/ResultsSummaryBar'
import { traducirEstado } from '@payload-config/lib/estados'
```
Cambiar import `Calendar` → añadir `Eye` en lucide-react.

### Paso 1: Fix P-01 — Texto flotante → ResultsSummaryBar

Buscar el `<div>` suelto con el texto de resultados (similar a):
```tsx
<div className="flex items-center justify-between">
  <p className="text-sm text-muted-foreground">
    {convocatoriasFiltradas.length} resultados · ocupación media {tasaOcupacion}%
  </p>
</div>
```

Reemplazar por:
```tsx
<ResultsSummaryBar
  count={convocatoriasFiltradas.length}
  entity="convocatorias"
  extra={`Ocupación media: ${tasaOcupacion}%`}
  className="mt-3"
/>
```

### Paso 2: Fix P-02 — Badges tipo inconsistentes

Buscar badges de tipo de convocatoria (`privado`, `desempleados`, etc.) y aplicar `traducirEstado` o el sistema de courseTypeConfig si los tipos ya están en COURSE_TYPE_CONFIG. Si no, mapear manualmente con:
```tsx
const TIPO_LABELS: Record<string, { label: string; variant: BadgeSemanticVariant }> = {
  privado:      { label: 'Privado',      variant: 'info' },
  desempleados: { label: 'Desempleados', variant: 'warning' },
  ocupados:     { label: 'Ocupados',     variant: 'success' },
}
```

### Paso 3: Fix P-03 — Icono Calendar → Eye

Buscar:
```tsx
<Calendar className="mr-2 h-4 w-4" />
Ver detalle
```
Reemplazar con:
```tsx
<Eye className="mr-2 h-4 w-4" />
Ver detalle
```
Añadir `Eye` al import de lucide-react y eliminar `Calendar` si no se usa en otro lugar.

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/programacion/page.tsx
git commit -m "fix(programacion): ResultsSummaryBar, badges tipo y icono Eye (P-01, P-02, P-03)"
```

---

## TAREA 7 — C-01 + C-02 + C-04: Cursos — title case + layout + colores badge

**Archivos:**
- `apps/tenant-admin/@payload-config/components/ui/CourseTemplateCard.tsx`
- `apps/tenant-admin/@payload-config/lib/courseTypeConfig.ts` (leer para entender configuración)

### Paso 1: Leer courseTypeConfig.ts

```bash
cat apps/tenant-admin/@payload-config/lib/courseTypeConfig.ts
```
Entender qué `bgColor` tienen los tipos para ajustarlos.

### Paso 2: Fix C-01 — Añadir función toTitleCase

En `CourseTemplateCard.tsx`, añadir antes del componente:
```tsx
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}
```

### Paso 3: Fix C-02 — Separar título y badge de área

En `CourseTemplateCard.tsx`, localizar (líneas ~46-53):
```tsx
<div className="flex items-start justify-between gap-2">
  <h3 className="line-clamp-2 text-base font-semibold leading-snug" title={template.nombre}>
    {template.nombre}
  </h3>
  <Badge variant="outline" className="shrink-0 text-[11px]">
    {template.area}
  </Badge>
</div>
```

Reemplazar por:
```tsx
<div className="flex flex-col gap-1">
  <h3 className="line-clamp-2 text-base font-semibold leading-snug" title={template.nombre}>
    {toTitleCase(template.nombre)}
  </h3>
  <Badge variant="outline" className="w-fit text-[11px]">
    {template.area}
  </Badge>
</div>
```

### Paso 4: Fix C-04 — Colores semánticos en courseTypeConfig

Leer `courseTypeConfig.ts` y ajustar los `bgColor` para que sean semánticamente consistentes:
- `privados` → azul info (no rojo, que es el CTA primario)
- `desempleados` → naranja warning
- `ocupados` → verde success

Actualizar en `courseTypeConfig.ts` los valores de `bgColor`/`hoverColor` o añadir un campo `badgeVariant: BadgeSemanticVariant` y usarlo en `CourseTemplateCard.tsx`.

### Paso 5: Commit

```bash
git add apps/tenant-admin/@payload-config/components/ui/CourseTemplateCard.tsx \
        apps/tenant-admin/@payload-config/lib/courseTypeConfig.ts
git commit -m "fix(cursos): title case, layout badge/título y colores semánticos (C-01, C-02, C-04)"
```

---

## TAREA 8 — AL-01 + AL-02 + AL-03 + AL-04: Alumnos

**Archivo:** `apps/tenant-admin/app/(dashboard)/alumnos/page.tsx`

### Paso 1: Leer el archivo completo

```bash
# Leer el archivo completo para entender la estructura del layout
```

### Paso 2: Fix AL-01 — Eliminar bg-black en filas

Buscar en el JSX de `<TableRow>` cualquier uso de:
```tsx
className="bg-black" // o bg-gray-900 o similar
```
Reemplazar por:
```tsx
className={selectedStudent?.id === row.id ? 'bg-primary/10' : ''}
```
O si es hover, asegurar que el color sea `hover:bg-muted/50` y no `bg-black`.

### Paso 3: Fix AL-02 — Panel previsualización condicional

Buscar el panel lateral de previsualización. Probablemente hay un layout tipo:
```tsx
<div className="grid grid-cols-[1fr_300px] gap-4">
  {/* tabla */}
  <div>{/* preview panel siempre visible */}</div>
</div>
```

Cambiar a:
```tsx
<div className={`grid gap-4 ${selectedStudent ? 'grid-cols-[1fr_300px]' : 'grid-cols-1'}`}>
  {/* tabla */}
  {selectedStudent ? (
    <div>{/* preview panel */}</div>
  ) : null}
</div>
```

### Paso 4: Fix AL-03 — Toggles contraste

Buscar el toggle de vista (Listado/Fichas). Si usa un `ToggleGroup`:
```tsx
// Añadir estilos explícitos al ToggleGroupItem activo:
<ToggleGroupItem value="lista" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
```

### Paso 5: Fix AL-04 — Iconos stat cards colores

Buscar el bloque de stat cards superiores (Total, Activos, Inactivos...). Para cada icono:
```tsx
// Solo "Activos" → text-green-600
// Resto → text-muted-foreground
```

### Paso 6: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/alumnos/page.tsx
git commit -m "fix(alumnos): bg-black filas, panel preview condicional, toggles y stat cards (AL-01..04)"
```

---

## TAREA 9 — CI-01 + CI-02 + CI-03: Ciclos

**Archivo:** `apps/tenant-admin/app/(dashboard)/ciclos/page.tsx`

### Paso 1: Fix CI-01 — Barra de estadísticas con variant="outline"

Buscar los badges de resumen horizontal (10 ciclos, 4 grado medio...). Añadir `variant="outline"` a todos y envolver en un div con `bg-muted rounded-md p-3 flex items-center gap-2 flex-wrap` si están sueltos.

### Paso 2: Fix CI-02 — Badges de nivel sobre imagen

En `CicloListItem.tsx` (o en la card de ciclo), buscar el badge que aparece sobre la imagen:
```tsx
<Badge className="absolute ... bg-black/50">Grado Medio</Badge>
```
Reemplazar por:
```tsx
<Badge className="absolute ... bg-black/70 backdrop-blur-sm border border-white/20 text-white">
  Grado Medio
</Badge>
```

### Paso 3: Fix CI-03 — Botones "Ver ciclo" → outline

Buscar los botones "Ver ciclo" en la card o en la lista:
```tsx
<Button>Ver ciclo</Button>
// o
<Button variant="default">Ver ciclo</Button>
```
Cambiar a:
```tsx
<Button variant="outline">Ver ciclo</Button>
```

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/ciclos/page.tsx \
        apps/tenant-admin/@payload-config/components/ui/CicloListItem.tsx
git commit -m "fix(ciclos): stats bar, contraste badges y botones outline (CI-01..03)"
```

---

## TAREA 10 — S-01 + S-02 + S-03: Sedes

**Archivo:** `apps/tenant-admin/app/(dashboard)/sedes/page.tsx`

### Paso 1: Fix S-01 — Subtítulo en PageHeader

Buscar:
```tsx
<p ...>Vista simplificada para operación diaria.</p>
```
Si el texto está fuera del PageHeader, moverlo eliminándolo de donde está y pasándolo como prop `description` al `PageHeader`. Actualmente `PageHeader` tiene `description: _description` (ignorado). Necesitarás actualizar el componente para renderizarlo.

En `PageHeader.tsx`, hacer que `description` se renderice:
```tsx
// En el componente, después del h1:
{description && (
  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
)}
// Y en la desestructuración, quitar el _ del parámetro:
description,  // en lugar de description: _description,
```

### Paso 2: Fix S-02 — Zeros "sin configurar"

Buscar los badges/spans que muestran contadores (aulas, capacidad, cursos). Cuando el valor es `0`:
```tsx
// Antes:
<Badge variant="outline">{sede.totalAulas}</Badge>

// Después:
<Badge variant={sede.totalAulas === 0 ? 'neutral' : 'outline'}>
  {sede.totalAulas === 0 ? 'Sin configurar' : sede.totalAulas}
</Badge>
```

### Paso 3: Fix S-03 — Botones "Ver sede" → outline

Buscar botones "Ver sede" con `variant="default"` o sin variant:
```tsx
<Button variant="outline">Ver sede</Button>
```

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/sedes/page.tsx \
        apps/tenant-admin/@payload-config/components/ui/PageHeader.tsx
git commit -m "fix(sedes): subtítulo PageHeader, zeros y botones outline (S-01..03)"
```

---

## TAREA 11 — PE-01 + PE-02 + PE-03 + PE-04: Personal

**Archivo:** `apps/tenant-admin/app/(dashboard)/personal/page.tsx`

### Paso 1: Fix PE-01 — Añadir búsqueda y filtro de sede

El archivo ya importa `Input`, `Select`, etc. (ver imports). Añadir estado de búsqueda y filtro:
```tsx
const [searchTerm, setSearchTerm] = useState('')
const [filterSede, setFilterSede] = useState('all')
```

Añadir el bloque de filtros en el JSX, justo después del PageHeader:
```tsx
<Card>
  <CardContent className="pt-4">
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <Select value={filterSede} onValueChange={setFilterSede}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Todas las sedes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las sedes</SelectItem>
          {/* Generar dinámicamente desde los datos */}
        </SelectContent>
      </Select>
    </div>
  </CardContent>
</Card>
```

Filtrar los datos antes del render:
```tsx
const staffFiltrado = staffMembers.filter(s => {
  const matchNombre = s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  const matchSede = filterSede === 'all' || s.assignedCampuses.some(c => String(c.id) === filterSede)
  return matchNombre && matchSede
})
```

### Paso 2: Fix PE-02 — Avatares con ring

En el lugar donde se renderizan los avatares de los profesores (probablemente en `StaffCard.tsx`):
```tsx
<Avatar className="ring-2 ring-offset-2 ring-muted">
```

### Paso 3: Fix PE-03 — Badge "Sin sedes" → span

Buscar:
```tsx
<Badge variant="outline">Sin sedes asignadas</Badge>
```
Reemplazar por:
```tsx
<span className="text-sm text-muted-foreground">Sin sedes asignadas</span>
```

### Paso 4: Fix PE-04 — Botón "Ver Ficha" ghost → outline

Buscar:
```tsx
<Button variant="ghost" ...>
  <Eye ... />
  Ver Ficha Completa
</Button>
```
Cambiar a:
```tsx
<Button variant="outline" size="sm">
  <Eye className="mr-2 h-4 w-4" />
  Ver Ficha Completa
</Button>
```

### Paso 5: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/personal/page.tsx \
        apps/tenant-admin/@payload-config/components/ui/StaffCard.tsx
git commit -m "fix(personal): búsqueda, avatares, badge sedes y botón ficha (PE-01..04)"
```

---

## TAREA 12 — LE-01 + LE-02 + LE-03: Leads

**Archivo:** `apps/tenant-admin/app/(dashboard)/leads/page.tsx`

### Paso 1: Fix LE-01 — Ocultar columna Origen vacía

```tsx
// Antes del return:
const hasAnyOrigin = leads.some(l => formatOrigin(l) !== '—')

// En TableHead:
{hasAnyOrigin && <TableHead>Origen</TableHead>}

// En TableCell:
{hasAnyOrigin && <TableCell>{formatOrigin(lead)}</TableCell>}
```

### Paso 2: Fix LE-02 — Pie de tabla con contador

Después del `</TableBody>`, añadir dentro del `<Table>`:
```tsx
<tfoot>
  <tr>
    <td colSpan={100} className="py-3 px-4 text-sm text-muted-foreground border-t">
      Mostrando {leadsFiltrados.length} de {leads.length} leads
    </td>
  </tr>
</tfoot>
```

### Paso 3: Fix LE-03 — Columna de acciones

En el `<TableHead>` final, añadir una columna de acciones vacía.
En cada `<TableRow>`, añadir al final:
```tsx
<TableCell>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Acciones</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Ver detalle</DropdownMenuItem>
      <DropdownMenuItem>Convertir a matrícula</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</TableCell>
```

Añadir imports de `DropdownMenu*` y `MoreHorizontal`.

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/leads/page.tsx
git commit -m "fix(leads): ocultar Origen vacío, contador y acciones por fila (LE-01..03)"
```

---

## TAREA 13 — MA-01 + MA-02 + MA-03: Matrículas

**Archivo:** `apps/tenant-admin/app/(dashboard)/matriculas/page.tsx`

### Paso 1: Fix MA-01 — Colores stat cards

Buscar el bloque de 4 stat cards y ajustar los className de números:
```tsx
// Total Solicitudes → text-foreground (neutro)
// Pendientes → text-orange-600
// Aceptadas → text-green-600
// Rechazadas → text-destructive
```

### Paso 2: Fix MA-02 — Acciones por fila

Añadir columna de acciones contextual según el estado de la solicitud:
```tsx
<TableCell>
  <div className="flex items-center gap-1">
    {solicitud.status === 'pending' && (
      <>
        <Button variant="outline" size="sm" className="text-green-700 border-green-300">
          Aceptar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
          Rechazar
        </Button>
      </>
    )}
    <Button variant="ghost" size="icon">
      <Eye className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

### Paso 3: Fix MA-03 — Scroll horizontal en tabla

Envolver la tabla en:
```tsx
<div className="overflow-x-auto">
  <Table>...</Table>
</div>
```

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/matriculas/page.tsx
git commit -m "fix(matriculas): stat cards colores, acciones fila y scroll (MA-01..03)"
```

---

## TAREA 14 — PL-01 + PL-02 + PL-03 + PL-04 + PL-05: Planner Visual

**Archivo:** `apps/tenant-admin/app/(dashboard)/planner/page.tsx`

**Imports a añadir:**
```tsx
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Users } from 'lucide-react' // ya importado probablemente
import { Tabs, TabsList, TabsTrigger } from '@payload-config/components/ui/tabs'
```

### Paso 1: Fix PL-01 — Padding estándar

El componente `PlannerVisualPageContent` (o su wrapper) debería tener:
```tsx
// Buscar el div wrapper principal y añadir:
<div className="px-6 pt-6 pb-10">
```
Si ya usa `px-` pero diferente, ajustar al estándar `px-6 pt-6`.

### Paso 2: Fix PL-02 — Separar título de nombre de sede

Buscar donde se construye el título tipo `"Planner Visual - Sede Norte"`. Probablemente en el PageHeader `title` prop:
```tsx
// Antes:
title={`Planner Visual - ${sedeSeleccionada}`}

// Después:
title="Planner Visual"
description={sedeSeleccionada}
```
(Requiere que PageHeader ya renderice `description` — lo hicimos en TAREA 10)

### Paso 3: Fix PL-03 — Tabs pill negro → shadcn Tabs

Buscar el botón de vista tipo pill con fondo negro para las 3 vistas (aulas/profesores/cursos). Reemplazar con:
```tsx
<Tabs value={vistaActual} onValueChange={(v) => setVistaActual(v as VistaTipo)}>
  <TabsList>
    <TabsTrigger value="aulas">
      <LayoutGrid className="mr-2 h-4 w-4" />
      Aulas
    </TabsTrigger>
    <TabsTrigger value="profesores">
      <User className="mr-2 h-4 w-4" />
      Profesores
    </TabsTrigger>
    <TabsTrigger value="cursos">
      <BookOpen className="mr-2 h-4 w-4" />
      Cursos
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### Paso 4: Fix PL-04 — EmptyState en vista Profesores

Buscar el texto suelto "Esta vista está en fase inicial..." y reemplazar con:
```tsx
{vistaActual === 'profesores' && (
  <EmptyState
    icon={Users}
    title="Vista en desarrollo"
    description="La vista de profesores está en fase inicial. Usa Exportar para validar los datos actuales."
    action={{
      label: 'Exportar datos',
      onClick: () => { /* lógica export */ }
    }}
  />
)}
```

### Paso 5: Fix PL-05 — Botones Exportar/Imprimir → outline sm

Buscar los botones de export/print (probablemente `<Download>` y `<Printer>`):
```tsx
<Button variant="outline" size="sm">
  <Download className="mr-2 h-4 w-4" />
  Exportar
</Button>
<Button variant="outline" size="sm">
  <Printer className="mr-2 h-4 w-4" />
  Imprimir
</Button>
```

### Paso 6: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/planner/page.tsx
git commit -m "fix(planner): padding, título, tabs, empty-state y botones (PL-01..05)"
```

---

## TAREA 15 — CV-01 + CV-02 + CV-03: Campus Virtual vista general

**Archivo:** `apps/tenant-admin/app/(dashboard)/campus-virtual/page.tsx`

### Paso 1: Leer el archivo para entender estructura de stat cards

Buscar las stat cards y localizar la posición de los iconos.

### Paso 2: Fix CV-01 — Iconos a esquina superior derecha

Patrón del Dashboard para stat cards:
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium">...</CardTitle>
    <Icon className="h-5 w-5 text-primary/70" />  {/* esquina superior derecha */}
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">...</div>
  </CardContent>
</Card>
```
Si en Campus Virtual el icono está en otra posición, reestructurar para seguir este patrón.

### Paso 3: Fix CV-02 — Botón Refrescar

Buscar y eliminar el botón "Refrescar" si no tiene lógica de recarga manual necesaria.

### Paso 4: Fix CV-03 — Fallback "Curso sin título"

Buscar donde se renderiza el nombre del curso en la tabla de inscripciones recientes:
```tsx
// Antes:
{inscripcion.nombreCurso ?? 'Curso sin título'}

// Después:
{inscripcion.nombreCurso ? (
  inscripcion.nombreCurso
) : (
  <span className="text-muted-foreground italic" title="Pendiente de sincronización LMS">
    Sin título
  </span>
)}
```

### Paso 5: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/campus-virtual/page.tsx
git commit -m "fix(campus-virtual): iconos stat cards, eliminar Refrescar y fallback título (CV-01..03)"
```

---

## TAREA 16 — CI-LMS-01 + CI-LMS-02 + CI-LMS-03: Inscripciones LMS

**Archivo:** `apps/tenant-admin/app/(dashboard)/campus-virtual/inscripciones/page.tsx`

**Imports a añadir:**
```tsx
import { traducirEstado } from '@payload-config/lib/estados'
```

### Paso 1: Fix CI-LMS-01 — Badges negro → semánticos

Buscar todos los `<Badge>` con `variant="default"` que muestran estados en inglés. Reemplazar:
```tsx
// Antes:
<Badge variant="default">{row.status}</Badge>

// Después:
<Badge variant={traducirEstado(row.status).variant}>
  {traducirEstado(row.status).label}
</Badge>
```
Eliminar cualquier `className="bg-black"` o `bg-gray-900` de badges.

### Paso 2: Fix CI-LMS-02 — Fallback "Sin curso" / "Sin run"

Buscar renderizado de nombre de curso y run:
```tsx
// Antes:
{row.nombreCurso ?? 'Sin curso'}

// Después:
{row.nombreCurso ?? (
  <span className="text-muted-foreground italic" title="Sin vincular al LMS">
    Sin vincular
  </span>
)}
```

### Paso 3: Fix CI-LMS-03 — DatePicker shadcn

Buscar el `<input type="date">` nativo. Verificar si el proyecto ya tiene el componente DatePicker instalado:
```bash
ls apps/tenant-admin/@payload-config/components/ui/ | grep -i date
```
Si no existe, instalar:
```bash
cd apps/tenant-admin && npx shadcn@latest add date-picker
```
Reemplazar el `<input type="date">` con el componente `<DatePicker>`.

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/campus-virtual/inscripciones/page.tsx
git commit -m "fix(inscripciones-lms): traducir badges, fallbacks y DatePicker (CI-LMS-01..03)"
```

---

## TAREA 17 — CP-01 + CP-02 + ML-01 + ML-02 + ML-03

**Archivos:**
- `apps/tenant-admin/app/(dashboard)/campus-virtual/progreso/page.tsx`
- `apps/tenant-admin/app/(dashboard)/campus-virtual/contenido/page.tsx`

**Imports para progreso:**
```tsx
import { traducirEstado } from '@payload-config/lib/estados'
```

### Paso 1: Fix CP-01 — Badge "completed" → success

En `progreso/page.tsx`, buscar:
```tsx
<Badge variant={row.status === 'completed' ? 'secondary' : 'default'}>
  {row.status}
</Badge>
```
Reemplazar:
```tsx
<Badge variant={traducirEstado(row.status).variant}>
  {traducirEstado(row.status).label}
</Badge>
```

### Paso 2: Fix ML-01 — Badges published/draft → semánticos

En `contenido/page.tsx`, hacer lo mismo:
```tsx
<Badge variant={traducirEstado(row.status).variant}>
  {traducirEstado(row.status).label}
</Badge>
```

### Paso 3: Fix ML-02 — Añadir acciones por fila en contenido

En `contenido/page.tsx`, añadir columna de acciones:
```tsx
<TableHead className="text-right">Acciones</TableHead>
// ...
<TableCell className="text-right">
  <Button variant="ghost" size="icon">
    <Edit className="h-4 w-4" />
  </Button>
</TableCell>
```

### Paso 4: Fix ML-03 — Buscador y filtro en contenido

Añadir bloque de filtros antes de la tabla (igual que PE-01, pero para cursos y estado):
```tsx
const [searchTerm, setSearchTerm] = useState('')
const [filterEstado, setFilterEstado] = useState('all')
```

### Paso 5: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/campus-virtual/progreso/page.tsx \
        apps/tenant-admin/app/(dashboard)/campus-virtual/contenido/page.tsx
git commit -m "fix(campus-virtual): traducir badges progreso/contenido, acciones y filtros (CP-01, ML-01..03)"
```

---

## TAREA 18 — MK-01 + MK-02: Campañas

**Archivo:** `apps/tenant-admin/app/(dashboard)/campanas/page.tsx`

**Imports:**
```tsx
import { Megaphone, TrendingUp, Users, DollarSign } from 'lucide-react'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { traducirEstado } from '@payload-config/lib/estados'
```

### Paso 1: Fix MK-01 — Reemplazar iconos non-Lucide

Buscar los iconos en las stat cards de KPI. Si usan SVG inline o iconos no-Lucide, reemplazar con los 4 de Lucide mencionados. Verificar que los imports están actualizados.

### Paso 2: Fix MK-02 — EmptyState cuando no hay campañas

Buscar el texto suelto "Vista basada en campañas registradas en el sistema" y, si está en un bloque condicional `campaigns.length === 0`:
```tsx
{campaigns.length === 0 ? (
  <EmptyState
    icon={Megaphone}
    title="Sin campañas activas"
    description="Crea tu primera campaña para empezar a captar leads."
    action={{ label: 'Nueva Campaña', onClick: () => router.push('/campanas/nueva') }}
  />
) : (
  /* tabla de campañas */
)}
```

### Paso 3: Traducir badges de estado

```tsx
<Badge variant={traducirEstado(campaign.status).variant}>
  {traducirEstado(campaign.status).label}
</Badge>
```

### Paso 4: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/campanas/page.tsx
git commit -m "fix(campanas): iconos Lucide, EmptyState y traducir badges (MK-01, MK-02)"
```

---

## TAREA 19 — CD-01 + CD-02 + CD-03 + CD-04: Detalle de Curso

**Archivo:** `apps/tenant-admin/app/(dashboard)/cursos/[id]/page.tsx`

### Paso 1: Fix CD-01 — toTitleCase en título

Importar o reimplementar `toTitleCase` (o importar desde un utils compartido). Aplicar al `template.nombre`:
```tsx
<h1 ...>{toTitleCase(template?.nombre ?? '')}</h1>
```

### Paso 2: Fix CD-02 — Separar Tipo y Área temática

Buscar el bloque donde se muestra `Área` con el badge de tipo mezclado. Separar en dos elementos distintos en el layout de información:
```tsx
<div>
  <span className="text-sm text-muted-foreground">Tipo</span>
  <Badge variant={typeConfig.badgeVariant}>{typeConfig.label}</Badge>
</div>
<div>
  <span className="text-sm text-muted-foreground">Área temática</span>
  <span>{template.area}</span>
</div>
```

### Paso 3: Fix CD-03 — Tab activo con border-b-2

Buscar el `TabsList`/`TabsTrigger` del detalle del curso. Añadir className al `TabsTrigger` activo:
```tsx
<TabsTrigger
  value="informacion"
  className="data-[state=active]:border-b-2 data-[state=active]:border-primary"
>
  Información
</TabsTrigger>
```

### Paso 4: Fix CD-04 — Badge número convocatorias bg-black → secondary

Buscar el badge con número de convocatorias en el panel lateral:
```tsx
// Antes:
<Badge className="bg-black text-white">3</Badge>

// Después:
<Badge variant="secondary">3</Badge>
```

### Paso 5: Commit

```bash
git add apps/tenant-admin/app/(dashboard)/cursos/[id]/page.tsx
git commit -m "fix(detalle-curso): title case, separar tipo/área, tabs y badge número (CD-01..04)"
```

---

## TAREA 20 — Deploy final a NEMESIS

**Pre-requisito:** Verificar que todos los commits anteriores están en main.

### Paso 1: Verificar estado

```bash
git log --oneline -20
git status
```

### Paso 2: Empaquetar archivos modificados

```bash
cd /path/to/akademate.com

tar czf /tmp/ui-audit-fixes-$(date +%Y%m%d).tar.gz \
  apps/tenant-admin/@payload-config/lib/estados.ts \
  apps/tenant-admin/@payload-config/components/ui/badge.tsx \
  apps/tenant-admin/@payload-config/components/ui/EmptyState.tsx \
  apps/tenant-admin/@payload-config/components/ui/ResultsSummaryBar.tsx \
  apps/tenant-admin/@payload-config/components/ui/PageHeader.tsx \
  apps/tenant-admin/@payload-config/components/ui/CourseTemplateCard.tsx \
  apps/tenant-admin/@payload-config/lib/courseTypeConfig.ts \
  apps/tenant-admin/app/(dashboard)/page.tsx \
  apps/tenant-admin/app/(dashboard)/programacion/page.tsx \
  apps/tenant-admin/app/(dashboard)/cursos/page.tsx \
  apps/tenant-admin/app/(dashboard)/cursos/[id]/page.tsx \
  apps/tenant-admin/app/(dashboard)/ciclos/page.tsx \
  apps/tenant-admin/app/(dashboard)/sedes/page.tsx \
  apps/tenant-admin/app/(dashboard)/alumnos/page.tsx \
  apps/tenant-admin/app/(dashboard)/personal/page.tsx \
  apps/tenant-admin/app/(dashboard)/campanas/page.tsx \
  apps/tenant-admin/app/(dashboard)/leads/page.tsx \
  apps/tenant-admin/app/(dashboard)/matriculas/page.tsx \
  apps/tenant-admin/app/(dashboard)/planner/page.tsx \
  apps/tenant-admin/app/(dashboard)/campus-virtual/page.tsx \
  apps/tenant-admin/app/(dashboard)/campus-virtual/inscripciones/page.tsx \
  apps/tenant-admin/app/(dashboard)/campus-virtual/progreso/page.tsx \
  apps/tenant-admin/app/(dashboard)/campus-virtual/contenido/page.tsx
```

### Paso 3: Enviar a NEMESIS y rebuild

```bash
scp -i ~/.ssh/nemesis_cmdr_key /tmp/ui-audit-fixes-*.tar.gz cmdr@100.99.60.106:/tmp/

ssh -i ~/.ssh/nemesis_cmdr_key cmdr@100.99.60.106 "
  cd /home/cmdr/akademate && \
  tar xzf /tmp/ui-audit-fixes-*.tar.gz && \
  cd infrastructure/docker && \
  docker compose build tenant && \
  docker compose up -d tenant
"
```

### Paso 4: Verificar

```bash
curl -s http://100.99.60.106:3009/api/health | jq .
```

---

## ORDEN DE EJECUCIÓN RECOMENDADO

```
TAREA 1  → COMP-05 (estados.ts + badge.tsx)      — FUNDACIONAL
TAREA 2  → COMP-03+04 (EmptyState + SummaryBar)  — FUNDACIONAL
TAREA 3  → G-01 PageHeader text-3xl              — GLOBAL
TAREA 4  → G-02 Botones Actualizar               — GLOBAL
TAREA 5  → Dashboard badges                       — ALTA
TAREA 6  → Programación                           — ALTA
TAREA 7  → Cursos catálogo                        — ALTA
TAREA 8  → Alumnos                                — ALTA
TAREA 9  → Ciclos                                 — MEDIA
TAREA 10 → Sedes                                  — MEDIA
TAREA 11 → Personal                               — MEDIA
TAREA 12 → Leads                                  — MEDIA
TAREA 13 → Matrículas                             — MEDIA
TAREA 14 → Planner                                — MEDIA
TAREA 15 → Campus Virtual general                 — MEDIA
TAREA 16 → Inscripciones LMS                      — ALTA (badges)
TAREA 17 → Progreso + Módulos/Lecciones           — BAJA/MEDIA
TAREA 18 → Campañas                               — MEDIA
TAREA 19 → Detalle Curso                          — BAJA
TAREA 20 → Deploy NEMESIS                         — FINAL
```
