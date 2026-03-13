import { createAuthClient } from 'better-auth/react'

/**
 * Better Auth — Client-side auth client for Akademate Ops dashboard.
 *
 * Used in React components and client-side code.
 * Auto-resolves baseURL from the current window.location in the browser.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3010'),
})

export const { signIn, signOut, useSession } = authClient
