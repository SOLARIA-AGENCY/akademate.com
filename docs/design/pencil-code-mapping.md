# Mapeo Bidireccional: Pencil ↔ Código — Login Page

**Archivo Pencil:** `/tmp/akademate-login.pen` (activo en Antigravity)
**Archivo React:** `apps/tenant-admin/app/auth/login/page.tsx`
**CSS Tokens:** `apps/tenant-admin/app/globals.css`
**Generado:** 2026-03-04 | Fidelidad: ~93%

---

## 1. Árbol de Mapeo Completo

### Artboard Principal

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `mYzJ2` | Login Page | `<div>` (root wrapper) | `min-h-screen flex items-center justify-center bg-background p-4` | bg: #F7F7F7, padding: 16px, display: flex |
| `KEgBR` | Theme Toggle | `<ThemeToggle>` (en `auth/layout.tsx`) | `fixed top-4 right-4` | position: fixed, top: 16px, right: 16px |
| `QJwKM` | Center Column | `<div className="w-full max-w-md">` | `w-full max-w-md relative z-10` | width: 100%, max-width: 448px |
| `hvrye` | Footer | `<div className="mt-8 text-center text-sm text-muted-foreground">` | `mt-8 text-center text-sm text-muted-foreground` | margin-top: 32px, font-size: 12px, color: #6C7A8D |

---

### Logo Area

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `Wbej7` | Logo Area | `<div className="text-center mb-8">` | `text-center mb-8` | margin-bottom: 32px |
| `CmS78` | Logo Outer | `<div className="relative rounded-full border-4 border-primary bg-white overflow-hidden flex items-center justify-center w-36 h-36">` | `rounded-full border-4 border-primary bg-white w-36 h-36` | 144×144px, border-radius: 50%, border: 4px solid #0066CC, bg: #FFFFFF |
| `K1cHE` | Logo BG | `<Image>` (contenedor — el favicon SVG) | `object-contain w-[100px] h-[100px]` | Fondo azul del ícono: #1552C9, borderRadius: 26px |
| `d8JhN` | Icon Letter "A" | (dentro del SVG favicon) | — | fill: #F8FAFC, fontSize: 56px, fontWeight: 900 |
| `1qgrg` | Dot | (dentro del SVG favicon) | — | fill: #D6E7FF, 26×26px, borderRadius: 13px |
| `JivAX` | Academy Name | `<h1 className="text-3xl font-bold">` | `text-3xl font-bold` | font-size: 30px, font-weight: 700, color: #0D0D0D |
| `3pgpZ` | Subtitle | `<p className="text-muted-foreground mt-2">` | `text-muted-foreground mt-2` | font-size: 14px, color: #6C7A8D, margin-top: 8px |

**Nota logo:** El `boxShadow` del círculo exterior (`0 20px 40px -5px hsl(var(--primary)/0.4)`) no está soportado en Pencil MCP (batch_design). Diferencia de fidelidad deliberada.

---

### Login Card

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `8wI55` | Login Card | `<Card>` (shadcn) | `shadow-2xl border-2` | bg: #FFFFFF, border-radius: 10px, padding: 24px, border: 2px solid #D8E2EF |
| `QcFhq` | Card Title | `<CardTitle className="text-2xl">` | `text-2xl` | font-size: 24px, font-weight: 700, color: #0D0D0D |
| `fxWJe` | Card Desc | `<CardDescription>` | (shadcn default) | font-size: 14px, color: #6C7A8D, line-height: 1.4 |

---

### Formulario — Email

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `F61J5` | Email Group | `<div className="space-y-2">` | `space-y-2` | gap: 6px (vertical) |
| `UpMZR` | Email Label | `<Label htmlFor="email">` | (shadcn Label) | font-size: 13px, font-weight: 500, color: #374151 |
| `JdH3U` | Email Input | `<Input type="email">` wrapeado en `<div className="relative">` | `pl-10` (input) | height: 44px, border: 1px solid #D8E2EF, bg: #FFFFFF, padding-left: 40px |

---

### Formulario — Password

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `sLBNK` | Pass Group | `<div className="space-y-2">` | `space-y-2` | gap: 6px (vertical) |
| `e0eYk` | Pass Label Row | `<div className="flex items-center justify-between">` | `flex items-center justify-between` | display: flex, justify-content: space-between |
| `RHU2D` | Pass Input | `<Input type="password">` | `pl-10 pr-10` | height: 44px, padding-left: 40px, padding-right: 40px |
| `IVWBO` | Eye Spacer | (spacer div implícito — `<button>` absolute) | `absolute right-3 top-1/2 -translate-y-1/2` | position: absolute, right: 12px |

---

