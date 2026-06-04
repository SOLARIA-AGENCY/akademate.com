import { describe, expect, it, vi } from 'vitest'

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))

describe('/api/staff/import course area inference', () => {
  it('infers unique qualified areas from assigned course names', async () => {
    const { __staffImportTestables } = await import('../route')

    const result = __staffImportTestables.resolveAssignedCourseAreas(
      [
        'Auxiliar de Farmacia y Parafarmacia + Dermo',
        'AUXILIAR DE FARMACIA Y PARAFARMACIA',
        'Curso no localizado',
      ],
      [
        {
          id: 1,
          name: 'Auxiliar de Farmacia y Parafarmacia + Dermocosmética',
          area_formativa: { id: 7 },
        },
        {
          id: 2,
          name: 'Entrenamiento Personal',
          area_formativa: 9,
        },
      ],
    )

    expect(result.qualifiedAreaIds).toEqual([7])
    expect(result.unmatchedCourses).toEqual(['Curso no localizado'])
  })

  it('returns no qualified areas when assigned courses cannot be matched', async () => {
    const { __staffImportTestables } = await import('../route')

    const result = __staffImportTestables.resolveAssignedCourseAreas(
      ['Seminario pendiente'],
      [
        {
          id: 1,
          name: 'Auxiliar de Enfermería',
          area_formativa: { id: 7 },
        },
      ],
    )

    expect(result.qualifiedAreaIds).toEqual([])
    expect(result.unmatchedCourses).toEqual(['Seminario pendiente'])
  })
})
