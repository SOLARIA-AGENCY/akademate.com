import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const scannedRoots = [
  path.join(repoRoot, 'app'),
  path.join(repoRoot, '@payload-config'),
  path.join(repoRoot, 'src'),
]

const ignoredPathFragments = [
  `${path.sep}__tests__${path.sep}`,
  `${path.sep}tests${path.sep}`,
  `${path.sep}stories${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}public${path.sep}`,
  `${path.sep}TAILWIND_V4_CONFIG.md`,
]

const ignoredFiles = new Set([
  path.join(repoRoot, 'app', 'providers', 'tenant-branding.tsx'),
  path.join(repoRoot, 'app', 'api', 'config', 'route.ts'),
  path.join(repoRoot, 'app', 'api', 'internal', 'invitations', 'route.ts'),
  path.join(repoRoot, 'app', 'api', 'leads', 'route.ts'),
  path.join(repoRoot, 'app', 'lib', 'server', 'tenant-host-branding.ts'),
  path.join(repoRoot, 'src', 'collections', 'Tenants', 'Tenants.ts'),
  path.join(repoRoot, 'src', 'lib', 'email', 'templates.ts'),
])

const sourceExtensions = new Set(['.ts', '.tsx', '.css'])
const forbiddenClassPattern =
  /(?:text|bg|border|from|to|via|stroke|fill|hover:bg|focus:border|focus:ring)-(?:blue|sky|indigo)-/g

function collectSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    if (ignoredPathFragments.some((fragment) => fullPath.includes(fragment))) continue
    if (ignoredFiles.has(fullPath)) continue

    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath))
      continue
    }

    if (sourceExtensions.has(path.extname(fullPath))) {
      files.push(fullPath)
    }
  }

  return files
}

describe('tenant UI color token hygiene', () => {
  it('does not use hardcoded blue, sky, or indigo Tailwind color classes in UI source', () => {
    const violations = scannedRoots
      .flatMap(collectSourceFiles)
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8')
        const matches = Array.from(source.matchAll(forbiddenClassPattern))
        return matches.map((match) => `${path.relative(repoRoot, file)}: ${match[0]}`)
      })

    expect(violations).toEqual([])
  })
})
