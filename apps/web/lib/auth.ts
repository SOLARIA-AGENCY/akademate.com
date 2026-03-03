import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from './db'
import { schema } from '@akademate/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    // Nuestras tablas usan nombres en plural (users, sessions, accounts, verifications)
    usePlural: true,
    schema: {
      users: schema.users,
      sessions: schema.sessions,
      accounts: schema.accounts,
      verifications: schema.verifications,
    },
  }),

  // Mapeo de campo: nuestra tabla users usa 'password_hash' pero Better Auth espera 'password'
  // Better Auth almacenará contraseñas en accounts.password, no en users directamente
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
    },
  },

  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3006',
  secret: process.env.BETTER_AUTH_SECRET!,

  trustedOrigins: [
    process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3006',
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Renovar si tiene > 1 día
  },

})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
