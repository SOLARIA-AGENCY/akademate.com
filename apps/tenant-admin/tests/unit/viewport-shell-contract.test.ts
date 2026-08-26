import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function read(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8')
}

describe('SaaS viewport-locked listing shell', () => {
  it('locks dashboard main and directory table to internal panel scroll', () => {
    const layout = read('app/(app)/(dashboard)/layout.tsx')
    expect(layout).toContain('overflow-hidden overscroll-contain px-4 pt-0')
    expect(layout).not.toContain('overflow-y-auto overflow-x-hidden')
    expect(layout).toContain('flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden')

    const listing = read('@payload-config/components/akademate/dashboard/Shell.tsx')
    expect(listing).toContain('flex h-full min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden')
    expect(listing).toContain('data-slot="dashboard-page-chrome"')
    expect(listing).not.toContain('sticky top-0 z-20')
    expect(listing).not.toContain('--dashboard-thead-top')

    const directory = read(
      '@payload-config/components/akademate/dashboard/directory/PremiumDirectoryShell.tsx',
    )
    expect(directory).toContain('overflow-y-auto overscroll-contain')
    expect(directory).toContain('[&_th]:sticky [&_th]:top-0')
    expect(directory).not.toContain('--dashboard-thead-top')
  })
})
