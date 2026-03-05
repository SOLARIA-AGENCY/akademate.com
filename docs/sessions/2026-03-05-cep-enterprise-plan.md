# Sesión 2026-03-05: CEP FORMACIÓN Enterprise Plan & Infraestructura Dedicada

## 🎯 Objetivo Completado
Investigación y documentación completa para implementar **Single-Tenant Dedicado para CEP FORMACIÓN**.

## 📊 Resultados

### Planes Identificados
| Plan | Precio | Usuarios | Storage | API Calls | Soporte |
|------|--------|----------|---------|-----------|---------|
| **STARTER** | €199/mes | 100 | 10GB | 50k/mes | Email |
| **PRO** | €299/mes | 500 | 100GB | 500k/mes | Prioritario |
| **ENTERPRISE** | €599/mes | ∞ | ∞ | ∞ | 24/7 |
| **ENTERPRISE DEDICADO** | €1,200/mes | ∞ | ∞ | ∞ | Dedicado + SLA |

### Desglose Plan €1,200/mes
- Infraestructura (Hetzner): €35/mes
- Dominio + DNS: €12.50/mes
- Branding/Personalización: €250/mes
- Mantenimiento + Soporte 24/7: €650/mes
- Integraciones: €225/mes
- Formación: Incluida

## 🏗️ Arquitectura Decidida

```
CEP FORMACIÓN (Hetzner Dedicado)
├─ PostgreSQL dedicada (akademate_cep)
├─ 8 Apps Next.js (PayloadCMS, Tenant-Admin, Campus, etc.)
├─ Redis + MinIO S3
├─ Nginx SSL con 6 dominios
└─ Certbot (SSL automático)

Conectado a:
Dashboard Central (Multitenant)
├─ API Bridge para gestionar CEP
├─ Billing, soporte, estadísticas
└─ Single source of truth
```

## 📋 Fases Implementación

### ✅ Fase 0: Investigación (COMPLETADA)
- Investigación de planes existentes
- Análisis de arquitectura actual
- Diseño de solución dedicada
- Documentación completa

### 🔄 Fase 1: Infraestructura (PRÓXIMA - 6 semanas)
**Tasks:**
- [ ] Crear rama: `deploy/cep-hetzner-phase1`
- [ ] Crear carpeta: `infrastructure/docker-cep-dedicated/`
- [ ] Preparar `.env.cep` completo
- [ ] Configurar VPS en Hetzner (CX42 o superior)
- [ ] Configurar DNS (6 subdominos)
- [ ] Desplegar docker-compose
- [ ] Crear tenant CEP en BD
- [ ] API Bridge funcional

**Dominios necesarios:**
```
cepformacion.es            (Principal)
api.cepformacion.es        (PayloadCMS)
admin.cepformacion.es      (Admin)
dashboard.cepformacion.es  (Tenant Admin)
campus.cepformacion.es     (App estudiantes)
portal.cepformacion.es     (Portal unificado)
```

### ⏳ Fase 2: Features Críticas (4 semanas - POST-LANZAMIENTO)
**Priority order:**
1. SSO/SAML/OIDC (40h) - Integración AD/Office365
2. White-labeling (20h) - Remover branding Akademate
3. Webhooks (30h) - Sistema de eventos
4. Audit logs (25h) - Auditoría completa
5. API rate limiting (20h) - Cuotas por plan
6. Plan validators (25h) - Validación de límites

### 📚 Fase 3: Features Avanzadas (Mantenimiento)
- BI & Analytics (40h)
- SCIM Directory Sync (30h)
- Autoscaling (30h)
- Performance tuning (25h)

## 💻 Información Técnica Clave

### Aislamiento de Datos
- ✅ YA IMPLEMENTADO: Todas las tablas tienen `tenantId` FK
- Control: `/apps/tenant-admin/src/access/tenantAccess.ts`
- Funciones: `readOwnTenant()`, `createWithTenant()`, etc.

### Variables de Entorno Críticas
```bash
DATABASE_URL=postgres://cep_admin:PASSWORD@postgres:5432/akademate_cep
PAYLOAD_PUBLIC_SERVER_URL=https://api.cepformacion.es
NEXT_PUBLIC_TENANT_URL=https://dashboard.cepformacion.es
S3_BUCKET=cepformacion-media
S3_REGION=fsn1
S3_ENDPOINT=https://s3.fsn1.hetzner.cloud
```

