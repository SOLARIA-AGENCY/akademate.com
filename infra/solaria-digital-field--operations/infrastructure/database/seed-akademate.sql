-- Seed data for Akademate.com project
-- SOLARIA Digital Field Operations

-- Clean existing data
DELETE FROM tasks;
DELETE FROM ai_agents;
DELETE FROM projects WHERE id != 2;

-- Ensure Akademate project exists
INSERT INTO projects (id, name, description, status, budget, start_date, priority)
VALUES (2, 'Akademate.com', 'Plataforma SaaS Multi-tenant para Academias de Formacion Profesional', 'development', 150000.00, CURDATE(), 'high')
ON DUPLICATE KEY UPDATE
    description='Plataforma SaaS Multi-tenant para Academias de Formacion Profesional',
    status='development',
    budget=150000.00;

-- Insert SOLARIA AI Agents
INSERT INTO ai_agents (id, name, role, status, capabilities) VALUES
(1, 'SOLARIA-PM', 'project_manager', 'active', '{"planning": true, "coordination": true, "reporting": true}'),
(2, 'SOLARIA-ARCH', 'architect', 'active', '{"design": true, "documentation": true, "review": true}'),
(3, 'SOLARIA-DEV-01', 'developer', 'active', '{"frontend": true, "react": true, "typescript": true}'),
(4, 'SOLARIA-DEV-02', 'developer', 'active', '{"backend": true, "nodejs": true, "database": true}'),
(5, 'SOLARIA-QA', 'tester', 'active', '{"testing": true, "automation": true, "qa": true}'),
(6, 'SOLARIA-DEVOPS', 'devops', 'active', '{"docker": true, "ci_cd": true, "infrastructure": true}'),
(7, 'SOLARIA-SEC', 'security_auditor', 'inactive', '{"security": true, "audit": true, "compliance": true}'),
(8, 'SOLARIA-DOC', 'technical_writer', 'inactive', '{"documentation": true, "api_docs": true}')
ON DUPLICATE KEY UPDATE
    name=VALUES(name),
    role=VALUES(role),
    status=VALUES(status),
    capabilities=VALUES(capabilities);

-- Insert real project tasks
INSERT INTO tasks (title, description, status, priority, progress, estimated_hours, project_id, assigned_agent_id) VALUES
('Configurar monorepo con Turborepo', 'Setup inicial del monorepo usando Turborepo para gestionar packages frontend y backend', 'completed', 'critical', 100, 8, 2, 6),
('Implementar schema multi-tenant', 'Disenar e implementar la arquitectura de base de datos multi-tenant con aislamiento por schema PostgreSQL', 'in_progress', 'critical', 65, 24, 2, 2),
('Configurar Payload CMS base', 'Instalar y configurar Payload CMS 3.0 como backend headless con soporte multi-tenant', 'in_progress', 'high', 40, 16, 2, 4),
('Crear coleccion Tenants', 'Implementar coleccion de tenants con campos: name, slug, domain, settings, plan, branding', 'pending', 'high', 0, 8, 2, 4),
('Crear coleccion Users con roles', 'Implementar sistema de usuarios con roles por tenant: superadmin, admin, instructor, student', 'pending', 'high', 0, 12, 2, 4),
('Disenar sistema de autenticacion', 'JWT + OAuth para autenticacion multi-tenant con tenant isolation y refresh tokens', 'pending', 'critical', 0, 16, 2, 2),
('Configurar React frontend base', 'Setup Next.js 15 con App Router, TailwindCSS y shadcn/ui components', 'completed', 'high', 100, 6, 2, 3),
('Implementar tenant resolver', 'Middleware para resolver tenant desde subdomain o custom domain con caching', 'pending', 'high', 0, 8, 2, 4),
('Crear componentes UI base', 'Implementar design system con componentes reutilizables siguiendo atomic design', 'in_progress', 'medium', 30, 20, 2, 3),
('Configurar Docker development', 'Docker Compose para desarrollo local con hot reload y servicios necesarios', 'completed', 'medium', 100, 4, 2, 6),
('Implementar BullMQ workers', 'Sistema de colas para tareas asincronas: emails, reportes, notificaciones', 'pending', 'medium', 0, 12, 2, 4),
('Crear landing page publica', 'Pagina de marketing para captacion de academias con formulario de contacto', 'pending', 'low', 0, 16, 2, 3),
('Implementar dashboard admin', 'Panel de administracion para super-admins con metricas y gestion de tenants', 'pending', 'medium', 0, 24, 2, 3),
('Crear API de cursos', 'CRUD completo para gestion de cursos con categorias, tags y modulos', 'pending', 'high', 0, 16, 2, 4),
('Implementar sistema de pagos', 'Integracion con Stripe para suscripciones, planes y facturacion', 'pending', 'high', 0, 24, 2, 4),
('Configurar CI/CD pipeline', 'GitHub Actions para tests, linting, build y deploy automatico a staging/prod', 'in_progress', 'high', 50, 8, 2, 6),
('Escribir tests unitarios core', 'Tests para funciones criticas: auth, tenant resolution, payments', 'pending', 'medium', 0, 16, 2, 5),
('Implementar auditoria y logs', 'Sistema de logging estructurado y auditoria para compliance GDPR', 'pending', 'medium', 0, 12, 2, 7),
('Documentar API endpoints', 'Documentacion OpenAPI/Swagger de todos los endpoints REST', 'pending', 'low', 0, 8, 2, 8),
('Review de seguridad inicial', 'Auditoria OWASP de seguridad del codigo y configuraciones', 'pending', 'high', 0, 16, 2, 7);

-- Update project metrics
UPDATE projects SET
    completion_percentage = (SELECT COALESCE(AVG(progress), 0) FROM tasks WHERE project_id = 2)
WHERE id = 2;
