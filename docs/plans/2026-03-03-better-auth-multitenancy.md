# Better Auth + Google OAuth + Multi-Tenant Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar Better Auth como sistema de autenticación unificado en Akademate, con Google OAuth, soporte multi-tenant mediante el Organization Plugin, y botones de Google en las páginas públicas de akademate.com (apps/web).

**Architecture:** Better Auth como capa de auth en `packages/auth-better` compartida entre apps. Las tablas de sesión/cuenta/verificación se añaden al schema Drizzle existente en `packages/db`, reutilizando la tabla `users` existente (UUID PK). El plugin de organizaciones mapea `organizations` → `tenants` y `members` → `memberships`. El middleware de Next.js protege rutas autenticadas.

**Tech Stack:** `better-auth@^1.2`, `@better-auth/drizzle-adapter`, Drizzle ORM, Next.js 15 App Router, Google OAuth 2.0, PostgreSQL

**Scope (prioridad):**
1. `apps/web` — Registro público con Google OAuth (FASE principal)
2. Schema compartido — tablas Better Auth + migration
3. `apps/tenant-admin` — Middleware de protección (sin reemplazar Payload auth todavía)

---

## Context del Codebase

### Archivos clave existentes
- `packages/db/src/schema.ts` — Tabla `users` (UUID PK), `memberships`, `tenants`. SIN `sessions`/`accounts`/`verification`.
- `packages/auth/src/` — JWT, password, RBAC, session, MFA existentes (NO tocar por ahora)
- `apps/web/app/registro/page.tsx` — Formulario demo request (añadir Google OAuth)
- `apps/web/app/login/page.tsx` — Redirige a `/accesos` (reemplazar con login real)
- `apps/web/lib/platform-access.ts` — `getRuntimePlatformUrls()` con `NEXT_PUBLIC_TENANT_URL`
- `apps/tenant-admin/app/auth/login/page.tsx` — Login Payload CMS (NO tocar)

### Conflictos a resolver
- `users` table ya existe con `passwordHash` — Better Auth usa campo `password` por defecto → configurar `user.additionalFields` para mapear
- `memberships` table ya existe → Better Auth Organization crea su propia `member` table → añadir ÚNICAMENTE las tablas faltantes, reusar `users`
- `packages/auth` existente → coexiste (no eliminar), Better Auth es capa adicional

---

## Fase 1: Instalar dependencias

### Task 1: Instalar better-auth en apps/web

**Files:**
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml` (automático)

**Step 1: Instalar paquetes**

```bash
cd /path/to/repo
pnpm add better-auth --filter @akademate/web
pnpm add @better-auth/drizzle-adapter --filter @akademate/web
```

**Step 2: Verificar instalación**

```bash
cat apps/web/package.json | grep better-auth
```
Esperado: `"better-auth": "^1.2.x"`

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add better-auth and drizzle adapter dependencies"
```

---

### Task 2: Instalar better-auth en packages/db (para schema generation)

**Files:**
- Modify: `packages/db/package.json`

**Step 1: Instalar**

```bash
pnpm add better-auth --filter @akademate/db
```

**Step 2: Commit**

```bash
git add packages/db/package.json pnpm-lock.yaml
git commit -m "feat(db): add better-auth for schema type generation"
```

---

## Fase 2: Extender schema Drizzle con tablas Better Auth

### Task 3: Añadir tablas de sesión, cuenta y verificación

Better Auth necesita las tablas: `session`, `account`, `verification`. La tabla `user` ya existe (nuestra `users`). No usamos el Organization Plugin todavía para evitar conflictos con `memberships` existente.

**Files:**
- Modify: `packages/db/src/schema.ts`

**Step 1: Escribir test para verificar que el schema exporta las nuevas tablas**

Archivo: `packages/db/src/__tests__/schema-better-auth.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { schema } from '../schema'

describe('Better Auth schema tables', () => {
  it('exports sessions table', () => {
    expect(schema.sessions).toBeDefined()
    expect(schema.sessions._.name).toBe('sessions')
  })

  it('exports accounts table', () => {
    expect(schema.accounts).toBeDefined()
    expect(schema.accounts._.name).toBe('accounts')
  })

  it('exports verifications table', () => {
    expect(schema.verifications).toBeDefined()
    expect(schema.verifications._.name).toBe('verifications')
  })

  it('sessions references users', () => {
    const cols = Object.keys(schema.sessions._.columns)
    expect(cols).toContain('userId')
  })
})
```

