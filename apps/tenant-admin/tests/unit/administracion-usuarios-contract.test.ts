import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('admin team members listing', () => {
  it('lists dashboard team with presence, invite chrome and catalog primitives', () => {
    const source = read('app/(app)/(dashboard)/administracion/usuarios/page.tsx')
    expect(source).toContain('Equipo del dashboard')
    expect(source).toContain('Enviar invitación')
    expect(source).toContain('presenceFromTimestamps')
    expect(source).toContain('/api/internal/invitations')
    expect(source).toContain('PremiumDirectoryShell')
    expect(source).toContain('StatusDotBadge')
    expect(source).toContain('ListingKpiStrip')
    expect(source).toContain('EmptyTitle')
    expect(source).not.toContain('#F2014B')
    expect(source).not.toContain('#f2014b')
    expect(source).not.toContain('Crear Usuario')
  })

  it('heartbeats last_seen_at from the dashboard layout', () => {
    const layout = read('app/(app)/(dashboard)/layout.tsx')
    const users = read('app/api/internal/users/route.ts')
    const collection = read('src/collections/Users/Users.ts')
    expect(layout).toContain('PresenceBeacon')
    expect(users).toContain('last_seen_at')
    expect(collection).toContain("name: 'last_seen_at'")
  })
})
