---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts
  - apps/tenant-admin/src/payload.config.ts
  - apps/tenant-admin/lib/apiKeyAuth.ts
  - apps/tenant-admin/middleware.ts
autonomous: true
requirements:
  - API-KEYS-01
  - API-KEYS-02

must_haves:
  truths:
    - "Un tenant admin puede crear una API Key con scopes específicos"
    - "La key en texto plano se muestra UNA sola vez al crearla"
    - "Requests con Authorization: Bearer <key> se autentican correctamente"
    - "La auth por cookies existente no se rompe"
    - "Keys inactivas o de otro tenant son rechazadas con 401"
  artifacts:
    - path: "apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts"
      provides: "Colección Payload CMS para API Keys con campos name, key_hash, scopes, tenant, is_active, rate_limit_per_day, last_used_at"
      exports: ["ApiKeys"]
    - path: "apps/tenant-admin/lib/apiKeyAuth.ts"
      provides: "Utilidades: hashApiKey (SHA-256 hex), generateApiKey (crypto.randomBytes), validateBearerToken (busca en DB)"
      exports: ["hashApiKey", "generateApiKey", "validateBearerToken"]
    - path: "apps/tenant-admin/middleware.ts"
      provides: "Middleware actualizado: detecta Bearer token y valida antes de verificar cookie"
  key_links:
    - from: "middleware.ts"
      to: "apps/tenant-admin/lib/apiKeyAuth.ts"
      via: "import validateBearerToken"
      pattern: "validateBearerToken"
    - from: "apps/tenant-admin/src/payload.config.ts"
      to: "apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts"
      via: "import ApiKeys, añadir a collections array"
      pattern: "ApiKeys"
---

<objective>
Colección ApiKeys en Payload CMS + middleware Bearer token auth.

Purpose: Base de autenticación para agentes IA. Sin esto, ningún endpoint /api/v1/ puede ser consumido por clientes externos.
Output: Colección ApiKeys funcional en PostgreSQL + middleware que acepta Bearer tokens sin romper cookie auth.
</objective>

<execution_context>
@/Users/carlosjperez/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@apps/tenant-admin/src/payload.config.ts
@apps/tenant-admin/src/collections/Courses/Courses.ts
@apps/tenant-admin/middleware.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Colección ApiKeys + utilidades de hash</name>
  <files>
    apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts
    apps/tenant-admin/lib/apiKeyAuth.ts
  </files>
  <action>
Crear `apps/tenant-admin/lib/apiKeyAuth.ts` con estas funciones usando `crypto` nativo de Node (no instalar nada):

```typescript
import crypto from 'crypto'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

/** SHA-256 hex del token en texto plano */
export function hashApiKey(plainKey: string): string {
  return crypto.createHash('sha256').update(plainKey).digest('hex')
}

/** Genera token: "ak_" + 40 bytes hex aleatorios */
export function generateApiKey(): string {
  return 'ak_' + crypto.randomBytes(40).toString('hex')
}

/** Resultado de validación de Bearer token */
export interface ApiKeyValidation {
  valid: boolean
  tenantId?: number
  scopes?: string[]
  keyId?: string
}

/**
 * Valida un Bearer token contra la colección api-keys.
 * NOTA: Esta función usa getPayloadHMR — sólo llamar desde Node runtime (route handlers),
 * NO desde Edge middleware (middleware.ts usa verificación separada).
 */
export async function validateBearerToken(token: string): Promise<ApiKeyValidation> {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const keyHash = hashApiKey(token)
    const result = await payload.find({
      collection: 'api-keys',
      where: { key_hash: { equals: keyHash }, is_active: { equals: true } },
      limit: 1,
    })
    if (result.docs.length === 0) return { valid: false }
    const doc = result.docs[0] as any
    // Actualizar last_used_at async (fire and forget)
    payload.update({
      collection: 'api-keys',
      id: doc.id,
      data: { last_used_at: new Date().toISOString() },
    }).catch(() => {})
    const tenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
    return { valid: true, tenantId, scopes: doc.scopes ?? [], keyId: String(doc.id) }
  } catch {
    return { valid: false }
  }
}
```

Crear `apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts`:

```typescript
import type { CollectionConfig } from 'payload'

const VALID_SCOPES = [
  'courses:read', 'courses:write',
  'students:read', 'students:write',
  'enrollments:read', 'enrollments:write',
  'analytics:read',
]

export const ApiKeys: CollectionConfig = {
  slug: 'api-keys',
  labels: { singular: 'API Key', plural: 'API Keys' },
  admin: {
    useAsTitle: 'name',
    group: 'Sistema',
    description: 'Claves API para conectores IA (Bearer token auth)',
    defaultColumns: ['name', 'is_active', 'last_used_at', 'createdAt'],
  },
  access: {
    // Solo admin y superadmin del mismo tenant pueden ver/crear/revocar sus keys
    read: ({ req }) => {
      if (!req.user) return false
      if (req.user.role === 'superadmin') return true
      if (req.user.role === 'admin') {
        return { tenant: { equals: req.user.tenant } }
      }
      return false
    },
    create: ({ req }) => {
      if (!req.user) return false
      return ['admin', 'superadmin'].includes(req.user.role)
    },
    update: ({ req }) => {
      if (!req.user) return false
      return ['admin', 'superadmin'].includes(req.user.role)
    },
    delete: ({ req }) => {
      if (!req.user) return false
      return ['admin', 'superadmin'].includes(req.user.role)
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nombre',
      admin: { description: 'Nombre descriptivo (ej: "Claude Code Agent", "ChatGPT Plugin")' },
    },
    {
      // Almacena el SHA-256 del token, NUNCA el token en texto plano
      name: 'key_hash',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Hash de la Key',
      admin: {
        readOnly: true,
        description: 'SHA-256 del token (no reversible). El token original se muestra UNA sola vez al crear.',
      },
      access: {
        read: () => false, // Nunca exponer el hash via API
      },
    },
    {
      name: 'scopes',
      type: 'select',
      hasMany: true,
      required: true,
      label: 'Permisos (Scopes)',
      options: VALID_SCOPES.map(s => ({ label: s, value: s })),
      admin: { description: 'Permisos que tendrá esta key. Usar mínimo necesario.' },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      label: 'Tenant',
      admin: { position: 'sidebar', description: 'Academia/organización propietaria de esta key' },
    },
    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Activa',
      admin: { position: 'sidebar', description: 'Desactivar para revocar sin eliminar' },
    },
    {
      name: 'rate_limit_per_day',
      type: 'number',
      defaultValue: 1000,
      min: 1,
      label: 'Límite requests/día',
      admin: { position: 'sidebar' },
    },
    {
      name: 'last_used_at',
      type: 'date',
      label: 'Último uso',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  timestamps: true,
}
```