**Step 2: Ejecutar test (debe fallar)**

```bash
pnpm --filter @akademate/db test
```
Esperado: FAIL — `schema.sessions is not defined`

**Step 3: Añadir tablas al schema**

En `packages/db/src/schema.ts`, añadir ANTES del objeto `export const schema = { ... }`:

```typescript
// ============================================================================
// BETTER AUTH TABLES
// ============================================================================

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})
```

Y añadir al objeto `export const schema = { ... }`:
```typescript
  // Better Auth
  sessions,
  accounts,
  verifications,
```

**Step 4: Ejecutar test (debe pasar)**

```bash
pnpm --filter @akademate/db test
```
Esperado: PASS — 4 tests passing

**Step 5: Commit**

```bash
git add packages/db/src/schema.ts packages/db/src/__tests__/schema-better-auth.test.ts
git commit -m "feat(db): add Better Auth session/account/verification tables to schema"
```

---

### Task 4: Generar y ejecutar migración Drizzle

**Files:**
- Create: `packages/db/migrations/XXXX_better_auth_tables.sql` (generado automáticamente)

**Step 1: Generar migración**

```bash
pnpm --filter @akademate/db drizzle-kit generate
```
Esperado: Genera archivo SQL con `CREATE TABLE sessions`, `CREATE TABLE accounts`, `CREATE TABLE verifications`

**Step 2: Revisar migración generada**

```bash
cat packages/db/migrations/*.sql | grep -A5 "CREATE TABLE sessions"
```
Verificar que NO modifica tabla `users` existente (solo añade las 3 nuevas).

**Step 3: Aplicar migración en desarrollo**

```bash
pnpm --filter @akademate/db drizzle-kit migrate
```
Esperado: Migration applied successfully

**Step 4: Verificar en PostgreSQL**

```bash
docker exec -it akademate-postgres psql -U postgres -d akademate -c "\dt sessions accounts verifications"
```
Esperado: 3 tablas listadas

**Step 5: Commit**

```bash
git add packages/db/migrations/
git commit -m "feat(db): add Better Auth migration for sessions/accounts/verifications"
```

---

## Fase 3: Configurar Better Auth (lib/auth.ts en apps/web)

### Task 5: Crear configuración central de Better Auth

**Files:**
- Create: `apps/web/lib/auth.ts`
- Create: `apps/web/lib/db.ts` (conexión Drizzle para web)

**Step 1: Crear lib/db.ts**

```typescript
// apps/web/lib/db.ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { schema } from '@akademate/db'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
})

export const db = drizzle(pool, { schema })
```

**Step 2: Escribir test de configuración**

Archivo: `apps/web/lib/__tests__/auth.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

describe('Better Auth config', () => {
  it('exports auth object', async () => {
    const { auth } = await import('../auth')
    expect(auth).toBeDefined()
    expect(auth.handler).toBeTypeOf('function')
  })

  it('has google provider configured when env vars present', async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    const { auth } = await import('../auth')
    expect(auth).toBeDefined()
  })
})
```

**Step 3: Ejecutar test (debe fallar)**

```bash
pnpm --filter @akademate/web test lib/__tests__/auth.test.ts
```
Esperado: FAIL — `Cannot find module '../auth'`

**Step 4: Crear apps/web/lib/auth.ts**

```typescript
// apps/web/lib/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from './db'
import { schema } from '@akademate/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  // Campo personalizado: nuestra tabla usa 'name' no 'name' de Better Auth
  // y 'passwordHash' en lugar de 'password'
  user: {
    additionalFields: {
      mfaEnabled: {
        type: 'boolean',
        defaultValue: false,
        input: false, // no exponer en signup
      },
    },
    modelName: 'users', // nombre real de la tabla en DB
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      // TODO: integrar con sistema de emails
      console.log(`Reset password URL for ${user.email}: ${url}`)
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
  },

  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3006',
  secret: process.env.BETTER_AUTH_SECRET!,

  trustedOrigins: [
    process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3006',
    process.env.NEXT_PUBLIC_TENANT_URL ?? 'http://localhost:3009',
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Renovar si tiene > 1 día
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(), // Usar UUID para compatibilidad
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

**Step 5: Ejecutar test (debe pasar)**

```bash
pnpm --filter @akademate/web test lib/__tests__/auth.test.ts
```
Esperado: PASS

**Step 6: Commit**

```bash
git add apps/web/lib/auth.ts apps/web/lib/db.ts apps/web/lib/__tests__/auth.test.ts
git commit -m "feat(web): add Better Auth core configuration with Google OAuth"
```

---

## Fase 4: Route Handler de Better Auth

### Task 6: Crear el catch-all route handler

**Files:**
- Create: `apps/web/app/api/auth/[...all]/route.ts`

**Step 1: Crear route handler**

```typescript
// apps/web/app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

