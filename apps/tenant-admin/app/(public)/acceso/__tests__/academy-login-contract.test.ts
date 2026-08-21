import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCatalogPageBySlug } from '@/app/(app)/(dashboard)/contenido/paginas/page-catalog'
import { catalogKindToApiKind } from '@/app/lib/website-page-persist'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')

function read(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8')
}

describe('academy student login', () => {
  it('is an editable public page that posts to campus auth', () => {
    const page = getCatalogPageBySlug('acceso')
    expect(page?.path).toBe('/acceso')
    expect(page?.pageKind).toBe('login')
    expect(catalogKindToApiKind('login')).toBe('login')
    expect(page?.sections.map((section) => section.id)).toEqual(['hero', 'loginForm', 'recover', 'help'])

    const publicPage = read('app/(public)/acceso/page.tsx')
    const form = read('app/(public)/acceso/_components/AcademyLoginForm.tsx')
    expect(publicPage).toContain('AcademyLoginForm')
    expect(form).toContain('/api/campus/auth/login')
    expect(form).toContain("router.push('/campus')")
    expect(form).not.toContain("fetch('/auth/login'")
    expect(form).not.toContain("router.push('/auth/login')")
    expect(read('middleware.ts')).toContain("'/acceso'")
    expect(read('app/(public)/layout.tsx')).toContain("href: '/acceso'")
  })
})