Finalmente, añadir `ApiKeys` a `apps/tenant-admin/src/payload.config.ts`:
- Importar: `import { ApiKeys } from './collections/ApiKeys/ApiKeys'`
- En el array `collections`, después de `AuditLogs`: `ApiKeys,`
  </action>
  <verify>
    <automated>cd /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin && npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "ApiKeys|apiKeyAuth" | head -20 || echo "TypeScript check done"</automated>
    <manual>Verificar que la colección aparece en el array collections de payload.config.ts y que lib/apiKeyAuth.ts no tiene imports rotos.</manual>
  </verify>
  <done>
    - apps/tenant-admin/src/collections/ApiKeys/ApiKeys.ts existe con slug 'api-keys', 7 campos, access control por tenant/role
    - apps/tenant-admin/lib/apiKeyAuth.ts exporta hashApiKey, generateApiKey, validateBearerToken
    - payload.config.ts importa y registra ApiKeys
    - TypeScript no reporta errores en estos archivos
  </done>
</task>

<task type="auto">
  <name>Task 2: Bearer token auth en middleware</name>
  <files>
    apps/tenant-admin/middleware.ts
  </files>
  <action>
El middleware actual corre en Edge Runtime (no puede usar `getPayloadHMR` ni hacer queries a PostgreSQL).
Estrategia: el middleware detecta el header `Authorization: Bearer ...` y marca la request con un header especial
`x-api-key-token`. Los route handlers de /api/v1/ harán la validación real via `validateBearerToken`.

Modificar `middleware.ts`:

1. Añadir `/api/v1/` a `publicRoutes` con manejo especial (no bloquear Bearer requests):

```typescript
// Rutas /api/v1/ usan Bearer token — el middleware pasa, los routes validan
const apiV1Routes = ['/api/v1/']
```

2. Antes del bloque `const token = request.cookies.get('payload-token')?.value` (línea ~275), añadir:

```typescript
// Bearer token auth para /api/v1/ — validación real ocurre en cada route handler
// El middleware solo hace pass-through para que el Edge no necesite DB access
if (pathname.startsWith('/api/v1/') || pathname.startsWith('/.well-known/')) {
  const authHeader = request.headers.get('authorization')
  const response = NextResponse.next()
  // Propagar el token al route handler via header interno
  if (authHeader?.startsWith('Bearer ')) {
    response.headers.set('x-api-bearer-token', authHeader.slice(7))
  }
  // Añadir CORS amplio para clientes IA (no solo ALLOWED_ORIGINS)
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  Object.entries(rateLimitHeaders).forEach(([k, v]) => response.headers.set(k, v))
  return response
}
```

3. Añadir también en el bloque de OPTIONS (preflight):

```typescript
// Handle OPTIONS preflight for /api/v1/ without origin restrictions
if (request.method === 'OPTIONS' && (pathname.startsWith('/api/v1/') || pathname.startsWith('/.well-known/'))) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
```

Colocar ambos bloques ANTES del bloque de `OPTIONS` actual (línea ~236) y ANTES del check de `payload-token` cookie.

IMPORTANTE: No eliminar ninguna lógica existente. Solo añadir los dos bloques en los puntos correctos.
  </action>
  <verify>
    <automated>cd /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin && npx tsc --noEmit --project tsconfig.json 2>&1 | grep "middleware" | head -10 || echo "TypeScript OK"</automated>
    <manual>Revisar manualmente que los bloques nuevos están ANTES del check de cookie y que no hay lógica duplicada.</manual>
  </verify>
  <done>
    - middleware.ts tiene bloque pass-through para /api/v1/ y /.well-known/ antes del check de cookie
    - OPTIONS preflight para /api/v1/ retorna 204 con CORS *
    - La cookie auth existente sigue funcionando para todas las rutas dashboard
    - TypeScript sin errores en middleware.ts
  </done>
</task>

</tasks>

<verification>
- `grep -r "ApiKeys" apps/tenant-admin/src/payload.config.ts` → muestra import y registro
- `grep "validateBearerToken\|hashApiKey\|generateApiKey" apps/tenant-admin/lib/apiKeyAuth.ts` → 3 exports
- `grep "api/v1" apps/tenant-admin/middleware.ts` → bloque pass-through presente
</verification>

