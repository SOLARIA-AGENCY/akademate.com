import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function odtFiles(dir: string): string[] {
  const found: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) found.push(...odtFiles(path))
    else if (name.endsWith('.odt')) found.push(path)
  }
  return found
}

describe('portal odt files', () => {
  it('are flowing text, not absolute-positioned frames', () => {
    const root = join(import.meta.dirname, '../public/transparencia')
    const files = odtFiles(root)
    expect(files.length).toBeGreaterThan(40)
    for (const file of files) {
      const xml = execFileSync('unzip', ['-p', file, 'content.xml'], {
        encoding: 'utf8',
        maxBuffer: 80 * 1024 * 1024,
      })
      const frames = xml.match(/draw:frame/g)?.length ?? 0
      expect(frames, file).toBeLessThanOrEqual(2)
      expect(xml, file).toContain('<text:p')
    }
  })
})
