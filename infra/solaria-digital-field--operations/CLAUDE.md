# SOLARIA Digital Field Operations - Oficina de Construcción en Campo

**Versión:** 3.2.0
**Última actualización:** 2025-12-11

---

## Changelog v3.2.0

### Backend (server.js)
- **JWT Security**: Validación de JWT_SECRET al inicio (mínimo 32 caracteres)
- **Quick Access Endpoint**: Nuevo `/api/auth/quick-access` que solo funciona en dev
- **Socket.IO Events**: Emits para proyectos, tareas y alertas en tiempo real
- **Alert Endpoints**: Nuevos `POST /api/alerts` y `PUT /api/alerts/:id/resolve`
- **C-Suite Dinámico**: Datos calculados de DB en lugar de hardcodeados
- **Query Fix**: `agents_assigned` usando `COALESCE(assigned_agent_id, agent_id)`

### Frontend (dashboard.js)
- **Nuevo Proyecto**: Modal y funcionalidad completa para crear proyectos
- **Modal Edición**: Muestra nombre del proyecto en título
- **Agent Capabilities**: Parse automático de JSON a badges legibles
- **Analytics Timeframe**: Filtro funcional por 7/30/90 días
- **Charts Update**: Todos los gráficos se actualizan al cambiar tema

### UI (index.html)
- **Botón Nuevo Proyecto**: Conectado a `dashboard.showNewProjectModal()`
- **Quick Access Seguro**: Sin credenciales en cliente

### Docker
- **Volume docs**: Montaje de documentación del proyecto

---

## Credenciales Estandarizadas