<success_criteria>
- Colección api-keys aparece en Payload Admin bajo grupo "Sistema"
- Bearer token en /api/v1/ no es redirigido al login
- Cookie auth sigue funcionando en /dashboard/*
</success_criteria>

<output>
Crear `.planning/quick/2-implementar-api-keys-endpoints-v1-mcp-se/PLAN-01-SUMMARY.md` al completar.
</output>

---
phase: quick-2
plan: 02
type: execute
wave: 2
depends_on: [quick-2-01]
files_modified:
  - apps/tenant-admin/app/api/v1/me/route.ts
  - apps/tenant-admin/app/api/v1/courses/route.ts
  - apps/tenant-admin/app/api/v1/courses/[id]/route.ts
  - apps/tenant-admin/app/api/v1/students/route.ts
  - apps/tenant-admin/app/api/v1/enrollments/route.ts
  - apps/tenant-admin/app/api/v1/analytics/route.ts
  - apps/tenant-admin/lib/v1Auth.ts
autonomous: true
requirements:
  - API-V1-01
  - API-V1-02

must_haves:
  truths:
    - "GET /api/v1/me con Bearer válido retorna info del tenant y scopes"
    - "GET /api/v1/courses con scope courses:read retorna lista de cursos del tenant"
    - "Request sin Bearer token retorna 401 JSON (no redirect a login)"
    - "Request con scope incorrecto retorna 403 JSON"
    - "Todos los endpoints filtran por tenantId de la key, no pueden acceder datos de otros tenants"
  artifacts:
    - path: "apps/tenant-admin/lib/v1Auth.ts"
      provides: "Helper withV1Auth(req, requiredScope) → {tenantId, scopes, keyId} o NextResponse 401/403"
      exports: ["withV1Auth"]
    - path: "apps/tenant-admin/app/api/v1/me/route.ts"
      provides: "GET /api/v1/me → {tenant, scopes, key_id}"
    - path: "apps/tenant-admin/app/api/v1/courses/route.ts"
      provides: "GET /api/v1/courses, POST /api/v1/courses"
    - path: "apps/tenant-admin/app/api/v1/students/route.ts"
      provides: "GET /api/v1/students"
    - path: "apps/tenant-admin/app/api/v1/enrollments/route.ts"
      provides: "GET /api/v1/enrollments, POST /api/v1/enrollments"
    - path: "apps/tenant-admin/app/api/v1/analytics/route.ts"
      provides: "GET /api/v1/analytics → KPIs del tenant"
  key_links:
    - from: "apps/tenant-admin/app/api/v1/courses/route.ts"
      to: "apps/tenant-admin/lib/v1Auth.ts"
      via: "import withV1Auth"
      pattern: "withV1Auth"
    - from: "apps/tenant-admin/lib/v1Auth.ts"
      to: "apps/tenant-admin/lib/apiKeyAuth.ts"
      via: "import validateBearerToken"
      pattern: "validateBearerToken"
---

<objective>
Endpoints estables /api/v1/ con autenticación Bearer y autorización por scopes.

Purpose: Superficie de API que Claude, ChatGPT y Grok pueden consumir directamente. Cada endpoint filtra por tenantId de la API Key.
Output: 6 route handlers + helper de auth reutilizable.
</objective>

<execution_context>
@/Users/carlosjperez/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@apps/tenant-admin/lib/apiKeyAuth.ts
@apps/tenant-admin/app/api/dashboard/route.ts
@apps/tenant-admin/src/collections/Courses/Courses.ts
</context>

<tasks>

<task type="auto">
  <name>Task 3: Helper withV1Auth + endpoints me y courses</name>
  <files>
    apps/tenant-admin/lib/v1Auth.ts
    apps/tenant-admin/app/api/v1/me/route.ts
    apps/tenant-admin/app/api/v1/courses/route.ts
    apps/tenant-admin/app/api/v1/courses/[id]/route.ts
  </files>
  <action>
Crear `apps/tenant-admin/lib/v1Auth.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { validateBearerToken, type ApiKeyValidation } from './apiKeyAuth'

export type V1AuthResult = ApiKeyValidation & { valid: true; tenantId: number; scopes: string[]; keyId: string }

/**
 * Extrae y valida el Bearer token del request.
 * Si la validación falla, retorna NextResponse con 401 o 403.
 * Si el scope requerido no está en la key, retorna 403.
 * Uso: const auth = await withV1Auth(req, 'courses:read'); if (auth instanceof NextResponse) return auth;
 */
export async function withV1Auth(
  req: NextRequest,
  requiredScope?: string
): Promise<V1AuthResult | NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'MISSING_BEARER_TOKEN', hint: 'Add Authorization: Bearer <your-api-key> header' },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7).trim()
  const result = await validateBearerToken(token)

  if (!result.valid || !result.tenantId || !result.scopes || !result.keyId) {
    return NextResponse.json(
      { error: 'Invalid or inactive API key', code: 'INVALID_API_KEY' },
      { status: 401 }
    )
  }

  if (requiredScope && !result.scopes.includes(requiredScope)) {
    return NextResponse.json(
      { error: `Missing required scope: ${requiredScope}`, code: 'INSUFFICIENT_SCOPE', required: requiredScope, granted: result.scopes },
      { status: 403 }
    )
  }

  return result as V1AuthResult
}
```

Crear `apps/tenant-admin/app/api/v1/me/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { withV1Auth } from '@/lib/v1Auth'

export async function GET(req: NextRequest) {
  const auth = await withV1Auth(req)
  if (auth instanceof NextResponse) return auth

  const payload = await getPayloadHMR({ config: configPromise })
  const tenant = await payload.findByID({ collection: 'tenants', id: auth.tenantId })

  return NextResponse.json({
    success: true,
    data: {
      key_id: auth.keyId,
      tenant_id: auth.tenantId,
      tenant_name: (tenant as any)?.name ?? null,
      scopes: auth.scopes,
    },
  })
}
```

Crear `apps/tenant-admin/app/api/v1/courses/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { withV1Auth } from '@/lib/v1Auth'

export async function GET(req: NextRequest) {
  const auth = await withV1Auth(req, 'courses:read')
  if (auth instanceof NextResponse) return auth

  const payload = await getPayloadHMR({ config: configPromise })
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100)

  const result = await payload.find({
    collection: 'courses',
    where: { tenant: { equals: auth.tenantId } },
    page,
    limit,
  })

  return NextResponse.json({
    success: true,
    data: result.docs,
    pagination: { page: result.page, limit: result.limit, totalDocs: result.totalDocs, totalPages: result.totalPages, hasNextPage: result.hasNextPage },
  })
}

