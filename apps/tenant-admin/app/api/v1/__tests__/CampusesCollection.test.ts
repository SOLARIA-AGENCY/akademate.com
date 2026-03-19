/**
 * @fileoverview Tests para la coleccion Campuses de Payload CMS
 * Valida: slug, campos, access control, hooks, opciones de select, grupos, relaciones
 */

import { describe, it, expect } from 'vitest'
import { Campuses } from '../../../../src/collections/Campuses/Campuses'

// ============================================================================
// Helpers
// ============================================================================

function findField(name: string) {
  return Campuses.fields.find((f: any) => f.name === name)
}

function findGroupSubField(groupName: string, subFieldName: string) {
  const group = findField(groupName) as any
  if (!group || group.type !== 'group') return undefined
  return group.fields?.find((f: any) => f.name === subFieldName)
}

function findArraySubField(arrayName: string, subFieldName: string) {
  const arr = findField(arrayName) as any
  if (!arr || arr.type !== 'array') return undefined
  return arr.fields?.find((f: any) => f.name === subFieldName)
}

function getSelectOptions(fieldName: string): string[] {
  const field = findField(fieldName) as any
  if (!field || field.type !== 'select' || !field.options) return []
  return field.options.map((o: any) => (typeof o === 'string' ? o : o.value))
}

function getNestedSelectOptions(arrayName: string, selectFieldName: string): string[] {
  const sub = findArraySubField(arrayName, selectFieldName) as any
  if (!sub || sub.type !== 'select' || !sub.options) return []
  return sub.options.map((o: any) => (typeof o === 'string' ? o : o.value))
}

const allFieldNames = Campuses.fields.map((f: any) => f.name).filter(Boolean)

// ============================================================================
// Tests: Collection metadata
// ============================================================================

