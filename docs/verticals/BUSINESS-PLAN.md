# BUSINESS-PLAN: definición final (auditada con razonamiento bayesiano)

Consume y cierra PLANS-STUDY.md + WIZARD-BRIEF.md. Estado: DECISIONES CERRADAS salvo lo marcado. Fecha: 2026-09-07.

---

## HUD final

HUD · business-plan-audit · review · repo · GO
🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100% · Δ —
Turno cerrado: creencias auditadas con posterior en cubos, 5 preguntas resueltas, plan completo con triggers de revisión (docs/verticals/BUSINESS-PLAN.md).

---

## 1. Auditoría de creencias (prior → posterior)

| # | Creencia | Prior (clase de referencia) | Evidencia (SNR) | Posterior |
|---|---|---|---|---|
| B1 | Escalera 3 tiers con entrada Solo | 75 (patrón universal del sector; WellnessLiving/Arketa venden tiers solo nombrados) | 4 métricas de pricing observadas; anchors solo $0-49 [HIGH] | **90** |
| B2 | Solo SIN límite de miembros (1 sede + 1-3 staff) | 50 (default del sector sería banda por miembros, TeamUp) | Capacidad física de sala limita volumen ~150-400 activos [MEDIUM-HIGH]; conocimiento del operador: 20×7 clases/día [HIGH del comandante]; quejas de precio por miembro en churn de Mindbody [MEDIUM] | **75** |
| B3 | Anclas internas $49 / $149-199 / €500+ | 40 (estimación, no dato) | Anchors competidores [MEDIUM: modelos no comparables 1:1]; nadie publica 2ª-sede-discount [O ausencia] | **60** |
| B4 | 2ª sede incluida en Business; 3ª+ add-on | 40 (bet diferenciador) | Ningún competidor ofrece paso intermedio amable [MEDIUM]; riesgo de dilución vs multiplicador por sede [H] | **60** |
| B5 | Estrategia contabilidad por tiers: sustituir FACTURACIÓN en Solo, CONECTAR en Business | 60 (9/10 del sector conecta; solo Arketa construyó) | 9/10 conectan [HIGH]; gestoría solo 16% voluntaria, 35% sin gestoría [HIGH]; Veri*factu = foso vs competidores USA [MEDIUM] | **90** |
| B6 | Wizard = presets (1 por vertical), plan = caps/versiones | 75 (modelo entitlement como dato es práctica estándar SaaS) | Matriz ya definida en repo (8 extensiones de pago); sin evidencia en contra | **90** |

Autochequeo (§8): B2 y B4 son los más expuestos a defensa. Nombro qué evidencia me movería de cubo:
- B2 baja a 50 si aparece patrón de sedes únicas >750 activos con soporte desproporcionado (no hay señal hoy).
- B4 baja a 40 si el attach de 2ª sede en renovaciones Business queda <40% (estaría regalando la sede 2).

## 2. Recetas de cierre — las 5 preguntas abiertas

### Q1 Facturación en Solo: ¿Veri*factu desde el día 1?
Prior: 50 (compliance builds tardan 2-3× lo estimado, tasa base de software regulatorio).
Evidencia: plazos BOE ya movidos 2 veces → empresas 1-ene-2027, autónomos ~jul-2028 [HIGH]; Contasimple ya lo ofrece gratis en su nicho (presión en facturación pura, no en all-in-one) [MEDIUM]; Akademate aún no tiene facturación nativa [G].
Diagnóstico: la obligación legal NO llega hasta 2027/28; el argumento de venta ("deja de pagar un segundo software") se sostiene con facturas conformes + export ordenado a gestoría; certificar SIF antes de plazo es la decisión cara.
Update: facturas legales ES (series, rectificativas, IVA/IRPF) + exports desde el día 1; certificación SIF como hito previo a 1-ene-2027; badge "Veri*factu ready" cuando esté.
Posterior: **75**. ← Cuello del plan (celda B3): price discovery.

### Q2 Descuento anual
Prior: 50 (convención SaaS -17% vs wellness -10%).
Evidencia: Arketa exige anual para su $49 [MEDIUM]; objeción de lock-in en autónomos [MEDIUM]; churn por contratos en Mindbody [HIGH].
Diagnóstico: anual ayuda caja pero el segmento Solo compra predecibilidad mensual.
Update: Solo = mensual por defecto, anual -17% (2 meses) opcional; propuestas Business anuales-first.
Posterior: **75**.

### Q3 Límite de staff en Solo
Prior: 40 (hard cap simple vs soft cap).
Evidencia: Square gated con $0 el team scheduling [MEDIUM]; sustitutos/monitores parciales frecuentes en yoga/deporte [H].
Diagnóstico: un hard cap de 3 bloquea casos legítimos (4 monitores a media jornada); el coste marginal de un asiento de visión es ~0.
Update: 3 asientos completos incluidos; asientos "instructor" (solo su agenda y su asistencia) gratis hasta 10; >10 asientos instructor o cualquier 4º rol admin → Business.
Posterior: **75**.

