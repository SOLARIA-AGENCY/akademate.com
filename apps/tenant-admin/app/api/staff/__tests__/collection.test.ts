import { describe, expect, it } from 'vitest'
import { Staff } from '../../../../src/collections/Staff/Staff'

const beforeValidateHooks = Staff.hooks?.beforeValidate ?? []
const normalizeHook = beforeValidateHooks[0] as Function
const beforeValidateHook = beforeValidateHooks[1] as Function

describe('Staff collection teaching area validation', () => {
  it('has a collection-level beforeValidate hook', () => {
    expect(beforeValidateHook).toBeTypeOf('function')
  })

  it('normalizes staff names before validation', () => {
    expect(
      normalizeHook({
        data: {
          first_name: 'NURIA ESTHER',
          last_name: 'ÁNGEL RAMOS',
          position: 'DOCENTE DE INGLÉS Y FRANCÉS',
        },
      })
    ).toEqual({
      first_name: 'Nuria Esther',
      last_name: 'Ángel Ramos',
      position: 'Docente de Inglés y Francés',
      full_name: 'Nuria Esther Ángel Ramos',
    })
  })

  it('rejects creating a teacher without qualified areas', () => {
    expect(() => beforeValidateHook({
      data: {
        staff_type: 'profesor',
        qualified_areas: [],
      },
      operation: 'create',
    })).toThrow(/área habilitada/i)
  })

  it('rejects updating a teacher when existing and incoming areas are empty', () => {
    expect(() => beforeValidateHook({
      data: {},
      originalDoc: {
        staff_type: 'profesor',
        qualified_areas: [],
      },
      operation: 'update',
    })).toThrow(/área habilitada/i)
  })

  it('allows administrative staff without qualified areas', () => {
    expect(beforeValidateHook({
      data: {
        staff_type: 'administrativo',
        qualified_areas: [],
      },
      operation: 'create',
    })).toEqual({
      staff_type: 'administrativo',
      qualified_areas: [],
    })
  })
})