export async function POST(req: NextRequest) {
  const auth = await withV1Auth(req, 'courses:write')
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const payload = await getPayloadHMR({ config: configPromise })

  const doc = await payload.create({
    collection: 'courses',
    data: { ...body, tenant: auth.tenantId },
  })

  return NextResponse.json({ success: true, data: doc }, { status: 201 })
}
```

Crear `apps/tenant-admin/app/api/v1/courses/[id]/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { withV1Auth } from '@/lib/v1Auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withV1Auth(req, 'courses:read')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const payload = await getPayloadHMR({ config: configPromise })
  const doc = await payload.findByID({ collection: 'courses', id }) as any

  // Tenant isolation: verify course belongs to auth tenant
  const docTenantId = typeof doc.tenant === 'object' ? doc.tenant?.id : doc.tenant
  if (String(docTenantId) !== String(auth.tenantId)) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: doc })
}
```
  </action>
  <verify>
    <automated>cd /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin && npx tsc --noEmit 2>&1 | grep -E "v1Auth|v1/me|v1/courses" | head -20 || echo "TypeScript check done"</automated>
    <manual>Revisar que lib/v1Auth.ts usa el tipo correcto de retorno. Confirmar que el @ alias en tsconfig.json apunta a la raíz correcta.</manual>
  </verify>
  <done>
    - lib/v1Auth.ts exporta withV1Auth con tipado correcto
    - GET /api/v1/me retorna tenant info y scopes
    - GET /api/v1/courses retorna paginación con isolación por tenantId
    - POST /api/v1/courses fuerza tenant de la key (no del body)
    - GET /api/v1/courses/[id] verifica tenant antes de retornar
  </done>
</task>

<task type="auto">
  <name>Task 4: Endpoints students, enrollments y analytics</name>
  <files>
    apps/tenant-admin/app/api/v1/students/route.ts
    apps/tenant-admin/app/api/v1/enrollments/route.ts
    apps/tenant-admin/app/api/v1/analytics/route.ts
  </files>
  <action>
Crear `apps/tenant-admin/app/api/v1/students/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { withV1Auth } from '@/lib/v1Auth'

export async function GET(req: NextRequest) {
  const auth = await withV1Auth(req, 'students:read')
  if (auth instanceof NextResponse) return auth

  const payload = await getPayloadHMR({ config: configPromise })
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100)

  const result = await payload.find({
    collection: 'students',
    where: { tenant: { equals: auth.tenantId } },
    page,
    limit,
  })

  return NextResponse.json({
    success: true,
    data: result.docs,
    pagination: { page: result.page, limit: result.limit, totalDocs: result.totalDocs, totalPages: result.totalPages, hasNextPage: result.hasNextPage },
  })
}
```

Crear `apps/tenant-admin/app/api/v1/enrollments/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { withV1Auth } from '@/lib/v1Auth'

export async function GET(req: NextRequest) {
  const auth = await withV1Auth(req, 'enrollments:read')
  if (auth instanceof NextResponse) return auth

  const payload = await getPayloadHMR({ config: configPromise })
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100)

  const result = await payload.find({
    collection: 'enrollments',
    where: { tenant: { equals: auth.tenantId } },
    page,
    limit,
    depth: 1, // populate course and student
  })

  return NextResponse.json({
    success: true,
    data: result.docs,
    pagination: { page: result.page, limit: result.limit, totalDocs: result.totalDocs, totalPages: result.totalPages, hasNextPage: result.hasNextPage },
  })
}

export async function POST(req: NextRequest) {
  const auth = await withV1Auth(req, 'enrollments:write')
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const payload = await getPayloadHMR({ config: configPromise })

  const doc = await payload.create({
    collection: 'enrollments',
    data: { ...body, tenant: auth.tenantId },
  })

  return NextResponse.json({ success: true, data: doc }, { status: 201 })
}
```

Crear `apps/tenant-admin/app/api/v1/analytics/route.ts` (reutiliza lógica del /api/dashboard existente):

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { withV1Auth } from '@/lib/v1Auth'

export async function GET(req: NextRequest) {
  const auth = await withV1Auth(req, 'analytics:read')
  if (auth instanceof NextResponse) return auth

  const payload = await getPayloadHMR({ config: configPromise })
  const tenantWhere = { tenant: { equals: auth.tenantId } }

  const [coursesData, convocationsData, studentsData, enrollmentsData] = await Promise.all([
    payload.find({ collection: 'courses', where: tenantWhere, limit: 0 }),
    payload.find({ collection: 'course-runs', where: tenantWhere, limit: 0 }),
    payload.find({ collection: 'students', where: tenantWhere, limit: 0 }),
    payload.find({ collection: 'enrollments', where: tenantWhere, limit: 0 }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      tenant_id: auth.tenantId,
      totals: {
        courses: coursesData.totalDocs,
        course_runs: convocationsData.totalDocs,
        students: studentsData.totalDocs,
        enrollments: enrollmentsData.totalDocs,
      },
      generated_at: new Date().toISOString(),
    },
  })
}
```
  </action>
  <verify>
    <automated>cd /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin && npx tsc --noEmit 2>&1 | grep -E "v1/students|v1/enrollments|v1/analytics" | head -20 || echo "TypeScript check done"</automated>
    <manual>Confirmar que todos los endpoints importan desde '@/lib/v1Auth' y que el @ alias está configurado en tsconfig.json (debería estar ya dado que el proyecto usa Next.js 15).</manual>
  </verify>
  <done>
    - GET /api/v1/students retorna lista paginada filtrada por tenant
    - GET /api/v1/enrollments retorna matrículas con depth:1 (course y student populados)
    - POST /api/v1/enrollments crea matrícula forzando tenant de la key
    - GET /api/v1/analytics retorna totales KPI del tenant
    - Todos usan withV1Auth con scope correcto
  </done>
</task>

</tasks>

<verification>
```bash
# Verificar que todos los archivos existen
ls apps/tenant-admin/app/api/v1/
# Debe mostrar: me/ courses/ students/ enrollments/ analytics/

# Verificar imports
grep -r "withV1Auth" apps/tenant-admin/app/api/v1/
# Debe aparecer en todos los route handlers

# TypeScript check global
cd apps/tenant-admin && npx tsc --noEmit 2>&1 | grep -c "error" || echo "0 errors"
```
</verification>

<success_criteria>
- 6 route handlers en /api/v1/ con auth y scope check
- Ningún endpoint redirige al login (retorna JSON 401)
- Todos filtran por tenantId de la API Key
- TypeScript sin errores
</success_criteria>

