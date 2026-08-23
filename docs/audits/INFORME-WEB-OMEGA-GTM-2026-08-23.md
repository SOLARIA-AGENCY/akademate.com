# Auditoría WEB pública Akademate — Go-to-Market premium
**Firma:** WEB-Ω · **Fecha:** 23 ago 2026 (Europe/Madrid) · **Ámbito:** akademate.com (marketing público, no SaaS admin)  
**URL auditada:** https://akademate.com (Cloudflare + Next.js) · ES/EN · Cliente vivo: https://cepformacion.akademate.com/

## Veredicto ejecutivo
La web **ya se siente SaaS premium de primera línea en capa visual y narrativa de producto**. El problema no es “falta de diseño”: es **confianza comercial y legal incompleta** + **fricciones de conversión** que impiden salir a vender con seguridad ante un comprador B2B serio (director de academia / CFO / DPO).

**Estado:** listo para marketing visual · **no listo para cierre comercial** hasta cerrar legales + identidad + producto de entrada + prueba social real.

## Scores /10
| Eje | Score | Lectura |
|---|---|---|
| Funcional (capa pública) | **6.5** | Rutas marketing OK; login app **503**; redes = búsquedas; form contacto client-side |
| UX / journeys | **7.5** | Nav clara, CTAs demo, pricing y verticales bien armados; demasiado “roadmap/próximamente” |
| Visual / marca | **8.5** | Hero, tipografía, navy, mockups multi-device, densidad premium |
| Confianza–conversión | **4.5** | Legales en borrador, datos empresa “pendientes”, badges de gobierno fáciles de malinterpretar, sin precios públicos, redes fake |
| **Media ponderada GTM** | **~6.2** | Premium en apariencia; frágil en “puedo firmar contigo hoy” |

## Hallazgos (crítico → bajo)

### CRÍTICO
1. **Legales en modo borrador público** (`/es/legal/privacidad`, términos, cookies, subencargados, IA). Banner ámbar: *“Información legal de trabajo sometida a revisión profesional…”*. Registro, IVA, domicilio Estonia, Malmö y canal privacidad = **“Pendiente de validación”**. Un comprador/DPO lo lee como *no apto para contrato*.
2. **Identidad mercantil incompleta** en sitio. Solo se nombra SOLARIA AGENCY OÜ sin código registral, VAT ni domicilio publicados. Bloquea confianza fiscal/LSSI y anexos DPA.
3. **Entrada al producto rota:** `/login` → `https://app.akademate.com/auth/login` responde **503**. Matar la promesa “sistema operativo” en el primer clic de “entrar”.

### ALTO
4. **Sin Aviso legal** (404 en `/aviso-legal`, `/es/aviso-legal`, `/legal/aviso-legal`). Para mercado ES/UE de servicios digitales es señal de inmadurez (aunque la entidad sea estonia).
5. **Redes sociales = URLs de búsqueda** (Instagram explore search, Facebook search, X search). Aspecto “placeholder”, no marca.
6. **Trust badges ISO 27001 / SOC 2 / OWASP** en Empresa como *“Referencia de gobierno”* / hoja de ruta. Riesgo de **greenwashing percibido** si el visitante cree que están certificados. Hay que etiquetar con brutal claridad o quitar logos de certificación hasta tener evidencia.
7. **Pricing sin precio** (“Propuesta a medida” en Launch/Business/Enterprise). Válido enterprise, pero debilita Launch self-serve y campañas de paid. FAQ lo explica; aún así frena cualificación rápida.
8. **Prueba social débil:** un caso CEP Formación + métricas/mock UI (1.284 alumnos, Creative Leadership…). Faltan logos reales, quotes con cargo, ROI, case study con números auditables.

### MEDIO
9. **Raíz default EN** (`lang="en"` en `/`). Mercado primario ES/CEP → pérdida de relevancia y fricción.
10. **Exceso de “próximamente”** (apps Mac/iPhone, Holded/Xero/QBO, muchos conectores “hoja de ruta”). Premium SaaS vende *capacidad demostrable hoy*; el resto va a roadmap privado o Trust Center.
11. **OG hero = foto stock oficina** (hombre + sala de reuniones). No refuerza producto; diluye positioning “operations platform”.
12. **Contacto** muestra “Loading form…” en fetch estático; dependencia JS. Debe degradar bien y confirmar envío + SLA respuesta.
13. **Sin LinkedIn corporativo** en footer (B2B SaaS casi obligatorio).
14. **Subencargados** sin inventario publicado (“se está validando”). Imprescindible para DPA/RGPD B2B.