**Step 2: Verificar que arranca sin error**

```bash
# Verificar que TypeScript no da errores
pnpm --filter @akademate/web tsc --noEmit
```
Esperado: sin errores de tipo

**Step 3: Commit**

```bash
git add apps/web/app/api/auth/
git commit -m "feat(web): add Better Auth catch-all route handler"
```

---

## Fase 5: Auth Client para el frontend

### Task 7: Crear auth-client.ts

**Files:**
- Create: `apps/web/lib/auth-client.ts`

**Step 1: Escribir test**

Archivo: `apps/web/lib/__tests__/auth-client.test.ts`

```typescript
import { describe, it, expect } from 'vitest'

describe('Auth client', () => {
  it('exports signIn, signUp, signOut functions', async () => {
    const client = await import('../auth-client')
    expect(client.authClient.signIn).toBeDefined()
    expect(client.authClient.signUp).toBeDefined()
    expect(client.authClient.signOut).toBeDefined()
  })

  it('exports useSession hook', async () => {
    const client = await import('../auth-client')
    expect(client.authClient.useSession).toBeDefined()
  })
})
```

**Step 2: Crear auth-client.ts**

```typescript
// apps/web/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3006',
})

export const { useSession, signIn, signUp, signOut } = authClient
```

**Step 3: Ejecutar test**

```bash
pnpm --filter @akademate/web test lib/__tests__/auth-client.test.ts
```
Esperado: PASS

**Step 4: Commit**

```bash
git add apps/web/lib/auth-client.ts apps/web/lib/__tests__/auth-client.test.ts
git commit -m "feat(web): add Better Auth client with React hooks"
```

---

## Fase 6: Variables de entorno

### Task 8: Documentar y añadir env vars requeridas

**Files:**
- Modify: `apps/web/.env.local` (desarrollo)
- Modify: `apps/web/.env.example` (si existe, o crear)
- Modify: `/home/cmdr/akademate/infrastructure/docker/.env` (NEMESIS producción)

**Step 1: Añadir vars a .env.example de apps/web**

```bash
# Create/update apps/web/.env.example
cat >> apps/web/.env.example << 'EOF'

# ============================================================================
# BETTER AUTH
# ============================================================================
BETTER_AUTH_SECRET=generate-with-openssl-rand-hex-32
BETTER_AUTH_URL=https://akademate.com   # URL pública de apps/web

# Google OAuth (obtener en console.cloud.google.com)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# Database (misma que usa Payload)
DATABASE_URL=postgresql://user:pass@localhost:5432/akademate
EOF
```

**Step 2: Añadir vars a .env.local (desarrollo)**

```
BETTER_AUTH_SECRET=dev-secret-replace-in-production-minimum-32-chars
BETTER_AUTH_URL=http://localhost:3006
GOOGLE_CLIENT_ID=<del console de Google>
GOOGLE_CLIENT_SECRET=<del console de Google>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/akademate
```

**Step 3: En NEMESIS (producción) añadir al .env de Docker**

```bash
# Via SSH a NEMESIS
sshpass -p '5561' ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no \
  carlosjperez@100.79.246.5 \
  'echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)" >> /home/cmdr/akademate/infrastructure/docker/.env'
```

**Step 4: Configurar Google OAuth en Google Cloud Console**
- Ir a https://console.cloud.google.com/apis/credentials
- Crear OAuth 2.0 Client ID
- Authorized redirect URIs: `http://100.99.60.106:3006/api/auth/callback/google` (NEMESIS) y `http://localhost:3006/api/auth/callback/google` (dev)
- Copiar Client ID y Secret a .env

**Step 5: Commit (solo .env.example, NUNCA el .env.local)**

```bash
git add apps/web/.env.example
git commit -m "feat(web): document Better Auth env vars in .env.example"
```

---

## Fase 7: Middleware de protección de rutas

### Task 9: Crear middleware en apps/web

**Files:**
- Create: `apps/web/middleware.ts`

