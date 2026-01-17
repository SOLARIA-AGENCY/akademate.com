# Runbook: Incident Response

## Objetivo
Coordinar respuesta ante incidentes y minimizar impacto.

## Severidades
- P0: caida total, datos comprometidos
- P1: degradacion grave, funciones criticas afectadas
- P2: degradacion parcial
- P3: impacto menor

## Pasos iniciales
1. Confirmar incidente y alcance.
2. Activar canal de incidentes.
3. Nombrar Incident Commander (IC).
4. Congelar cambios en prod (si aplica).

## Diagnostico
1. Revisar logs y metrics (OTEL).
2. Verificar health checks y dependencias.
3. Identificar rollback viable.

## Mitigacion
1. Aplicar rollback o hotfix controlado.
2. Validar recuperacion de servicios criticos.
3. Comunicar estado a stakeholders.

## Post-mortem
1. Documentar timeline y causa raiz.
2. Acciones correctivas y preventivas.
3. Actualizar runbooks y tests.

## Checklist
- [ ] IC asignado
- [ ] Canal de incidentes activo
- [ ] Mitigacion aplicada
- [ ] Stakeholders informados
- [ ] Post-mortem completado
