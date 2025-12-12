# Migración Dashboard: DashboardLayout + AppSidebar + Páginas de Cursos

**Fecha de Generación:** 2025-11-13
**Fase Actual:** Migración de Dashboard Mockup a Payload CMS
**Dependencias Previas:** ✅ Tailwind v4 configurado, ✅ shadcn/ui instalado

---

## Contexto

Ya tenemos configurado:
- ✅ Tailwind CSS v4 con `@theme` directive
- ✅ shadcn/ui con componentes base (Button, Card, Badge, Input, DropdownMenu)
- ✅ Payload CMS 3.62.1 + Next.js 15.2.3
- ✅ App Router configurado con rutas `(dashboard)` y `(payload)`
- ✅ Página de prueba en `app/(dashboard)/page.tsx` verificando estilos

**Objetivo:** Migrar el diseño completo del dashboard mockup de Vite/React a Next.js/Payload CMS.

---

## Fuente de Referencia

**Mockup Location:** `/Users/carlosjperez/Documents/GitHub/www.cepcomunicacion.com/design-dashboard-mockup/cep-admin-mockup/`

**Archivos Clave del Mockup:**
- `src/layouts/DashboardLayout.tsx` - Layout principal con sidebar
- `src/components/navigation/AppSidebar.tsx` - Sidebar con menú de navegación
- `src/components/navigation/AppHeader.tsx` - Header con breadcrumbs y acciones
- `src/pages/CiclosPage.tsx` - Página de ciclos formativos
- `src/pages/CursosPage.tsx` - Página de cursos (si existe)
- `src/data/mockCiclos.ts` - Datos de ejemplo de ciclos
- `src/types/index.ts` - TypeScript types compartidos

**Componentes UI del Mockup:**
- `src/components/ui/CicloCard.tsx` - Tarjeta de ciclo formativo
- `src/components/ui/CursoCicloCard.tsx` - Tarjeta de curso dentro de ciclo
- shadcn/ui components customizados

---

## Tareas a Realizar

### Tarea 1: Analizar Estructura del Mockup

**Objetivo:** Entender la arquitectura actual del mockup para replicarla en Next.js.

**Archivos a Inspeccionar:**
```bash
# Layout y estructura principal
design-dashboard-mockup/cep-admin-mockup/src/layouts/DashboardLayout.tsx
design-dashboard-mockup/cep-admin-mockup/src/components/navigation/AppSidebar.tsx
design-dashboard-mockup/cep-admin-mockup/src/components/navigation/AppHeader.tsx

# Páginas existentes
design-dashboard-mockup/cep-admin-mockup/src/pages/*.tsx

# Componentes UI personalizados
design-dashboard-mockup/cep-admin-mockup/src/components/ui/*.tsx

# Types y datos mock
design-dashboard-mockup/cep-admin-mockup/src/types/index.ts
design-dashboard-mockup/cep-admin-mockup/src/data/*.ts
```

**Deliverable:**
- Documento markdown con:
  - Estructura de menú del AppSidebar (items, iconos, rutas)
  - Props de DashboardLayout
  - Componentes reutilizables identificados
  - Types TypeScript necesarios
  - Dependencias de iconos (Lucide React, etc.)

---

### Tarea 2: Instalar Dependencias Faltantes

**Verificar e Instalar:**
```bash
# Iconos (probablemente Lucide React)
pnpm add lucide-react

# Componentes shadcn/ui adicionales si son necesarios
# Ejemplo:
npx shadcn@latest add sidebar
npx shadcn@latest add breadcrumb
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add scroll-area
npx shadcn@latest add sheet
npx shadcn@latest add tooltip
```

**Verificación:**
- Ejecutar `pnpm install` sin errores
- Confirmar que componentes shadcn se instalan en `@payload-config/components/ui/`

---

### Tarea 3: Crear Tipos TypeScript Compartidos

**Ubicación:** `apps/cms/types/index.ts`

**Tipos Necesarios (basados en mockup):**
```typescript
// Ejemplo - Adaptar según mockup real:

export interface Ciclo {
  id: string
  nombre: string
  codigo: string
  tipo: 'medio' | 'superior'
  familia_profesional: string
  duracion_horas: number
  cursos?: Curso[]
  descripcion?: string
  imagen?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Curso {
  id: string
  nombre: string
  codigo: string
  ciclo_id: string
  modalidad: 'presencial' | 'online' | 'hibrido'
  sede_id?: string
  plazas_disponibles: number
  precio?: number
  fecha_inicio?: string
  fecha_fin?: string
  activo: boolean
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  href?: string
  children?: MenuItem[]
  permission?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'gestor' | 'marketing' | 'asesor' | 'lectura'
  avatar?: string
}
```

