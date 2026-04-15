import { existsSync, readFileSync } from 'fs'
import { describe, expect, test } from 'vitest'
import {
  buildPdfContent,
  buildPreparedRows,
  isTeleformacionEligible,
  parseCatalogMarkdown,
  parseCourseRowsFromMarkdown,
  parseImageIndexFromMarkdown,
  parsePdfExtractedText,
  parsePdfIndexFromMarkdown,
} from './import-cursostenerife-catalog'

const REAL_SOURCE_PATH =
  '/Users/carlosjperez/Desktop/CursosTenerife_Catalogo/catalogo/CATALOGO_CURSOS_TENERIFE_2025.md'

describe('import-cursostenerife-catalog parser', () => {
  test('parses catalog rows and excludes non-catalog sections', () => {
    const markdown = `
## 🔴 CURSOS PARA DESEMPLEADOS - TEST
| # | CURSO | MODALIDAD | HORAS | PDF |
|---|---|---|---|---|
| 1 | Inglés A1 | Presencial/Teleformación | 150 | SSCE01-ingles-a1.pdf |

## 🟢 CURSOS PARA OCUPADOS (TEST)
| # | CURSO | MODALIDAD | HORAS | HORARIO | FECHA INICIO | PDF |
|---|---|---|---|---|---|---|
| 1 | Cocina para Celíacos | Teleformación | 35 | 18:00-22:00 | 19 Mar 2025 | HOTR0048-cocina-para-celiacos.pdf |

## 🔵 CURSOS PRIVADOS
| CURSO | MODALIDAD | DURACIÓN | PRECIO |
|---|---|---|---|
| Auxiliar de Enfermería | Presencial | - | Consultar |

## 🎓 CICLOS FORMATIVOS
### Ciclo de Farmacia y Parafarmacia

## 📊 RESUMEN ESTADÍSTICO
| CATEGORÍA | CANTIDAD |
|---|---|
| Cursos privados | 1 |
`
    const rows = parseCourseRowsFromMarkdown(markdown)
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.title)).toEqual([
      'Inglés A1',
      'Cocina para Celíacos',
      'Auxiliar de Enfermería',
    ])
    expect(rows[0]?.durationHours).toBe(150)
    expect(rows[1]?.durationHours).toBe(35)
    expect(rows[2]?.durationHours).toBeNull()
  })

  test('parses PDF index table', () => {
    const markdown = `
## 📁 PDFs DESCARGADOS
| # | ARCHIVO | CURSO |
|---|---|---|
| 1 | ADGD0031-gestion-recursos-humanos.pdf | Gestión de Recursos Humanos |
| 2 | - | Curso sin PDF |
`
    const index = parsePdfIndexFromMarkdown(markdown)
    expect(index.get('gestion de recursos humanos')).toBe('ADGD0031-gestion-recursos-humanos.pdf')
    expect(index.has('curso sin pdf')).toBe(false)
  })

  test('parses image index and excludes logos/cycles', () => {
    const markdown = `
## 🖼️ ÍNDICE DE IMÁGENES DESCARGADAS
### 📋 Imágenes Institucionales (Logos y Sellos)
| # | ARCHIVO | DESCRIPCIÓN |
|---|---|---|
| 1 | logo-centro.jpg | Logo oficial |

### 🎓 Imágenes de Cursos (Reales)
| # | ARCHIVO | CURSO ASOCIADO |
|---|---|---|
| 1 | auxiliar-de-enfermeria.jpg | Auxiliar de Enfermería |
| 2 | ciclo-farmacia-parafarmacia.jpg | Ciclo de Farmacia y Parafarmacia |
| 3 | logo-sede-norte.jpg | Sede Norte |
`
    const index = parseImageIndexFromMarkdown(markdown)
    expect(index.get('auxiliar de enfermeria')).toBe('auxiliar-de-enfermeria.jpg')
    expect(index.has('ciclo de farmacia y parafarmacia')).toBe(false)
  })

  test('builds teleformacion derived rows from modality', () => {
    const markdown = `
## 🔴 CURSOS PARA DESEMPLEADOS - TEST
| # | CURSO | MODALIDAD | HORAS | PDF |
|---|---|---|---|---|
| 1 | Inglés A1 | Presencial/Teleformación | 150 | SSCE01-ingles-a1.pdf |
| 2 | Gestión de Recursos Humanos | Presencial | 60 | ADGD0031-gestion-recursos-humanos.pdf |
`
    const parsed = parseCatalogMarkdown(markdown)
    const prepared = buildPreparedRows(parsed, { imagesDir: '/tmp' })

    expect(prepared.stats.dedupedSourceRows).toBe(2)
    expect(prepared.stats.teleDerivedRows).toBe(1)
    expect(prepared.stats.finalRows).toBe(3)
    expect(
      prepared.rows.some((row) => row.title === 'Inglés A1' && row.courseType === 'teleformacion')
    ).toBe(true)
    expect(
      prepared.rows.some((row) => row.title === 'Gestión de Recursos Humanos' && row.courseType === 'teleformacion')
    ).toBe(false)
  })
})

describe('import-cursostenerife-catalog modality helpers', () => {
  test('detects teleformacion eligibility', () => {
    expect(isTeleformacionEligible('Presencial/Teleformación')).toBe(true)
    expect(isTeleformacionEligible('Online')).toBe(true)
    expect(isTeleformacionEligible('Presencial')).toBe(false)
  })
})

describe('import-cursostenerife-catalog pdf parser', () => {
  test('extracts objective/modules/duration from pdf text', () => {
    const text = `
Denominación de la especialidad: GESTIÓN CONTABLE, FISCAL Y LABORAL
Código: ADGD0032

Objetivo general
Realizar las tareas de administración contable y fiscal de una empresa.

Relación de módulos de formación
Módulo 1  GESTIÓN CONTABLE  120 horas
Módulo 2  GESTIÓN FISCAL  120 horas

Modalidad de impartición
Presencial
Teleformación

Duración de la formación
Duración total en cualquier modalidad de impartición 340 horas

Requisitos de acceso del alumnado
Título de Graduado en ESO o equivalente.

Prescripciones de formadores y tutores
`
    const parsed = parsePdfExtractedText(text)
    const content = buildPdfContent(parsed)

    expect(parsed.specialtyCode).toBe('ADGD0032')
    expect(parsed.modules).toHaveLength(2)
    expect(parsed.durationHours).toBe(340)
    expect(content.shortDescription).toContain('administración contable')
    expect(Array.isArray(content.longDescription)).toBe(true)
  })
})

describe('import-cursostenerife-catalog real markdown metrics', () => {
  const runIfSourceExists = existsSync(REAL_SOURCE_PATH) ? test : test.skip

  runIfSourceExists('matches expected catalog parse metrics', () => {
    const markdown = readFileSync(REAL_SOURCE_PATH, 'utf8')
    const parsed = parseCatalogMarkdown(markdown)
    const prepared = buildPreparedRows(parsed, {
      imagesDir: '/Users/carlosjperez/Desktop/CursosTenerife_Catalogo/imagenes_cursos',
    })

    expect(parsed.rows.length).toBe(124)
    expect(prepared.stats.dedupedSourceRows).toBe(110)
    expect(prepared.stats.teleDerivedRows).toBeGreaterThanOrEqual(20)
    expect(prepared.stats.finalRows).toBeGreaterThanOrEqual(130)
  })
})

