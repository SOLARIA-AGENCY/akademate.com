# Runbook: Oficina Digital de Campo (DFO) – v2.0

## 1) Prerrequisitos
- Docker y Docker Compose operativos
- Node 22+ y pnpm 9+ (para scripts/mcp/tests)
- Puertos libres: 3030 (dashboard), 6379 (Redis), 33060 (MariaDB externo)

## 2) Levantar oficina (single-container + Redis + Worker)
```bash
cd infra/solaria-digital-field--operations
docker compose -f docker-compose.single.yml up -d
```

## 3) Verificar servicios
```bash
# Ver estado de contenedores
docker compose -f docker-compose.single.yml ps

# Health check
curl http://localhost:3030/api/health

# Logs
docker compose -f docker-compose.single.yml logs -f office
```

## 4) Ingesta de proyecto
```bash
# Akademate (por defecto)
bash scripts/ingest-project.sh "Akademate.com" ../../docs/PROJECT_MILESTONES.md

# Otro proyecto
bash scripts/ingest-project.sh "Mi Proyecto" /path/to/MILESTONES.md
```

## 5) Credenciales Estandarizadas

| Servicio | Usuario | Password |
|----------|---------|----------|
| Dashboard | carlosjperez | bypass |
| Dashboard (API) | userId: carlosjperez | password: bypass |
| MariaDB root | root | SolariaRoot2024 |
| MariaDB app | solaria_user | solaria2024 |

> **NOTA**: Passwords sin caracteres especiales (!@#$%) para evitar problemas de escaping en bash.

## 6) API Quick Reference

### Login
```bash
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"carlosjperez","password":"bypass"}'
```

### Usar token
```bash
TOKEN="<token_del_login>"
curl http://localhost:3030/api/projects -H "Authorization: Bearer $TOKEN"
curl http://localhost:3030/api/tasks -H "Authorization: Bearer $TOKEN"
curl http://localhost:3030/api/agents -H "Authorization: Bearer $TOKEN"
```

## 7) BullMQ Queues

El sistema incluye colas para procesamiento asíncrono:

| Cola | Descripción | Concurrencia |
|------|-------------|--------------|
| agent-tasks | Tareas de agentes IA | 5 |
| code-analysis | Análisis de código | 3 |
| project-sync | Sincronización de proyectos | 2 |
| notifications | Alertas y notificaciones | 10 |

### Ver estado de Redis
```bash
docker exec solaria-digital-field--operations-redis-1 redis-cli INFO
```

## 8) MCPs (opcional)
```bash
# API completa (tasks/projects/alerts/logs)
pnpm mcp:dfo

# UI/headless con Playwright
pnpm mcp:playwright
```

## 9) Tests
```bash
# Health check rápido
curl -f http://localhost:3030/api/health && echo "OK"

# Tests completos
bash dashboard/tests/api-tests.sh
```

## 10) Teardown
```bash
# Detener sin eliminar datos
docker compose -f docker-compose.single.yml down

# Detener y eliminar volúmenes (limpieza total)
docker compose -f docker-compose.single.yml down -v
```

## 11) Troubleshooting

### Dashboard no responde
```bash
docker compose -f docker-compose.single.yml restart office
docker compose -f docker-compose.single.yml logs office
```

### Error de conexión a base de datos
```bash
# Verificar que MariaDB está corriendo
docker exec solaria-digital-field--operations-office-1 mariadb-admin ping

# Verificar usuario
docker exec solaria-digital-field--operations-office-1 \
  mariadb -usolaria_user -psolaria2024 solaria_construction -e "SELECT 1"
```

### Redis no conecta
```bash
docker compose -f docker-compose.single.yml restart redis
docker exec solaria-digital-field--operations-redis-1 redis-cli PING
```

### Worker no procesa jobs
```bash
docker compose -f docker-compose.single.yml logs worker
docker compose -f docker-compose.single.yml restart worker
```

## 12) Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────┐   │
│  │    office    │    │    redis    │    │    worker    │   │
│  │  (MariaDB +  │◄──►│  (BullMQ    │◄──►│  (BullMQ     │   │
│  │  Dashboard)  │    │   Queues)   │    │   Workers)   │   │
│  │  :3030       │    │  :6379      │    │              │   │
│  │  :33060(DB)  │    │             │    │              │   │
│  └──────────────┘    └─────────────┘    └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Queues:
  - agent-tasks     → Tareas de agentes IA
  - code-analysis   → Análisis de código
  - project-sync    → Sincronización externa
  - notifications   → Alertas y notificaciones
```

---

**SOLARIA Digital Field Operations v2.0**