**Deliverable:**
- `apps/cms/types/index.ts` con todos los tipos del mockup migrados

---

### Tarea 4: Implementar DashboardLayout

**Ubicación:** `apps/cms/app/(dashboard)/layout.tsx`

**Requisitos:**
- Usar App Router layout pattern de Next.js
- Integrar AppSidebar (colapsable, responsive)
- Integrar AppHeader (breadcrumbs, acciones de usuario)
- Manejar estado de sidebar (abierto/cerrado)
- Responsive: Mobile (Sheet/Drawer), Desktop (Sidebar fijo)
- Aplicar estilos coherentes con Tailwind v4

**Componentes a Crear:**
```
apps/cms/components/
├── layout/
│   ├── DashboardLayout.tsx (o en app/(dashboard)/layout.tsx)
│   ├── AppSidebar.tsx
│   ├── AppHeader.tsx
│   └── MobileNav.tsx (opcional, si mockup lo tiene)
```

**Ejemplo de Estructura de Menú (adaptar según mockup):**
```typescript
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
  },
  {
    id: 'ciclos',
    label: 'Ciclos Formativos',
    icon: 'GraduationCap',
    children: [
      { id: 'ciclos-all', label: 'Todos los Ciclos', href: '/ciclos' },
      { id: 'ciclos-medio', label: 'Ciclo Medio', href: '/ciclos/medio' },
      { id: 'ciclos-superior', label: 'Ciclo Superior', href: '/ciclos/superior' },
    ],
  },
  {
    id: 'cursos',
    label: 'Cursos',
    icon: 'BookOpen',
    href: '/cursos',
  },
  {
    id: 'sedes',
    label: 'Sedes',
    icon: 'MapPin',
    href: '/sedes',
  },
  // ... más items
]
```

**Testing:**
- Verificar layout responsive (mobile < 768px, desktop >= 768px)
- Verificar sidebar colapsable
- Verificar navegación entre rutas

---

### Tarea 5: Implementar AppSidebar con Menús

**Ubicación:** `apps/cms/components/layout/AppSidebar.tsx`

**Features Requeridos:**
- Menú colapsable con animaciones smooth
- Iconos de Lucide React
- Active state highlighting (ruta actual resaltada)
- Menú jerárquico con submenús
- Avatar y datos de usuario en footer del sidebar
- Botón de logout
- Modo collapsed/expanded
- Versión mobile (Sheet) y desktop (fixed sidebar)

**shadcn/ui Components Necesarios:**
```bash
npx shadcn@latest add sidebar
npx shadcn@latest add scroll-area
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add tooltip
```

**Integración con Next.js:**
- Usar `usePathname()` de `next/navigation` para active state
- Usar `<Link>` de `next/link` para navegación
- State management con `useState` o Zustand (si es necesario)

**Deliverable:**
- `apps/cms/components/layout/AppSidebar.tsx` funcional
- Estilos coherentes con diseño mockup
- Responsive funcionando

---

### Tarea 6: Implementar AppHeader

**Ubicación:** `apps/cms/components/layout/AppHeader.tsx`

**Features Requeridos:**
- Breadcrumbs dinámicos basados en ruta actual
- Botón de toggle sidebar (mobile)
- Avatar de usuario con dropdown menu
- Acciones contextuales (búsqueda, notificaciones, etc. si el mockup lo tiene)
- Responsive

**shadcn/ui Components Necesarios:**
```bash
npx shadcn@latest add breadcrumb
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
```

**Breadcrumb Logic:**
```typescript
// Ejemplo:
const pathname = usePathname()
const segments = pathname.split('/').filter(Boolean)

// Convertir "/ciclos/medio" → ["Dashboard", "Ciclos", "Medio"]
const breadcrumbItems = segments.map((segment, index) => ({
  label: capitalize(segment),
  href: '/' + segments.slice(0, index + 1).join('/'),
}))
```

**Deliverable:**
- `apps/cms/components/layout/AppHeader.tsx` funcional

---

### Tarea 7: Migrar Página de Ciclos (CiclosPage)

**Ubicación:** `apps/cms/app/(dashboard)/ciclos/page.tsx`

**Fuente:** `design-dashboard-mockup/cep-admin-mockup/src/pages/CiclosPage.tsx`

