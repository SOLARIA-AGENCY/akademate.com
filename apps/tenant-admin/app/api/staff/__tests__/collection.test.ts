import { describe, expect, it } from 'vitest'
import { Staff } from '../../../../src/collections/Staff/Staff'

const beforeValidateHook = Staff.hooks?.beforeValidate?.[0] as Function

describe('Staff collection teaching area validation', () => {
  it('has a collection-level beforeValidate hook', () => {
    expect(beforeValidateHook).toBeTypeOf('function')
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
