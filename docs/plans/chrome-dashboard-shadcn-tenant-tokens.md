# Plan: chrome dashboard shadcn + tokens de tenant

Documento único para dos repos:
- CEP: `cepformacion.akademate.com` / worktree platform `apps/tenant-admin`
- SaaS: `akademate.com` tenant-admin equivalente

Idioma UI: español. Sin raya larga. Sin pintar en blanco: cada control tiene slug shadcn.
No deploy, no migraciones, no Traefik/DNS, no `next build` en el VPS vivo.
Commit/push/pin solo si el repo destino ya tiene standing GO. Si no, parar en PR.

---

## 0. Cómo usarlo

1. Implementar por fases. No mezclar Fase C (sidebar) con A/B.
2. Cada fase: slug nombrado, tests focales, captura de 1 listado + 1 ficha, luego siguiente fase.
3. En SaaS: ejecutar TODO el plan EXCEPTO la sección 3.A (adapter CEP). Dejar 3.B.
4. En CEP: ejecutar el plan Y conservar 3.A como único sitio donde vive la marca CEP.

---

## 1. Objetivo y no-objetivos

Objetivo: que el dashboard se vea SaaS pro (un solo sistema de controles shadcn New York) y que color, logo y nombre salgan del tenant, no del componente.

No-objetivos:
- No hardcodear CEP Formación, logo CEP, `#f2014b`, `#3E091A` en primitivos `components/ui` ni en shells de directory/table/sidebar.
- No instalar los 61 slugs. Solo los de cada fase.
- No reescribir planner OccupancyMatrix, ni el rail de agente como chat shadcn, ni 148 páginas a mano.
- No tres feature cards, no glow, no Inter como voz, no em dash.

---

## 2. Contrato de personalización por tenant (obligatorio en ambos repos)

Fuente de verdad: `TenantBranding` (provider). Campos mínimos:

```
academyName: string
logos.principal | oscuro | claro | favicon: string
theme.primary: hex
theme.sidebar: hex
theme.accent: hex
```

Mapeo a CSS (ya existe `applyThemeVariables` / `deriveBrandTokens`):

| Token CSS | Origen | Dónde se pinta |
|---|---|---|
| `--primary` `--ring` `--brand` | `theme.primary` | botones, focus, pills activos |
| `--sidebar` | `theme.sidebar` | fondo del shell (rails izq+der) |
| `--dashboard-canvas` | superficie de contenido (blanco/navy según light/dark) | topbar + main inset |

Reglas:

1. El fondo del grid dashboard usa `bg-[hsl(var(--sidebar))]` o equivalente. NUNCA `bg-[#3E091A]`, NUNCA `bg-[#0F2440]`, NUNCA `bg-[#0B1D36]` en el shell.
2. Rail izquierdo y rail de agente: `bg-transparent` sobre el mismo shell. El agente hereda el color del sidebar del tenant. Si cambias `theme.sidebar`, ambos rails cambian.
3. Logo y wordmark del rail: `branding.logos.principal` + `branding.academyName`. Cero strings "CEP Formación" o "Akademate" dentro de `AppSidebar` / `Sidebar` oficial.
4. Un componente en `components/ui/*` kebab (button, table, sidebar, toggle-group, kbd, command, sonner) NO importa `academy-brand.ts` ni `CEP_*`.
5. Light default en auth: canvas blanco. Dark: navy de superficie, no el hex del sidebar del tenant mezclado con el login.
6. Si `/api/config` no trae tema: fallback de PLATAFORMA (`AKADEMATE_PRIMARY` / `AKADEMATE_SIDEBAR`), no fallback CEP.

Hallazgo actual a corregir en Fase A (ambos repos si está):

```
DASHBOARD_SHELL_LOCKED_CLASS incluye bg-[#3E091A]
```

Eso rompe multi-tenant. Sustituir por token `--sidebar`.

---

## 3. Adapters por repo (única divergencia)

### 3.A Solo CEP (NO copiar a akademate.com)

Archivo típico: `app/providers/tenant-branding.tsx` + `src/domain/academy-brand.ts`.