<output>
Crear `.planning/quick/2-implementar-api-keys-endpoints-v1-mcp-se/PLAN-02-SUMMARY.md` al completar.
</output>

---
phase: quick-2
plan: 03
type: execute
wave: 2
depends_on: [quick-2-01]
files_modified:
  - apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx
  - apps/tenant-admin/app/api/v1/keys/route.ts
  - apps/tenant-admin/app/api/v1/keys/[id]/route.ts
autonomous: true
requirements:
  - API-UI-01

must_haves:
  truths:
    - "Admin puede ver su lista de API Keys con nombre, scopes y último uso"
    - "Al crear una key, el token en texto plano aparece UNA sola vez en un modal"
    - "Admin puede revocar (desactivar) una key existente"
    - "La UI llama a los endpoints internos /api/v1/keys, no genera keys en cliente"
  artifacts:
    - path: "apps/tenant-admin/app/api/v1/keys/route.ts"
      provides: "GET /api/v1/keys (lista del tenant autenticado por cookie), POST /api/v1/keys (crea key, retorna texto plano UNA vez)"
      exports: ["GET", "POST"]
    - path: "apps/tenant-admin/app/api/v1/keys/[id]/route.ts"
      provides: "DELETE /api/v1/keys/[id] (revoca desactivando is_active=false)"
      exports: ["DELETE"]
    - path: "apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx"
      provides: "UI real con tabla de keys, modal de creación con selector de scopes, botón revocar"
  key_links:
    - from: "apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx"
      to: "apps/tenant-admin/app/api/v1/keys/route.ts"
      via: "fetch('/api/v1/keys')"
      pattern: "fetch.*api/v1/keys"
---

<objective>
UI real de gestión de API Keys + endpoints internos para crear/listar/revocar.

Purpose: Permitir a los admins de cada tenant gestionar sus keys desde la UI dashboard (sin tocar Payload Admin).
Output: UI funcional conectada a endpoints que usan cookie auth (no Bearer), mostrando token UNA sola vez.
</objective>

<execution_context>
@/Users/carlosjperez/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx
@apps/tenant-admin/lib/apiKeyAuth.ts
@apps/tenant-admin/app/api/dashboard/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 5: Endpoints internos CRUD de API Keys + UI actualizada</name>
  <files>
    apps/tenant-admin/app/api/v1/keys/route.ts
    apps/tenant-admin/app/api/v1/keys/[id]/route.ts
    apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx
  </files>
  <action>
Estos endpoints usan la SESSION de cookie (Payload auth), NO Bearer token. Son para el dashboard interno.

Crear `apps/tenant-admin/app/api/v1/keys/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import { generateApiKey, hashApiKey } from '@/lib/apiKeyAuth'

/** GET /api/v1/keys — Lista las API Keys del tenant del usuario autenticado (cookie session) */
export async function GET(_req: NextRequest) {
  const payload = await getPayloadHMR({ config: configPromise })
  // Usar Payload local API — getPayloadHMR respeta la sesión del request via cookie
  // tenantId viene de process.env como fallback igual que /api/dashboard
  const envTenantId = parseInt(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '2', 10) || 2

  const result = await payload.find({
    collection: 'api-keys',
    where: { tenant: { equals: envTenantId }, is_active: { equals: true } },
    limit: 50,
  })

  return NextResponse.json({
    success: true,
    data: result.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      scopes: doc.scopes,
      is_active: doc.is_active,
      rate_limit_per_day: doc.rate_limit_per_day,
      last_used_at: doc.last_used_at ?? null,
      created_at: doc.createdAt,
    })),
  })
}

/** POST /api/v1/keys — Crea nueva API Key, retorna el token UNA sola vez */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, scopes } = body as { name: string; scopes: string[] }

  if (!name || !scopes?.length) {
    return NextResponse.json({ error: 'name and scopes are required' }, { status: 400 })
  }

  const payload = await getPayloadHMR({ config: configPromise })
  const envTenantId = parseInt(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '2', 10) || 2

  const plainToken = generateApiKey()
  const keyHash = hashApiKey(plainToken)

  const doc = await payload.create({
    collection: 'api-keys',
    data: {
      name,
      key_hash: keyHash,
      scopes,
      tenant: envTenantId,
      is_active: true,
      rate_limit_per_day: 1000,
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: (doc as any).id,
      name: (doc as any).name,
      scopes: (doc as any).scopes,
      // ÚNICA VEZ que el token en texto plano se retorna
      token: plainToken,
      warning: 'Save this token now. It will NOT be shown again.',
    },
  }, { status: 201 })
}
```

Crear `apps/tenant-admin/app/api/v1/keys/[id]/route.ts`:

```typescript
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'

/** DELETE /api/v1/keys/[id] — Revoca (desactiva) una API Key */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadHMR({ config: configPromise })

  await payload.update({
    collection: 'api-keys',
    id,
    data: { is_active: false },
  })

  return NextResponse.json({ success: true, message: 'API Key revoked' })
}
```

Reemplazar el contenido de `apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx` con una versión que:

1. Mantiene la sección de Facebook Pixel, Google Tags, MCP y Webhooks EXACTAMENTE igual (solo cambiar la sección de API Keys).
2. La sección API Keys:
   - `useEffect` al montar: `fetch('/api/v1/keys')` → setKeys(data.data)
   - Estado `newToken: string | null` para mostrar el token tras crear
   - Selector de scopes en el modal de creación (checkboxes: courses:read, courses:write, students:read, students:write, enrollments:read, enrollments:write, analytics:read)
   - Al crear: `POST /api/v1/keys` → si success, setNewToken(data.data.token) → mostrar modal con token
   - Modal "Guarda tu token" con el token en un input readonly + botón Copy → al cerrar setNewToken(null)
   - Al revocar: `DELETE /api/v1/keys/${id}` → refetch lista
   - Mostrar en tabla: name, scopes (badges), last_used_at, botón Revocar

