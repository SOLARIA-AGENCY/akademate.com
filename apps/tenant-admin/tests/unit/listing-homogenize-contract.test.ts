import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8')
}

describe('listing homogenize contract', () => {
  it('table primitive clips X overflow and wraps cells', () => {
    const source = read('@payload-config/components/ui/table.tsx')
    expect(source).toContain('overflow-x-hidden')
    expect(source).not.toContain('overflow-x-auto')
    expect(source).toContain('table-fixed')
    expect(source).toContain('[overflow-wrap:anywhere]')
    expect(source).not.toContain('whitespace-nowrap')
  })

  it('listing chrome uses Badge static and directory campus red', () => {
    const badges = read('@payload-config/components/akademate/dashboard/CourseTaxonomyBadges.tsx')
    const shell = read('@payload-config/components/directory/PremiumDirectoryShell.tsx')
    expect(badges).toContain('variant="static"')
    expect(shell).toContain('DirectoryCampusBadge')
    expect(shell).toContain('DIRECTORY_CAMPUS_PILL_CLASS')
    expect(shell).toContain('DirectoryAreaBadge')
    expect(shell).toContain('parseDirectoryHexColor')
  })

  it('course listings replace slate privados with funding badges', () => {
    const card = read('@payload-config/components/ui/CourseTemplateCard.tsx')
    const list = read('@payload-config/components/ui/CourseListItem.tsx')
    expect(card).toContain('CourseFundingBadge')
    expect(card).toContain('DirectoryAreaBadge')
    expect(list).toContain('CourseFundingBadge')
    expect(list).not.toContain('bg-slate-100')
  })
})