> **IMPORTANTE**: Passwords sin caracteres especiales (!@#$%) para evitar problemas de escaping en bash.

| Servicio | Usuario | Password |
|----------|---------|----------|
| Dashboard UI | carlosjperez | bypass |
| Dashboard API | userId: carlosjperez | password: bypass |
| MariaDB root | root | SolariaRoot2024 |
| MariaDB app | solaria_user | solaria2024 |
| JWT Secret | - | solaria_jwt_secret_2024_min32chars_secure |

---

## Propósito

Esta es una **Oficina Digital de Construcción en Campo** completamente autocontenida y aislada. Su propósito es:

1. Gestionar proyectos de construcción de software de forma autónoma
2. Proporcionar dashboards ejecutivos para CEO, CTO, COO y CFO
3. Coordinar agentes IA especializados (SOLARIA Agents)
4. Ser desmantelable sin afectar el proyecto construido
5. **NUEVO:** Integrarse con cualquier agente IA via MCP (Model Context Protocol)

---

## IMPORTANTE: Instalación Automática del MCP

**Cualquier agente IA (Claude Code, Cursor, Windsurf, Codex, etc.) que acceda a este proyecto DEBE ejecutar primero:**

```bash
# Auto-instalar el servidor MCP para integración con el dashboard
bash scripts/install-mcp.sh
```

Este script:
- Detecta automáticamente el entorno (Claude Code, Cursor, Windsurf, Continue, Codex, etc.)
- Instala las dependencias necesarias
- Configura el MCP en el archivo de configuración correcto
- Habilita herramientas directas para gestionar tareas, agentes y proyectos

**Después de instalar el MCP, el agente puede usar comandos naturales como:**
- "Muéstrame el estado del proyecto"
- "Crea una tarea: Implementar autenticación con prioridad alta"
- "Marca la tarea #5 como completada"
- "Lista todas las tareas asignadas a SOLARIA-DEV-01"
- "¿Cuál es el progreso actual?"

### Herramientas MCP Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `get_dashboard_overview` | Ver KPIs ejecutivos y métricas |
| `list_tasks` | Listar todas las tareas |
| `create_task` | Crear nueva tarea |
| `update_task` | Actualizar tarea (estado, prioridad, progreso) |
| `complete_task` | Marcar tarea como completada |
| `list_agents` | Ver agentes SOLARIA |
| `get_agent_tasks` | Ver tareas de un agente |
| `list_projects` | Listar proyectos |
| `get_activity_logs` | Ver logs de actividad |

---

## Inicio Rápido para Agentes

### Invocar la Oficina

Cuando un agente necesite usar esta oficina, debe:

```bash
# 1. Navegar al directorio
cd infra/solaria-digital-field--operations

# 2. Iniciar los servicios (incluye Redis + Worker)
docker compose -f docker-compose.single.yml up -d

# 3. Esperar 20 segundos para inicialización
sleep 20

# 4. Verificar health
curl http://localhost:3030/api/health

# 5. Ingestar proyecto
bash scripts/ingest-project.sh "Akademate.com" ../../docs/PROJECT_MILESTONES.md

# 6. Acceder al Dashboard
# URL: http://localhost:3030
# Credenciales: carlosjperez / bypass
```

### Login API

```bash
# Obtener token JWT
curl -X POST http://localhost:3030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId":"carlosjperez","password":"bypass"}'

# Usar token en requests
TOKEN="<token_del_login>"
curl http://localhost:3030/api/projects -H "Authorization: Bearer $TOKEN"
```

### Detener la Oficina

```bash
docker compose -f docker-compose.single.yml down
```

### Desmantelar Completamente

```bash
# Detener y eliminar volúmenes
docker compose -f docker-compose.single.yml down -v

# Eliminar datos persistentes
rm -rf ./storage ./logs

# El proyecto construido permanece intacto en su repositorio original
```

---

## Arquitectura con BullMQ

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

Colas disponibles:
  - agent-tasks     → Tareas de agentes IA (concurrencia: 5)
  - code-analysis   → Análisis de código (concurrencia: 3)
  - project-sync    → Sincronización externa (concurrencia: 2)
  - notifications   → Alertas y notificaciones (concurrencia: 10)
```

---

## Arquitectura del Sistema

```
solaria-digital-field--operations/
├── dashboard/                    # Dashboard C-Suite (CEO/CTO/COO/CFO)
│   ├── server.js                # Servidor Express con API
│   ├── public/
│   │   ├── index.html           # UI del Dashboard
│   │   ├── dashboard.js         # Lógica del frontend
│   │   └── solaria-logo.png     # Logo corporativo
│   └── package.json
├── backend/                      # API de gestión de proyectos
├── frontend/                     # UI React (alternativa)
├── scripts/                      # Automatización y agentes IA
│   ├── auto-deploy.js           # Despliegue automático
│   ├── ai-agent-coordinator.js  # Coordinador de agentes
│   ├── agent-setup.js           # Configuración de agentes
│   └── project-analyzer.js      # Analizador de repositorios
├── docker-compose.yml           # Orquestación de servicios
├── .env.example                 # Variables de entorno
└── CLAUDE.md                    # Este archivo
```

---

## Roles Ejecutivos y Accesos

### CEO (Chief Executive Officer)
- **Vista:** Overview estratégico, KPIs globales, alertas críticas
- **Métricas:** ROI, estado general de proyectos, presupuesto total
- **Acciones:** Aprobar decisiones críticas, ver reportes ejecutivos

### CTO (Chief Technology Officer)
- **Vista:** Arquitectura técnica, rendimiento de agentes IA, deuda técnica
- **Métricas:** Cobertura de código, tiempo de build, errores técnicos
- **Acciones:** Asignar agentes, revisar arquitectura, aprobar releases

### COO (Chief Operations Officer)
- **Vista:** Operaciones diarias, flujo de trabajo, recursos
- **Métricas:** Tareas completadas, velocidad del equipo, utilización
- **Acciones:** Asignar tareas, gestionar sprints, resolver bloqueos

### CFO (Chief Financial Officer)
- **Vista:** Presupuesto, costos, proyecciones financieras
- **Métricas:** Burn rate, costo por tarea, ROI por proyecto
- **Acciones:** Aprobar gastos, revisar reportes financieros

---

## API Endpoints

### Autenticación
```
POST /api/auth/login     # Login con credenciales
GET  /api/auth/verify    # Verificar token JWT
POST /api/auth/logout    # Cerrar sesión
```

### Dashboard
```
GET /api/dashboard/overview   # Resumen ejecutivo
GET /api/dashboard/metrics    # Métricas por timeframe
GET /api/dashboard/alerts     # Alertas activas
```

### Proyectos
```
GET    /api/projects          # Listar proyectos
POST   /api/projects          # Crear proyecto
GET    /api/projects/:id      # Detalle de proyecto
PUT    /api/projects/:id      # Actualizar proyecto
DELETE /api/projects/:id      # Eliminar proyecto
```

### Agentes IA
```
GET /api/agents               # Listar agentes
GET /api/agents/:id           # Detalle de agente
PUT /api/agents/:id/status    # Actualizar estado
```

### Tareas
```
GET  /api/tasks               # Listar tareas
POST /api/tasks               # Crear tarea
PUT  /api/tasks/:id           # Actualizar tarea
```

---

## Servicios Docker

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| nginx | 80, 443 | Reverse proxy y SSL |
| dashboard-backend | 3000 | API del Dashboard C-Suite |
| mysql | 3306 | Base de datos principal |
| redis | 6379 | Cache y colas |
| minio | 9000, 9001 | Almacenamiento S3 |

---

## Variables de Entorno Críticas

```env
# Base de datos
DB_HOST=mysql
DB_NAME=solaria_construction
DB_USER=solaria_user
DB_PASSWORD=<secure_password>

# Seguridad
JWT_SECRET=<min_32_chars>

# IA (opcional)
OPENAI_API_KEY=<api_key>
ANTHROPIC_API_KEY=<api_key>
```

---

## Flujo de Trabajo para Agentes

### 1. Análisis de Proyecto
```bash
npm run analyze -- --repo=<github_url>
```

### 2. Configurar Agentes IA
```bash
npm run agents
```

### 3. Importar Proyecto
```bash
npm run import -- --source=<path>
```

### 4. Monitorear Progreso
- Acceder a http://localhost:80
- Usar "Acceso Rápido" para entrar
- Navegar a la sección correspondiente al rol

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar en modo desarrollo

# Producción
npm run start            # Iniciar con Docker
npm run stop             # Detener servicios

# Mantenimiento
npm run setup            # Configuración inicial
docker-compose logs -f   # Ver logs en tiempo real

# Backup
docker exec mysql mysqldump -u root solaria_construction > backup.sql

# Restaurar
docker exec -i mysql mysql -u root solaria_construction < backup.sql
```

---

## Protocolo de Desmantelamiento

Cuando el proyecto de construcción finalice:

### 1. Exportar Datos Finales
```bash
# Exportar base de datos
docker exec mysql mysqldump -u root solaria_construction > final_export.sql

# Exportar documentos
cp -r ./storage/documents ./project_documents_backup/
```

### 2. Generar Reporte Final
```bash
npm run report:final
```

### 3. Desmantelar Infraestructura
```bash
# Detener todos los servicios
docker-compose down

# Eliminar volúmenes (datos)
docker-compose down -v

# Eliminar imágenes (opcional)
docker-compose down --rmi all
```

### 4. Verificar Aislamiento
- El proyecto construido en su repositorio original permanece intacto
- Solo se elimina la oficina de construcción
- Los backups quedan disponibles si se necesitan

---

## Troubleshooting

### Dashboard no carga
```bash
docker-compose restart dashboard-backend nginx
```

### Error de conexión a base de datos
```bash
docker-compose restart mysql
docker-compose logs mysql
```

### Agentes no responden
```bash
docker-compose restart agent-manager
npm run agents -- --reset
```

### Limpiar cache
```bash
docker exec redis redis-cli FLUSHALL
```

---

## Contacto y Soporte

- **Empresa:** SOLARIA AGENCY (https://www.solaria.agency)
- **Propietario:** Carlos J. Pérez
- **Repositorio:** https://github.com/SOLARIA-AGENCY/solaria-digital-field--operations

---

## Notas para Claude Code y Agentes IA

### PASO OBLIGATORIO AL INICIAR

```bash
# 1. PRIMERO: Instalar MCP para integración directa
bash scripts/install-mcp.sh

# 2. Iniciar Docker si no está corriendo
docker-compose up -d

# 3. Ahora puedes usar herramientas MCP directamente
```

### Información General

1. Este directorio es una **oficina temporal** de construcción
2. Todos los cambios al proyecto real deben hacerse en el repositorio del proyecto
3. Esta oficina solo coordina y monitorea el trabajo
4. Al finalizar, ejecutar el protocolo de desmantelamiento
5. Los datos críticos deben exportarse antes de desmantelar
6. El color corporativo SOLARIA es **#f6921d** (naranja)
7. El acceso rápido usa el usuario `carlosjperez` con password `bypass`
8. **NUEVO:** Usa el MCP para interactuar con el dashboard programáticamente
9. Los agentes se llaman SOLARIA-PM, SOLARIA-ARCH, SOLARIA-DEV-01, etc.

### Ejecutar Tests

```bash
# Tests de API del dashboard
bash dashboard/tests/api-tests.sh

# Tests completos del proyecto
bash scripts/run-tests.sh
```

---

**SOLARIA Digital Field Operations**
**Oficina de Construcción en Campo v3.0.0**