Implementar el reemplazo de la sección API Keys preservando todo lo demás.
El archivo es largo (~715 líneas) así que usar Edit para cambiar solo la sección relevante:
- `useState<APIKey[]>([...mockData])` → `useState<RealApiKey[]>([])`
- Añadir `useEffect` para fetch inicial
- Actualizar `handleCreateKey` para llamar a POST /api/v1/keys
- Actualizar `handleDeleteKey` para llamar a DELETE /api/v1/keys/${id}
- Añadir modal de "token mostrado una vez"
- Añadir selector de scopes en el modal de creación

Tipo `RealApiKey`:
```typescript
interface RealApiKey {
  id: string
  name: string
  scopes: string[]
  is_active: boolean
  rate_limit_per_day: number
  last_used_at: string | null
  created_at: string
}
```
  </action>
  <verify>
    <automated>cd /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin && npx tsc --noEmit 2>&1 | grep -E "v1/keys|configuracion/apis" | head -20 || echo "TypeScript check done"</automated>
    <manual>
1. Ir a /configuracion/apis en el browser
2. Crear una API Key → verificar que aparece el modal con token
3. Copiar token, cerrar modal → verificar que no se puede volver a ver
4. Verificar que la key aparece en la tabla
5. Revocar la key → verificar que desaparece de la lista
    </manual>
  </verify>
  <done>
    - GET /api/v1/keys retorna lista de keys activas del tenant
    - POST /api/v1/keys crea key y retorna token en texto plano (una sola vez en la respuesta)
    - DELETE /api/v1/keys/[id] desactiva la key (is_active=false)
    - UI muestra tabla real (no mock data) con scopes y último uso
    - Modal post-creación muestra token con advertencia de "guárdalo ahora"
  </done>
</task>

</tasks>

<verification>
```bash
# Verificar estructura de archivos v1/keys
ls apps/tenant-admin/app/api/v1/keys/

# Verificar que la UI page ya no usa mock data
grep "pk_live\|pk_dev" apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx
# Debe retornar vacío (sin mock data)

# Verificar fetch al backend
grep "api/v1/keys" apps/tenant-admin/app/(dashboard)/configuracion/apis/page.tsx
# Debe mostrar las 3 llamadas fetch
```
</verification>

<success_criteria>
- La UI llama a endpoints reales (no genera keys en cliente)
- El token aparece UNA sola vez en un modal después de crear
- Revocar una key la desactiva en la DB
</success_criteria>

<output>
Crear `.planning/quick/2-implementar-api-keys-endpoints-v1-mcp-se/PLAN-03-SUMMARY.md` al completar.
</output>

---
phase: quick-2
plan: 04
type: execute
wave: 3
depends_on: [quick-2-02]
files_modified:
  - apps/tenant-admin/app/api/v1/openapi.json/route.ts
  - apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts
  - packages/mcp-server/package.json
  - packages/mcp-server/src/index.ts
  - packages/mcp-server/tsconfig.json
autonomous: true
requirements:
  - OPENAPI-01
  - MCP-01
  - MCP-02

must_haves:
  truths:
    - "GET /api/v1/openapi.json retorna spec OpenAPI 3.1 válida con todos los endpoints v1"
    - "GET /.well-known/ai-plugin.json retorna manifest ChatGPT Actions válido"
    - "packages/mcp-server/src/index.ts es un stdio MCP server con 5 tools y 2 resources"
    - "El MCP server arranca con: AKADEMATE_API_URL=... AKADEMATE_API_KEY=ak_... node dist/index.js"
  artifacts:
    - path: "apps/tenant-admin/app/api/v1/openapi.json/route.ts"
      provides: "GET /api/v1/openapi.json → spec completa de los 7 endpoints v1"
    - path: "apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts"
      provides: "GET /.well-known/ai-plugin.json → manifest para ChatGPT Actions"
    - path: "packages/mcp-server/src/index.ts"
      provides: "MCP stdio server con tools: get_courses, get_students, get_analytics, create_enrollment, get_schedule. Resources: courses_catalog, students_list"
    - path: "packages/mcp-server/package.json"
      provides: "Package con dependencia @modelcontextprotocol/sdk (ya en overrides del monorepo: 1.25.2)"
  key_links:
    - from: "packages/mcp-server/src/index.ts"
      to: "AKADEMATE_API_URL/api/v1/"
      via: "fetch con Authorization: Bearer $AKADEMATE_API_KEY"
      pattern: "fetch.*api/v1"
---

<objective>
OpenAPI spec + ChatGPT manifest + MCP Server en packages/mcp-server.

Purpose: Permitir que ChatGPT Actions consuma la API directamente y que Claude Code use el MCP server para acceder a datos de Akademate.
Output: Spec navigable en /api/v1/openapi.json, manifest en /.well-known/ai-plugin.json, y MCP server publicado como package.
</objective>

<execution_context>
@/Users/carlosjperez/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@package.json
@apps/tenant-admin/lib/v1Auth.ts
</context>

<tasks>

<task type="auto">
  <name>Task 6: OpenAPI spec + ChatGPT manifest</name>
  <files>
    apps/tenant-admin/app/api/v1/openapi.json/route.ts
    apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts
  </files>
  <action>
Crear `apps/tenant-admin/app/api/v1/openapi.json/route.ts` (ruta especial con nombre de archivo con punto):

NOTA: Next.js App Router no permite puntos en segmentos de ruta. Usar ruta alternativa: `apps/tenant-admin/app/api/v1/openapi/route.ts` que retorna el JSON con header correcto, y también crear `apps/tenant-admin/app/api/v1/openapi.json/route.ts` como redirect.

