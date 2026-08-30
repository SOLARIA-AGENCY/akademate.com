import { describe, expect, it } from 'vitest'
import {
  MultiEntityTopologyError,
  assertValidMultiEntityTopology,
  validateMultiEntityTopology,
  type MultiEntityTopology,
} from '../src/multi-entity-topology'

const validTopology: MultiEntityTopology = {
  legalEntities: [
    { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
    { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
  ],
  campuses: [
    { id: 'campus-norte', tenantId: 'cep' },
    { id: 'campus-sur', tenantId: 'cep' },
  ],
  campusBindings: [
    {
      id: 'binding-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
      status: 'validated',
    },
    {
      id: 'binding-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      status: 'proposed',
    },
  ],
  staffAssignments: [
    {
      id: 'teacher-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      staffId: 'teacher-shared',
      campusIds: ['campus-norte'],
      status: 'validated',
    },
    {
      id: 'teacher-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-shared',
      campusIds: ['campus-sur'],
      status: 'proposed',
    },
  ],
  accountingConnections: [
    {
      id: 'accounting-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      provider: 'provider',
      externalCompanyId: 'company-norte',
      secretReference: 'vault://cep/norte/accounting',
      integrationMode: 'read_only',
      status: 'active',
    },
    {
      id: 'accounting-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      provider: 'provider',
      externalCompanyId: 'company-sur',
      secretReference: 'vault://cep/sur/accounting',
      integrationMode: 'read_only',
      status: 'draft',
    },
  ],
}

describe('CEP multi-entity topology validation', () => {
  it('allows one master teacher identity to be assigned independently to multiple entities', () => {
    expect(validateMultiEntityTopology(validTopology)).toEqual([])
    expect(() => assertValidMultiEntityTopology(validTopology)).not.toThrow()
  })

  it('rejects a campus bound to two active legal entities', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      campusBindings: [
        ...validTopology.campusBindings,
        {
          id: 'binding-sur-crossed',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          campusId: 'campus-norte',
          status: 'proposed',
        },
      ],
    }

    expect(validateMultiEntityTopology(topology)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'campus_multiple_entities', recordId: 'binding-norte' }),
        expect.objectContaining({
          code: 'campus_multiple_entities',
          recordId: 'binding-sur-crossed',
        }),
      ])
    )
  })

  it('rejects a staff campus outside the assigned legal entity', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      staffAssignments: [
        {
          ...validTopology.staffAssignments[0]!,
          campusIds: ['campus-sur'],
        },
      ],
    }

    expect(validateMultiEntityTopology(topology)).toContainEqual({
      code: 'staff_campus_out_of_entity',
      recordType: 'staffAssignments',
      recordId: 'teacher-norte',
      relatedId: 'campus-sur',
    })
  })

  it('rejects tenant mismatches in every entity-owned relation', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      campusBindings: [{ ...validTopology.campusBindings[0]!, tenantId: 'other-tenant' }],
      staffAssignments: [{ ...validTopology.staffAssignments[0]!, tenantId: 'other-tenant' }],
      accountingConnections: [
        { ...validTopology.accountingConnections[0]!, tenantId: 'other-tenant' },
      ],
    }

    const issues = validateMultiEntityTopology(topology)
    expect(issues.filter(({ code }) => code === 'tenant_mismatch')).toHaveLength(3)
  })

  it('rejects one external accounting company reused by two entities', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      accountingConnections: [
        validTopology.accountingConnections[0]!,
        {
          ...validTopology.accountingConnections[1]!,
          externalCompanyId: 'company-norte',
        },
      ],
    }

    expect(validateMultiEntityTopology(topology)).toContainEqual({
      code: 'accounting_company_multiple_entities',
      recordType: 'accountingConnections',
      recordId: 'accounting-sur',
      relatedId: 'accounting-norte',
    })
  })

  it('rejects one accounting secret reference reused by two legal entities', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      accountingConnections: [
        validTopology.accountingConnections[0]!,
        {
          ...validTopology.accountingConnections[1]!,
          secretReference: validTopology.accountingConnections[0]!.secretReference,
        },
      ],
    }

    expect(validateMultiEntityTopology(topology)).toContainEqual({
      code: 'accounting_secret_multiple_entities',
      recordType: 'accountingConnections',
      recordId: 'accounting-sur',
      relatedId: 'accounting-norte',
    })
  })

  it.each([
    {
      expectedCode: 'accounting_secret_reference_invalid',
      patch: { secretReference: 'plain-text-secret' },
    },
    {
      expectedCode: 'accounting_connection_not_read_only',
      patch: { integrationMode: 'read_write' },
    },
  ] as const)('fails closed with $expectedCode', ({ expectedCode, patch }) => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      accountingConnections: [
        {
          ...validTopology.accountingConnections[0]!,
          ...patch,
        } as MultiEntityTopology['accountingConnections'][number],
      ],
    }

    expect(validateMultiEntityTopology(topology)).toContainEqual(
      expect.objectContaining({
        code: expectedCode,
        recordType: 'accountingConnections',
        recordId: 'accounting-norte',
      })
    )
  })

  it('reports missing references and duplicate record IDs without throwing early', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      legalEntities: [validTopology.legalEntities[0]!, validTopology.legalEntities[0]!],
      campusBindings: [
        {
          ...validTopology.campusBindings[0]!,
          legalEntityId: 'missing-entity',
          campusId: 'missing-campus',
        },
      ],
      staffAssignments: [],
      accountingConnections: [],
    }

    const issues = validateMultiEntityTopology(topology)
    expect(issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['duplicate_record_id', 'legal_entity_missing', 'campus_missing'])
    )
    expect(() => assertValidMultiEntityTopology(topology)).toThrow(MultiEntityTopologyError)
  })

  it('allows a historical inactive campus binding alongside the current owner', () => {
    const topology: MultiEntityTopology = {
      ...validTopology,
      campusBindings: [
        ...validTopology.campusBindings,
        {
          id: 'binding-norte-old',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          campusId: 'campus-norte',
          status: 'inactive',
        },
      ],
    }

    expect(validateMultiEntityTopology(topology)).toEqual([])
  })
})
