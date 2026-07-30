# Migracion multi-entidad

## Objetivo

Migrar un tenant sin cambiar inicialmente su web publica y sin inventar razones sociales o identificadores fiscales.

## Precondiciones

- Backup verificado de PostgreSQL.
- Inventario firmado por administracion: razon social, NIF/CIF y entidad principal de cada sede.
- Listado de personal con empleador contractual y porcentajes de asignacion por sede.
- Listado de convocatorias con entidad titular, gestora y financiadora.

## Orden de ejecucion

1. Aplicar la migracion de esquema. Las nuevas relaciones de convocatorias son inicialmente nullable.
2. Crear las entidades juridicas con identificadores estables. Crear ACATEM y APROEM sin inventar CIF si falta el dato.
3. Crear un ambito `virtual_entity` interno para ACATEM y otro para APROEM.
4. Registrar la entidad principal de CEP Norte y CEP Santa Cruz mediante `site-entity-relationships` con rol `primary_operator`.
5. Añadir ACATEM/APROEM en ambas sedes como `shared_operator` cuando proceda.
6. Crear relaciones laborales y asignaciones temporales del personal. La suma activa por persona no debe superar 100% salvo excepcion documentada.
7. Backfill de `owner_legal_entity` en todas las convocatorias; completar gestora, financiadora y ambito cuando corresponda.
8. Asignar entidad juridica a cada apunte financiero y reconciliar totales antes/despues por periodo.
9. Comprobar que la API publica solo devuelve sedes fisicas activas y publicas.
10. Cuando no queden convocatorias sin titular, endurecer `owner_legal_entity` a NOT NULL en una segunda migracion.

## Despliegue por fases

1. Staging: backup, migracion, dry-run del bootstrap, tests y consultas de reconciliacion.
2. Produccion fase A: desplegar codigo compatible con campos nullable y aplicar solo la migracion causal.
3. Produccion fase B: cargar configuracion legal verificada, relaciones de sedes, personal y convocatorias.
4. Observacion: 24 horas revisando errores de acceso, registros sin tenant y diferencias de informes.
5. Produccion fase C: hacer obligatoria la entidad titular de convocatoria cuando el contador pendiente sea cero.

No ejecutar el bootstrap `--apply`, el backfill ni el endurecimiento en el mismo paso de despliegue.

El bootstrap es idempotente y simula por defecto:

```bash
pnpm --filter @akademate/tenant-admin bootstrap:multi-entity ../../docs/data/cep-multi-entity.bootstrap.example.json
# Solo despues de completar y revisar entidades/sedes:
pnpm --filter @akademate/tenant-admin bootstrap:multi-entity ruta/config-verificada.json --apply
```

## Reconciliacion obligatoria

```sql
SELECT count(*) FROM course_runs WHERE owner_legal_entity_id IS NULL;
SELECT count(*) FROM staff WHERE tenant_id IS NULL;
SELECT tenant_id, legal_entity_id, count(*) FROM financial_entries GROUP BY 1, 2 ORDER BY 1, 2;
SELECT tenant_id, center_id, count(*) FILTER (WHERE is_primary AND active)
FROM site_entity_relationships GROUP BY 1, 2;
```

El primer resultado debe ser cero antes del endurecimiento. El tercero debe devolver exactamente una relacion principal activa por sede fisica, salvo excepcion temporal aprobada.

## Rollback

- Antes del backfill: revertir la migracion de esquema.
- Despues del backfill: exportar primero las nuevas tablas; retirar el consumo de campos multi-entidad; solo entonces ejecutar `down`.
- Nunca convertir un ambito virtual en sede para conservar datos durante el rollback.

## Datos pendientes de CEP

La configuracion no incluye por ahora nombres fiscales ni CIF de las entidades asociadas a CEP Norte y CEP Santa Cruz. Esos valores deben aportarse y verificarse antes de producción. ACATEM y APROEM pueden registrarse por nombre operativo con `tax_id` vacio hasta que administracion lo valide.