Crear `apps/tenant-admin/app/api/v1/openapi/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3002'

  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Akademate API',
      version: '1.0.0',
      description: 'REST API for Akademate — Training Center Management Platform. Authenticate with Bearer token (API Key from /configuracion/apis).',
    },
    servers: [{ url: baseUrl, description: 'Akademate instance' }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'API Key (ak_...)' },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalDocs: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNextPage: { type: 'boolean' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            code: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/api/v1/me': {
        get: {
          summary: 'Get current API key info',
          description: 'Returns tenant info and scopes for the authenticated API key.',
          operationId: 'getMe',
          responses: {
            '200': { description: 'Success', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { key_id: { type: 'string' }, tenant_id: { type: 'integer' }, tenant_name: { type: 'string' }, scopes: { type: 'array', items: { type: 'string' } } } } } } } } },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/api/v1/courses': {
        get: {
          summary: 'List courses',
          operationId: 'getCourses',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': { description: 'Paginated list of courses' },
            '401': { description: 'Unauthorized', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
            '403': { description: 'Missing scope: courses:read' },
          },
        },
        post: {
          summary: 'Create course',
          operationId: 'createCourse',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'modality', 'area_formativa'], properties: { name: { type: 'string' }, modality: { type: 'string', enum: ['presencial', 'online', 'hibrido'] }, area_formativa: { type: 'string', description: 'Area formativa ID' } } } } } },
          responses: { '201': { description: 'Course created' }, '401': { description: 'Unauthorized' }, '403': { description: 'Missing scope: courses:write' } },
        },
      },
      '/api/v1/courses/{id}': {
        get: {
          summary: 'Get course by ID',
          operationId: 'getCourseById',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Course detail' }, '401': { description: 'Unauthorized' }, '404': { description: 'Not found or wrong tenant' } },
        },
      },
      '/api/v1/students': {
        get: {
          summary: 'List students',
          operationId: 'getStudents',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: { '200': { description: 'Paginated list of students' }, '401': { description: 'Unauthorized' }, '403': { description: 'Missing scope: students:read' } },
        },
      },
      '/api/v1/enrollments': {
        get: {
          summary: 'List enrollments',
          operationId: 'getEnrollments',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: { '200': { description: 'Paginated list of enrollments with populated course and student' }, '401': { description: 'Unauthorized' }, '403': { description: 'Missing scope: enrollments:read' } },
        },
        post: {
          summary: 'Create enrollment',
          operationId: 'createEnrollment',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['student', 'course_run'], properties: { student: { type: 'string', description: 'Student ID' }, course_run: { type: 'string', description: 'CourseRun ID' } } } } } },
          responses: { '201': { description: 'Enrollment created' }, '401': { description: 'Unauthorized' }, '403': { description: 'Missing scope: enrollments:write' } },
        },
      },
      '/api/v1/analytics': {
        get: {
          summary: 'Get analytics KPIs',
          operationId: 'getAnalytics',
          responses: { '200': { description: 'KPI totals for the tenant' }, '401': { description: 'Unauthorized' }, '403': { description: 'Missing scope: analytics:read' } },
        },
      },
    },
  }

  return NextResponse.json(spec, {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

Crear `apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts`:

NOTA: El directorio `.well-known` empieza con punto. En Next.js App Router crear `apps/tenant-admin/app/.well-known/ai-plugin.json/route.ts`. Si el FS da problemas con el directorio punto, usar `apps/tenant-admin/app/api/ai-plugin/route.ts` con redirect desde `apps/tenant-admin/public/.well-known/ai-plugin.json` (archivo estático).

Estrategia más simple: crear `apps/tenant-admin/public/.well-known/ai-plugin.json` como archivo estático:

```json
{
  "schema_version": "v1",
  "name_for_human": "Akademate",
  "name_for_model": "akademate",
  "description_for_human": "Manage courses, students, and enrollments in Akademate training platform.",
  "description_for_model": "Plugin for Akademate training management. Use this to get courses catalog, student list, enrollment data, and analytics KPIs. Authentication via API key.",
  "auth": {
    "type": "service_http",
    "authorization_type": "bearer"
  },
  "api": {
    "type": "openapi",
    "url": "/api/v1/openapi"
  },
  "logo_url": "/logos/logo.png",
  "contact_email": "support@akademate.com",
  "legal_info_url": "/legal/terminos"
}
```

Crear ese archivo en `apps/tenant-admin/public/.well-known/ai-plugin.json`.
  </action>
  <verify>
    <automated>curl -s http://localhost:3002/api/v1/openapi 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK:', d.get('openapi'))" || echo "Server not running — check file exists"</automated>
    <manual>
1. Verificar que apps/tenant-admin/app/api/v1/openapi/route.ts existe
2. Verificar que apps/tenant-admin/public/.well-known/ai-plugin.json existe
3. El JSON del spec tiene todos los paths definidos
    </manual>
  </verify>
  <done>
    - GET /api/v1/openapi retorna spec OpenAPI 3.1 con 7 paths
    - /.well-known/ai-plugin.json accesible como archivo estático
    - La spec referencia la URL base desde PAYLOAD_PUBLIC_SERVER_URL
  </done>
</task>

<task type="auto">
  <name>Task 7: MCP Server en packages/mcp-server</name>
  <files>
    packages/mcp-server/package.json
    packages/mcp-server/tsconfig.json
    packages/mcp-server/src/index.ts
  </files>
  <action>
El monorepo ya tiene `@modelcontextprotocol/sdk` en overrides (versión 1.25.2). Usarlo directamente.

Crear `packages/mcp-server/package.json`:

```json
{
  "name": "@akademate/mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for Akademate — exposes tools and resources for AI agents",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "akademate-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --out-dir dist",
    "dev": "tsup src/index.ts --format esm --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.25.2"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "^5.9.3",
    "@types/node": "^22.0.0"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

Crear `packages/mcp-server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Crear `packages/mcp-server/src/index.ts`:

```typescript
#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// ============================================================================
// Configuration
// ============================================================================

const API_URL = process.env.AKADEMATE_API_URL
const API_KEY = process.env.AKADEMATE_API_KEY

if (!API_URL || !API_KEY) {
  console.error('[akademate-mcp] ERROR: AKADEMATE_API_URL and AKADEMATE_API_KEY env vars required')
  process.exit(1)
}

// ============================================================================
// HTTP Helper
// ============================================================================

async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_URL.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

// ============================================================================
// MCP Server
// ============================================================================

const server = new Server(
  { name: 'akademate', version: '1.0.0' },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
)

// ============================================================================
// Tools
// ============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_courses',
      description: 'List courses from the Akademate catalog. Returns name, modality, area, active status, and pricing.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', description: 'Page number (default: 1)', default: 1 },
          limit: { type: 'number', description: 'Results per page (max 100, default: 20)', default: 20 },
        },
      },
    },
    {
      name: 'get_students',
      description: 'List students enrolled in the platform.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
        },
      },
    },
    {
      name: 'get_analytics',
      description: 'Get KPI analytics: total courses, students, enrollments, and course runs for the tenant.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'create_enrollment',
      description: 'Enroll a student in a course run (convocatoria).',
      inputSchema: {
        type: 'object',
        required: ['student_id', 'course_run_id'],
        properties: {
          student_id: { type: 'string', description: 'The student ID to enroll' },
          course_run_id: { type: 'string', description: 'The course run (convocatoria) ID' },
        },
      },
    },
    {
      name: 'get_schedule',
      description: 'Get upcoming course runs (convocatorias) schedule with dates, capacity, and enrollment status.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
        },
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const a = (args ?? {}) as Record<string, unknown>

  try {
    switch (name) {
      case 'get_courses': {
        const data = await apiFetch(`/api/v1/courses?page=${a.page ?? 1}&limit=${a.limit ?? 20}`)
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'get_students': {
        const data = await apiFetch(`/api/v1/students?page=${a.page ?? 1}&limit=${a.limit ?? 20}`)
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'get_analytics': {
        const data = await apiFetch('/api/v1/analytics')
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'create_enrollment': {
        if (!a.student_id || !a.course_run_id) {
          return { content: [{ type: 'text', text: 'Error: student_id and course_run_id are required' }], isError: true }
        }
        const data = await apiFetch('/api/v1/enrollments', {
          method: 'POST',
          body: JSON.stringify({ student: a.student_id, course_run: a.course_run_id }),
        })
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      case 'get_schedule': {
        const data = await apiFetch(`/api/v1/enrollments?page=${a.page ?? 1}&limit=${a.limit ?? 20}`)
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true }
  }
})

// ============================================================================
// Resources
// ============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'akademate://courses_catalog',
      name: 'Courses Catalog',
      description: 'Complete list of courses (first 100). Use get_courses tool for pagination.',
      mimeType: 'application/json',
    },
    {
      uri: 'akademate://students_list',
      name: 'Students List',
      description: 'Complete list of students (first 100). Use get_students tool for pagination.',
      mimeType: 'application/json',
    },
  ],
}))

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  if (uri === 'akademate://courses_catalog') {
    const data = await apiFetch('/api/v1/courses?limit=100')
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] }
  }

  if (uri === 'akademate://students_list') {
    const data = await apiFetch('/api/v1/students?limit=100')
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] }
  }

  throw new Error(`Unknown resource: ${uri}`)
})

