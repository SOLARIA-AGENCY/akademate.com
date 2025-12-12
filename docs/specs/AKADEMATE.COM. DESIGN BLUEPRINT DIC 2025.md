# AKADEMATE — Design Blueprint (UI/UX) + Component System (Multi-surface, Multitenant)

## Resumen ejecutivo

Este blueprint define el sistema de diseño, el modelo de theming y la librería de componentes compartidos para AKADEMATE. Su objetivo es garantizar consistencia entre superficies, acelerar entrega mediante reutilización (shadcn/ui + kits pre-diseñados) y reducir ambigüedad operativa en un contexto multitenant con multisede e impersonación.

---

## 1) Objetivo y alcance

### 1.0 Cómo usar este documento

- **Audiencia**: Frontend Lead, UI/UX, PM técnico y contribuyentes a `apps/*` y `packages/ui`.
- **Cadencia**: se actualiza cuando se incorporan nuevos shells, tokens o patrones P0/P1. Cambios ad-hoc fuera de este documento se consideran desviación.
- **Entrada al catálogo**: un componente es “oficial” cuando:
  - vive en `packages/ui`,
  - usa tokens (sin hardcode de estilo),
  - cubre estados (loading/empty/error/forbidden/not-found) cuando aplique,
  - es SSR-safe por defecto (y explícitamente Client Component cuando no lo sea).
- **Qué es desviación**: duplicar componentes en `apps/*`, introducir tokens paralelos, alterar `shadcn/ui` sin gobernanza o adoptar patrones de layout inconsistentes por superficie.

### 1.1 Propósito

Este documento establece un marco de diseño y un sistema de componentes orientado a acelerar la entrega y garantizar consistencia visual e interactiva en un SaaS multitenant con múltiples superficies: `platform-ops`, `tenant-admin`, `campus`, `web` y `cms`. El blueprint define convenciones de UI, tokens de diseño, shells de navegación y patrones de interacción que permiten:

- **Coherencia multi-surface** sin fragmentación estilística.
- **Reutilización sistemática** de componentes y bloques sobre `shadcn/ui` (Radix + Tailwind) y kits pre-diseñados.
- **Accesibilidad operativa** alineada con WCAG 2.2 AA, con soporte completo de teclado y estados de foco consistentes.
- **Legibilidad del contexto multitenant** (tenant/site) y señalización explícita de impersonación en Ops.

### 1.2 No-objetivos (fuera de alcance)

- No define reglas de negocio, permisos, ownership ni RLS; únicamente prescribe cómo **representarlos** en UI.
- No sustituye contratos de dominio (`packages/application`) ni el enforcement DB-first en Postgres.
- No convierte el CMS en fuente de verdad operativa; su rol permanece editorial/configurativo.

---

## 2) Principios de diseño

### 2.1 Consistencia multi-surface

- Un único sistema de tokens y componentes compartidos en `packages/ui`.
- La variación por superficie se limita a densidad informacional, navegación y jerarquía semántica; no se admiten divergencias arbitrarias de estilo.
- Los `primitives` de interacción (botones, menús, diálogos, formularios) se consideran invariantes; los shells de layout pueden especializarse por superficie.

### 2.2 Densidad informacional y priorización cognitiva

- **Admin (**``**, **``**)**: alta densidad, foco tabular, filtros persistentes, acciones contextuales y atajos cuando el coste de aprendizaje esté justificado.
- **Campus**: densidad media; lectura, continuidad y progresión como objetivo; minimización de opciones simultáneas.
- **Web pública**: claridad máxima y performance; composición de bloques, narrativa y CTAs con enfoque SEO-first.

### 2.3 Accesibilidad (WCAG 2.2 AA)

