# AKADEMATE — Brand Guidelines v1.0

> Documento de referencia para identidad de marca, design tokens y theming multi-tenant.
> Versión: 1.0 | Fecha: 2026-03-05

---

## 1. Concepto de marca

### Propuesta de valor visual

**"Sistema operativo educativo"**: una marca que comunica estructura, claridad y control,
con un punto de calidez humana (educación accesible) sin volverse "infantil".

### Personalidad (3–5 adjetivos)

- Precisa
- Confiable
- Moderna
- Escalable
- Cercana (sin informalidad)

### Tono de comunicación

- **Profesional y directo**: frases cortas, verbos de acción.
- **Orientado a resultado**: "publica", "gestiona", "convierte", "entrega".
- **Sin grandilocuencia**: cero "revolucionamos la educación"; sí "reduce fricción y mejora trazabilidad".

### Diferenciadores visuales

- Arquitectura tipográfica fuerte (grid, jerarquía limpia, numerales legibles).
- Señalización de estados (Draft/Published/Archived) como lenguaje de producto.
- Acento por tenant sin perder coherencia (marca "plataforma" + marca "academia").

---

## 2. Naming & Tagline

**Nombre:** Akademate

**Lectura:** "Academy + mate/companion". Suena a acompañante operativo, no a "curso suelto".
**Pros:** memorable, internacionalizable, no ultra genérico.
**Contras:** la "k" puede parecer tech/artificial; se compensa con tipografía sobria.

### Tagline principal (elige 1)

1. "Tu academia, operada."
2. "Publica, gestiona y enseña."
3. "El sistema operativo de tu academia." *(más ambicioso, úsalo en pitch/landing)*

### Variaciones por contexto

| Superficie | Tagline |
|------------|---------|
| Web marketing (SEO) | "Web + campus + gestión, todo en una plataforma." |
| Admin | "Gestión académica sin fricción." |
| Campus | "Aprende con continuidad." |
| Enterprise | "Gobernanza multisede y trazabilidad." |

### Alternativas de nombre (solo si se decide cambiar)

- Academate (sin K, más "mainstream")
- Akamate (más corto, peor SEO)
- AkadeOS (demasiado tech)

**Recomendación:** mantener Akademate y construir equity.

---

## 3. Logo (dirección creativa + sistema)

### Objetivo del logo

Debe escalar a:

- 16px favicon
- App icon 1024×1024
- Wordmark en header web
- UI densa en admin (sidebar)

### Territorio visual recomendado

**Evitar** birrete/libro. Proponer un símbolo abstracto que sugiera:

- Estructura modular (LMS + backoffice + web)
- Conexión/acompañamiento ("mate")
- Progresión (campus)

### Concepto de isotipo (propuesta)

**"A modular + nodo"**

- Una A construida con 3 módulos (bloques) + un punto/nodo desplazado que sugiere "compañero" o "hub".
- Funciona en monocromo, y permite un acento por tenant (el nodo toma el `--brand-accent`).

### Variantes obligatorias

- Full lockup horizontal: `[isotipo] + AKADEMATE`
- Vertical: isotipo arriba, texto abajo
- Solo símbolo
- Monocromo (negro/blanco)
- Negativo (para dark)

### Reglas

- **Área de seguridad:** 1× altura del nodo alrededor.
- **Mínimo:**
  - isotipo: 14px
  - lockup: 120px de ancho (si baja de eso, usar isotipo)
- No efectos 3D, no sombras dentro del logo.

### Entregables de logo (rutas)

```
docs/brand/assets/logo/akademate-logo.svg
docs/brand/assets/logo/akademate-logo-dark.svg
docs/brand/assets/logo/akademate-mark.svg
docs/brand/assets/favicon/favicon.ico
docs/brand/assets/app-icon/app-icon-1024.png
```

---

## 4. Paleta de colores (con accesibilidad AA)

**Estrategia:** base sobria "SaaS B2B" + acento controlado.

- `--primary` estable de plataforma (Akademate)
- `--brand-accent` variable por tenant (con validación AA server-side)

### Paleta base (propuesta)

| Token | HEX | HSL | Uso |
|-------|-----|-----|-----|
| Background | `#FFFFFF` | `0 0% 100%` | fondos |
| Foreground | `#0B1220` | `219 49% 8%` | texto principal |
| Primary | `#111827` | `221 39% 11%` | botones primarios, énfasis |
| Primary FG | `#F9FAFB` | `210 20% 98%` | texto sobre primary |
| Secondary | `#F3F4F6` | `220 14% 96%` | chips, bg suave |
| Muted | `#6B7280` | `220 9% 46%` | texto secundario |
| Border | `#E5E7EB` | `220 13% 91%` | bordes/divisores |

### Semánticos

| Estado | HEX | Token | Uso |
|--------|-----|-------|-----|
| Success | `#16A34A` | `success` | confirmaciones |
| Warning | `#F59E0B` | `warning` | avisos |
| Error | `#DC2626` | `destructive` | errores |
| Info | `#2563EB` | `info` | info/links |

### Acento por tenant (variable)

```css
--brand-accent: /* HSL o HEX del tenant */;
--brand-accent-foreground: /* calculado: blanco/negro con ratio ≥ 4.5:1 */;
```

Si no cumple AA → fallback a `--primary`.

