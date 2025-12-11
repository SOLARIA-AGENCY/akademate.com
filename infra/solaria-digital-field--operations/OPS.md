# Oficina Digital de Campo – Operación en sitio (Akademate)

## Servicios vivos (docker-compose)
- `dashboard-backend` (puerto 3000): UI C-Suite, MySQL.
- `mysql` (3306): datos del dashboard/PMO.
- `nginx` (80/443): proxy hacia dashboard (no TLS en local).
- `solaria-backend` (3001): placeholder API; no crítico para reporting.
- Otros (redis/minio/agent-manager/document-processor/postgres) están en stack pero hoy no se usan; se pueden apagar si se desea.

## Accesos
- Dashboard: http://localhost:3000
- Usuario: `carlosjperez`
- Password: `SolariaAdmin2024!`
- Health: `curl http://localhost:3000/api/health`

## Operación diaria (por Codex)
1) Mantener contenedores: `docker-compose ps` / `docker-compose logs -f dashboard-backend`.
2) Ingestar estado de Akademate: `pnpm ingest-akademate` (lee docs/PROJECT_MILESTONES.md y spec; crea/actualiza proyecto/tareas/métricas en MySQL).
3) Actualizar métricas: tras correr tests de Akademate (`pnpm test` en raíz), registrar progreso en dashboard con el script anterior.
4) Seguridad: credenciales seed rotadas; usar JWT_SECRET del .env. Si se expone, desactivar cualquier bypass dev.

## Scripts útiles
- `pnpm ingest-akademate`: ingesta no interactiva de milestones/spec al dashboard.
- `docker-compose up -d --build`: levantar stack en sitio.
- `docker-compose down -v`: apagar y limpiar volúmenes.

## Ubicación
- Repo principal: `/Users/carlosjperez/Documents/GitHub/akademate.com`
- Oficina acoplada: `/Users/carlosjperez/Documents/GitHub/solaria-digital-field--operations` (anidada en `infra/` del proyecto).

## Flujo esperado
- Codex ejecuta ingestión + sincronización tras cada avance.
- CEO revisa dashboard C-Suite para progreso en tiempo real.