- `hostLooksLikeCep(host)` + `applyCepHostIdentity` pueden forzar nombre, logo, primary `#f2014b`, sidebar `#3E091A` cuando el Host es CEP.
- Eso es un ADAPTER de host, no UI. Los componentes shadcn solo leen `branding` ya resuelto.
- No añadir más hex CEP en layout, directory, table, agent rail.
- `CEP_AGENT_RAIL = CEP_SIDEBAR` se elimina como constante de chrome: el agent no tiene color propio.

### 3.B akademate.com SaaS (obligatorio)

- NO portar `applyCepHostIdentity`, `isCepChromeHost`, `CEP_DEFAULT_BRANDING`, `CEP_LOGO`, `CEP_ACADEMY_NAME`.
- Branding = registro del tenant (`/api/config` o equivalente) + fallback Akademate.
- Dejar el tipo `TenantBranding` y `applyThemeVariables` ABIERTOS: un tenant futuro (incluida CEP si algún día corre sobre SaaS) personaliza logo/nombre/primary/sidebar sin fork de componentes.
- Si el SaaS hoy tiene navy hardcoded en el shell, misma corrección: `--sidebar`.

---

## 4. Defectos a cerrar (auditoría)

MCP `@shadcn` disponible. `components.json` → `"registries": {}` (HOLD). 29/61 slugs kebab instalados. 35 widgets de dominio dentro de `components/ui`.

| Superficie | Slug | Hoy | Fase |
|---|---|---|---|
| registries MCP | — | `{}` | A0 |
| Shell bg | token `--sidebar` | hex CEP | A0 |
| Segmentos directory | `toggle-group` | `<button>` nativo | A |
| Vista lista/grid | `toggle-group` (`ViewToggle` ya envuelve) | botones nativos en directory | A |
| Atajo ⌘K visual | `kbd` | `<kbd>` HTML | A |
| Thead cobros/landings | `table` | `<thead>` HTML | A |
| Thead listings | `table` | `EntityListingTable` `bg-card` sticky | ya OK, no tocar |
| Toolbar: search izq, filtros der, `h-10` | `input` `select` `toggle-group` | parcialmente hecho | preservar |
| Paleta Cmd+K | `command` | Dialog+Input | B |
| Toasts | `sonner` | `toaster.tsx` custom | B |
| Rail izquierdo | `sidebar` | `AppSidebar` custom, `sidebar.tsx` muerto | C |
| Empty | `empty` | `EmptyState` custom | D |
| Forms alta personal | `form` / `field` / `input` | `<input>` nativo en varios nuevo/editar | D |

`ViewToggle` y `SegmentedToggle` YA usan `ToggleGroup`. El bug es que `PremiumDirectoryShell` no los llama.

---

## 5. Catálogo (no inventar)

Orden: primitivos del repo → `npx shadcn add <slug>` o MCP plugin 6948 (`get_add_command_for_items`) → nada de Magic/Aceternity en el admin.

`components.json` (ambos repos, ajustar aliases al árbol real):

```json
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "iconLibrary": "lucide",
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json"
  }
}
```

Si el schema local usa otro formato de `registries`, el criterio es: `get_project_registries` debe listar `@shadcn` sin pasarlo a mano.

Aliases típicos CEP: `@payload-config/components/ui`. SaaS puede ser `@/components/ui`. No mezclar imports `@/` rotos: o path map, o rewrites.

Hardlinks CEP: `components/*` y `@payload-config/components/*` pueden compartir inode. Editar uno. No duplicar.

---

## 6. Fases

### Fase A0. Fontanería (cero o casi cero píxeles)

- Poner `@shadcn` en `registries`.
- Shell: `bg-[#3E091A]` (o navy SaaS) → `bg-[hsl(var(--sidebar))]` (o la función hex→hsl que ya use el provider).
- Verificar que `applyThemeVariables` escribe `--sidebar` en `:root`.
- Tests: branding fallback plataforma; CEP adapter solo en repo CEP.

DoD A0: MCP ve el registry. Un tenant con `theme.sidebar` distinto cambia el color de AMBOS rails sin tocar JSX del sidebar.

### Fase A. Directory + tablas sueltas (el 80% de sensación “pro”)

Slugs: `toggle-group` (ya instalado), `kbd` (añadir si falta), `table` (ya), `button`, `input`, `select`.

