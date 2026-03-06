# Claude Code - Dokumentación de Proyectos & Planes

## Plan Activo: CEP FORMACIÓN - Infraestructura Dedicada

**Estado:** Documentación completada - Listo para implementación
**Branch:** `claude/research-pricing-plans-4QUgh`
**Fecha:** 2026-03-05

### Resumen Ejecutivo

Implementación de **Single-Tenant Dedicado para CEP FORMACIÓN** con:
- Servidor Hetzner independiente
- Dominio propio (cepformacion.es)
- Plan Enterprise €1200/mes
- Gestionable desde dashboard multitenant central

**Ver documentación completa en:** `/root/.claude/plans/lexical-coalescing-tide.md`

### Fases de Implementación

#### Fase 0 (ACTUAL) ✅
- [x] Investigación de planes existentes (Starter, Pro, Enterprise)
- [x] Análisis de arquitectura de deployment
- [x] Diseño de infraestructura dedicada
- [x] Documentación completa del plan

#### Fase 1 (PRÓXIMA - 6 semanas)
- [ ] Preparar estructura de carpetas `infrastructure/docker-cep-dedicated/`
- [ ] Crear `.env.cep` con variables
- [ ] Configurar VPS en Hetzner
- [ ] Desplegar docker-compose en Hetzner
- [ ] Conectar al dashboard central

#### Fase 2 (POST-LANZAMIENTO)
- [ ] SSO/SAML/OIDC
- [ ] White-labeling completo
- [ ] Webhooks funcionales
- [ ] Audit logs
- [ ] API rate limiting
- [ ] SLA monitoring

### Detalles Técnicos

**Estructura de Carpetas (a crear):**
```
infrastructure/
└── docker-cep-dedicated/
    ├── docker-compose.yml
    ├── .env.cep
    ├── Dockerfile.*
    ├── nginx/
    │   ├── cepformacion.conf
    │   └── certbot/
    └── README.md
```

**Variablesof Entorno Clave:**
- Base de datos dedicada: `akademate_cep`
- Dominio principal: `cepformacion.es`
- S3 Bucket: `cepformacion-media` (Hetzner)
- Tenant ID: `<SERÁ GENERADO>`

**Comandos Importantes:**
```bash
# Desplegar en Hetzner
docker-compose -f infrastructure/docker-cep-dedicated/docker-compose.yml up -d

# Migraciones
docker-compose run --rm payload npm run db:migrate

# Ver logs
docker-compose logs -f
```

### Documentación Relacionada

- **Plan detallado:** `/root/.claude/plans/lexical-coalescing-tide.md`
- **Pricing planes:** Investigación en misma rama
- **Arquitectura:** Análisis completo del codebase

### Equipo & Responsabilidades

**Para Fase 1:**
- 1-2 desarrolladores (8-12 semanas)
- 1 DevOps para infraestructura Hetzner
- 1 QA para testing

**Costo estimado:** €21,000 en desarrollo (recuperado en 9 meses de €1,200/mes)

### Próximas Acciones

1. ✅ Documentación completa
2. → Crear rama de implementación (`deploy/cep-hetzner-phase1`)
3. → Preparar estructura de carpetas
4. → Configurar Hetzner y DNS
5. → Desplegar primera versión

### Referencias

- Sistema actual: Multitenant en PostgreSQL con aislamiento por `tenantId`
- Planes: STARTER (€199), PRO (€299), ENTERPRISE (€599+ dedicado €1200)
- Estado: Hay features declaradas pero no implementadas (SSO, webhooks, audit logs)

---

**Última actualización:** 2026-03-05
**Responsable:** Claude Code Agent
**Próxima revisión:** Antes de Fase 1