- Navegación por teclado end-to-end (Tab/Shift+Tab, Enter, Esc) en flujos P0.
- `:focus-visible` obligatorio y consistente; no se aceptan “focus traps” no intencionales.
- Contraste AA controlado por tokens; evitar hardcode de colores.
- Semántica y ARIA correctas en controles compuestos (Radix/shadcn como base).
- Respeto estricto a `prefers-reduced-motion`.

### 2.4 Diseño explícito para multitenancy

- En superficies autenticadas, el **contexto activo** debe ser inequívoco: `tenant` + `site` (si aplica).
- En `platform-ops`, la impersonación se comunica mediante **banner persistente** con acción de salida y metadatos (motivo/expiración).
- En `web`, el tenant se expresa por host; el UI no debe inducir percepciones de “espacio global” compartido.

---

## 3) Design tokens y theming

### 3.1 Tokens base (CSS variables)

Se adopta el set estándar de shadcn y se extiende de forma conservadora con: `surface-*`, `focus` y `chart-*`. El objetivo no es “decorar”, sino **normalizar** el lenguaje visual y asegurar contrastes consistentes.

**Ejemplo (**``**):**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;

  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;

  --radius: 0.75rem;

  /* Extended surfaces */
  --surface-1: 0 0% 100%;
  --surface-2: 210 40% 98%;

  /* Focus color */
  --focus: 221.2 83.2% 53.3%;

  /* Charts (HSL) */
  --chart-1: 221.2 83.2% 53.3%;
  --chart-2: 142.1 76.2% 36.3%;
  --chart-3: 24.6 95% 53.1%;
  --chart-4: 0 84.2% 60.2%;
  --chart-5: 262.1 83.3% 57.8%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;

  --surface-1: 222.2 84% 4.9%;
  --surface-2: 217.2 32.6% 10%;
  --focus: 221.2 83.2% 53.3%;
}
```

### 3.2 Tailwind preset (unificación)

- Se centraliza un preset de Tailwind en `packages/ui/src/styles/tailwind-preset.ts`.
- `colors` y `radius` referencian variables HSL (`hsl(var(--primary))`), evitando divergencias entre apps.

### 3.3 Tipografía (legibilidad y densidad)

- **Admin/Campus**: `Inter` o `Geist Sans`, con tabulación numérica para tablas (`"tnum"`).
- **Web**: misma familia por consistencia; una display font es admisible solo si no degrada Core Web Vitals.

Escala recomendada:

- `text-xs` (12): metadata/auxiliares
- `text-sm` (14): base admin
- `text-base` (16): base campus/web
- `text-lg/xl/2xl`: jerarquía semántica

### 3.4 Grid y responsividad

- Breakpoints Tailwind: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.
- Admin:
  - Sidebar persistente desde `lg`.
  - En `md` o menor: sidebar como `Sheet`/drawer.
- Web:
  - Contenedor recomendado `max-w-6xl` (ajustable por sección).

### 3.5 Extensión por tenant: acento ("accent") con garantía AA

**Decisión de UI:** permitir un acento por tenant mediante variables CSS **sin acoplamiento al CMS**, con garantía reproducible de contraste (WCAG AA) y fallback automático.

Implementación mínima recomendada:

- Persistir un acento no crítico en `tenants` (Postgres): `ui_accent_h/s/l` (HSL) o `ui_accent_hex`.
- El layout raíz de cada app resuelve el tenant por host e **inyecta** variables en el `<html>` o en un wrapper.

#### Garantía WCAG AA (server-side)

- El servidor calcula:
  - `--brand-accent` (HSL)
  - `--brand-accent-foreground` (elige blanco o negro según ratio)
- Umbrales:
  - **AA texto normal**: ratio ≥ 4.5:1
  - **AA texto grande**: ratio ≥ 3:1 (solo si la variante tipográfica lo justifica)
- Si el acento no alcanza AA con blanco ni negro en el contexto de uso definido (p. ej., botones/CTAs), se aplica fallback a `--primary` y `--primary-foreground`.

#### Algoritmo (reproducible)

- Convertir HSL/HEX a sRGB.
- Calcular luminancia relativa (WCAG):
  - `L = 0.2126*R + 0.7152*G + 0.0722*B` con corrección gamma.
- Ratio de contraste:
  - `(max(L1,L2)+0.05)/(min(L1,L2)+0.05)`.
- Selección de foreground:
  - si `contrast(accent, white) >= 4.5` → foreground = white
  - si no y `contrast(accent, black) >= 4.5` → foreground = black
  - si no → fallback a `primary/primary-foreground`

```tsx
// apps/*/app/layout.tsx (Server Component)
// 1) resolve tenant by host
// 2) read tenant ui accent (non-critical)
// 3) validate contrast + compute foreground
// 4) inject CSS vars (SSR-safe, sin flash)

