import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../app/(app)/(dashboard)/administracion/usuarios/page.tsx'),
  'utf8',
)

describe('Usuarios Page', () => {
  it('renders the dashboard team listing with invite and presence', () => {
    expect(source).toContain('Equipo del dashboard')
    expect(source).toContain('Enviar invitación')
    expect(source).toContain('presenceFromTimestamps')
    expect(source).toContain('/api/internal/invitations')
    expect(source).not.toContain('#F2014B')
  })
})
