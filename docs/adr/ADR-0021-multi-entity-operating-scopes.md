# ADR-0021: Entidades juridicas, sedes fisicas y ambitos operativos

- Estado: aceptada para implementacion incremental
- Fecha: 2026-07-28
- Alcance: SaaS Akademate, empezando por CEP

## Contexto

Una sede fisica no identifica necesariamente a la entidad que contrata personal, gestiona una convocatoria o soporta su contabilidad. CEP Norte y CEP Santa Cruz tienen entidades juridicas distintas. ACATEM y APROEM operan transversalmente en ambas sedes, pero esa diferenciacion no debe aparecer en la web publica.

## Decision

Se separan tres conceptos:

1. `legal-entities`: sujeto juridico, fiscal y contable.
2. `campuses`: lugar fisico potencialmente visible en la web.
3. `operating-scopes`: ambito interno virtual, departamento, proyecto o centro de coste.

Las relaciones son explicitas y temporales. Una sede puede tener una entidad operadora principal y entidades compartidas. El personal tiene una relacion laboral con una entidad y asignaciones independientes a sedes. Las convocatorias identifican entidad titular, gestora y financiadora, ademas de sede fisica y ambito interno. Los apuntes de finanzas operativas siempre pertenecen a una entidad juridica y no reutilizan las facturas de suscripcion SaaS.

ACATEM y APROEM se representan como entidades juridicas con un `operating-scope` de tipo `virtual_entity`. No se crean como registros de `campuses`.

## RBAC

El rol base del tenant se conserva por compatibilidad. `scoped-role-bindings` permite restringir un rol a una entidad, sede, ambito interno o convocatoria. Cada binding admite como maximo un ambito primario para evitar permisos ambiguos. Las colecciones organizativas son privadas y tenant-scoped.

## Consecuencias

- Agregar una tercera entidad no requiere cambios de codigo.
- La web publica continua mostrando solo `campuses` activos con `public_visibility=public`.
- Los datos historicos requieren backfill antes de hacer obligatoria la entidad titular de cada convocatoria.
- Toda relacion nueva debe validar que ambos extremos pertenecen al mismo tenant.
- Los informes financieros deben agrupar primero por entidad juridica y luego, opcionalmente, por sede, ambito o convocatoria.

## Alternativas descartadas

- Convertir ACATEM y APROEM en sedes: mezcla identidad juridica con ubicacion y puede filtrarlas a la web publica.
- Añadir columnas booleanas o nombres codificados para ACATEM/APROEM: no escala a una tercera entidad y obliga a desplegar codigo por cada alta.