**Componentes a Migrar:**
- CicloCard component → `apps/cms/components/ui/CicloCard.tsx`
- CursoCicloCard (si existe) → `apps/cms/components/ui/CursoCicloCard.tsx`
- Filtros de búsqueda (si existen)
- Grid/List view de ciclos

**Datos Mock:**
- Copiar `mockCiclos.ts` a `apps/cms/data/mockCiclos.ts`
- Adaptar tipos TypeScript si es necesario

**Features:**
- Grid responsivo de tarjetas de ciclos
- Búsqueda/filtrado (si mockup lo tiene)
- Click en ciclo navega a detalle: `/ciclos/[id]`
- Botón "Nuevo Ciclo" (puede ser placeholder por ahora)

**Deliverable:**
- `apps/cms/app/(dashboard)/ciclos/page.tsx`
- `apps/cms/components/ui/CicloCard.tsx`
- `apps/cms/data/mockCiclos.ts`

---

### Tarea 8: Migrar Página de Detalle de Ciclo (Opcional)

**Ubicación:** `apps/cms/app/(dashboard)/ciclos/[id]/page.tsx`

**Fuente:** `design-dashboard-mockup/cep-admin-mockup/src/pages/CicloDetailPage.tsx` (si existe)

**Features:**
- Mostrar información completa del ciclo
- Lista de cursos asociados al ciclo
- Acciones: Editar, Eliminar, Activar/Desactivar
- Breadcrumbs: Dashboard > Ciclos > [Nombre del Ciclo]

**Next.js Dynamic Route:**
```typescript
// apps/cms/app/(dashboard)/ciclos/[id]/page.tsx
export default function CicloDetailPage({ params }: { params: { id: string } }) {
  const ciclo = mockCiclos.find(c => c.id === params.id)
  // ...
}
```

**Deliverable:**
- `apps/cms/app/(dashboard)/ciclos/[id]/page.tsx`

---

### Tarea 9: Migrar Páginas Adicionales (Según Mockup)

**Posibles Páginas a Migrar:**
- `/cursos` - Listado de cursos
- `/sedes` - Listado de sedes/campuses
- `/estudiantes` o `/leads` - Gestión de estudiantes/leads
- `/campanas` - Campañas de marketing
- `/dashboard` - Dashboard principal con estadísticas

**Proceso para Cada Página:**
1. Identificar página en mockup: `design-dashboard-mockup/cep-admin-mockup/src/pages/[NombrePage].tsx`
2. Crear ruta en Next.js: `apps/cms/app/(dashboard)/[ruta]/page.tsx`
3. Migrar componentes UI necesarios a `apps/cms/components/ui/`
4. Adaptar lógica de React Router a Next.js App Router
5. Verificar estilos y responsive
6. Testing manual en navegador

**Prioridad:**
1. Dashboard principal
2. Ciclos (ya hecho en Tarea 7)
3. Cursos
4. Sedes
5. Resto según necesidad

---

## Checklist de Migración

### Preparación
- [ ] Analizar estructura completa del mockup
- [ ] Listar todos los componentes a migrar
- [ ] Identificar dependencias de iconos y librerías
- [ ] Documentar estructura de menú y rutas

### Implementación
- [ ] Instalar lucide-react y componentes shadcn faltantes
- [ ] Crear `types/index.ts` con tipos compartidos
- [ ] Implementar `DashboardLayout` en `app/(dashboard)/layout.tsx`
- [ ] Implementar `AppSidebar.tsx` con menú completo
- [ ] Implementar `AppHeader.tsx` con breadcrumbs
- [ ] Migrar página de Ciclos (`/ciclos`)
- [ ] Crear componente `CicloCard.tsx`
- [ ] Copiar datos mock `mockCiclos.ts`
- [ ] Migrar página de detalle de ciclo (`/ciclos/[id]`)
- [ ] Migrar página de Dashboard principal
- [ ] Migrar página de Cursos
- [ ] Migrar página de Sedes
- [ ] (Opcional) Migrar más páginas según mockup

### Verificación
- [ ] Navegación entre páginas funciona sin errores
- [ ] Sidebar colapsable funciona
- [ ] Breadcrumbs se actualizan correctamente
- [ ] Responsive mobile y desktop verificado
- [ ] Active state en menú funciona
- [ ] Estilos coherentes con Tailwind v4
- [ ] Zero errores de TypeScript (`pnpm typecheck`)
- [ ] Zero errores en consola del navegador
- [ ] Zero warnings de Next.js