---

## 5. Tipografía

### Recomendación

- **UI/Body:** Inter *(legible, estándar SaaS, excelente en tablas)*
- **Display/Títulos:** Geist Sans o mantener Inter con pesos/escala

> Si quieres una sola familia para todo (recomendado): **Inter**.

### Escala tipográfica (UI first)

| Nivel | Tamaño | Peso | Line-height |
|-------|--------|------|-------------|
| H1 | 40px | 700 | 1.1 |
| H2 | 32px | 700 | 1.15 |
| H3 | 24px | 600 | 1.2 |
| H4 | 20px | 600 | 1.25 |
| Body | 16px | 400–500 | 1.5 |
| Small | 14px | 400–500 | 1.45 |
| Caption | 12px | 400 | 1.4 |

### CSS sugerido

```css
/* packages/ui/src/tokens/typography.css */
:root {
  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
    Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  --tracking-tight: -0.02em;
  --tracking-normal: -0.01em;
}
```

---

## 6. Elementos gráficos

### Formas/elementos decorativos

- Grid sutil (1px, baja opacidad) para marketing hero.
- Puntos/nodos como motivo (coherente con isotipo).
- Nada de ilustración "cartoon" en core product; si hay ilustraciones, deben ser lineales y sobrias.

### Iconografía

- **`lucide-react`** (ya alineado con blueprint)
- Grosor consistente, sin "filled icons" mezclados.

### Motion

- Microtransiciones (150–220ms), respetar `prefers-reduced-motion`.

---

## 7. Aplicaciones (spec)

### Tarjeta digital (template)

- Fondo `background`
- Isotipo arriba izq
- Nombre + rol
- URL + email
- Acento `--brand-accent` en línea inferior o punto/nodo

### Firma de email

- Nombre (semibold)
- Cargo + Akademate
- Tel / web
- Isotipo 20px (no banner)

### Slides (portada + slide tipo)

- Portada: isotipo grande + tagline
- Slide tipo: header con título + footer con URL
- Acento mínimo (líneas, bullets, nodos)

### Social

- Avatar: isotipo centrado (fondo sólido)
- Cover: grid + nodos + claim

### Documentos (carta/factura)

- Header con logo
- Tipografía definida
- Jerarquía fuerte (títulos, tabla, totales)

---

## 8. Theming por tenant (operativo y seguro)

### Principio

**Akademate es la plataforma; el tenant es la identidad del cliente.**
Se permite personalización controlada: acento + logo + ciertos radios/estilo, sin romper consistencia.

### Variables CSS mínimas (customizables)

```css
/* packages/ui/src/tokens/tenant.css */
:root {
  /* Platform base */
  --primary: 221 39% 11%;
  --primary-foreground: 210 20% 98%;

  /* Tenant accent (computed) */
  --brand-accent: 221.2 83.2% 53.3%;
  --brand-accent-foreground: 210 40% 98%;
}
```

### Regla AA y fallback (obligatoria)

- Calcular en servidor el foreground del acento y validar contraste (≥ 4.5:1).
- Si no cumple con blanco o negro, fallback a `--primary`.

### Ejemplos de variación (3 arquetipos)

1. **Academia corporativa (B2B):** acento azul sobrio, UI densa, marketing minimal.
2. **Escuela creativa:** acento púrpura/teal moderado, más aire en web, mismas bases UI.
3. **Centro fitness/bienestar:** acento verde, CTAs claros, campus con continuidad visual.

### Dónde persistirlo

En Core (Postgres) como config no-crítica del tenant (no en Payload), porque afecta UI transversal
y debe ser determinista por host.

---

## 9. Implementación: Tailwind tokens (sugerido)

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: "hsl(var(--primary))",
      "primary-foreground": "hsl(var(--primary-foreground))",
      secondary: "hsl(var(--secondary))",
      "secondary-foreground": "hsl(var(--secondary-foreground))",
      muted: "hsl(var(--muted))",
      "muted-foreground": "hsl(var(--muted-foreground))",
      border: "hsl(var(--border))",

      // Tenant
      accent: "hsl(var(--brand-accent))",
      "accent-foreground": "hsl(var(--brand-accent-foreground))",

      // Semantic
      success: "#16A34A",
      warning: "#F59E0B",
      info: "#2563EB",
    },
    borderRadius: {
      lg: "var(--radius)",
    },
  },
}
```

---

## 10. Checklist de producción (para cerrar v1.0)

- [ ] Logo: isotipo abstracto (no educación literal), monocromo perfecto.
- [ ] Paleta: AA en botones y enlaces en light/dark.
- [ ] UI: tokens únicos compartidos (`packages/ui/src/tokens/`), nada hardcode por app.
- [ ] Theming: acento por tenant calculado server-side con fallback.
- [ ] Sistema multi-superficie consistente (admin denso, campus medio, web claro).

---

## 11. Riesgos identificados

| Riesgo | Descripción | Mitigación |
|--------|-------------|------------|
| Logo literal | Birrete/libro cae en genérico | Usar concepto abstracto "A modular + nodo" |
| Saturación primaria | Primary muy saturado rompe AA | Diseñar con contraste desde día 1 |
| Fragmentación de tokens | Cada app con su propio CSS | Centralizar en `packages/ui/src/tokens/` |