### Remember + Submit

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `1BkI0` | Remember Row | `<div className="flex items-center gap-2">` | `flex items-center gap-2` | display: flex, align-items: center, gap: 8px |
| `EwRo1` | Checkbox | `<input type="checkbox">` | `rounded` | 16×16px, border-radius: 3px |
| `nqofJ` | Rem Label | `<Label htmlFor="remember">` | `cursor-pointer text-sm` | font-size: 14px, color: #374151 |
| `AYxqt` | Submit Btn | `<Button type="submit" size="lg">` | `w-full` + (shadcn) | width: 400px, height: 48px, bg: #0066CC, border-radius: 8px |
| `X8Gwn` | Shield Icon | `<Shield className="mr-2 h-5 w-5">` (lucide) | `mr-2 h-5 w-5` | emoji fallback en Pencil |
| `9TLOv` | Submit Text | "Iniciar Sesión" text | — | font-size: 15px, font-weight: 600, color: #FFFFFF |

---

### Divider + Google OAuth

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `J86V3` | Divider Row | `<div className="relative my-5">` | `relative my-5` | margin: 20px 0 |
| `lhRxY` | Div L | `<span className="w-full border-t">` (izquierda) | `w-full border-t` | height: 1px, bg: #E5E7EB |
| `XyH02` | Div Text | `<span className="bg-card px-2 text-muted-foreground">` | `text-xs uppercase` | font-size: 11px, letter-spacing: 0.06, color: #9CA3AF |
| `ATeTq` | Div R | `<span className="w-full border-t">` (derecha) | `w-full border-t` | height: 1px, bg: #E5E7EB |
| `u0Vu3` | Google Btn | `<a href="...google...">` | `flex w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 py-2.5` | height: 44px, border: 1px solid #D8E2EF, bg: #F7F7F7 |
| `61idt` | G Colors | `<svg viewBox="0 0 24 24">` (Google G logo SVG) | `h-5 w-5` | 20×20px (4 paths SVG) |
| `6VZcw` | G Label | "Continuar con Google" text | — | font-size: 14px, font-weight: 500, color: #374151 |

---

### Signup + Footer

| Pencil Node ID | Pencil Name | React Element | Tailwind Classes | Valor Computado |
|---------------|-------------|---------------|------------------|-----------------|
| `FawAW` | Signup Row | `<p className="mt-5 text-center text-sm text-muted-foreground">` | `mt-5 text-center text-sm` | margin-top: 20px, font-size: 14px |
| `Vvrex` | Signup Txt | "¿No tienes cuenta?" | — | color: #6B7280 |
| `FAM29` | Signup Link | `<Link href="/auth/signup">` | `font-medium text-primary hover:underline` | color: #0066CC, font-weight: 600 |
| `wklEC` | F Copy | "© 2026 Akademate..." | (primer `<p>`) | font-size: 12px, color: #9CA3AF |
| `Kju7Z` | F Privacy | `<a href="/legal/privacidad">` | `hover:text-foreground transition-colors` | color: #9CA3AF → #0D0D0D on hover |
| `GmwvP` | F Terms | `<a href="/legal/terminos">` | `hover:text-foreground transition-colors` | color: #9CA3AF |
| `quRHt` | F Cookies | `<a href="/legal/cookies">` | `hover:text-foreground transition-colors` | color: #9CA3AF |

---

## 2. Tokens de Color Mapeados

| CSS Variable | HSL | Hex Computado | Uso en Diseño |
|-------------|-----|---------------|---------------|
| `--background` | `0 0% 97%` | `#F7F7F7` | Artboard bg, Input bg |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card, Google btn bg |
| `--primary` | `210 100% 40%` | `#0066CC` | Submit btn, links, logo border |
| `--border` / `--input` | `214.3 31.8% 91.4%` | `#D8E2EF` | Input borders, card border |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `#6C7A8D` | Labels, subtítulos, footer |
| `--foreground` | `222.2 84% 4.9%` | `#0D0D0D` | Títulos, texto principal |
| `--destructive` | `0 84.2% 60.2%` | `#F35353` | Mensaje de error (no visible en estado normal) |

---

## 3. Diferencias Deliberadas Pencil vs Código

| Elemento | En Código | En Pencil | Razón |
|----------|-----------|-----------|-------|
| Logo glow shadow | `boxShadow: 0 20px 40px -5px hsl(var(--primary)/0.4)` | No presente | `shadow` no soportado en batch_design API |
| Card shadow | `shadow-2xl` (Tailwind) | No presente | Misma razón |
| Input border | `border border-input` (shadcn) | `strokeColor:#D8E2EF strokeWidth:1` | Equivalente visual |
| Checkbox nativo | `<input type="checkbox">` | Frame 16×16 | No existe checkbox nativo en Pencil |
| Lucide icons | SVG components (Mail, Lock, Eye, Shield) | Emojis (✉ 🔒 👁 🛡) | Pencil no soporta import de SVG externos |
| Google G logo | SVG multi-path | 4 rectangles colorados | Sin soporte upload de SVG en batch_design |
| Hover states | CSS `:hover` transitions | No presente | Pencil es diseño estático |
| `focus-visible` ring | CSS ring color | No presente | Estados interactivos no aplican |
| Dark mode | CSS `.dark` class toggle | Artboard separado (pendiente) | Dark mode requiere artboard duplicado |