Archivos CEP (buscar equivalentes en SaaS):

- `.../directory/PremiumDirectoryShell.tsx`
- `.../layout/Shell.tsx` (`DashboardToolbar`) si aún pinta botones nativos de vista
- `app/(app)/(dashboard)/finanzas/cobros-pagos/**`
- `app/(app)/(dashboard)/web/landings/**` (y campus landings si duplica)

Cambios:

1. Segmentos (Todas / Físicas / …): `SegmentedToggle` o `ToggleGroup`+`ToggleGroupItem`. Altura fila `h-10`. Item visual `h-9` dentro de la fila, no más bajo que el Input.
2. Vista tabla/grid: `ViewToggle`. Prohibido `<button>` para este control.
3. ⌘K: componente `Kbd` oficial, no `<kbd>` crudo.
4. Layout toolbar (todas las páginas listing, no solo 7):
   - Buscador a la IZQUIERDA (`Input` `h-10` `bg-background`).
   - Cluster `ml-auto flex h-10`: segmentos + `Select` filtros + vista.
   - Mismo patrón en `DashboardToolbar` (campañas, leads, matrículas, etc.).
5. Cobros y landings: `Table`+`TableHeader`+`TableHead` con sticky `bg-card` opaco. Prohibido `bg-muted/40` en thead. Prohibido `<thead>` HTML.
6. Badges de estado: `LISTING_PILL_CLASS` + `StatusDotBadge` (composición sobre `badge`, no hex sueltos). Sedes: columna Tipo Física/Virtual con esos tones. No inventar un tercer sistema de pills.

Páginas que DEBEN quedar homogéneas (PremiumDirectoryShell):
Sedes, Ciclos, Cursos, Convocatorias, Alumnos, Profesores, Administrativo.

DoD A: grep de `<button` en PremiumDirectoryShell = 0 para segmentos/vista. grep `<thead` en cobros y landings = 0. Toolbar search left / controls right en las 7 + DashboardToolbar.

### Fase B. Paleta y toasts

Slugs: `command`, `sonner` (añadir). `dialog`/`input` dejan de ser el Cmd+K.

- `CommandPalette`: `Command` + `CommandInput` + `CommandList` + `CommandItem` (cmdk oficial). Trigger sigue siendo Cmd+K. No reponer el campo “Buscar sección...” del topbar (eliminado a propósito).
- Layout: `Toaster` de `sonner`, no el custom `toaster.tsx` si se puede sustituir 1:1. Si hay callers de `useToast` propio, migrar o adaptar el bridge. No dos sistemas de toast.

DoD B: Cmd+K abre command oficial. Un toast de prueba usa sonner. Topbar sin search de secciones.

### Fase C. Sidebar oficial (caro, fase propia, contrato visual)

Slug: `sidebar` (archivo suele existir y NO estar montado). Trigger: `button` + Lucide `PanelLeft` / `PanelLeftClose` (rectángulo con pestaña, NO chevrons `<` `>`).

Contrato que el `SidebarProvider` DEBE cumplir (si no, no merge):

1. Color 100% `var(--sidebar)` del tenant. Cero navy/CEP en el componente.
2. Colapsado: `w-[80px]`, solo iconos, `overflow-x-hidden`, sin labels ni texto recortado.
3. Expandido: `w-[240px]`, label visible.
4. Toggle FUERA del rail, en el topbar centro (`data-slot="sidebar-collapse-toggle"`). El rail no lleva su propio chevron de colapso.
5. Secciones acordeón: click (no hover). Cerrado `ChevronRight` a la derecha. Abierto `ChevronDown`. En colapsado, submenu solo iconos.
6. Iconos: sección `h-5 w-5`. Subpáginas `h-4 w-4`.
7. Wordmark y logo desde `TenantBranding`, no constantes de academia.
8. Móvil: `Sheet` existente o el de `sidebar` oficial, un solo patrón.
9. `use-mobile` y aliases `@/components/ui` deben resolver. Si SaaS no tiene `@/components/*` → mapear o reescribir imports del `sidebar.tsx` oficial a los aliases del repo.
10. No montar dos sidebars. `AppSidebar` se absorbe (datos de nav) o se sustituye. Un `SidebarProvider` en el layout dashboard.

