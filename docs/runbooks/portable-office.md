# Oficina digital de obra (DFO) – Runbook rápido

Ubicación fija en este proyecto: `infra/solaria-digital-field--operations` (no clonar fuera de la repo de Akademate).

## Prerrequisitos
- Docker Desktop activo.
- Node 22+/pnpm 9+ (solo para scripts auxiliares).

## Preparar entorno
```bash
cd infra/solaria-digital-field--operations
cp .env.example .env   # si .env no existe; valores locales predefinidos
```

## Arranque
- **Mínimo (dashboard + MySQL):**
  ```bash
  docker-compose up -d dashboard-backend mysql
  ```
- **Completo (agentes, minio, redis, postgres, nginx, etc.):**
  ```bash
  docker-compose up -d
  ```
- **Todo-en-uno (un contenedor: MySQL + dashboard):**
  ```bash
  docker compose -f docker-compose.single.yml up -d
  ```

Accesos:
- Dashboard: http://localhost:3030  
  - “Acceso Rápido” o usuario `carlosjperez` / `SolariaAdmin2024!`
- Health: `curl http://localhost:3030/api/health`

## Ingestar avance de Akademate
Desde `infra/solaria-digital-field--operations`:
```bash
pnpm ingest-akademate
```
Lee `docs/PROJECT_MILESTONES.md` y la spec para registrar proyecto/tareas/métricas en MySQL del dashboard.

## MCP (para agentes Codex/Claude)
1) MCP API completo (recomendado):  
   ```bash
   pnpm mcp:dfo   # expone herramientas de proyectos/tareas/alertas/logs vía stdio
   ```
   Config cliente ejemplo:  
   ```json
   "mcpServers": {
     "solaria-dashboard": {
       "command": "pnpm",
       "args": ["-C", "/Users/carlosjperez/Documents/GitHub/akademate.com", "mcp:dfo"]
     }
   }
   ```
2) Opcional UI (navegación): mantener Playwright MCP si necesitas abrir el dashboard en headless:  
   ```bash
   nohup pnpm exec mcp-server-playwright --port 8793 --headless --host 127.0.0.1 >/tmp/mcp-playwright.log 2>&1 &
   ```
3) Smoke UI/API con Playwright (oficina corriendo en :3030):  
   ```bash
   pnpm test:ui:dfo
   ```

## Apagar y desmontar
```bash
docker-compose down -v
```
Elimina contenedores, red y volúmenes (oficina desmontada).

## Notas
- Variables sensibles (`DB_PASSWORD`, `JWT_SECRET`, `MINIO_ROOT_PASSWORD`, `OPENAI_API_KEY`) están en `.env`. Ajusta `OPENAI_API_KEY` si quieres activar features IA.
- Si cambias puertos o dominios, alinea `nginx.conf` y los healthchecks en `docker-compose.yml`.
