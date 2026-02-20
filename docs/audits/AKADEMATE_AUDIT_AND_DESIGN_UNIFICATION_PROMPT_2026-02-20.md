# AKADEMATE — Auditoría de Sistema + Unificación de Diseño

## Objetivo
Auditar estado funcional real del despliegue NEMESIS y ejecutar remediación + unificación visual entre servicios bajo design system único.

## Entorno
- Web pública: `:3006`
- Ops admin: `:3004`
- Payload CMS: `:3003`
- Tenant dashboard: `:3009`
- Campus virtual: `:3005`

## Estado inicial reportado
- 🔴 Tenant dashboard `:3009`: crash runtime (`Cannot read properties of undefined (reading 'call')`)
- 🔴 Ops admin `:3004`: login roto (`No se pudo iniciar sesión en Ops`)
- 🔴 Payload CMS `:3003/admin/login`: `Something went wrong`
- 🟡 Web pública `:3006/cursos`: error SSR (`digest: 2394153064`)
- 🟡 Campus `:3005`: contraseña dev de alumno no documentada

## Fase 1 — Remediación funcional (P0/P1)
1. **Payload Auth Base**
   - Validar seed de usuarios y superadmin
   - Probar `POST /api/users/login` directo
   - Verificar `PAYLOAD_SECRET`, DB vars, cookies
2. **Ops Admin**
   - Confirmar usuario `ops@akademate.com` con rol `superadmin`
   - Corregir mapping endpoint/body de login
3. **Tenant Dashboard**
   - Capturar stack completo del `TypeError`
   - Aislar módulo/hook/import que retorna `undefined`
   - Corregir dependencia circular/import dinámico inválido
4. **Web /cursos**
   - Añadir manejo de error SSR + fallback UI
   - Asegurar fetch resiliente (array vacío permitido)
5. **Campus**
   - Documentar credenciales dev alumno en launchpad

## Fase 2 — Unificación de diseño
### Referencia visual obligatoria
- Login de Ops (`:3004`) + login custom Payload (`:3003/admin/login`)

### Tokens base
- Background: `hsl(222 47% 8%)`
- Background secundario: `hsl(228 50% 6%)`
- Foreground: `hsl(210 40% 98%)`
- Border: `hsl(217 33% 17%)`
- Primary: `#2563eb`
- Cyan: `#06b6d4`
- CTA gradient: `from-blue-600 to-cyan-500`
- Glass bg: `rgba(255,255,255,0.03)`

### Reglas de componentes (shadcn/ui)
- Button primario: gradiente azul-cyan, `rounded-xl`, `h-11`
- Inputs: `bg-white/5 border-white/10 rounded-xl`
- Cards: `bg-white/[0.03] border border-white/8 rounded-2xl`
- Fondo páginas: dark navy + mesh gradient radial

### Rediseño obligatorio
- Campus login (`:3005`)
- Tenant dashboard interno (`:3009`) completo
- Web pública (`:3006`) unificada con tokens (puede mantener light marketing si respeta sistema)

## Fase 3 — QA y aceptación
### Checklist mínimo
- No errores runtime en consola en rutas core
- Sin hidratation mismatches
- Sin loops de carga infinita
- Navegación lateral completa funcional
- Auth funcional en Ops, Payload, Tenant, Campus

### Rutas de validación tenant
- `/dashboard`
- `/programacion`
- `/planner`
- `/cursos`
- `/campus-virtual`
- `/leads`
- `/personal`
- `/sedes`
- `/administracion/usuarios`
- `/campanas`
- `/creatividades`
- `/perfil`

## Entregables
1. Matriz PASS/PARTIAL/FAIL por ruta
2. Evidencias (screenshots + consola)
3. Lista de bugs priorizada P0-P3 con repro
4. Veredicto final: **GO / NO-GO**

## Prompt corto para otro agente
"Ejecuta una auditoría funcional y visual completa de Akademate en NEMESIS, corrige P0/P1 de auth/runtime/SSR primero, luego unifica diseño según referencia Ops+Payload (dark navy + shadcn + CTA azul-cyan), y entrega matriz de rutas, evidencia visual, bugs priorizados y veredicto GO/NO-GO."
