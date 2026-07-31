# Prompt optimizado: expansión de la web pública de Akademate

## Objetivo

Rediseñar y ampliar la web pública de Akademate como una landing SaaS B2B de nivel internacional para un sistema operativo configurable que gestiona academias, centros, clubes y programas presenciales, online e híbridos.

La inteligencia artificial es una capacidad opcional dentro de los flujos, no el eje principal de venta. La promesa central es conectar captación, reserva, admisión, pagos, operación académica, campus virtual, comunicación, finanzas y crecimiento en un mismo sistema.

## Fuente funcional

La implementación debe incorporar la conversación compartida `Revisión repositorio akademate.com`, especialmente:

- evolución de formulario de lead a `Reservation & Admissions Engine`;
- modos configurables: información, admisión, reserva, inscripción gratuita, matrícula con pago y lista de espera;
- modelo común `Offering -> Run -> Sessions -> Capacity -> Access -> Price -> Reservation -> Participation`;
- jerarquía `Organization -> Brand -> Location -> Domain -> Offering -> Run -> Payment account`;
- dominios propios y subdominios resueltos por contexto organizativo;
- separación estricta entre la suscripción SaaS y el dinero que paga el participante a la organización;
- arquitectura compatible con Stripe, PayPal, SEPA y APIs financieras mediante adaptadores;
- captación, atribución, Meta Ads, eventos de conversión y conectores MCP;
- perfiles configurables por vertical y capacidades activables;
- casos desde un campus temporal hasta una red de franquicias.

## Audiencia

Propietarios, directores y responsables de operaciones, admisiones, finanzas y formación de:

- centros de formación profesional o reglada;
- academias de idiomas;
- estudios de yoga, pilates y bienestar;
- academias y clubes deportivos;
- campus de verano y programas estacionales;
- escuelas de música, danza y artes escénicas;
- bootcamps y escuelas online por cohortes;
- proveedores de formación corporativa;
- grupos multi-sede y franquicias.

## Arquitectura de información

Mantener las rutas públicas estables y reales:

- `/`: visión, flujo de captación a participación, verticales, módulos, pagos, campus, crecimiento, planes y CTA;
- `/features`: catálogo completo de módulos y capacidades transversales;
- `/pricing`: Launch, Business y Enterprise, sin precios todavía;
- `/blog`, `/sobre-nosotros`, `/contacto` y rutas legales existentes.

## Concepto visual completo

### Design Read

Landing SaaS B2B para operadores de centros, con lenguaje premium, humano y operativo; composición editorial asimétrica, fotografía documental contemporánea, sistema azul Akademate y motion contenido.

### Diales

- `DESIGN_VARIANCE: 7`
- `MOTION_INTENSITY: 6`
- `VISUAL_DENSITY: 4`

### Tesis visual

Mostrar Akademate como la capa invisible que conecta una experiencia humana diversa: una reserva sencilla en la web desencadena capacidad, pagos, comunicación, aprendizaje, asistencia y finanzas coordinadas.

### Plan de contenido

1. Hero full bleed: sistema operativo para cada forma de aprender, entrenar y crecer.
2. Journey transaccional: descubrimiento, reserva, pago, participación, aprendizaje y crecimiento.
3. Verticales: casos reales representados con fotografía y copy específico.
4. Operación: módulos académicos, campus, comunicación y finanzas.
5. Captación: campañas, Meta Ads/MCP, atribución, CRM y conversión.
6. Pagos: Stripe, PayPal, SEPA, conciliación y entidad receptora.
7. Pricing: Launch, Business y Enterprise.
8. Confianza, recursos y CTA final.

### Tesis de interacción

- entrada escalonada del hero para fijar jerarquía;
- carrusel horizontal accesible de verticales con scroll-snap, no autoplay agresivo;
- revelado suave de etapas del journey y zoom mínimo en imágenes al hover;
- respetar `prefers-reduced-motion`.

## Restricciones de diseño

- inglés como idioma principal;
- hero dentro del primer viewport, CTA visible y texto breve;
- fotografías sin texto incrustado, marcas, logos ni interfaces falsas;
- una sola familia de iconos, la ya instalada en el proyecto;
- una paleta coherente: azul noche, blanco, azul eléctrico y grises fríos;
- radios consistentes: botones pill, medios y superficies 24-32 px;
- máximo un eyebrow cada tres secciones;
- evitar grids de cards genéricas y secciones zigzag repetitivas;
- responsive explícito para cada composición;
- sin claims de certificación, clientes ficticios ni métricas inventadas;
- no añadir trackers de terceros ni código de consentimiento mientras no existan trackers;
- no modificar rutas, textos legales ni el flujo de consentimiento existente.

## Copy y claims

- vender el resultado operativo, no el estado del desarrollo;
- nombrar Stripe, PayPal, SEPA, finance APIs, Meta Ads y MCP dentro de una arquitectura de integración configurable;
- indicar en pricing que la disponibilidad exacta de integraciones se define durante el onboarding, sin lenguaje defensivo;
- mantener los frameworks regulatorios como referencias informativas, nunca como certificaciones;
- CEP Formación puede permanecer como única referencia real visible; otros nombres no deben presentarse como clientes.

## Quality Gate

- contenido centralizado y reutilizado por landing, features y pricing;
- enlaces y navegación reales;
- imágenes originales persistidas dentro de `apps/web/public/images/marketing`;
- tests adversariales de contenido, claims, rutas, trackers y pricing;
- typecheck, tests, build y E2E de `apps/web`;
- QA visual desktop 1440x900 y móvil 390x844;
- consola y red sin errores;
- commit/push separados de cualquier despliegue;
- despliegue solo de `apps/web`, nunca CEP.
