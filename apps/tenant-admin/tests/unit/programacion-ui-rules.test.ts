import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('programacion ui rules', () => {
  it('lista docente column uses icon stack, never name text', () => {
    const source = read('app/(app)/(dashboard)/programacion/page.tsx')
    expect(source).toContain('DirectoryStaffIcons')
    expect(source).toContain('profesorRefs')
    expect(source).toContain('<DirectoryStaffIcons staff={conv.profesorRefs} />')
    expect(source).not.toContain('{conv.profesor}')
  })

  it('lista sede uses campus identity, not the red text pill', () => {
    const source = read('app/(app)/(dashboard)/programacion/page.tsx')
    expect(source).toContain('DirectoryCampusIdentity')
    expect(source).not.toContain('<DirectoryCampusBadge')
    expect(source).toContain('CourseModalityBadge')
    expect(source).toContain('CourseFundingBadge')
  })
})