const { accentHsl, accentFgHsl, usedFallback } = computeBrandAccent({
  requestedAccent: tenant.uiAccent, // HSL/HEX
  mode: 'light',
  minRatio: 4.5,
  fallbackAccent: 'var(--primary)',
  fallbackForeground: 'var(--primary-foreground)',
});

<html
  data-accent-fallback={usedFallback ? '1' : '0'}
  style={{
    ['--brand-accent' as any]: accentHsl,
    ['--brand-accent-foreground' as any]: accentFgHsl,
  }}
>
```

Reglas:

- `--brand-accent` alimenta variantes (CTAs, highlights) y no sustituye `--primary` si compromete AA.
- `--brand-accent-foreground` se calcula server-side mediante el algoritmo anterior (no heurísticas ad-hoc).
- El resultado debe ser estable por request (mismo tenant/host ⇒ mismas variables) y cacheable cuando sea viable.

---

## 4) Librería de componentes (`packages/ui`)

### 4.1 Estructura propuesta

```text
packages/ui/
  src/
    components/
      ui/                 # shadcn base (primitives)
      admin/              # bloques admin (CRUD, tables, filters)
      campus/             # bloques campus (cards, lesson layout)
      marketing/          # bloques web (hero, CTA, faq)
      multitenant/        # tenant/site badges, impersonation banner, host guard
    layouts/
      platform-ops/
      tenant-admin/
      campus/
      web/
    styles/
      globals.css
      tokens.css
      tailwind-preset.ts
    lib/
      cn.ts
      format.ts           # currency/dates/numbers
      nav.ts              # nav typed por superficie
      ui-permissions.ts   # gating visual (no sustituye auth)
      telemetry.ts        # wrapper eventos UI
