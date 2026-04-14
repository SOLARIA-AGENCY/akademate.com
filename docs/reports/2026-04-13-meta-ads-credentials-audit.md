# Auditoría Meta Ads — Credenciales y Permisos (Producción)

**Fecha:** 2026-04-13  
**Servidor auditado:** `akademate-prod` (`46.62.222.138`)  
**Host remoto:** `mail.cepcomunicacion.com`  
**Objetivo:** validar configuración Meta/Facebook Ads y acceso API solo para campañas `SOLARIA AGENCY`.

## Resumen ejecutivo

- ✓ Se auditó el servidor correcto de producción Akademate en Hetzner.
- ✓ Los IDs de Meta en tenant CEP existen y están cargados (`ad_account`, `business`, `pixel`).
- ✓ El token de Conversions API (CAPI) está configurado.
- ✗ No hay token de Marketing API en tenant (`integrations_meta_marketing_api_token` vacío).
- ✗ Llamada real a Graph API para campañas falla por permisos (`ads_read/ads_management` no concedidos).
- 📌 Resultado: hoy no se puede auditar campañas por API hasta cargar token Marketing API correcto.

## Evidencia técnica (sin secretos)

### 1) Infra y contenedores
- Contenedores activos observados:
  - `akademate-tenant`
  - `akademate-web`
  - `akademate-ops`
  - `akademate-db`
  - `traefik`

### 2) Datos Meta en tenant (PostgreSQL producción)
- Tenant: `CEP FORMACION` (`cep-formacion`)
- `integrations_meta_ad_account_id`: presente (`730494526974837`)
- `integrations_meta_business_id`: presente (`598666359737310`)
- `integrations_meta_pixel_id`: presente (`1189071876088388`)
- `integrations_meta_conversions_api_token`: presente
- `integrations_meta_marketing_api_token`: **ausente**

### 3) Prueba de acceso a campañas por API
- Endpoint probado: `GET /v21.0/act_{AD_ACCOUNT}/campaigns`
- Resultado:
  - `OAuthException`
  - Código `200`
  - Mensaje: el propietario de la cuenta publicitaria no ha concedido `ads_management` o `ads_read`.

## Diagnóstico

Hay una separación correcta entre CAPI y Marketing API, pero falta completar el lado Marketing:

1. CAPI token existe (sirve para eventos de conversión).
2. Marketing token no está cargado en tenant.
3. Sin token con permisos Ads, no se puede:
   - listar campañas,
   - validar estado real de borradores,
   - publicar vía API.

## Acciones requeridas

### P0
1. Crear/obtener token de Meta Marketing API desde Business Manager/System User con permisos:
   - `ads_read`
   - `ads_management`
2. Cargar token en tenant:
   - `integrations_meta_marketing_api_token`
3. Revalidar por API:
   - listar campañas con filtro por nombre `SOLARIA AGENCY`.

### P1
1. Rotar y revisar permisos de tokens periódicamente.
2. Mantener política de operación restringida por prefijo:
   - `SOLARIA AGENCY`
3. Automatizar smoke de Meta API (read-only) antes de despliegues de campañas.

## Nota operativa

La revisión visual previa confirma dos campañas en borrador listas para levantar, pero la verificación de cuenta Meta “en vivo por API” queda bloqueada hasta tener token Marketing API válido con permisos Ads.