### BAJO
15. Sitemap/robots/hreflang/OG/Twitter card: bien montados.
16. Headers de seguridad (HSTS, CSP, X-Frame-Options DENY, etc.): sólidos en marketing.
17. Cookies: postura honesta (sin analytics aún; consentimiento futuro documentado). Bien para no incumplir; mal para medir funnel hasta activar CMP + GA4/Meta con bloqueo previo.
18. Blog con 3 piezas (jul 2026): base SEO OK, aún no autoridad.

## Qué ya está a nivel “primera línea”
- Posicionamiento claro: *“El sistema operativo para academias”* / *Run the whole academy*.
- Arquitectura de oferta: Launch · Business · Enterprise + módulos de pago + matriz de capacidades.
- Verticalización (FP, wellness, deporte, idiomas, temporada, artes, online, redes).
- Narrativa de roles (equipo / docentes / alumnado) + journey reserva→pago con consentimiento.
- Centro de confianza estructural (privacidad, cookies, términos, subencargados, IA).
- i18n ES/EN + SEO técnico base.
- Diseño visual denso, contemporáneo, comparable a SaaS edtech/ops premium.

## Gap para “salir a vender y marketear”
Checklist mínimo de **go-live comercial** (sin esto, no campaigns serias ni demos a escala):

| # | Debe | Dueño típico |
|---|---|---|
| 1 | Publicar datos mercantiles reales (OÜ + registro + VAT + domicilio) y quitar banner ámbar | Legal + Comandante |
| 2 | Aviso legal + privacidad/Términos/DPA listos (abogado UE) + canal privacy@ | Legal |
| 3 | Inventario de subencargados real (hosting, email, pagos, IA) | Legal + Ops |
| 4 | app.akademate.com login 200 + mensaje de estado si mantenimiento | BUILD / infra |
| 5 | Perfiles reales LinkedIn (+ IG/X opcionales) o quitar iconos | Marketing |
| 6 | Relabel badges: “marcos de referencia” vs “certificado”; o Trust Center con evidencia | Marketing + Seguridad |
| 7 | 1 case study CEP con captura real + quote + métrica | Marketing + WEB |
| 8 | Precio ancla Launch (desde X €/mes o “desde pack temporada”) O calculadora de alcance | Comercial |
| 9 | CMP + analytics solo post-consentimiento | WEB + Legal |
| 10 | Default locale ES para visitantes ES; EN como x-default documentado | WEB |
| 11 | Sustituir OG stock por captura producto + marca | Diseño |
| 12 | SLA respuesta demo (<24h laborables) visible en contacto | Comercial |

## 7 acciones priorizadas (orden de impacto GTM)
1. **Cerrar legales y datos de empresa** (quitar “pendiente” y banner). Bloqueo #1 de venta.
2. **Reparar app login (503)** o desviar CTA “entrar” a demo hasta que esté verde.
3. **Case study CEP Formación** (hero social proof) + 2–3 logos más si existen.
4. **LinkedIn + limpiar iconos sociales** (nada de search URLs).
5. **Clarificar trust badges** / Trust Center honesto (RGPD-ready ≠ ISO certificado).
6. **Anclar Launch con precio o pack** para paid ads y outbound.
7. **Activar medición con CMP** (GA4 + Meta CAPI) y page default ES.

## Journey conversión actual (resumen)
`Home → Book a demo → /contacto?asunto=demo` (formulario con consentimiento privacidad). Alternativas: pricing CTAs, verticales, features. No hay self-serve signup público evidente. Modelo sales-led: correcto para Business/Enterprise; Launch necesita fricción baja.

## Evidencia (URLs clave)
- Home ES: https://akademate.com/es  
- Pricing: https://akademate.com/es/pricing  
- Contacto: https://akademate.com/es/contacto  
- Privacidad (borrador): https://akademate.com/es/legal/privacidad  
- Login app: https://app.akademate.com/auth/login → **503**  
- Tenant demo: https://cepformacion.akademate.com/  
- Screens: `/workspace/akademate-audit/marketing/01-browser-shot-a.png`, `03-browser-shot-c.png`, `og-hero.jpg`

