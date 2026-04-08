import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const authBaseUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3010'
const authSecret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.PAYLOAD_SECRET ??
  'akademate-dev-auth-secret-local-only'

/**
 * Better Auth — Server-side auth instance for Akademate Ops dashboard.
 *
 * Uses the same PostgreSQL database as tenant-admin (via shared Docker network).
 * Better Auth creates its own tables: user, session, account, verification.
 * These are separate from Payload CMS's `users` table.
 *
 * Required env: DATABASE_URL
 */
export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: authSecret,

  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    disableSignUp: process.env.NODE_ENV === 'production',
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 days
    updateAge: 60 * 60 * 24,        // Refresh session token daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,               // Cache session in cookie 5 min (reduces DB reads)
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'akademate_ops',
  },

  trustedOrigins: [
    'https://admin.akademate.com',
    'http://localhost:3010',
    authBaseUrl,
  ],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