---

## 4. Propuesta de Flujo Bidireccional

### 4.1 Diseño → Código (Pencil → React)

```
Pencil (batch_get) → JSON nodos → Script de extracción → PR con cambios visuales
```

**Proceso:**
1. Ejecutar `batch_get` en el artboard para extraer todos los nodos
2. Comparar propiedades Pencil con valores computados en el mapa
3. Si hay diferencias de color/spacing → actualizar CSS variables en `globals.css`
4. Si hay diferencias de layout → actualizar clases Tailwind en `page.tsx`

**Script de extracción (concepto):**
```typescript
// tools/pencil-extract.ts
// Lee batch_get JSON y genera diff con valores actuales del código
const pencilNodes = await batchGet("mYzJ2")
const changes = diffWithCode(pencilNodes, currentTailwindValues)
// Output: PR-ready cambios en globals.css y page.tsx
```

### 4.2 Código → Diseño (React → Pencil)

```
Tailwind class change → Calcular nuevo valor computado → batch_design U() sobre node ID
```

**Proceso manual actual:**
1. Detectar cambio en `globals.css` o `page.tsx`
2. Mapear clase/variable → node ID usando este documento
3. Ejecutar `batch_design` con `U(nodeId, {nuevaPropiedad: nuevoValor})`

**Ejemplo — cambiar color primario:**
```
CSS: --primary: 210 100% 40% → 220 90% 45%
Hex: #0066CC → #2255BB

Pencil update:
U("AYxqt", {fill:"#2255BB"})    // Submit Btn bg
U("FAM29", {fill:"#2255BB"})    // Signup Link color
U("CmS78", {strokeColor:"#2255BB"})  // Logo border
```

### 4.3 Roadmap Bidireccionalidad Completa

| Fase | Acción | Herramienta | Estado |
|------|--------|-------------|--------|
| **1** | Mapa manual Pencil ↔ código (este doc) | Manual | ✅ HECHO |
| **2** | Script `pencil-extract.ts` que lee batch_get JSON | TypeScript CLI | Pendiente |
| **3** | Hook PostSave en Pencil → dispara script | Pencil API (no disponible aún) | Bloqueado |
| **4** | Watcher en `globals.css` → actualiza Pencil vía MCP | Node.js + chokidar + Pencil MCP | Posible ahora |
| **5** | CI/CD: en cada PR, generar screenshot Pencil vs Playwright | GitHub Actions | Futuro |

### 4.4 Watcher CSS → Pencil (Implementable Ahora)

El único flujo automatizable actualmente es **código → Pencil**, usando un watcher:

```typescript
// tools/css-to-pencil-watcher.ts
import chokidar from 'chokidar'
import { execMcp } from './pencil-mcp-client'

const TOKEN_TO_NODE_MAP = {
  '--primary': [
    { nodeId: 'AYxqt', prop: 'fill' },
    { nodeId: 'FAM29', prop: 'fill' },
    { nodeId: 'CmS78', prop: 'strokeColor' },
  ],
  '--card': [
    { nodeId: '8wI55', prop: 'fill' },
    { nodeId: 'u0Vu3', prop: 'fill' },
  ],
  // ... resto del mapa
}

chokidar.watch('apps/tenant-admin/app/globals.css').on('change', async () => {
  const newTokens = parseCssTokens('globals.css')
  for (const [token, nodes] of Object.entries(TOKEN_TO_NODE_MAP)) {
    const newHex = hslToHex(newTokens[token])
    for (const { nodeId, prop } of nodes) {
      await execMcp('batch_design', {
        operations: [`U("${nodeId}", {${prop}:"${newHex}"})`]
      })
    }
  }
})
```

---

## 5. Quick Reference — IDs Clave

```
mYzJ2   → Artboard completo (1440×900)
QJwKM   → Centro (max-w-md wrapper, 448px)
CmS78   → Logo círculo exterior
8wI55   → Login Card (Card shadcn)
AYxqt   → Botón "Iniciar Sesión" (primary action)
u0Vu3   → Botón Google OAuth
hvrye   → Footer links row
```

---

*Generado por: ECO-Lambda (Λ) | Claude Sonnet 4.6 | Akademate Design System*
