import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

const uiPrimitiveFiles = [
  '@payload-config/components/ui/select.tsx',
  'components/ui/select.tsx',
  '@payload-config/components/ui/dropdown-menu.tsx',
  'components/ui/dropdown-menu.tsx',
]

function readPrimitive(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

describe('dropdown and select selection color hygiene', () => {
  it('uses soft CEP primary states instead of solid accent states', () => {
    const violations = uiPrimitiveFiles.flatMap((relativePath) => {
      const source = readPrimitive(relativePath)
      const matches = [
        ...source.matchAll(
          /focus:bg-accent|focus:text-accent-foreground|data-\[state=open\]:bg-accent/g
        ),
      ]

      return matches.map((match) => `${relativePath}: ${match[0]}`)
    })

    expect(violations).toEqual([])
  })

  it('keeps checked and highlighted select items on the soft primary background', () => {
    const selectSources = uiPrimitiveFiles
      .filter((relativePath) => relativePath.endsWith('/select.tsx'))
      .map(readPrimitive)

    for (const source of selectSources) {
      expect(source).toContain('data-[highlighted]:bg-primary/10')
      expect(source).toContain('data-[state=checked]:bg-primary/10')
      expect(source).not.toContain('data-[state=checked]:bg-primary ')
    }
  })
})