```

### 4.2 Estándares de diseño y API

- Naming: PascalCase; tipos `*Props`; hooks `use*`.
- Composabilidad: priorizar composición y slots; evitar banderas booleanas proliferantes.
- Separación estricta: `packages/ui` no incorpora lógica de negocio; solo presentación, validación local y orquestación de estados.

### 4.3 Server vs Client Components (criterios)

- Por defecto: Server Components.
- Client Components únicamente cuando exista:
  - estado interactivo (Dialog/Popover/Tabs)
  - formularios (React Hook Form)
  - DataTable client-side (si aplica)
  - toast/notifications
  - calendario interactivo

### 4.4 Formularios (RHF + Zod)

- Stack: `react-hook-form` + `zod` + resolvers.
- UX:
  - errores inline + resumen superior en formularios extensos
  - estados `disabled`/`pending` unificados
  - ayuda contextual (helper text) consistente

### 4.5 Tablas y listas (admin)

- Base: TanStack Table (reutilizar patrón del kit si ya lo integra).
- Capacidades esperadas:
  - sorting, filtering, pagination
  - column visibility
  - row actions
  - bulk selection (cuando aplique)
  - export CSV (P1 si no bloquea MVP)

Estados:

- `loading`: skeleton rows
- `empty`: empty state con CTA
- `error`: alert con retry

### 4.6 Iconografía y feedback

- Iconos: `lucide-react`.
- Feedback:
  - `toast` para confirmaciones transitorias
  - `Alert` inline para errores persistentes/warnings

### 4.7 Gobernanza del catálogo (evitar deuda y forks)

- **Ownership**: `packages/ui` tiene propietarios explícitos (Frontend Lead + UI/UX) responsables de revisiones y consistencia de tokens.
- **Versionado**: `packages/ui` sigue SemVer.
  - `PATCH`: fixes internos sin cambios de API.
  - `MINOR`: nuevos componentes/props compatibles.
  - `MAJOR`: cambios incompatibles (breaking) con guía de migración.
- **Deprecations**:
  - todo breaking se precede por un periodo de deprecación (al menos 1 release minor)
  - componentes deprecados se marcan con `@deprecated` en tipos y se documentan en changelog
- **Changelog y migraciones**:
  - changelog obligatorio por release (qué cambió, impacto, pasos)
  - no se aceptan cambios de API “silenciosos”

### 4.8 Contrato de consumo (apps → `packages/ui`)

- **Importación**:
  - importar desde `packages/ui` (exports controlados)
  - evitar imports profundos salvo rutas declaradas públicas
  - preferir rutas estables tipo `@akademate/ui` (o alias equivalente)
- **Tree-shaking**:
  - exports ESM; evitar barrels que exporten “todo” si penalizan bundles
  - componentes pesados (p. ej., calendarios) deben ser importables de forma granular
- **SSR-safe por defecto**:
  - cualquier componente con APIs del navegador o `useEffect` debe encapsularse como Client Component y declararse explícitamente
  - prohibido introducir side-effects en módulos de import
- **CSS/Tokens**:
  - las apps consumen `tokens.css`/`globals.css` y el preset Tailwind desde `packages/ui`
  - no redefinir tokens por superficie
  - no hardcode de colores salvo casos justificados y documentados
- **Compatibilidad**:
  - dependencias UI como `peerDependencies` cuando corresponda (React, Radix, etc.) para evitar duplicados
  - cambios de peer deps se tratan como breaking o requieren coordinación explícita

---

## 5) Mapa de layouts por superficie (shells)

> Los shells se implementan en `packages/ui/src/layouts/*` y se consumen desde `apps/*`. Las apps se limitan a componer páginas e integrar sus adaptadores (handlers/server actions) locales.

### 5.1 `apps/platform-ops` — Ops Shell

**Objetivo:** operación global, trazabilidad y control de impersonación.

Wireframe (textual):

- Topbar
  - Left: Logo + Environment badge (dev/stg/prod)
  - Center: Global search (tenants/users/domains)
  - Right: User menu + notifications
- Banner persistente (solo en impersonación)
  - “Impersonating: {tenant} / {site}” + motivo + expiración + “Exit”
- Sidebar (densa)
  - Tenants, Domains, Users, Audits, System Health
- Content
  - DataTable-first + detail drawer

Reglas:

- Densidad alta, sin motion decorativo.
- Confirmaciones explícitas en acciones críticas, con señalización de auditoría.

### 5.2 `apps/tenant-admin` — Admin Shell

**Objetivo:** operación de academia (oferta, CRM, alumnos, LMS, calendario, ajustes).

Wireframe (textual):

- Topbar
  - Tenant badge + Site selector
  - Quick actions (New course/offering/enrollment)
  - User menu
- Sidebar
  - Oferta (Cursos, Convocatorias)
  - CRM (Leads)
  - Alumnos
  - LMS
  - Calendario
  - Ajustes
- Content
  - Page header (breadcrumbs) + acciones
  - Main area (table/forms)

Reglas:

- Reutilizar scaffolding CRUD del kit.
- Transiciones (Publish/Archive) con confirmación y copy inequívoco.

### 5.3 `apps/campus` — Campus Shell

**Objetivo:** consumo de contenidos, progreso y continuidad.

Wireframe (textual):

- Topbar
  - Tenant badge discreto
  - Mis cursos
  - Perfil
- Navigation
  - Mis cursos, Calendario, Perfil
- Content
  - cards + progreso + layout de lección

Reglas:

- Minimizar fricción; priorizar “retomar” y la lectura.

### 5.4 `apps/web` — Public Web Shell

**Objetivo:** captación y conversión con enfoque SEO-first.

Wireframe (textual):

- Header
  - logo, navegación, CTA (Acceso / Solicitar info)
- Main
  - hero, listado PUBLISHED, bloques de confianza, FAQ
- Footer
  - legal/contacto

Reglas:

- Server-first, hidratación mínima.
- Exposición exclusiva de contenido PUBLISHED.

---

## 6) Patrones de UI para flujos canónicos (P0)

### 6.0 Taxonomía transversal de estados y mensajes

> Objetivo: homogeneizar copy, acciones y señalización de errores/estados en todas las superficies, evitando reinvenciones por flujo.

#### Estados canónicos (obligatorios)

- **loading**: skeleton coherente con el layout final (evitar spinners genéricos salvo acciones puntuales).
- **empty**: explica por qué está vacío y propone una acción primaria viable (CTA) o el siguiente paso.
- **error** (recuperable): incluye `error_code`, contexto mínimo y acción primaria de recuperación (Reintentar) + secundaria (Soporte/Auditoría en Ops).
- **forbidden**: bloqueo por permisos/estado; indicar qué falta (rol, membership, matrícula) y ofrecer ruta de resolución.
- **not-found**: recurso inexistente o no accesible; evitar ambigüedad con forbidden (en web pública, preferir not-found si no debe filtrarse existencia).

#### Códigos de error UI (nomenclatura)

- Formato: `UIE-<STATUS>-<SLUG>`.
  - Ej.: `UIE-403-AUTHZ_DENIED`, `UIE-404-RESOURCE_NOT_FOUND`, `UIE-429-RATE_LIMIT`.
- Reglas:
  - el código debe mostrarse en `Alert`/error screen y emitirse en telemetría
  - el `SLUG` debe ser estable (no copy) y alineado con errores de aplicación cuando exista correspondencia

#### Guía de copy (títulos/acciones)

- **loading**: sin copy, salvo indicadores locales (p. ej., “Publicando…” en el botón).
- **empty**:
  - Título factual (“No hay convocatorias aún”).
  - Cuerpo con causa plausible (“Crea una para poder publicarla en la web”).
  - Acción primaria: crear/importar.
- **error**:
  - Título: “No se pudo cargar {recurso}”.
  - Cuerpo: una frase, sin stack traces, incluir `error_code`.
  - Acciones: Reintentar (primaria), Contactar soporte / Ver auditoría (secundaria según superficie).
- **forbidden**:
  - Título: “Acceso restringido”.
  - Cuerpo: condición explícita (“No tienes permisos para publicar en este site”).
  - Acciones: Solicitar acceso / Cambiar site / Salir de impersonación (si aplica).
- **not-found**:
  - Título: “No encontrado”.
  - Cuerpo: “El recurso no existe o no está disponible”.
  - Acciones: Volver + enlace a la lista.

#### Mapeo recomendado (HTTP/causas → estado UI)

- `401/403` → forbidden (Ops/Admin/Campus); en web pública, preferir `404` si no debe filtrarse existencia.
- `404` → not-found.
- `409` → error con copy específico de conflicto (p. ej., “Ya está publicado”).
- `422` → errores de formulario inline + summary superior.
- `429` → error con copy accionable (“Intenta de nuevo en unos minutos”).
- `5xx` → error con retry y fallback.

#### Requisito multitenant en estados

- En superficies autenticadas, mantener visible `Tenant: X / Site: Y` (o badge equivalente) para evitar confusión operacional.
- En impersonación (Ops), mantener banner activo y ofrecer “Exit impersonation” como acción secundaria en forbidden/error.

---

### 6.1 Publicación de oferta (DRAFT → PUBLISHED) + reflejo en web

**Entrada**

- Actor: Staff/Admin.
- Contexto: tenant + site visibles.

**Pasos UI**

1. `Oferta → Cursos`: DataTable + “Crear curso”.
2. `Curso → Convocatorias`: DataTable + “Crear convocatoria”.
3. Detail de convocatoria (DRAFT): summary + `StatusBadge`.
4. Acción “Publicar”:
   - Confirm dialog con checklist (fechas, precio, capacidad, slug).
   - Submit → toast éxito → status a PUBLISHED.
5. Acción “Ver en web”: deep link al detalle público.

**Salida UI**

- Convocatoria publicada; `published_at` visible.

**Estados**

- Canónicos: ver 6.0.
- Específicos:
  - `409` (conflicto): “La convocatoria ya está publicada” + CTA “Ver en web”.

**Componentes**

- `AdminShell`
- `TenantContextBadge`, `SiteSelector`
- `DataTable` (kit admin)
- `StatusBadge` (`DRAFT/PUBLISHED/ARCHIVED`)
- `ConfirmDialog`
- `PageHeader`

**Pantallas**

- `/oferta/cursos`
- `/oferta/cursos/[courseId]`
- `/oferta/convocatorias`
- `/oferta/convocatorias/[offeringId]`

**Trazabilidad multitenant**

- Badge persistente `Tenant: X / Site: Y`.
- En el diálogo de publicación: repetir el contexto para evitar errores operativos.

### 6.2 Captación de lead (web) → listado y conversión (tenant-admin)

**Entrada**

- Visitante en web (tenant resuelto por host).

**Pasos UI (web)**

1. Listado/detalle de convocatoria (PUBLISHED).
2. CTA “Solicitar información” (lead form): nombre, email, teléfono opcional, interés, consentimiento.
3. Submit: pantalla de éxito + canal de fallback.

**Pasos UI (admin)**

1. `CRM → Leads`: DataTable con filtros (estado, fuente, fecha).
2. Detail (drawer o page): datos + historial.
3. Acción “Convertir”: wizard (lookup alumno) + creación de matrícula.
4. Confirmación: toast + deep link a matrícula.

**Salida UI**

- Lead registrado y convertido; alumno/matrícula creados.

**Estados**

- Canónicos: ver 6.0.
- Específicos:
  - web `429`: aplicar `UIE-429-RATE_LIMIT` con mensaje accionable + reintento diferido.
  - web: anti-bot/challenge (si aplica) con copy neutro y sin filtrar heurísticas.
  - admin: empty state con explicación del funnel + CTA “Compartir enlace de captación” (si existe en el producto).

**Componentes**

- Web: `LeadForm`, `PublicOfferingCard`, `CTASection`
- Admin: `LeadsTable`, `ConvertLeadWizard`, `StudentLookupCombobox`

**Pantallas**

- web: `/ofertas`, `/ofertas/[slug]`, `/preinscripcion` (o modal)
- admin: `/crm/leads`, `/crm/leads/[leadId]/convert`

**Trazabilidad multitenant**

- web: la marca percibida es la academia (tenant); evitar referencias a “plataforma global”.
- admin: contexto visible en topbar.

### 6.3 Campus: cursos matriculados + consumo de lecciones

**Entrada**

- Alumno autenticado con matrícula activa.

**Pasos UI**

1. `Mis cursos`: grid/list con cards (título, progreso, próxima sesión).
2. Detail de curso: módulos + lecciones (sidebar).
3. Detail de lección: contenido/recursos; “Marcar completada” (P0/P1 según tracking).

**Salida UI**

- Progreso actualizado y visible (P1 si tracking completo).

**Estados**

- Canónicos: ver 6.0.
- Específicos:
  - forbidden: “No tienes matrícula activa” + CTA “Contactar con la academia”.
  - not-found (lección): “Lección no disponible” + CTA “Volver al curso”.

**Componentes**

- `CampusShell`
- `CourseCard`, `ProgressBar`, `LessonSidebar`, `LessonContent`

**Pantallas**

- `/me/cursos`
- `/cursos/[offeringId]`
- `/cursos/[offeringId]/lecciones/[lessonId]`

**Trazabilidad multitenant**

- Tenant badge discreto; el usuario no debe inferir acceso cross-tenant.

---

## 7) Reutilización de componentes pre-diseñados (repositorios y mapeo)

### 7.1 Repositorios de referencia

Estas fuentes se tratan como **catálogo de patrones**. La extracción debe transformarse en componentes mantenibles y alineados con tokens, evitando copias puntuales en `apps/*`.

- **Academate-ui** (layouts/plantillas Next + shadcn; dashboards, calendarios, empty states)
  - `https://github.com/SOLARIA-AGENCY/Academate-ui`
- **shadcn-admin-kit** (bloques admin: CRUD scaffolding, tables, forms, filters, layouts)
  - `https://github.com/SOLARIA-AGENCY/shadcn-admin-kit`
- **shadcn/ui** (primitives oficiales)
  - `https://ui.shadcn.com`

Guía de extracción (alto nivel):

- **Academate-ui**: shells, bloques de dashboard, empty states, calendario (si existe).
- **shadcn-admin-kit**: DataTable (toolbar/filtros/acciones), CRUD scaffolding, patrones de form.
- **shadcn/ui**: primitives (Button/Dialog/Sheet/Tabs/DropdownMenu/Toast/Form).

Regla: la “productización” ocurre en `packages/ui` (no en `apps/*`).

### 7.2 Tabla de mapeo (necesidad → fuente → adaptación)

| Necesidad AKADEMATE                        | Fuente                | Componente/Plantilla      | Adaptación requerida                                 |
| ------------------------------------------ | --------------------- | ------------------------- | ---------------------------------------------------- |
| App shell admin (sidebar + topbar)         | shadcn-admin-kit      | Admin layout shell        | Insertar Tenant/Site badge; route groups por módulos |
| CRUD scaffolding (list/detail/create/edit) | shadcn-admin-kit      | CRUD patterns             | Ajustar copy/labels; estandarizar estados            |
| DataTable avanzada                         | shadcn-admin-kit      | Table + filters + actions | Tipado columnas, estados, export (P1)                |
| Formularios + validación                   | shadcn/ui             | Form primitives           | Wrappers RHF+Zod compartidos                         |
| Dialog/Drawer patterns                     | shadcn/ui             | Dialog/Sheet              | Confirmaciones críticas (publish/convert)            |
| Dashboards/cards/charts layout             | Academate-ui          | Dashboard blocks          | Conectar a métricas cuando existan                   |
| Calendar UI                                | Academate-ui          | Calendar blocks           | Conectar a sesiones (P1)                             |
| Empty states/onboarding                    | Academate-ui          | Empty state blocks        | Copy por superficie (admin/campus/web)               |
| Marketing hero/CTA/FAQ                     | Academate-ui + shadcn | Marketing blocks          | SEO + performance (Server Components)                |
| Inbox/messages (si aplica)                 | Academate-ui          | Inbox UI                  | Solo si blueprint activa mensajería                  |

---

## 8) Directrices de implementación

### 8.1 Integración sin acoplamiento (reglas de repo)

- Todo componente compartido reside en `packages/ui`.
- Prohibida la duplicación por app.
- Las apps (`apps/*`) se limitan a:
  - componer shells y páginas,
  - importar desde `packages/*`,
  - invocar sus adaptadores locales (handlers/server actions) conectados a `packages/application`.

### 8.2 Convención de rutas por app (alto nivel)

- `apps/platform-ops`
  - `/tenants`, `/tenants/[id]`, `/domains`, `/users`, `/audit`
- `apps/tenant-admin`
  - `/oferta/cursos`, `/oferta/convocatorias`
  - `/crm/leads`
  - `/alumnos`, `/matriculas`
  - `/lms/*`, `/calendario/*`, `/ajustes/*`
- `apps/campus`
  - `/me/cursos`, `/cursos/[offeringId]/*`, `/perfil/*`
- `apps/web`
  - `/ofertas`, `/ofertas/[slug]`, `/blog/*`, `/contacto`, `/acceso`

### 8.3 Telemetría UX (sin invadir el dominio)

Instrumentación desde UI vía wrapper `packages/ui/src/lib/telemetry.ts`.

#### Esquema mínimo de nombres de eventos

Formato recomendado: `surface.flow.action.result`

- `surface`: `platform-ops | tenant-admin | campus | web | cms`
- `flow`: `offering_publish | lead_capture | lead_convert | campus_consume | auth | nav`
- `action`: `view | open | submit | confirm | publish | convert | enroll | complete`
- `result`: `success | error | cancel | timeout`

Ejemplos:

- `tenant-admin.offering_publish.publish.success`
- `web.lead_capture.submit.error`
- `platform-ops.auth.impersonate.success`

#### Qué instrumentar (mínimo viable)

- Errores de cliente: error boundaries + `error_code` + `surface`.
- Performance:
  - route load / TTFB (preferentemente server)
  - submit-to-success en acciones críticas (publish/convert)
- Embudos:
  - web: view offering → open lead form → submit lead
  - admin: open lead → convert wizard → enrollment created

#### Dónde se dispara (server vs client) para evitar sesgos

- **Server-side (preferente)**:
  - cambios de estado canónicos (p. ej., `publish.success`, `convert.success`) cuando el backend confirma
  - métricas de carga de ruta/TTFB
- **Client-side (complementario)**:
  - eventos de intención/UX (p. ej., apertura de diálogo, page view) y fricción
  - errores de render/hydration y fallos de red percibidos por el usuario

Regla práctica:

- Si el evento representa un hecho confirmado, emitirlo server-side.
- Si el evento representa intención o fricción, emitirlo client-side.

#### Privacidad y retención (no PII)

- Prohibido enviar PII (email, teléfono, nombre, direcciones) en payload de telemetría.
- Identificadores permitidos:
  - `tenant_id`, `site_id` (internos)
  - `user_id` interno (solo en superficies autenticadas)
  - `session_id` efímero
- Correlación excepcional: hashing con salt en servidor + documentación del motivo.
- Retención recomendada:
  - eventos crudos: 30–90 días (según compliance)
  - agregados: mayor retención (sin riesgo de reidentificación)

Regla: telemetría de UI es diagnóstica; no reemplaza auditoría de negocio.

---

## 9) Checklist de calidad (DoD de UI)

- Accesibilidad
  - teclado end-to-end
  - `aria-*` en controles compuestos
  - contraste AA validado (light/dark)
  - foco visible consistente (`:focus-visible`)
- Responsive
  - admin usable en `md` (sidebar → drawer)
  - campus/web optimizados para móvil
- Estados por pantalla
  - loading/skeleton
  - empty
  - error
  - forbidden
  - not-found
- Tokens y consistencia
  - sin hardcode de colores salvo justificación
  - uso de clases semánticas y variables
- Multitenancy
  - badges tenant/site en superficies autenticadas
  - banner de impersonación en Ops
- Reglas del monorepo
  - sin imports cruzados entre `apps/*`
  - shared solo desde `packages/*`
- Documentación
  - catálogo de componentes (Storybook si se habilita; si no, `/ui-kit` interno)
- Performance
  - web: Server Components por defecto, imágenes optimizadas, hidratación mínima
  - admin/campus: code-splitting y carga bajo demanda de bloques pesados

