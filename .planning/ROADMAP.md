# Akademate — Roadmap

## Proyecto
Plataforma SaaS para gestión de academias y centros de formación.

## Milestones

### M1: Infraestructura y Conectores IA
**Objetivo:** API pública con autenticación por API Keys, endpoints estables /api/v1/, MCP Server para Claude y especificación OpenAPI para ChatGPT/Grok/Gemini.

#### Phase 1: API Keys + /api/v1/ Foundation
- [ ] Colección ApiKeys en Payload CMS
- [ ] Bearer token auth en middleware
- [ ] Endpoints estables /api/v1/
- [ ] UI gestión de API Keys

#### Phase 2: OpenAPI 3.1 Spec
- [ ] Spec completa servida en /api/v1/openapi.json
- [ ] /.well-known/ai-plugin.json para ChatGPT Actions

#### Phase 3: MCP Server
- [ ] packages/mcp-server/ en monorepo
- [ ] Tools: get_courses, get_students, get_analytics, create_enrollment
- [ ] Auth via API Key
