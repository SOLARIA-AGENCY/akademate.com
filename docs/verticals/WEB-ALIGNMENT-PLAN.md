# WEB-ALIGNMENT-PLAN: llevar el plan de negocio a la web pública (sin precios)

**ESTADO: IMPLEMENTADO (2026-09-07) sobre `feat/vertical-landings`.** Cambios de código: W1-W5 completos (marketplace add-ons con estados/metering/imágenes, línea DFY en growth, bloque Deployment, FAQs +4, copy /features multi-proveedor + imagen NFC, línea home, chips por vertical). Verificación: 112/112 tests, tsc limpio, next build OK. Las 8 imágenes llegaron por handoff y están en disco (driving v2 con QA visual aprobado). No implementado por decisión: card Solo en web, FAQPage JSON-LD.

Plan de implementación PROPUESTO (nada ejecutado aún). Consume BUSINESS-PLAN.md + ADD-ONS.md. Fecha: 2026-09-07. Rama de trabajo: `feat/vertical-landings` (worktree `akademate-public-expansion`).

---

## 0. Regla maestra

**Cero precios, cero divisas, en ningún string.** El test `marketing-content.test.ts` ya prohíbe `/[€$£]\s?\d/` — se mantiene como guardián. Etiquetado copiado del modelo Kisi (el mejor referente observado): planes "Tailored proposal" (ya existe), add-ons "Available as add-on" / "Añadible a tu plan" con **lenguaje de unidad sin divisa** ("per screen", "per door"), roadmap "Coming soon" / "Próximamente" (patrón ya establecido en el repo para apps y conectores Holded/Xero/QuickBooks). SEO: **ninguna URL nueva** para coming-soon (guía Google anti thin-content); todo vive como sección/badge en páginas existentes.

## 1. Estado actual vs objetivo

| Superficie | Hoy | Objetivo |
|---|---|---|
| /pricing cards | 3 (Launch/Business/Enterprise) | **Sin cambios de cards** (Solo decidido interno); Enterprise gana subtítulo deployment |
| /pricing extensiones | 8 tarjetas planas "Paid extension" | Marketplace real: estados live/soon, metering por unidad, growth incluye landings + línea DFY, IA 2 modos (MCP gratis / agente con cuota) |
| Comparador | ~50 filas, QR/NFC/signage = paid-extension (testeado) | + filas "Campaign landing pages" y modos IA; añade estado soon |
| FAQ pricing | 6 preguntas | +3 (cómo se compran add-ons; quién compra el hardware; IA BYO vs agente) |
| /features | roadmapModules genéricos | copy actualizado (multi-proveedor, 2 modos IA, landings) + imagen de acceso |
| Home | banda pricing 3 tiers | línea "add-ons modulares" + link `#addons`; mencionar Solo soon |
| Landings verticales | teaser con 3 cards del catálogo | auto-incluye Solo al añadirlo al catálogo; sin secciones extra en v1 |
| Imágenes | sin ilustración de access/signage/IA/landings | 6-7 assets nuevos (§4) |

## 2. Cambios por superficie

### A. Datos (`pricing-content.ts` + `pricing-i18n.ts` ES/ES maps)
1. `paidExtensions[]`: añadir campo `status: 'live' | 'coming-soon'` (access, signage, resources → soon; resto live). Metering en `summary`: access "per door", signage "per screen". 
2. `agentic` card: bullets 2 modos — "Connect your own ChatGPT or Claude via MCP" + "Akademate assistant in the side panel with a monthly AI quota".
3. `growth` card: bullet "Campaign landing pages with UTM attribution".
4. Nuevas filas comparador: "Campaign landing pages" (paid-extension×3), "Bring-your-own AI via MCP" y "Akademate AI assistant (quota)" — respetando el lock de QR/NFC/signage como paid-extension.
5. FAQs +4 (EN/ES): compra de add-ons vía propuesta; hardware siempre aparte (instalador/proveedor del cliente); diferencia BYO-MCP vs agente con cuota; **"¿Puede Akademate instalarse en nuestros propios servidores?" → sí, variante On-Premise de Enterprise** (canon ya la declara: "Dedicated private cloud or on-premise" enterprise-scope).
6. Si §6.1 aprueba Solo: `plans` + card (label "Coming soon", features: 1 sede · miembros sin límite · facturación conforme incluida · dominio propio como add-on).

### B. Página /pricing (`app/pricing/page.tsx`)
1. Grid de cards: 4 columnas o 2×2 con Solo primero y chip "Próximamente" (mismo estilo que connectors).
2. Sección extensiones → renombrar visualmente "Add-ons" (anchor `id="addons"`): pill por estado ("Add-on" azul / "Coming soon" gris), iconos ya existentes (QrCode, Monitor, Bot...), metering bajo el título.
3. FAQPage JSON-LD (nuevo en pricing, igual que landings) — pricing quote-only rankea igual (Kisi/Salesforce lo demuestran).
4. **Nuevo bloque "Deployment"** (bajo las cards o junto a Add-ons): tres opciones con chip — *Managed cloud* (por defecto, todos los planes) · *Dedicated private cloud* (Enterprise) · **On-Premise: "Akademate installed on your own servers" / "instalado en tus propios servidores"** (Enterprise, CTA "Talk to Enterprise"). Sin precios. Keyword SEO propia: "on-premise academy software" / "software para academias on-premise". La card Enterprise gana subtítulo "Cloud, dedicated or on-premise". Limitación honesta en el copy: features que requieren nuestra nube (agente AI con cuota) no disponibles on-premise sin bridge — no se promete.

