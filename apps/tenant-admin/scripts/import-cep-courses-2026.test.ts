import { existsSync, readFileSync } from 'fs'
import { describe, expect, test } from 'vitest'
import {
  buildRowsFromMarkdown,
  classifyAreaCode,
  normalizeCourseTitle,
  parseMarkdownCourseRows,
  buildSlugBase,
  ensureUniqueSlug,
} from './import-cep-courses-2026'

const REAL_SOURCE_PATH = '/Users/carlosjperez/Downloads/CURSOS CEP FORMACION 2026.md'

describe('import-cep-courses-2026 parser', () => {
  test('dedupes by title+section and preserves inter-type duplicates', () => {
    const md = `
## Cursos privados
| Curso | Descripción breve |
|---|---|
| Nóminas | x |
| Nóminas | y |
| Auxiliar de Clínicas Estéticas | x |
| Auxiliar de Clínicas Estéticas | y |

## Cursos para trabajadores ocupados
| Curso | Descripción breve |
|---|---|
| Nóminas | x |
`
    const parsed = parseMarkdownCourseRows(md)
    const result = buildRowsFromMarkdown(md, { excludeCycles: true })

    expect(parsed.length).toBe(5)
    expect(result.stats.dedupedByType).toBe(3)
    expect(result.stats.finalRows).toBe(3)
    expect(result.stats.overlapAcrossTypes).toBe(1)
    expect(result.stats.overlapTitles).toContain(normalizeCourseTitle('Nóminas'))
  })

  test('classifies key examples into expected official areas', () => {
    expect(classifyAreaCode('Auxiliar Clínico Veterinario').areaCode).toBe('VETA')
    expect(classifyAreaCode('Farmacia y Dermocosmética').areaCode).toBe('SCLN')
    expect(classifyAreaCode('Instructor/a de Pilates').areaCode).toBe('SBD')
    expect(classifyAreaCode('Programación web con software libre').areaCode).toBe('TDD')
    expect(classifyAreaCode('Contabilidad avanzada').areaCode).toBe('EAG')
    expect(
      classifyAreaCode('Vigilancia, Seguridad privada y Protección de personas').areaCode
    ).toBe('SVP')
  })

  test('builds unique slugs with suffix by study type', () => {
    const registry = new Set<string>(['nominas-ocu'])
    const baseOcu = buildSlugBase('Nóminas', 'ocupados')
    const baseDes = buildSlugBase('Nóminas', 'desempleados')
    const slugOcu = ensureUniqueSlug(baseOcu, registry)
    const slugDes = ensureUniqueSlug(baseDes, registry)

    expect(baseOcu).toBe('nominas-ocu')
    expect(baseDes).toBe('nominas-des')
    expect(slugOcu).toBe('nominas-ocu-2')
    expect(slugDes).toBe('nominas-des')
  })
})

describe('import-cep-courses-2026 real markdown metrics', () => {
  const runIfRealSourceExists = existsSync(REAL_SOURCE_PATH) ? test : test.skip

  runIfRealSourceExists('matches expected source counts and exclusions', () => {
    const markdown = readFileSync(REAL_SOURCE_PATH, 'utf8')
    const result = buildRowsFromMarkdown(markdown, { excludeCycles: true })

    expect(result.stats.rawRows).toBe(132)
    expect(result.stats.dedupedByType).toBe(131)
    expect(result.stats.excludedCycles).toBe(2)
    expect(result.stats.finalRows).toBe(129)
    expect(result.stats.overlapAcrossTypes).toBe(5)
    expect(result.stats.unmappedCount).toBe(0)

    expect(result.stats.overlapTitles).toContain(
      normalizeCourseTitle('Procedimientos básicos en el Marketing Digital y Redes Sociales')
    )
    expect(result.stats.overlapTitles).toContain(normalizeCourseTitle('Inglés A1'))
    expect(result.stats.overlapTitles).toContain(normalizeCourseTitle('Inglés B1'))
    expect(result.stats.overlapTitles).toContain(normalizeCourseTitle('Diseño de páginas web para Hostelería'))
    expect(result.stats.overlapTitles).toContain(normalizeCourseTitle('Nóminas'))
  })
})
