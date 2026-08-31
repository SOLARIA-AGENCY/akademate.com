import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')

function walk(dirPath: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const path = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(path, out)
      continue
    }
    if (/\.(tsx|ts)$/.test(entry.name)) out.push(path)
  }
  return out
}

describe('inner pages have no local PageHeader', () => {
  it('deletes the local PageHeader component', () => {
    expect(existsSync(join(root, '@payload-config/components/ui/PageHeader.tsx'))).toBe(false)
  })

  it('does not import or render PageHeader on dashboard pages', () => {
    const files = walk(join(root, 'app/(app)/(dashboard)'))
    const hits = files.filter((file) => {
      const source = readFileSync(file, 'utf8')
      return (
        source.includes("from '@payload-config/components/ui/PageHeader'") ||
        source.includes('<PageHeader') ||
        /export function PageHeader/.test(source)
      )
    })
    expect(hits).toEqual([])
  })

  it('keeps SiteHeader sticky from sidebar-16', () => {
    const header = readFileSync(join(root, '@payload-config/components/site-header.tsx'), 'utf8')
    expect(header).toContain('function SiteHeader')
    expect(header).toContain('sticky')
    expect(header).toContain('top-0')
    expect(header).toContain('Breadcrumb')
  })
})