describe('Campuses Collection', () => {
  it('has correct slug', () => {
    expect(Campuses.slug).toBe('campuses')
  })

  it('has timestamps enabled', () => {
    expect(Campuses.timestamps).toBe(true)
  })

  it('uses name as admin title', () => {
    expect(Campuses.admin?.useAsTitle).toBe('name')
  })

  // ==========================================================================
  // Required fields
  // ==========================================================================

  describe('required fields', () => {
    it('has slug field', () => {
      const field = findField('slug') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('text')
      expect(field.required).toBe(true)
      expect(field.unique).toBe(true)
    })

    it('has name field', () => {
      const field = findField('name') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('text')
      expect(field.required).toBe(true)
    })

    it('has city field', () => {
      const field = findField('city') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('text')
      expect(field.required).toBe(true)
    })
  })

  // ==========================================================================
  // New fields added in expansion
  // ==========================================================================

  describe('expanded fields', () => {
    it.each([
      ['description', 'textarea'],
      ['active', 'checkbox'],
      ['image', 'upload'],
      ['province', 'text'],
      ['phone2', 'text'],
      ['web', 'text'],
      ['capacity', 'number'],
      ['notes', 'textarea'],
    ])('has %s field of type %s', (name, type) => {
      const field = findField(name) as any
      expect(field).toBeDefined()
      expect(field.type).toBe(type)
    })

    it('has coordinator relationship to staff (single)', () => {
      const field = findField('coordinator') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('relationship')
      expect(field.relationTo).toBe('staff')
      expect(field.hasMany).toBeUndefined()
    })
  })

  // ==========================================================================
  // Photos array
  // ==========================================================================

  describe('photos array field', () => {
    it('exists and is an array', () => {
      const field = findField('photos') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('array')
    })

    it('has photo sub-field (upload)', () => {
      const sub = findArraySubField('photos', 'photo') as any
      expect(sub).toBeDefined()
      expect(sub.type).toBe('upload')
      expect(sub.relationTo).toBe('media')
      expect(sub.required).toBe(true)
    })

    it('has caption sub-field (text)', () => {
      const sub = findArraySubField('photos', 'caption') as any
      expect(sub).toBeDefined()
      expect(sub.type).toBe('text')
    })
  })

  // ==========================================================================
  // Classrooms array
  // ==========================================================================

  describe('classrooms array field', () => {
    it('exists and is an array', () => {
      const field = findField('classrooms') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('array')
    })

    it.each(['name', 'capacity', 'floor', 'equipment', 'active'])(
      'has sub-field: %s',
      (subFieldName) => {
        const sub = findArraySubField('classrooms', subFieldName)
        expect(sub).toBeDefined()
      }
    )

    it('equipment select has 9 options', () => {
      const options = getNestedSelectOptions('classrooms', 'equipment')
      expect(options).toHaveLength(9)
    })

    it('equipment options include all expected values', () => {
      const options = getNestedSelectOptions('classrooms', 'equipment')
      const expected = [
        'projector', 'digital_board', 'whiteboard', 'wifi',
        'computers', 'ac', 'av_system', 'lab', 'workshop',
      ]
      expect(options).toEqual(expect.arrayContaining(expected))
      expect(expected).toEqual(expect.arrayContaining(options))
    })
  })

  // ==========================================================================
  // Services select
  // ==========================================================================

  describe('services select field', () => {
    it('exists and is a select', () => {
      const field = findField('services') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('select')
      expect(field.hasMany).toBe(true)
    })

    it('has 11 service options', () => {
      const options = getSelectOptions('services')
      expect(options).toHaveLength(11)
    })

    it('includes all expected service values', () => {
      const options = getSelectOptions('services')
      const expected = [
        'wifi', 'parking', 'cafeteria', 'library', 'accessibility',
        'elevator', 'study_room', 'lockers', 'public_transport',
        'front_desk', 'break_area',
      ]
      expect(options).toEqual(expect.arrayContaining(expected))
      expect(expected).toEqual(expect.arrayContaining(options))
    })
  })

  // ==========================================================================
  // Parking group
  // ==========================================================================

  describe('parking group', () => {
    it('exists and is a group', () => {
      const field = findField('parking') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('group')
    })

    it.each(['available', 'spaces', 'free', 'notes'])(
      'has sub-field: %s',
      (subFieldName) => {
        const sub = findGroupSubField('parking', subFieldName)
        expect(sub).toBeDefined()
      }
    )
  })

  // ==========================================================================
  // Schedule group
  // ==========================================================================

  describe('schedule group', () => {
    it('exists and is a group', () => {
      const field = findField('schedule') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('group')
    })

    it.each(['weekdays', 'saturday', 'sunday', 'notes'])(
      'has sub-field: %s',
      (subFieldName) => {
        const sub = findGroupSubField('schedule', subFieldName)
        expect(sub).toBeDefined()
      }
    )
  })

  // ==========================================================================
  // Staff relationships
  // ==========================================================================

  describe('staff relationships', () => {
    it('has staff_members relationship to staff with hasMany', () => {
      const field = findField('staff_members') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('relationship')
      expect(field.relationTo).toBe('staff')
      expect(field.hasMany).toBe(true)
    })

    it('has coordinator relationship to staff (single, not hasMany)', () => {
      const field = findField('coordinator') as any
      expect(field).toBeDefined()
      expect(field.type).toBe('relationship')
      expect(field.relationTo).toBe('staff')
      // coordinator is a single relationship, not hasMany
      expect(field.hasMany).toBeFalsy()
    })
  })

  // ==========================================================================
  // Removed fields (cycles/courses not assigned to campuses)
  // ==========================================================================

  describe('removed fields', () => {
    it('does NOT have cycles_offered field', () => {
      expect(findField('cycles_offered')).toBeUndefined()
    })

    it('does NOT have courses_offered field', () => {
      expect(findField('courses_offered')).toBeUndefined()
    })
  })

  // ==========================================================================
  // Tenant field
  // ==========================================================================

  describe('tenant isolation', () => {
    it('has tenantField in fields array', () => {
      // tenantField is imported and added to the fields array
      // It should have a name property (typically "tenant")
      const tenantLike = Campuses.fields.find(
        (f: any) => f.name === 'tenant' || f.name === 'tenantId'
      )
      expect(tenantLike).toBeDefined()
    })
  })

  // ==========================================================================
  // Access control
  // ==========================================================================

  describe('access control', () => {
    it('read access returns true (public)', () => {
      const readFn = Campuses.access?.read as Function
      expect(readFn).toBeDefined()
      // read() => true -- no arguments needed for public access
      expect(readFn({})).toBe(true)
    })

    it('create access is defined (canManageCampuses)', () => {
      expect(Campuses.access?.create).toBeDefined()
      expect(typeof Campuses.access?.create).toBe('function')
    })

    it('update access is defined (canManageCampuses)', () => {
      expect(Campuses.access?.update).toBeDefined()
      expect(typeof Campuses.access?.update).toBe('function')
    })

    it('delete access is defined (canManageCampuses)', () => {
      expect(Campuses.access?.delete).toBeDefined()
      expect(typeof Campuses.access?.delete).toBe('function')
    })

    it('create/update/delete use the same access function', () => {
      expect(Campuses.access?.create).toBe(Campuses.access?.update)
      expect(Campuses.access?.update).toBe(Campuses.access?.delete)
    })
  })

  // ==========================================================================
  // Hooks
  // ==========================================================================

  describe('hooks', () => {
    it('has beforeValidate hook for auto-slug generation', () => {
      const hooks = Campuses.hooks?.beforeValidate
      expect(hooks).toBeDefined()
      expect(Array.isArray(hooks)).toBe(true)
      expect(hooks!.length).toBeGreaterThanOrEqual(1)
    })

    it('beforeValidate generates slug from name when slug is missing', () => {
      const hook = Campuses.hooks?.beforeValidate?.[0] as Function
      const result = hook({ data: { name: 'Sede Santa Cruz', slug: undefined } })
      expect(result).toBeDefined()
      expect(result.slug).toBe('sede-santa-cruz')
    })

    it('beforeValidate strips accents from generated slug', () => {
      const hook = Campuses.hooks?.beforeValidate?.[0] as Function
      const result = hook({ data: { name: 'Sede Tenerife Sur (Adeje)', slug: undefined } })
      expect(result.slug).toMatch(/^[a-z0-9-]+$/)
      expect(result.slug).not.toContain('(')
    })

    it('beforeValidate trims name and city', () => {
      const hook = Campuses.hooks?.beforeValidate?.[0] as Function
      const result = hook({ data: { name: '  Test  ', city: '  Madrid  ', slug: 'existing' } })
      expect(result.name).toBe('Test')
      expect(result.city).toBe('Madrid')
    })

    it('beforeValidate does not overwrite existing slug', () => {
      const hook = Campuses.hooks?.beforeValidate?.[0] as Function
      const result = hook({ data: { name: 'Sede Norte', slug: 'custom-slug' } })
      expect(result.slug).toBe('custom-slug')
    })

    it('has beforeChange hook', () => {
      const hooks = Campuses.hooks?.beforeChange
      expect(hooks).toBeDefined()
      expect(Array.isArray(hooks)).toBe(true)
      expect(hooks!.length).toBeGreaterThanOrEqual(1)
    })
  })
})