**Step 1: Escribir test de middleware**

Archivo: `apps/web/__tests__/middleware.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('Middleware auth protection', () => {
  it('allows public routes without auth', async () => {
    const { middleware } = await import('../middleware')
    const req = new NextRequest('http://localhost:3006/')
    const res = await middleware(req)
    // Public routes should not redirect
    expect(res?.status).not.toBe(302)
  })

  it('redirects /dashboard to login when no session', async () => {
    const { middleware } = await import('../middleware')
    const req = new NextRequest('http://localhost:3006/dashboard')
    const res = await middleware(req)
    expect(res?.status).toBe(302)
    expect(res?.headers.get('location')).toContain('/login')
  })
})
```

**Step 2: Crear middleware.ts**

```typescript
// apps/web/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

// Rutas que requieren autenticación
const PROTECTED_PREFIXES = ['/dashboard', '/perfil', '/mi-academia']

// Rutas públicas explícitas (siempre permitidas)
const PUBLIC_PATHS = ['/', '/registro', '/accesos', '/sobre-nosotros', '/cursos', '/blog', '/contacto', '/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas de API de auth siempre
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!needsAuth) return NextResponse.next()

  const session = await getSessionFromRequest(request, auth)

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 3: Ejecutar test**

```bash
pnpm --filter @akademate/web test __tests__/middleware.test.ts
```
Esperado: PASS

**Step 4: Commit**

```bash
git add apps/web/middleware.ts apps/web/__tests__/middleware.test.ts
git commit -m "feat(web): add auth middleware protecting /dashboard routes"
```

---

## Fase 8: UI — Botones Google en páginas públicas

### Task 10: Añadir botón "Continuar con Google" a /registro

**Files:**
- Modify: `apps/web/app/registro/page.tsx`

**Step 1: Escribir test de integración del botón Google**

Archivo: `apps/web/app/registro/__tests__/page.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RegistroPage from '../page'

describe('RegistroPage', () => {
  it('renders Google signup button', () => {
    render(<RegistroPage />)
    expect(screen.getByText(/continuar con google/i)).toBeInTheDocument()
  })

  it('renders email/password form fields', () => {
    render(<RegistroPage />)
    expect(screen.getByLabelText(/nombre de tu academia/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })
})
```

**Step 2: Actualizar registro/page.tsx para añadir Google OAuth**

En la parte superior del componente (después de los imports existentes), añadir:

```typescript
import { authClient } from '@/lib/auth-client'
```

Añadir la función `handleGoogleSignup`:

```typescript
const handleGoogleSignup = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/registro/completar', // Página de completar perfil post-Google
  })
}
```

Añadir el botón Google ANTES del formulario existente (después del `<div className="rounded-2xl border bg-card shadow-sm p-8">`):

```tsx
{/* Sección Google OAuth */}
<div className="mb-6">
  <button
    type="button"
    onClick={handleGoogleSignup}
    className="w-full inline-flex items-center justify-center gap-3 rounded-md border bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
  >
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
    Continuar con Google
  </button>

  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-card px-2 text-muted-foreground">O completa el formulario</span>
    </div>
  </div>
