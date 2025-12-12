# Configuración de Tailwind CSS v4 en Payload CMS

**Fecha:** 2025-11-13
**Aplicación:** apps/cms (Payload CMS + Next.js 15)
**Versión Tailwind:** 4.1.17

## Problema Resuelto

Durante la migración del dashboard mockup a Payload CMS, los estilos de shadcn/ui no se aplicaban correctamente:

❌ **Síntomas:**
- Cards con fondo transparente (debían ser blancos)
- Buttons con fondo transparente (debían ser azul primary)
- Layout funcionando (borderRadius, padding, shadows) pero colores ausentes
- CSS generado: solo 644 líneas (faltan miles de utilidades)

✅ **Causa Raíz:**
Tailwind CSS v4 introduce breaking changes incompatibles con sintaxis v3:
1. Cambio de directivas `@tailwind` a `@import "tailwindcss"`
2. Los colores custom requieren `@theme` directive para generar utilidades
3. Configuración en `tailwind.config.ts` no expone automáticamente colores como utilidades

## Solución Implementada

### 1. app/globals.css - Sintaxis Tailwind v4

**ANTES (v3 - ❌ NO FUNCIONA):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 97%;
    --primary: 221.2 83.2% 53.3%;
    /* ... más variables ... */
  }
}
```

**DESPUÉS (v4 - ✅ FUNCIONA):**
```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

/* Tailwind v4 theme - expone CSS variables como utilidades */
@theme {
  --color-background: hsl(0 0% 97%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-card: hsl(0 0% 100%);
  --color-card-foreground: hsl(222.2 84% 4.9%);
  --color-primary: hsl(221.2 83.2% 53.3%);
  --color-primary-foreground: hsl(210 40% 98%);
  --color-secondary: hsl(210 40% 96.1%);
  --color-destructive: hsl(0 84.2% 60.2%);
  --color-muted: hsl(210 40% 96.1%);
  --color-accent: hsl(210 40% 96.1%);
  --color-border: hsl(214.3 31.8% 91.4%);
  --color-input: hsl(214.3 31.8% 91.4%);
  --color-ring: hsl(221.2 83.2% 53.3%);
  --color-sidebar: hsl(0 0% 98%);
  --color-sidebar-primary: hsl(240 5.9% 10%);
  --color-sidebar-accent: hsl(240 4.8% 95.9%);
  --color-sidebar-border: hsl(220 13% 91%);
  --color-chart-1: hsl(12 76% 61%);
  --color-chart-2: hsl(173 58% 39%);
  --radius: 0.5rem;
}

@layer base {
  :root {
    /* CSS variables para runtime theming (dark mode) */
    --background: 0 0% 97%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --primary: 221.2 83.2% 53.3%;
    /* ... resto de variables ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... variables dark mode ... */
  }
}

@layer base {
  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
}
```

### 2. tailwind.config.ts - Content Paths

**CRÍTICO:** Asegurarse de que Tailwind escanea `@payload-config` donde shadcn instala componentes:

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./@payload-config/**/*.{ts,tsx}", // ✅ ESENCIAL para shadcn
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... resto de colores ...
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
} satisfies Config;

export default config;
```

### 3. postcss.config.cjs - Plugin de PostCSS

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // v4 requiere paquete separado
    autoprefixer: {},
  },
}
```

### 4. package.json - Dependencias

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.17",
    "tailwindcss": "^4.1.17",
    "tailwindcss-animate": "^1.0.7",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49"
  }
}
```

## Verificación

### Método 1: Inspección Manual en Browser
```bash
# 1. Iniciar dev server
npm run dev

# 2. Abrir http://localhost:3000
# 3. DevTools → Inspect Card element
# 4. Verificar:
#    - backgroundColor: rgb(255, 255, 255) ✅ (no transparent)
#    - Button backgroundColor: rgb(37, 99, 235) ✅
```

### Método 2: Playwright Script (Automatizado)

**Script:** `inspect_css.py`

```bash
python3 inspect_css.py
```

**Salida Esperada:**
```
🃏 Estilos del primer Card:
  backgroundColor: rgb(255, 255, 255) ✅
  borderRadius: 12px ✅
  boxShadow: ... ✅

🔘 Estilos del primer Button:
  backgroundColor: rgb(37, 99, 235) ✅
  color: rgb(248, 250, 252) ✅
```

### Método 3: Verificar CSS Generado

```bash
# Verificar que clases de color se generan
curl -s "http://localhost:3000/_next/static/css/app/layout.css" | grep -c "\.bg-card"
# Output esperado: 1 (o mayor)

# Verificar tamaño del CSS
curl -s "http://localhost:3000/_next/static/css/app/layout.css" | wc -l
# Output esperado: 1200+ líneas
```

## Diagnóstico de Problemas

### Problema: "Cannot apply unknown utility class"
```
Error: Cannot apply unknown utility class `border-border`
```

**Solución:** No usar `@apply` con utilidades custom en v4. Usar CSS directo:

```css
/* ❌ NO FUNCIONA en v4 */
* {
  @apply border-border;
}

/* ✅ FUNCIONA */
* {
  border-color: hsl(var(--border));
}
```

### Problema: Colores transparentes en componentes

**Síntomas:**
- Cards con `rgba(0, 0, 0, 0)` en lugar de blanco
- Buttons sin background color

**Diagnóstico:**
```bash
# 1. Verificar que @theme existe en globals.css
grep -A 5 "@theme" app/globals.css

# 2. Verificar que utilidades se generan
curl -s "http://localhost:3000/_next/static/css/app/layout.css" | grep "\.bg-primary"

# 3. Si no devuelve nada, falta @theme directive
```

**Solución:** Añadir bloque `@theme` con `--color-*` variables (ver sección 1).

### Problema: shadcn componentes sin estilos

**Diagnóstico:**
```bash
# Verificar que Tailwind escanea @payload-config
grep "@payload-config" tailwind.config.ts
```

**Solución:** Añadir `./@payload-config/**/*.{ts,tsx}` a `content` array.

## Recursos

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/v4-beta)
- [Upgrade Guide v3 → v4](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui with Tailwind v4](https://ui.shadcn.com/docs/installation/next)
- [Playwright Python](https://playwright.dev/python/docs/intro)

## Checklist de Reconfiguración

Si necesitas volver a configurar desde cero:

- [ ] 1. Instalar dependencias: `npm install -D @tailwindcss/postcss tailwindcss tailwindcss-animate`
- [ ] 2. Crear `postcss.config.cjs` con `@tailwindcss/postcss` plugin
- [ ] 3. Crear `tailwind.config.ts` con content paths (incluir `@payload-config`)
- [ ] 4. Crear `app/globals.css` con sintaxis v4:
  - `@import "tailwindcss"`
  - `@plugin "tailwindcss-animate"`
  - Bloque `@theme` con `--color-*` variables
  - `@layer base` con `:root` y `.dark` para runtime theming
- [ ] 5. Importar `globals.css` en `app/layout.tsx`
- [ ] 6. Instalar shadcn: `npx shadcn@latest init`
- [ ] 7. Verificar con Playwright script o DevTools

---

**Generado:** 2025-11-13
**Última Actualización:** 2025-11-13
**Responsable:** Claude Code
**Proyecto:** CEPComunicacion v2 - Payload CMS Dashboard
