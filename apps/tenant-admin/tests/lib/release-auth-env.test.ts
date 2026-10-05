import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('production auth environment contract', () => {
  it('requires current secret and declares optional controls in current and candidate', () => {
    const compose = readFileSync(resolve(process.cwd(), '../../infrastructure/production/tenant-admin/docker-compose.yml'), 'utf8')
    for (const variable of [
      'SESSION_SIGNING_SECRET_CURRENT', 'SESSION_SIGNING_SECRET_PREVIOUS',
      'TRUST_PROXY_HEADERS', 'IMPERSONATION_ENABLED', 'ALLOW_DEV_AUTO_LOGIN',
    ]) {
      const declarations = compose.match(new RegExp(`^\\s+${variable}:`, 'gm')) ?? []
      expect(declarations).toHaveLength(2)
    }
    expect(compose.split('${SESSION_SIGNING_SECRET_CURRENT:?Set SESSION_SIGNING_SECRET_CURRENT in .env}')).toHaveLength(3)
  })

  it('documents every Task C release variable', () => {
    const env = readFileSync(resolve(process.cwd(), '../../infrastructure/production/tenant-admin/release.env.example'), 'utf8')
    for (const variable of [
      'SESSION_SIGNING_SECRET_CURRENT=', 'SESSION_SIGNING_SECRET_PREVIOUS=',
      'TRUST_PROXY_HEADERS=false', 'IMPERSONATION_ENABLED=false', 'ALLOW_DEV_AUTO_LOGIN=false',
    ]) expect(env).toContain(variable)
  })
})
