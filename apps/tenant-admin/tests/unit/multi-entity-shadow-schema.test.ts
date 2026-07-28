import { describe, expect, it } from 'vitest'
import {
  CampusEntityBindingsShadow,
  cepMultiEntityShadowCollections,
  CourseRunScopesShadow,
  denyShadowAccess,
  FinanceConnectionsShadow,
  getCepMultiEntityShadowCollections,
  LegalEntitiesShadow,
  StaffEmploymentsShadow,
  validateCampusEntityBinding,
  validateEmploymentAllocations,
} from '../../src/collections/MultiEntityShadow/MultiEntityShadow'

describe('CEP multi-entity shadow schema', () => {
  it('is default-off and fails closed without an explicit environment label', () => {
    expect(getCepMultiEntityShadowCollections({})).toEqual([])
    expect(getCepMultiEntityShadowCollections({ CEP_MULTI_ENTITY_SHADOW_SCHEMA_ENABLED: 'true' })).toEqual([])
  })

  it('cannot be registered in production even if the flag is enabled', () => {
    expect(getCepMultiEntityShadowCollections({
      CEP_MULTI_ENTITY_SHADOW_SCHEMA_ENABLED: 'true',
      CEP_MULTI_ENTITY_SHADOW_ENVIRONMENT: 'production',
    })).toEqual([])
  })

  it('registers only in an explicitly allowed non-production environment', () => {
    expect(getCepMultiEntityShadowCollections({
      CEP_MULTI_ENTITY_SHADOW_SCHEMA_ENABLED: 'true',
      CEP_MULTI_ENTITY_SHADOW_ENVIRONMENT: 'test',
    })).toBe(cepMultiEntityShadowCollections)
  })

  it('keeps every shadow collection hidden and deny-all', () => {
    expect(cepMultiEntityShadowCollections).toHaveLength(6)
    for (const collection of cepMultiEntityShadowCollections) {
      expect(collection.admin?.hidden).toBe(true)
      expect(collection.access?.read).toBe(denyShadowAccess)
      expect(collection.access?.create).toBe(denyShadowAccess)
      expect(collection.access?.update).toBe(denyShadowAccess)
      expect(collection.access?.delete).toBe(denyShadowAccess)
      expect(denyShadowAccess({} as never)).toBe(false)
    }
  })

  it('keeps physical campuses separate from generic legal entities', () => {
    expect(LegalEntitiesShadow.fields.some((field) => 'name' in field && field.name === 'campus')).toBe(false)
    const campusField = CampusEntityBindingsShadow.fields.find((field) => 'name' in field && field.name === 'campus')
    const legalEntitiesField = CampusEntityBindingsShadow.fields.find((field) => 'name' in field && field.name === 'legal_entities')
    const primaryField = CampusEntityBindingsShadow.fields.find((field) => 'name' in field && field.name === 'primary_legal_entity')

    expect(campusField).toMatchObject({ relationTo: 'campuses', unique: true, required: true })
    expect(legalEntitiesField).toMatchObject({ relationTo: 'legal-entities-shadow', hasMany: true, required: true })
    expect(primaryField).toMatchObject({ relationTo: 'legal-entities-shadow', required: true })
  })

  it('requires the single primary entity to belong to the campus entity set', () => {
    expect(() => validateCampusEntityBinding({
      primary_legal_entity: 10,
      legal_entities: [10, 11],
    })).not.toThrow()
    expect(() => validateCampusEntityBinding({
      primary_legal_entity: 12,
      legal_entities: [10, 11],
    })).toThrow(/Primary legal entity/)
  })

  it('requires positive staff allocations totaling exactly 100 percent', () => {
    expect(() => validateEmploymentAllocations({
      allocations: [{ percentage: 60 }, { percentage: 40 }],
    })).not.toThrow()
    expect(() => validateEmploymentAllocations({ allocations: [{ percentage: 99.99 }] })).toThrow(/exactly 100/)
    expect(() => validateEmploymentAllocations({ allocations: [{ percentage: 100 }, { percentage: 0 }] })).toThrow(/greater than 0/)
  })

  it('references shared masters and keeps run scopes nullable during shadow rollout', () => {
    const staffField = StaffEmploymentsShadow.fields.find((field) => 'name' in field && field.name === 'staff')
    const runField = CourseRunScopesShadow.fields.find((field) => 'name' in field && field.name === 'course_run')
    const scopeFields = CourseRunScopesShadow.fields.filter((field) => (
      'name' in field && ['owner_scope', 'manager_scope', 'funder_scope'].includes(field.name)
    ))

    expect(staffField).toMatchObject({ relationTo: 'staff', required: true })
    expect(runField).toMatchObject({ relationTo: 'course-runs', required: true, unique: true })
    expect(scopeFields).toHaveLength(3)
    expect(scopeFields.every((field) => !('required' in field) || field.required !== true)).toBe(true)
  })

  it('binds finance to one legal entity and enforces read-only mode', () => {
    const entityField = FinanceConnectionsShadow.fields.find((field) => 'name' in field && field.name === 'legal_entity')
    const readOnlyField = FinanceConnectionsShadow.fields.find((field) => 'name' in field && field.name === 'read_only')

    expect(entityField).toMatchObject({ relationTo: 'legal-entities-shadow', required: true, unique: true })
    expect(readOnlyField).toMatchObject({ type: 'checkbox', required: true, defaultValue: true })
    if (!readOnlyField || !('validate' in readOnlyField) || typeof readOnlyField.validate !== 'function') {
      throw new Error('read_only validation is missing')
    }
    expect(readOnlyField.validate(true, {} as never)).toBe(true)
    expect(readOnlyField.validate(false, {} as never)).toMatch(/read-only/)
  })
})