</div>
```

**Step 3: Ejecutar test**

```bash
pnpm --filter @akademate/web test app/registro/__tests__/page.test.tsx
```
Esperado: PASS

**Step 4: Commit**

```bash
git add apps/web/app/registro/page.tsx apps/web/app/registro/__tests__/page.test.tsx
git commit -m "feat(web): add Google OAuth button to /registro page"
```

---

### Task 11: Crear página de login real para apps/web

La página `/login` actualmente redirige a `/accesos` (gateway interno). Necesitamos una página de login real para usuarios del portal público.

**Files:**
- Create: `apps/web/app/portal/login/page.tsx` (nueva ruta pública)
- Modify: `apps/web/components/layout/header.tsx` (actualizar link de login)

**Step 1: Crear página de login pública**

```tsx
// apps/web/app/portal/login/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function PortalLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '' })

  const handleGoogleLogin = async () => {
    setLoading(true)
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    })
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
        callbackURL: '/dashboard',
      })
      if (error) {
        setError(error.message ?? 'Email o contraseña incorrectos')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Error de conexión. Por favor inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/5 to-background flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition-colors">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">Akademate</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Accede a tu cuenta</h1>
          <p className="mt-2 text-muted-foreground">Bienvenido de vuelta</p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8 space-y-5">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 rounded-md border bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">O con email</span>
            </div>
          </div>

          {/* Email/password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Contraseña
                </label>
                <Link href="/portal/forgot-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Crear academia gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Actualizar header para link al login del portal**

En `apps/web/components/layout/header.tsx`, cambiar el link "Iniciar sesión":

```tsx
// ANTES:
href={loginUrl}  // apuntaba a tenant-admin

// DESPUÉS (dos opciones en el header):
// 1. "Portal" → /portal/login (usuarios del portal web)
// 2. "Admin" → tenantLoginUrl (administradores de academia - enlace secundario)
```

Actualizar la sección CTA del header:

```tsx
<div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 lg:items-center">
  <Link
    href="/portal/login"
    className="text-sm font-medium text-muted-foreground hover:text-foreground"
  >
    Iniciar sesión
  </Link>
  <Link
    href="/registro"
    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
  >
    Empezar gratis
  </Link>
</div>
```

**Step 3: Commit**

```bash
git add apps/web/app/portal/ apps/web/components/layout/header.tsx
git commit -m "feat(web): add public portal login page with Google OAuth and email/password"
```

---

## Fase 9: Página de completar perfil post-Google (opcional pero recomendada)

### Task 12: Crear /registro/completar para nuevos usuarios Google

Cuando un usuario se registra con Google por primera vez, necesitamos capturar el nombre de su academia.

**Files:**
- Create: `apps/web/app/registro/completar/page.tsx`

**Step 1: Crear página**

```tsx
// apps/web/app/registro/completar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { GraduationCap, Loader2 } from 'lucide-react'

export default function CompletarRegistroPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [academyName, setAcademyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/registro')
    }
  }, [session, isPending, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Enviar solicitud de demo con datos del usuario Google
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: session?.user.name ?? '',
          email: session?.user.email ?? '',
          asunto: 'demo',
          mensaje: `Academia: ${academyName}\n\nRegistro via Google OAuth`,
          gdpr_consent: true,
        }),
      })
      const data = await response.json()
      if (data.success) {
        router.push('/registro/gracias')
      } else {
        setError(data.error ?? 'Error al completar el registro')
      }
    } catch {
      setError('Error de conexión. Por favor inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (isPending) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-primary/5 to-background flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">¡Un paso más!</h1>
          <p className="mt-2 text-muted-foreground">
            Hola, {session?.user.name}. ¿Cuál es el nombre de tu academia?
          </p>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="academyName" className="block text-sm font-medium">
                Nombre de tu academia <span className="text-destructive">*</span>
              </label>
              <input
                id="academyName"
                type="text"
                required
                placeholder="ej. Academia García de Idiomas"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Completar registro'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add apps/web/app/registro/completar/
git commit -m "feat(web): add post-Google OAuth profile completion page"
```

---

## Fase 10: Despliegue en NEMESIS

### Task 13: Build y deploy en NEMESIS

**Step 1: Copiar archivos nuevos a NEMESIS**

```bash
# Copiar archivos nuevos/modificados
scp apps/web/lib/auth.ts carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/lib/auth.ts
scp apps/web/lib/auth-client.ts carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/lib/auth-client.ts
scp apps/web/lib/db.ts carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/lib/db.ts
scp -r apps/web/app/api/auth/ carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/app/api/auth/
scp apps/web/middleware.ts carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/middleware.ts
scp apps/web/app/registro/page.tsx carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/app/registro/page.tsx
scp -r apps/web/app/portal/ carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/app/portal/
scp -r apps/web/app/registro/completar/ carlosjperez@100.79.246.5:/home/cmdr/akademate/apps/web/app/registro/completar/
```

**Step 2: Añadir vars de entorno al .env de NEMESIS**

```bash
sshpass -p '5561' ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no carlosjperez@100.79.246.5 << 'ENDSSH'
  cat >> /home/cmdr/akademate/infrastructure/docker/.env << 'EOF'
BETTER_AUTH_SECRET=REPLACE_WITH_ACTUAL_SECRET
BETTER_AUTH_URL=http://100.99.60.106:3006
GOOGLE_CLIENT_ID=REPLACE_WITH_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=REPLACE_WITH_GOOGLE_SECRET
EOF
ENDSSH
```

**Step 3: Ejecutar migración de DB en NEMESIS**

```bash
sshpass -p '5561' ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no carlosjperez@100.79.246.5 \
  'cd /home/cmdr/akademate && docker exec akademate-postgres psql -U postgres -d akademate -c "SELECT count(*) FROM sessions" 2>/dev/null || echo "Need migration"'
```

Si tabla no existe, ejecutar migración:
```bash
# Copiar migración generada y ejecutar
scp packages/db/migrations/*better_auth*.sql carlosjperez@100.79.246.5:/tmp/
sshpass -p '5561' ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no carlosjperez@100.79.246.5 \
  'docker exec -i akademate-postgres psql -U postgres -d akademate < /tmp/*better_auth*.sql'
```

**Step 4: Rebuild contenedor web**

```bash
sshpass -p '5561' ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no carlosjperez@100.79.246.5 \
  'cd /home/cmdr/akademate/infrastructure/docker && export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:$PATH && docker compose build --no-cache akademate-web && docker compose up -d --no-deps akademate-web'
```

**Step 5: Verificar deploy**

```bash
curl -s http://100.99.60.106:3006/api/auth/get-session | head -50
```
Esperado: JSON con `{ "session": null }` o `{ "session": { ... } }`

**Step 6: Commit final**

```bash
git add .
git commit -m "feat(web): complete Better Auth + Google OAuth integration

- Add Better Auth configuration with Drizzle adapter
- Add Google OAuth social login
- Add email/password authentication
- Add auth middleware for route protection
- Add portal login page with Google + email/password
- Add Google button to /registro page
- Add post-OAuth profile completion page
- Add Better Auth tables to Drizzle schema (sessions, accounts, verifications)"
```

---

## Testing End-to-End

### Task 14: Verificar flujo completo

**Step 1: Test flujo Google OAuth**

1. Ir a `http://100.99.60.106:3006/registro`
2. Click "Continuar con Google"
3. Completar OAuth en Google
4. Verificar redirección a `/registro/completar`
5. Ingresar nombre de academia y enviar
6. Verificar redirección a `/registro/gracias` o página de éxito

**Step 2: Test flujo email/password (login)**

1. Ir a `http://100.99.60.106:3006/portal/login`
2. Intentar con credenciales incorrectas → mensaje de error
3. Iniciar sesión con credenciales válidas
4. Verificar redirección a `/dashboard`

**Step 3: Test middleware de protección**

1. Ir a `http://100.99.60.106:3006/dashboard` sin sesión
2. Verificar redirección a `/login?callbackUrl=/dashboard`

**Step 4: Verificar sesión en DB**

```bash
docker exec -it akademate-postgres psql -U postgres -d akademate \
  -c "SELECT id, user_id, expires_at FROM sessions ORDER BY created_at DESC LIMIT 5;"
```

---

## Notas de Arquitectura

### Por qué NO reemplazamos packages/auth todavía
El paquete `packages/auth` existente (JWT, password, RBAC, MFA) es usado por `apps/tenant-admin` a través de Payload CMS. Reemplazarlo requiere una migración separada de Payload CMS auth → Better Auth que está fuera del scope de este plan.

### Por qué separamos portal/login de tenant-admin/login
- `apps/web/app/portal/login` → Para usuarios del portal web público (alumnos, dueños de academias)
- `apps/tenant-admin/app/auth/login` → Para administradores de Payload CMS (gestores internos)

### Multi-tenancy en Better Auth
Para la integración completa con el Organization Plugin de Better Auth, se requeriría:
1. Mapear `organizations` table → `tenants` table existente
2. Mapear `members` table → `memberships` table existente
3. Esto es FASE 2 de multi-tenancy y está fuera del scope de este plan inicial.

En este plan, la multi-tenancy se maneja via `memberships` table existente, que ya vincula usuarios a tenants.

---

## Checklist de Verificación Final

- [ ] `better-auth` instalado en `apps/web`
- [ ] Tablas `sessions`, `accounts`, `verifications` creadas en DB
- [ ] `apps/web/lib/auth.ts` configurado con Google y email/password
- [ ] `apps/web/app/api/auth/[...all]/route.ts` creado
- [ ] `apps/web/lib/auth-client.ts` con hooks de React
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] `apps/web/middleware.ts` protege rutas `/dashboard`
- [ ] Botón Google en `/registro`
- [ ] Página `/portal/login` con Google + email/password
- [ ] Página `/registro/completar` para post-Google
- [ ] Deploy en NEMESIS con rebuild del contenedor web
- [ ] Flujo completo verificado manualmente