## Nota de coordinación
Sin solape con AUDIT-Ω (SaaS admin OVH). Fixes de producto/login → BUILD-Ω. Esta auditoría es **capa pública / marketing / legal / conversión**.

— WEB-Ω

---

## Anexo A — Sistema de diseño de mockups (marketing vs app real)
**Firma:** WEB-Ω · Evidencia: `marketing/home-es.png`, `home-en.png`, `features.png`, `pricing.png`, `legal-privacidad.png` vs admin real `02-dashboard.png`

### Veredicto DS
Los mockups de la web pública proyectan un **producto 1–1,5 niveles por encima** de la app admin real. No es solo “más bonito”: es otro **contrato visual** (densidad narrativa, datos vivos, composición editorial, profundidad). Eso es una ventaja de marketing y un **riesgo de expectativa** en demo: el comprador espera la UI del mockup y recibe un dashboard más genérico/shadcn con estados vacíos.

### Tokens reales del sitio marketing (extraídos del CSS live)
| Token | Valor |
|---|---|
| Font | **Inter** (variable 100–900), `--font-sans` |
| Brand navy (texto/CTA) | `#071633` |
| Hero / trust / footer | `#06142f` → `#050f24` / `#03102a` |
| Primary (acciones UI) | HSL `224 71% 48%` ≈ azul `#2563eb` |
| Surface page | `--background: 0 0% 97%` (gris frío ~#F7F7F8) |
| Foreground | `222 47% 11%` |
| Muted text | `220 9% 46%` (slate) |
| Border / input | `220 13% 91%` |
| Success / warning / info | tokens semánticos definidos |
| Radios | `--radius-surface: 1rem` · `--radius-control: 0.75rem` · pills `9999px` |
| Textura hero | `.product-texture` = grid 64px + glow radial azul |
| Stack | Tailwind + shadcn-like CSS vars (light/dark) |

### Anatomía del DS en mockups de producto (lo que se vende)
1. **Paleta de mando**  
   Navy casi-negro para “sistema operativo” + azul medio para acción + blanco de contenido + slate para meta. Accents de dato (verde tendencia, naranja/ámbar en charts financieros del pricing mock).

2. **Tipografía editorial SaaS**  
   Headlines grandes, tracking negativo fuerte (`tracking-[-0.045em]` en legales), peso semibold/extrabold. Body con line-height generoso (~1.6–1.75). En mockups: KPIs enormes (1.284) como objeto visual, no como tabla.

3. **Jerarquía de superficies**  
   - Marketing shell: hero navy texturado → bandas blancas → bandas navy de cierre.  
   - App-in-app: sidebar oscura + canvas claro + **cards blancas** con borde sutil (no sombra dura).  
   - Capsule CTAs (`rounded-full`) vs cards `rounded-2xl` / `1–1.5rem`.

4. **Componentes estrella en mockups**  
   - **Device stack** (desktop + tablet + phone) con biseles finos y overlap.  
   - **Glass / capas** (tarjetas translúcidas sobre dashboard).  
   - **Checkout de curso** tipo Stripe: foto lifestyle + rating + avatares + radio pricing + wallet icons + CTA primario dominante.  
   - **Command centre**: KPI cards + sparkline/trend + lista de sesiones del día + “Admissions pulse” en navy.  
   - **Pricing triad**: card central Business invertida (navy) = patrón classic premium.  
   - **Module cards** con iconos line thin + bullets cortos + badge “Paid extension”.

5. **Espaciado y ritmo**  
   Márgenes de sección generosos (sensación “respirable”). Mockups nunca se ven apretados: padding interno de cards alto. Eso es el 40% del feeling premium.

6. **Iconografía**  
   Lucide/line, stroke ~2, peso alineado a Inter. Sin iconos “cartoon”. Badges de compliance (GDPR, EU AI Act) tratados como objetos de marca en footer.

7. **Motion / estado (implicado)**  
   Tabs Operate/Publish/Enrol, role switchers, filtros. Aunque sean estáticos en captura, el DS promete **estados claros** (selected = fondo claro + check).

### Gap mockup marketing ↔ app real (admin)
| Dimensión | Mockup marketing | App real (dashboard audit) | Gap |
|---|---|---|---|
| Densidad de historia | Escenas con datos vivos, fotos, charts llenos | Ceros, gauges vacíos, charts sin serie | Alto |
| Composición | Editorial / “Apple keynote” | Admin utilitario 2 columnas | Alto |
| Profundidad | Overlap, glass, device frames | Plano: sidebar + cards | Medio-Alto |
| Color de acento en datos | Charts multi-color controlados | Azul + gris, más monótono | Medio |
| Empty states | Casi inexistentes en marketing | Dashboard “0” dominante | Crítico para demos |
| Crowns / gating visual | Ausente en mockups | Crowns en Finanzas/Campus | Diferencia de modelo |
| FAB chat | No en mockups de producto | FAB azul esquina | Ruido vs promesa limpia |
| Coherencia tipográfica | Inter + tracking de marketing | Misma familia, menos escala hero | Medio |

**Conclusión de gap:** el marketing ya tiene el **north-star visual**. La app real comparte ADN (navy sidebar, Inter, cards, azul primario) pero aún no aplica la **gramática premium** de los mockups (datos teatrales, composición, empty states de lujo, depth).

### Implicaciones GTM (importante)
- **Ventaja:** la web ya vende “primera línea”.  
- **Riesgo:** demos y trials defraudan si el admin no se acerca al mockup en 30 segundos.  
- **Acción de producto/diseño (para BUILD / design):** adoptar el marketing DS como **source of truth** del producto, no al revés.

### Spec mínima para alinear producto al DS de mockups (backlog visual)
1. **Dashboard “filled demo mode”** con datos de teatro (como 1.284 / 18 / 92%) + empty states premium si tenant vacío.  
2. **KPI card pattern** del command centre (número XL + delta + label + opcional sparkline).  
3. **Sidebar**: misma densidad y labels que mock; revisar crowns (sustituir por “Business” badge más fino).  
4. **Enrollment public page** del mock → priorizar como superficie real (es el screenshot más convertible).  
5. **Depth kit**: 1 shadow elevation + 1 glass optional + device frame solo en marketing (no en app).  
6. **Quitar o rediseñar FAB chat** en demos (rompe la foto limpia).  
7. **Documentar tokens** en un Design System interno: navy `#071633`, primary HSL, radius surface/control, Inter scale (Display / Title / Body / Meta).  
8. **Una sola fuente de verdad Figma** = frames de marketing mockups → componentes app.

### Score específico Design System
| Sub-eje | Score /10 |
|---|---|
| Coherencia marketing site | **9.0** |
| Fidelity / polish de mockups producto | **9.0** |
| Paridad app real ↔ promesa visual | **5.0** |
| Documentación/tokens reutilizables | **6.5** (existen en CSS; faltan guía y adopción producto) |
| **DS listo para vender la marca** | **Sí** |
| **DS listo para que el producto cumpla la promesa** | **Aún no** |

— WEB-Ω

---

## Anexo B — Higiene HTTP / infra (scan complementario)
Fuente: `/workspace/akademate-audit/http-scan.md` · verificado WEB-Ω

| Hallazgo | Severidad GTM | Detalle |
|---|---|---|
| `academy.akademate.com` **no resuelve DNS** | Medio | El mock de home cita `academy.akademate.com/creative-leadership` como ejemplo de página pública de curso → enlace muerto en narrativa |
| HTTP sirve 200 **sin redirect a HTTPS** | Medio | `http://akademate.com` y `http://www…` entregan HTML; HSTS está en respuesta pero falta 301 canónico |
| Apex y www **sin redirect canónico** | Bajo-Medio | Ambos 200 con contenido gemelo → SEO duplicado / señal de marca floja |
| Sin JSON-LD / schema.org | Bajo | Oportunidad Organization + SoftwareApplication + FAQ |
| CEP legales → login | Bajo (tenant) | En cepformacion, rutas legales/robots redirigen a auth; no es el marketing host |

Acción infra rápida: Cloudflare 301 HTTP→HTTPS + www→apex (o al revés) + DNS/página real para el subdominio de ejemplo o cambiar el copy del mock.

— WEB-Ω