### C. /features
1. `roadmapModules` copy: Attendance and physical access → "QR check-in, NFC/RFID identities and multi-provider reader adapters."; Digital signage → "…across every site, with your choice of screen provider."; AI-assisted operations → mencionar 2 modos.
2. Insertar imagen de acceso (§4.1) en la sección roadmap junto al copy de access.

### D. Home
Banda pricing: añadir chip "Solo — coming soon" + una línea "Every plan can add modules: signage, access control, AI and growth." → `/pricing#addons`. Sin tocar estructura (evitar re-auditar CRO).

### E. Landings verticales (rama feat/vertical-landings)
El teaser ya lee `getPricingContent().page.cards` → Solo aparece solo. v1 NO añade secciones de add-ons por vertical (ruido); v2 opcional: chips de add-ons relevantes del preset dentro del bloque integraciones.

## 3. Qué NO se hace (guardarrails)

- Sin precios, ni "from $X", ni en alt/JSON-LD (regex test lo impide).
- Sin URLs nuevas para coming-soon (SEO thin-content).
- Sin prometer hardware nuestro: copy siempre "conecta tus lectores/pantallas; el hardware lo compras a tu proveedor".
- Tests existentes se actualizan, no se debilitan: locks de QR/NFC/signage como paid-extension, paridad EN/ES fail-closed, forbid-price regex intactos.

## 4. Imágenes a generar (convención repo: `akademate-` + `-v1`, jpg foto 1536×1024, png UI 1586×992; alt EN/ES)

| # | Archivo | Composición (referente observado) | Dónde va |
|---|---|---|---|
| 1 | `akademate-access-nfc-tap-v1.jpg` | **La que pides**: mano con móvil en pleno tap sobre lector pedestal negro junto a compuerta/paso de cristal de academia-gym, anillo LED verde (composición hero de Kisi) | /pricing add-on access, /features roadmap |
| 2 | `akademate-access-qr-checkin-v1.jpg` | Móvil mostrando QR ante tablet/lector de pared en la puerta del estudio, estado "checked in" | /features + landings (futuro) |
| 3 | `akademate-signage-reception-v1.jpg` | Pantalla de recepción con horario de clases del día + QR (composición ScreenCloud), ambiente academia | /pricing add-on signage |
| 4 | `akademate-ai-sidebar-agent-v1.png` | Mock UI: dashboard Akademate con ventana lateral de chat del agente, respuesta citando datos de la academia (patrón Fin/ClickUp, NO sparkles abstractos). Etiquetado "Illustrative product example" | /pricing add-on agentic, /features |
| 5 | `akademate-growth-landing-v1.png` | Mock UI: builder de landing de campaña + panel de atribución UTM | /pricing add-on growth |
| 6 | `akademate-ai-mcp-byo-v1.png` | Diagrama producto: ChatGPT/Claude del cliente ↔ capa MCP ↔ Akademate (estilo diagramas png existentes) | /features AI workspace |
| 7 | `akademate-solo-studio-owner-v1.jpg` (opcional) | Dueña de estudio de 1 sala con tablet en recepción, ambiente cálido | Card Solo en /pricing |

Nota de política: los jpgs actuales parecen generados por IA (metadatos); la página /legal/ia no cubre imágenes de marketing. Recomendación: mantener el etiquetado "Illustrative" en mocks UI y no tocar legal [TV §6.3].

## 5. Orden de ejecución y verificación

| Fase | Contenido | Verificación |
|---|---|---|
| W1 | Datos: statuses, metering, bullets IA/landings, filas comparador, FAQs, card Solo (si se aprueba) | vitest pricing/marketing tests actualizados |
| W2 | Página /pricing: grid 4 cards + chip soon, sección Add-ons (anchor), FAQPage JSON-LD | vitest + visual |
| W3 | /features copy + imagen acceso | vitest CRO locks |
| W4 | Home: chip Solo + línea add-ons | vitest |
| W5 | Landings: verificar teaser auto + build SSG | `next build` (10 landings + pricing prerender) |
| W6 | Generar 6-7 imágenes y integrarlas con alt EN/ES | test de assets existentes en disco |
| W7 | tsc + suite completa + revisión visual EN/ES | verde |

## 6. Decisiones del Comandante — RESUELTAS (2026-09-07, 2 rondas)

1. **Solo: NO en la web.** El grid de /pricing queda en 3 tiers; Solo vive solo en propuestas internas. Fuera de este plan la card Solo (se elimina del alcance W1; el bloque Home tampoco la menciona).
2. **Imágenes: SÍ**, las 7 (prompts exactos en [IMAGE-PROMPTS.md](IMAGE-PROMPTS.md)); etiquetado "Illustrative" en mocks; sin cambios en /legal/ia. Prioridad 1: redo de la imagen de autoescuela (defectuosa).
3. **FAQPage JSON-LD en /pricing: NO por ahora** (solo <details> HTML).
4. **Chips de add-ons por vertical: SÍ en v1** (alcance completo W1-W7).
5. **Metering sin divisa: SÍ** ("per screen", "per door").
6. **Ejecución: de una vez** (sin parada en W2).
7. **Landings done-for-you: SÍ como servicio visible** — línea de servicios con CTA de presupuesto en la card growth de /pricing (copy EN/ES), sin página propia.
8. **IA: conector MCP GRATIS en todos los planes; el agente propio incluye cuota inicial limitada y lo de pago son los packs de ampliación** (sustituye al fee $19 de ADD-ONS.md v1). Copy de la card agentic: "Connect your own ChatGPT or Claude via MCP — free" + "Akademate assistant in the side panel with an included starter AI quota, expandable".
9. **On-Premise: bloque Deployment en /pricing** (3 modos) + FAQ (ya definido en §B.4).
