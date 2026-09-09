# ADD-ONS: catálogo, pricing y reglas de integración

Complementa a BUSINESS-PLAN.md (prevalece lo que coincida). Estado: catálogo cerrado, anchors internos [TV con pilotos]. Fecha: 2026-09-07.

---

## HUD final

HUD · addons-catalog · review · repo · GO
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% · Δ —
Cerrado: 8 add-ons del canon + landings (dentro de growth) + IA en dos modos (BYO vía MCP / agente propio con cuota), anchors de mercado y reglas de integración.

## 1. Reglas del catálogo (inquebrantables)

1. El marketplace de add-ons es visible en **todos** los planes; los add-ons en roadmap (access, signage) se muestran "próximamente" y **no son comprables** hasta que producto los entregue. Nunca se vende roadmap.
2. Hardware y terceros SIEMPRE facturados aparte (canon `separatelyBilledItems`: lectores, tarjetas, pantallas, players, instalación). Akademate cobra la **capa software + conectores**, nunca el hierro.
3. Al comprar un add-on aparece su entry point de menú (mismo motor de entitlements del wizard: `preset.core ∪ purchased_addons`); al caducar, desaparece sin destruir datos.
4. Precio por dispositivo (pantalla/puerta) = modelo multi-proveedor: cada proveedor/instalador cobra su hardware; nuestra cuota es por unidad gestionada en plataforma.

## 2. Catálogo (los 8 del canon `apps/web/lib/pricing-content.ts`)

| Add-on (id) | Qué es | Estado | Pricing (ancla interna) | Gate |
|---|---|---|---|---|
| **agentic** — IA (2 modos) | ver §3 | Canon: "AI workspace and MCP" + "AI-assisted operations (Optional capability)" | Conector MCP **gratis** · Agente propio con cuota inicial limitada + packs | Todos |
| **access** — Control de accesos QR/NFC | Identidades, check-in QR móvil, lectores NFC/RFID **multi-proveedor** (capa software sobre lectores existentes) | Roadmap (Campus operations roadmap) → "próximamente" | $9/puerta-lector/mo (Kisi cobra $50-80/puerta; somos la capa ligera) | Todos, cuando esté |
| **signage** — Digital signage | Playlists programadas, anuncios, estado de dispositivos, multi-sede | Roadmap (Campus communications roadmap) → "próximamente" | $9-15/pantalla/mo (mercado $8-30; Yodeck $12, ScreenCloud $20) | Todos, cuando esté |
| **growth** — Growth pack (incluye **landings de campaña**) | Atribución UTM, dashboard de growth, conectores Meta/Google Ads, **landing pages de campaña** para ads | Canon paid-extension (live) | $39/sede/mo flat; landings self-serve ilimitadas incluidas | Todos |
| **finance** — Finance avanzado | Libro mayor, conciliación bancaria, conexiones ERP | Canon paid-extension | flat/sede; recomendado Business+ (Solo ya trae facturación + receivables + exports) | Business+ |
| **workforce** — HR | Contratos, disponibilidad, carga, inputs de nómina | Canon paid-extension | por asiento de empleado (~$3-5) | Todos |
| **resources** — Biblioteca/inventario | Recursos, equipamiento, stock, instalaciones | Canon: Expansion roadmap → "próximamente" | flat/sede | Todos, cuando esté |
| **implementation** — Migración e integraciones | Migración de datos, integraciones a medida | Canon | one-off, por presupuesto | Todos (típico Enterprise) |

**Landings de pago, decisión de empaquetado:** las landings self-serve de campaña viven DENTRO de growth (no creamos un 9º SKU; necesitan la atribución del mismo pack). La creación done-for-you de landings (agencia) sería una línea de servicios one-off. 📌 [TV: ¿ofrecemos el servicio done-for-you?]

## 3. IA: dos modos (el add-on estrella)

El cliente **no necesita contratar un agente nuevo**:

- **Modo BYO (trae el suyo) — vía MCP: GRATIS.** El cliente conecta su ChatGPT/Claude/servicio existente al MCP server de Akademate y consulta su academia desde ahí, sin coste de conector en ningún plan (decisión comandante 2026-09-07; sustituye al fee de $19 anterior). Canon ya lo declara ("MCP integration layer", "AI workspace and MCP").
- **Modo agente propio — ventana lateral:** nuestro agente embebido en el panel lateral de la app (UI por definir 📌 [TV]). **Incluye una cuota inicial limitada de tokens gratis**; lo de pago son los packs de ampliación, exactamente como ClickUp Brain (créditos + top-ups $10/10K) o Notion AI (metered). Ancla de pack: **$10/10K créditos**; la cuota la comparten admin + instructores. Sin límite de asientos.
- Por qué flat-por-academia y no por asiento: el comprador SMB tiene pocos asientos y rechaza AI-per-seat (Copilot $30/usuario es enterprise-think); cuota + packs es el patrón emergente en vertical SaaS. [H consistente con ClickUp/Notion]

## 4. Anclas de mercado usadas [O]

Signage: Yodeck $8-16/pantalla · ScreenCloud $20 · Pickcel ~$15. Acceso: Kisi from $99/mo por location, $50-80/puerta; Verkada licencias puerta $250-600/año + hardware aparte; tarjetas/fobs $3-10. IA: ClickUp Brain $9/usuario + créditos; Notion metered; Copilot $30/usuario; Fin $0.99/resolución. Landings: Unbounce/Instapage ~$99/mo (nosotros lo empaquetamos, no lo medimos por página). Branded app (referencia futura, Mobile roadmap): Walla +$149/mo + $500 build.

## 5. Expectativas de attach y KPIs

- Attach objetivo software-only: 20-40% [H]; IA proyectada como la de mayor attach (sin fricción de hardware, dolor universal de recepción) y landings la segunda (ligada directamente a ingresos de matrícula).
- Pagos NO es add-on (es core con take-rate): benchmark vertical SaaS 71%+ de attach en pagos embebidos. [O]
- KPIs por add-on: attach %, NRR por expansión (mediana sector 106%), churn del add-on vs plan base.
- Revisión de catálogo: si un add-on queda <10% attach a los 6 meses de lanzado → reempaquetar o absorber en plan.

## 6. Integración en planes (resumen)

Todos los planes ven el marketplace completo. Gates por defecto: finance → Business+; el resto comprable en todos (cuando su estado lo permita). Los add-ons por dispositivo (signage, access) se suman por sede: la cuota escala con pantallas/puertas activas, coherente con el metering por sedes del plan.
