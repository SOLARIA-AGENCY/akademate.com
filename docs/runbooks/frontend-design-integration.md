# Frontend Design Integration (Academate-ui)

## Estado
- Fuente de diseño shadcn integrada localmente en `vendor/academate-ui`.
- Contenido incluido: `home`, `templates`, `templates-baseui`, documentación y assets del repositorio origen.

## Repositorio origen
- `https://github.com/SOLARIA-AGENCY/Academate-ui`

## Objetivo en Akademate
- Usar `vendor/academate-ui` como base visual para acelerar UI en apps (`apps/web`, `apps/admin-client`, `apps/campus`, `apps/ops`, etc.).
- Reutilizar componentes/patrones sin acoplar el monorepo a un segundo workspace externo.

## Flujo recomendado de adopción
1. Seleccionar plantilla base en `vendor/academate-ui/templates/*`.
2. Copiar solo vistas/componentes necesarios al app destino (`apps/<app>/app`, `apps/<app>/components`, `apps/<app>/lib`).
3. Alinear tokens de color/tema con la especificación de Akademate (`docs/specs/ACADEIMATE_SPEC.md`).
4. Forzar multitenancy en cualquier capa de datos/UI sensible (`tenant_id`, dominio tenant, claims).
5. Validar Tailwind v4 del repo actual (`@tailwindcss/postcss`, tokens y theme.colors según AGENTS.md).

## Nota técnica
- La fuente quedó bajo `vendor/` para evitar conflictos con `pnpm-workspace.yaml` y mantener el origen de diseño disponible de forma íntegra dentro del proyecto.
