# Despliegue rápido (SOLARIA Digital Field Operations)

1) Preparar `.env`
```
cp .env.example .env
# Rellenar DB_PASSWORD, MYSQL_ROOT_PASSWORD, JWT_SECRET, MINIO creds, OPENAI_API_KEY (opcional)
# Ajustar REPO_PATH al repo de Akademate en tu máquina/host
```

2) Build & run (local/prod simple)
```
docker-compose up -d --build
```
- Dashboard: http://localhost:3000
- Credenciales seed: carlosjperez / SolariaAdmin2024! (puedes cambiarlas en MySQL `users`)

3) Ingestar proyecto Akademate (importa spec/milestones al dashboard)
```
pnpm ingest-akademate
```

4) Parar/limpiar
```
docker-compose down -v
```

Notas
- Autologin activado para uso local; si expones, deshabilita quick login y rota credenciales.
- Si activas agentes IA, define OPENAI_API_KEY en `.env`.
- Servicios opcionales (redis/minio/postgres/agent-manager/document-processor) están listos; puedes comentar en docker-compose si no los usas.