DoD C: 0 `SidebarProvider` antes → 1 después. Tests de rail colapsado (iconos, overflow, chevrons, subiconos). Screenshot light: canvas blanco, rails del color del tenant.

NO hacer Fase C el mismo día que A si el equipo no puede visual-QA el menú entero.

### Fase D. Pulido (opcional, después de A+B)

- `empty` oficial para vacíos de directory (restyle tokens; `EmptyState` custom puede wrapping el slug).
- Altas `nuevo`/`editar` de profesores/administrativo/ciclos: `Input`/`Select`/`Textarea`/`Button` shadcn, no HTML nativo. `form`/`field` si el repo aún no tiene el slug.
- Sacar widgets PascalCase de `components/ui/` a `components/akademate/` o `components/layout/` (higiene, 0 cambio visual). No bloquear A–C por esto.

Fuera de D: OccupancyMatrix, chat del agente, ComingSoonPage → no son el chrome.

---

## 7. Comportamiento ya decidido (preservar en ambos)

Estos no son “premium extra”. Son regresiones si se pierden:

- Menús click, no hover.
- Badges de estado = pill (Activo / etc.), no cards de título encima del listado.
- Buscador listing fondo `bg-background` (blanco en light).
- ThemeToggle no es campana. Campana = notificaciones.
- No campo “Buscar sección” en topbar. CommandPalette Cmd+K sí.
- Document scroll retirado: shell `h-dvh` 3 columnas `rail | main | agent`.
- Thead sticky opaco `bg-card` en TODAS las tablas listing.
- Controles de filtro/segmento/vista siempre a la derecha; search a la izquierda; misma altura `h-10`.

---

## 8. Tests mínimos por fase

A0: `--sidebar` sale de `theme.sidebar`; CEP adapter no corre en host no-CEP (test de host).
A: `PremiumDirectoryShell` contiene `SegmentedToggle` o `ToggleGroup`, no `<button` de segmento; `ViewToggle`; `Kbd`; EntityListingTable `[&_th]:bg-card`; cobros/landings sin `<thead`.
B: CommandPalette importa `@/components/ui/command` (o alias repo); layout importa sonner.
C: layout tiene `SidebarProvider`; no toggle de colapso dentro del brand del rail; `PanelLeft` en topbar; collapsed class `overflow-x-hidden`; `SIDEBAR_SUBNAV_ICON_CLASS` `h-4 w-4`.
Focal vitest + 1 prueba adversarial de host/tenant. `pnpm verify:boundary` si el repo lo tiene.

No datos reales. No secretos en tests.

---

## 9. Verificación visual

Light: login y dashboard canvas blanco; rails = `theme.sidebar` del tenant.
Dark: canvas navy de superficie; rails siguen `theme.sidebar`.
Un listado (Sedes) + una ficha + una página DashboardToolbar (Leads o Campañas).
Colapsar rail: solo iconos, submenú más chico, chevron right/down.
Agent rail: mismo color que el izquierdo (transparencia sobre shell).

SaaS: tenant default Akademate (navy sidebar, logo Akademate, wordmark Akademate).
CEP: tras A0, el mismo JSX muestra burdeos porque el adapter rellena `theme.sidebar`, no porque el shell tenga el hex.

---

## 10. Orden de merge recomendado

1. A0 + A en una PR (o dos commits).
2. B en PR aparte.
3. C en PR aparte con QA de menú.
4. D cuando A–C estén en staging.

Si el standing GO del repo es “commit + staging + prod”, CEP puede pinnear A0+A solo. No pinnear C sin QA.

---

## 11. Prompt corto para el agente SaaS (pegar encima si hace falta)

Eres el agente de akademate.com SaaS. Implementa el plan “chrome dashboard shadcn + tokens de tenant”.
NO apliques identidad CEP (logo, nombre, `#f2014b`, `#3E091A`, `applyCepHostIdentity`).
SÍ deja `TenantBranding` + CSS `--primary` / `--sidebar` para que cualquier tenant (incluido uno tipo CEP) personalice sin fork.
UI en español. Slugs shadcn New York. Empieza por Fase A0+A. No Fase C hasta que A esté verificado.