### Testing Manual
- [ ] Desktop: Sidebar expandido/colapsado
- [ ] Mobile: Menu Sheet funciona
- [ ] Navegación: Todas las rutas accesibles
- [ ] Cards: Hover states y clicks funcionan
- [ ] Formularios: Inputs y dropdowns funcionan (si existen)
- [ ] Dark mode: Si mockup lo tiene, verificar

---

## Instrucciones de Ejecución para Claude Code

**PROMPT SUGERIDO:**

```
Migrar el dashboard completo del mockup Vite/React a Next.js/Payload CMS siguiendo esta especificación:

CONTEXTO:
- Mockup ubicado en: design-dashboard-mockup/cep-admin-mockup/
- Destino: apps/cms/app/(dashboard)/
- Tailwind v4 ya configurado ✅
- shadcn/ui base instalado ✅

TAREAS (ejecutar en orden):

1. ANÁLISIS DEL MOCKUP:
   - Leer DashboardLayout.tsx, AppSidebar.tsx, AppHeader.tsx del mockup
   - Listar todas las páginas en mockup/src/pages/
   - Identificar componentes UI en mockup/src/components/ui/
   - Extraer estructura de menú y tipos TypeScript

2. INSTALACIÓN DE DEPENDENCIAS:
   - Instalar lucide-react
   - Instalar componentes shadcn faltantes: sidebar, breadcrumb, avatar, separator, scroll-area, sheet, tooltip
   - Verificar package.json actualizado

3. CREAR TIPOS:
   - Crear apps/cms/types/index.ts con tipos del mockup
   - Exportar: Ciclo, Curso, MenuItem, User, etc.

4. IMPLEMENTAR DASHBOARDLAYOUT:
   - Crear apps/cms/app/(dashboard)/layout.tsx
   - Integrar AppSidebar (colapsable, responsive)
   - Integrar AppHeader (breadcrumbs)
   - Manejar estado de sidebar

5. IMPLEMENTAR APPSIDEBAR:
   - Crear apps/cms/components/layout/AppSidebar.tsx
   - Menú completo con iconos Lucide
   - Active state con usePathname()
   - Versión mobile (Sheet) y desktop
   - Avatar usuario en footer

6. IMPLEMENTAR APPHEADER:
   - Crear apps/cms/components/layout/AppHeader.tsx
   - Breadcrumbs dinámicos
   - Toggle sidebar (mobile)
   - Dropdown usuario

7. MIGRAR PÁGINA DE CICLOS:
   - Crear apps/cms/app/(dashboard)/ciclos/page.tsx
   - Migrar componente CicloCard a apps/cms/components/ui/
   - Copiar mockCiclos.ts a apps/cms/data/
   - Grid responsive de ciclos

8. MIGRAR DETALLE DE CICLO:
   - Crear apps/cms/app/(dashboard)/ciclos/[id]/page.tsx
   - Información completa del ciclo
   - Breadcrumbs funcionales

9. MIGRAR PÁGINAS ADICIONALES:
   - Dashboard principal (/) con estadísticas
   - Cursos (/cursos)
   - Sedes (/sedes)
   - Otras según mockup

10. VERIFICACIÓN FINAL:
    - pnpm typecheck (0 errores)
    - Navegación completa funcional
    - Responsive verificado
    - Estilos coherentes
    - Screenshot final de dashboard

REGLAS:
- NO modificar archivos de design-dashboard-mockup/ (solo leer)
- SÍ crear nuevos archivos en apps/cms/
- Usar Next.js App Router patterns (no React Router)
- Mantener coherencia con Tailwind v4 configurado
- Seguir convenciones de shadcn/ui
- TypeScript strict mode

ENTREGABLES:
- Layout completo funcional
- Sidebar con menú completo
- Mínimo 3 páginas migradas (Dashboard, Ciclos, Cursos)
- Componentes UI reutilizables
- Zero errores TypeScript
- Documentación de componentes creados

¿Estás listo para comenzar? Empieza con Tarea 1: Análisis del Mockup.
```

---

## Recursos

**Documentación:**
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Lucide React Icons](https://lucide.dev/icons/)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)

**Archivos de Referencia:**
- `apps/cms/TAILWIND_V4_CONFIG.md` - Configuración Tailwind
- `apps/cms/app/(dashboard)/page.tsx` - Página de prueba
- `design-dashboard-mockup/cep-admin-mockup/` - Mockup completo

---

**Última Actualización:** 2025-11-13
**Generado por:** Claude Code
**Proyecto:** CEPComunicacion v2 - Payload CMS Dashboard Migration