### Q4 Trial vs entrada a Solo
Prior: 60 (precios no públicos → trial auto-servivo incoherente).
Evidencia: decisión locked de no publicar precios [HIGH, comandante]; CTA primario demo ya locked [HIGH].
Diagnóstico: coherencia exige founder-led en Solo de momento.
Update: Solo arranca venta asistida con ancla interna; el funnel de trial se abre cuando se publiquen precios (trigger único).
Posterior: **90**.

### Q5 Precio del add-on por sede (3ª+)
Prior: 40 (flat vs bandas, sin datos).
Evidencia: nadie publica multiplicador por sede [O]; complejidad de bandas solo se justifica con volumen [H].
Diagnóstico: flat es cotizable en proposal y evita micro-negociación; bandas pueden llegar vía Enterprise.
Update: flat ≈ 40% del delta Solo→Business (≈ $40-60/mo por sede extra), fijado en proposal; revisar con datos de cuentas 3-5 sedes.
Posterior: **60**.

## 3. PLAN DE NEGOCIO — DEFINICIÓN FINAL

### Tiers
| | **Solo** | **Business** | **Enterprise / Group** |
|---|---|---|---|
| Límites | 1 sede · 3 asientos completos + 10 instructor (solo agenda/asistencia) · miembros sin límite | 2 sedes incluidas · asientos completos ampliados | 3+ sedes · multi-marca |
| Sedes extra | — | 3ª+ add-on flat ≈40% del delta Solo→Business | ilimitadas |
| Web | Subdominio + offer pages + reservas · **dominio propio como add-on** (sin subir de plan) | Dominio propio + CMS + blog/SEO incluidos | Dominios por marca |
| Growth | Captura leads, recordatorios | + CRM pipeline, automatizaciones, conectores ads | + atribución de red |
| Finance | Facturación ES conforme + cobros + receivables + exports gestoría | + conectores: **Holded → QuickBooks → Xero** | + APIs, facturación por sede |
| Multi-sede | — | vista consolidada 2 sedes | gobernanza franquicia, reporte de red |
| Precio | $49/mo interno (anual -17% opcional) | $149-199/mo interno (anual-first) | custom, floor €500+ |
| Venta | Asistida (proposal) | Asistida | Enterprise deal |
| Todas | Marketplace de add-ons visible (catálogo y pricing en [ADD-ONS.md](ADD-ONS.md): access, signage, growth+landings, finance, workforce, resources, agentic con IA en dos modos BYO-MCP/agente-propio); roadmap = "próximamente" no comprable |||

### Reglas transversales
1. Ocultar módulo nunca destruye datos; cambiar de preset/plan reconfigura menú sin migraciones.
2. Upsell triggers ordenados: dominio propio (micro-upsell, disponible desde Solo) · 2ª sede · 4º admin/11º instructor · facturación multi-país · marca propia.
3. Anti-churn: sin setup fee en Solo/Business, mensual disponible, downgrade sin trampas, límites publicados en proposal.
4. Veri*factu: facturas conformes día 1; certificación SIF antes de 1-ene-2027; el foso se comunica cuando esté.
5. **Dominio propio = add-on en TODOS los planes**, sin necesidad de subir de plan. Canon ya existente: en `apps/web/lib/pricing-content.ts` figura como *paid-extension* en Launch e *included* en Business+. Receta: Prior 60 (lo había restringido a Business en v1 de este doc) → Evidencia: canon interno del repo [HIGH] + argumento SEO/brand de la academia (su autoridad de dominio, crítica en verticales de SEO local como autoescuelas/FP) [HIGH] + costes de registro/DNS de terceros siempre facturados aparte (`separatelyBilledItems`) [O] → Posterior **90**. Riesgo de canibalizar Business asumido y acotado: lo que sigue exclusivo de Business es el bundle web completo (CMS + blog/SEO), no el dominio.

### KPIs y triggers de revisión (qué mueve cada cubo)
| Métrica | Umbral de revisión | Decisión en riesgo |
|---|---|---|
| Realización de precio en proposals (Solo) | <40% cierra a $49 o >60% cierra >$79 → re-anclar | B3 (60) |
| Attach 2ª sede en renovación Business | <40% | B4 (60) |
| Sedes únicas >750 activos o soporte 2× media | arriba de eso | B2 (75) |
| T pendientes de conector Holded | 5 tenants piden QBO antes de tiempo | orden B5 |
| Activación Solo (1ª reserva + 1ª factura <14 días) | <50% → onboarding asistido obligatorio | B1 (90) |

### Explícitamente NO decidido hoy
- Publicar precios: único trigger = funnel self-serve validado o cohorte piloto con datos de cierre. No antes.
- Nombre público del tier Solo (interno hasta lanzamiento).