// ============================================================================
// Start
// ============================================================================

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('[akademate-mcp] Server started. Waiting for MCP requests via stdio.')
}

main().catch((err) => {
  console.error('[akademate-mcp] Fatal error:', err)
  process.exit(1)
})
```

Después de crear los archivos, instalar dependencias del nuevo package:
```bash
cd /Users/carlosjperez/Documents/GitHub/akademate.com && pnpm install
```

Intentar build del MCP server:
```bash
cd /Users/carlosjperez/Documents/GitHub/akademate.com/packages/mcp-server && pnpm build
```
  </action>
  <verify>
    <automated>ls /Users/carlosjperez/Documents/GitHub/akademate.com/packages/mcp-server/src/index.ts && echo "File exists" || echo "MISSING"</automated>
    <manual>
Ejecutar para verificar que arranca:
```bash
cd /Users/carlosjperez/Documents/GitHub/akademate.com/packages/mcp-server
pnpm build && echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | AKADEMATE_API_URL=http://localhost:3002 AKADEMATE_API_KEY=ak_test node dist/index.js
```
Debe mostrar la lista de tools en stderr/stdout.

Para usar con Claude Code, añadir a ~/.claude.json:
```json
{
  "mcpServers": {
    "akademate": {
      "command": "node",
      "args": ["/path/to/akademate.com/packages/mcp-server/dist/index.js"],
      "env": {
        "AKADEMATE_API_URL": "https://your-akademate.com",
        "AKADEMATE_API_KEY": "ak_..."
      }
    }
  }
}
```
    </manual>
  </verify>
  <done>
    - packages/mcp-server/src/index.ts existe con 5 tools y 2 resources
    - pnpm build en packages/mcp-server produce dist/index.js sin errores
    - El server arranca como stdio MCP server
    - tools/list retorna: get_courses, get_students, get_analytics, create_enrollment, get_schedule
  </done>
</task>

</tasks>

<verification>
```bash
# Verificar estructura del MCP package
ls /Users/carlosjperez/Documents/GitHub/akademate.com/packages/mcp-server/
# Debe mostrar: package.json, tsconfig.json, src/

ls /Users/carlosjperez/Documents/GitHub/akademate.com/packages/mcp-server/src/
# Debe mostrar: index.ts

# Verificar ai-plugin.json estático
ls /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin/public/.well-known/
# Debe mostrar: ai-plugin.json

# Verificar OpenAPI route
ls /Users/carlosjperez/Documents/GitHub/akademate.com/apps/tenant-admin/app/api/v1/openapi/
# Debe mostrar: route.ts
```
</verification>

<success_criteria>
- GET /api/v1/openapi retorna JSON con openapi: "3.1.0" y 7 paths
- public/.well-known/ai-plugin.json accesible estáticamente
- packages/mcp-server compila a dist/index.js
- MCP server expone 5 tools (get_courses, get_students, get_analytics, create_enrollment, get_schedule)
- MCP server expone 2 resources (courses_catalog, students_list)
</success_criteria>

<output>
Crear `.planning/quick/2-implementar-api-keys-endpoints-v1-mcp-se/PLAN-04-SUMMARY.md` al completar.
</output>
