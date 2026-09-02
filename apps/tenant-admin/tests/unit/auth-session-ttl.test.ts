import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  parseRememberFlag,
  REMEMBER_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  sessionTtlSeconds,
} from '../../app/lib/auth-session-ttl'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('remember session ttl', () => {
  it('uses 12 hours by default and 30 days when remember is on', () => {
    expect(sessionTtlSeconds(false)).toBe(SESSION_TTL_SECONDS)
    expect(sessionTtlSeconds(true)).toBe(REMEMBER_TTL_SECONDS)
    expect(parseRememberFlag(true)).toBe(true)
    expect(parseRememberFlag(false)).toBe(false)
  })

  it('sends remember from the login form into login and session cookies', () => {
    const page = readFileSync(path.join(root, 'app/(app)/auth/login/page.tsx'), 'utf8')
    const login = readFileSync(path.join(root, 'app/api/users/login/route.ts'), 'utf8')
    const session = readFileSync(path.join(root, 'app/api/auth/session/route.ts'), 'utf8')
    expect(page).toContain('remember: credentials.remember')
    expect(login).toContain('sessionTtlSeconds(remember)')
    expect(session).toContain('sessionTtlSeconds(remember)')
  })
})