### Archivos a Crear/Modificar
```
infrastructure/
└── docker-cep-dedicated/          (NUEVO)
    ├── docker-compose.yml          (Basado en existente)
    ├── .env.cep                    (Variables específicas)
    ├── Dockerfile.payload
    ├── Dockerfile.web
    ├── Dockerfile.tenant-admin
    ├── Dockerfile.campus
    ├── Dockerfile.portal
    └── nginx/
        ├── cepformacion.conf       (NUEVO)
        └── certbot/                (SSL automático)
```

### Nueva Tabla: `remote_tenants`
Para gestionar CEP desde dashboard central:
```typescript
remotetenants: pgTable('remote_tenants', {
  id: uuid('id').primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  slug: text('slug').unique(),
  name: text('name'),
  apiUrl: text('api_url'),  // https://api.cepformacion.es
  apiKey: text('api_key'),  // Token para auth
  deploymentType: text('deployment_type'),  // 'hetzner_dedicated'
  status: text('status'),   // 'active'
  createdAt: timestamp('created_at'),
})
```

## 💰 Costos & ROI

**Costo Desarrollo:** €21,000 (350 horas)
**Costo Operación (mensual):** €35-50
**Ingresos (mensual):** €1,200
**Break-even:** 9 meses
**Proyección 2 años:** €28,800 - €21,000 = €7,800 ganancia

## 📁 Documentación Generada

**En Repo:**
- `/claude.md` - Resumen del proyecto y próximas acciones
- `/agents.md` - Información de agentes y sesiones (ACTUALIZADO)
- `/root/.claude/plans/lexical-coalescing-tide.md` - Plan completo (350+ líneas)

**En Este Archivo (memorias):**
- Guía para próximas sesiones
- Checklist de tasks
- Información técnica de referencia

## ⚠️ Puntos de Atención

1. **Aislamiento crítico:** El código ya valida `tenantId` en cada query (via tenantAccess.ts)
2. **Dominios:** Todos DEBEN configurarse en DNS de Hetzner ANTES de desplegar
3. **SSL/Certbot:** Configuración automática pero requiere dominios resolviendo
4. **S3:** Crear bucket "cepformacion-media" en Hetzner Cloud ANTES de desplegar
5. **Database:** PostgreSQL dedicada es requirement (NO compartir con otros tenants)
6. **Backup:** Configurar backups automáticos en Hetzner DESDE EL DÍA 1

## 🚀 Próximos Pasos (Sesión 2)

```bash
# 1. Crear rama de trabajo
git checkout -b deploy/cep-hetzner-phase1

# 2. Crear estructura de carpetas
mkdir -p infrastructure/docker-cep-dedicated/nginx

# 3. Copiar y modificar archivos
cp infrastructure/docker/docker-compose.yml infrastructure/docker-cep-dedicated/
cp infrastructure/docker/Dockerfile.* infrastructure/docker-cep-dedicated/

# 4. Preparar .env.cep con valores
# REQUIERE:
# - Credenciales S3 Hetzner
# - API Key para PayloadCMS
# - SMTP para emails

# 5. Configurar Hetzner
# - Crear VPS CX42 (8GB RAM, 4vCPU)
# - Crear bucket S3
# - Configurar DNS (6 dominios)
# - SSH access

# 6. Desplegar
docker-compose -f docker-compose.yml up -d
docker-compose run --rm payload npm run db:migrate
```

## 📞 Contactos & Referencias

**Infraestructura Hetzner:**
- Console: https://console.hetzner.cloud
- Docs: https://docs.hetzner.cloud
- S3: https://hetzner.cloud/storage/object-storage

**Plan Detail:** Ver `/root/.claude/plans/lexical-coalescing-tide.md` (360 líneas)
**Billing Config:** `/packages/types/src/billing.ts`
**Schema Reference:** `/packages/db/src/schema.ts`

---

**Creado:** 2026-03-05
**Estado:** ✅ Investigación completada | 🔄 Listo para Fase 1
**Próxima sesión:** Infraestructura en Hetzner
