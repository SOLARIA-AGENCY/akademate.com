import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3006',
})

export const { useSession, signIn, signUp, signOut } = authClient
