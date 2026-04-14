import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WebsiteNavigationItem } from '../types'
import { getPayload } from 'payload'

const findMock = vi.fn()

vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

import { resolvePublicNavigation } from '../navigation'

const getPayloadMock = vi.mocked(getPayload)

describe('resolvePublicNavigation', () => {
  beforeEach(() => {
    findMock.mockReset()
    getPayloadMock.mockClear()
    getPayloadMock.mockResolvedValue({ find: findMock } as any)
  })

  it('resolves dynamic dropdowns for study types, cycles and campuses', async () => {
    findMock
      .mockResolvedValueOnce({
        docs: [
          { id: 1, name: 'Privados', code: 'PRIV', active: true },
          { id: 2, name: 'Ocupados', code: 'OCU', active: true },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          { id: 10, name: 'Farmacia y Parafarmacia', slug: 'farmacia', level: 'grado_medio', active: true },
          { id: 11, name: 'Higiene Bucodental', slug: 'higiene-bucodental', level: 'grado_superior', active: true },
        ],
      })
      .mockResolvedValueOnce({
        docs: [{ id: 20, name: 'Sede Santa Cruz', slug: 'sede-santa-cruz', active: true }],
      })

    const items: WebsiteNavigationItem[] = [
      { label: 'Cursos', href: '/cursos', kind: 'dropdown', source: 'study_types' },
      { label: 'Ciclos', href: '/ciclos', kind: 'dropdown', source: 'cycles_by_level' },
      { label: 'Sedes', href: '/sedes', kind: 'dropdown', source: 'campuses' },
    ]

    const resolved = await resolvePublicNavigation(items, { tenantId: '12' })

    expect(resolved).toHaveLength(3)
    expect(resolved[0].children?.map((child) => child.href)).toEqual([
      '/cursos?tipo=privados',
      '/cursos?tipo=ocupados',
    ])
    expect(resolved[1].groups?.map((group) => group.label)).toEqual([
      'Grado Medio · CFGM',
      'Grado Superior · CFGS',
    ])
    expect(resolved[2].children?.[0]?.href).toBe('/sedes/sede-santa-cruz')
    expect(findMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        collection: 'cycles',
        where: {
          and: [{ tenant: { equals: 12 } }, { active: { equals: true } }],
        },
      })
    )
    expect(findMock).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        collection: 'campuses',
        where: {
          and: [{ tenant: { equals: 12 } }, { active: { equals: true } }],
        },
      })
    )
  })

  it('falls back to link when dynamic source has no children', async () => {
    findMock
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })

    const resolved = await resolvePublicNavigation([
      { label: 'Cursos', href: '/cursos', kind: 'dropdown', source: 'study_types' },
      { label: 'Ciclos', href: '/ciclos', kind: 'dropdown', source: 'cycles_by_level' },
      { label: 'Sedes', href: '/sedes', kind: 'dropdown', source: 'campuses' },
    ])

    expect(resolved.every((item) => item.kind === 'link')).toBe(true)
  })
})
