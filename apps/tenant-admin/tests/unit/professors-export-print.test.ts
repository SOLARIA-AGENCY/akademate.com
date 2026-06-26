import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const professorsPage = readFileSync(
  path.join(repoRoot, 'app/(app)/(dashboard)/profesores/page.tsx'),
  'utf8'
)

describe('professors export and print actions', () => {
  it('prints the in-page professor sheet without opening a second browser window', () => {
    expect(professorsPage).toContain('id="professors-print-sheet"')
    expect(professorsPage).toContain('const handlePrint = () => window.print()')
    expect(professorsPage).not.toContain('window.open')
  })

  it('keeps required professor CSV detail columns', () => {
    for (const header of [
      "header: 'Estado'",
      "header: 'Contrato'",
      "header: 'Motivo baja'",
      "header: 'Areas'",
      "header: 'Sedes'",
      "header: 'Cursos'",
      "header: 'Detalle cursos'",
    ]) {
      expect(professorsPage).toContain(header)
    }
  })
})
