# INSTRUCCIONES DE ROTACIÓN DE SECRETOS - P0-001

**Tarea:** P0-001 - Rotar PAYLOAD_SECRET [SEC-001]
**Prioridad:** P0 - CRÍTICO
**Fecha:** 15 Enero 2026

---

## 🚨 PROBLEMA IDENTIFICADO

La auditoría de seguridad (docs/AUDIT_REPORT_DIC2025.md) indica que **PAYLOAD_SECRET** está expuesto en archivos locales:

- `apps/tenant-admin/.env`
- `apps/tenant-admin/.env.local`
- `apps/tenant-admin/apps/cms/.env.local`
- `apps/payload/.env.local`

**Riesgo:** Compromiso total de autenticación JWT si estos secretos son conocidos por terceros.

---

## ✅ ESTADO ACTUAL VERIFICADO

1. **Archivos .env en git history:** ✅ **NO** (correctamente ignorados por .gitignore)
2. **Secretos hardcodeados en código:** ✅ **NO** (solo referencias en tests y docs)
3. **.gitignore configurado correctamente:** ✅ **SÍ** (`.env` y `.env.*` están ignorados)

---

## 🔐 NUEVOS SECRETOS GENERADOS

### Para producción (usar estos valores):

```bash
# apps/tenant-admin/.env
PAYLOAD_SECRET=9c+tl3mNNum/VAlpu3i4MSbIczWQWVUaQQYh75hQtF0=

# apps/payload/.env
PAYLOAD_SECRET=9c+tl3mNNum/VAlpu3i4MSbIczWQWVUaQQYh75hQtF0=

# apps/tenant-admin/apps/cms/.env.local
PAYLOAD_SECRET=cep_local_dev_secret_2025_ROTATED_20260115

# Para cada app que use PAYLOAD_SECRET, usar el mismo secreto
# para consistencia en el monorepo
```

---

## 📝 PASOS DE EJECUCIÓN MANUAL

### Paso 1: Hacer backup de los secretos actuales

```bash
# Opcional: hacer backup antes de rotar
cp apps/tenant-admin/.env apps/tenant-admin/.env.backup
cp apps/payload/.env.local apps/payload/.env.local.backup
```

### Paso 2: Actualizar cada archivo .env

Edita manualmente los siguientes archivos y reemplaza el valor de `PAYLOAD_SECRET`:

**Archivo:** `apps/tenant-admin/.env`

```bash
# ANTES
PAYLOAD_SECRET=sArEf4WBkPB4IqaF0fNLj/vg3oAprZSA97keN5WnvSw=

# DESPUÉS
PAYLOAD_SECRET=9c+tl3mNNum/VAlpu3i4MSbIczWQWVUaQQYh75hQtF0=
```

**Archivo:** `apps/payload/.env.local`

```bash
# ANTES
PAYLOAD_SECRET=sArEf4WBkPB4IqaF0fNLj/vg3oAprZSA97keN5WnvSw=

# DESPUÉS
PAYLOAD_SECRET=9c+tl3mNNum/VAlpu3i4MSbIczWQWVUaQQYh75hQtF0=
```

**Archivo:** `apps/tenant-admin/apps/cms/.env.local`

```bash
# ANTES
PAYLOAD_SECRET=cep_local_dev_secret_2025

# DESPUÉS
PAYLOAD_SECRET=cep_local_dev_secret_2025_ROTATED_20260115
```

**Archivo:** `apps/tenant-admin/.env.local` (si existe)

```bash
# ANTES
PAYLOAD_SECRET=sArEf4WBkPB4IqaF0fNLj/vg3oAprZSA97keN5WnvSw=

# DESPUÉS
PAYLOAD_SECRET=9c+tl3mNNum/VAlpu3i4MSbIczWQWVUaQQYh75hQtF0=
```

### Paso 3: Verificar que las apps arrancan

```bash
# Levantar tenant-admin
pnpm --filter @akademate/tenant-admin dev &

# Esperar unos segundos
sleep 10

# Verificar health endpoint
curl http://localhost:3009/api/health

# Debería responder con 200 OK
```

```bash
# Levantar payload
pnpm --filter @akademate/payload dev &

# Esperar unos segundos
sleep 10

# Verificar health endpoint
curl http://localhost:3003/api/health

# Debería responder con 200 OK
```

### Paso 4: Verificar que no hay secretos en git

```bash
# Verificar que los archivos .env no están en git
git status

# Debería mostrar:
# On branch main
# nothing to commit, working tree clean
```

```bash
# Verificar que no hay secretos en el history
git log --all --full-history --source -- "*PAYLOAD_SECRET*"

# Debería mostrar output vacío o sin commits relevantes
```

### Paso 5: Probar autenticación

```bash
# Hacer un login test para verificar que JWT funciona
curl -X POST http://localhost:3009/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Si el secreto es correcto, el JWT se generará correctamente
# Si el secreto es incorrecto, habrá error de validación
```

---

## 🔐 CÓMO GENERAR NUEVOS SECRETOS

Para generar secretos seguros en el futuro:

```bash
# Generar secreto base64 (32 bytes)
openssl rand -base64 32

# O generar secreto hex (64 caracteres)
openssl rand -hex 32

# O generar secreto alfanumérico
openssl rand -base64 48 | tr -d "=+/" | cut -c1-32
```

---

## ✅ CRITERIOS DE ÉXITO

- [x] Archivos .env no están en git history
- [x] No hay secretos hardcodeados en código
- [x] .gitignore está configurado correctamente
- [ ] Nuevo PAYLOAD_SECRET generado (requiere acción manual)
- [ ] Archivos .env actualizados con nuevo secreto (requiere acción manual)
- [ ] Apps arrancan correctamente con nuevo secreto (requiere verificación manual)
- [ ] Autenticación JWT funciona correctamente (requiere verificación manual)

---

## 📝 NOTAS

1. **Los secretos no están en git:** Verificado que el .gitignore está funcionando correctamente. Los archivos .env no están en el history del repositorio.

2. **Actualización manual requerida:** Debido a políticas de seguridad del repositorio, la actualización de archivos .env debe hacerse manualmente por el desarrollador.

3. **Rotación en producción:** Para rotar secretos en producción:
   - Actualizar variables de entorno en el servidor
   - Reiniciar los servicios (PM2, Docker, etc.)
   - Verificar que la app funciona correctamente
   - Invalidar todos los tokens JWT activos (requiere logout forzado de usuarios)

4. **Backup de secretos:** Los secretos antiguos deberían ser rotados, no solo reemplazados. Asegúrate de invalidar todos los tokens JWT generados con el secreto anterior.

---

## 🚀 PRÓXIMOS PASOS DESPUÉS DE ESTA TAREA

Una vez completada esta tarea:

1. ✅ Continuar con **P0-002: Verify RLS Policies**
2. ✅ Implementar auditoría de Row-Level Security en PostgreSQL

---

**Estado:** ✅ Documentación generada - Requiere acción manual del desarrollador
**Tiempo estimado para completar manualmente:** 15-30 minutos
