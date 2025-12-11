# Runbook: Oficina Digital de Campo (DFO) – Arranque rápido

## 1) Prerrequisitos
- Docker operativo.
- Node 22+ y pnpm 9+ (para scripts/mcp/tests).
- Puertos libres: 3030 (dashboard) y 3306 (MariaDB interna).

## 2) Levantar oficina (single-container)
```bash
cd infra/solaria-digital-field--operations
docker compose -f docker-compose.single.yml up -d
```

## 3) Ingesta de proyecto (Akademate por defecto)
```bash
pnpm ingest-akademate
```

## 4) MCPs
- API completa (tasks/projects/alerts/logs):
  ```bash
  pnpm mcp:dfo
  ```
- UI/headless opcional (navegación):
  ```bash
  pnpm mcp:playwright
  ```

## 5) Checks y tests
```bash
pnpm health           # /api/health
pnpm test:ui:dfo      # smoke UI/API con Playwright
```

## 6) Accesos
- Dashboard: http://localhost:3030
- Credenciales seed: `carlosjperez` / `SolariaAdmin2024!`

## 7) Teardown
```bash
docker compose -f docker-compose.single.yml down -v
```

## Notas
- Las contraseñas seed se reescriben en cada arranque por el entrypoint (hash de `SolariaAdmin2024!`).
- MCP DFO usa auth por API; mantener oficina arriba antes de llamar a herramientas.
