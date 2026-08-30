import { describe, expect, it } from 'vitest'
import {
  MultiEntityResourceOwnershipError,
  assertValidMultiEntityResourceOwnership,
  validateMultiEntityResourceOwnership,
  type MultiEntityOperationalResources,
} from '../src/multi-entity-resources'
import { MultiEntityTopologyError } from '../src/multi-entity-topology'

const validResources: MultiEntityOperationalResources = {
  topology: {
    legalEntities: [
      { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
      { id: 'entity-santa-cruz', tenantId: 'cep', status: 'validated' },
      { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
    ],
    campuses: [
      { id: 'campus-norte', tenantId: 'cep' },
      { id: 'campus-santa-cruz', tenantId: 'cep' },
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
        id: 'binding-santa-cruz',
        tenantId: 'cep',
        legalEntityId: 'entity-santa-cruz',
        campusId: 'campus-santa-cruz',
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
        id: 'assignment-norte',
        tenantId: 'cep',
        legalEntityId: 'entity-norte',
        staffId: 'teacher-shared',
        campusIds: ['campus-norte'],
        status: 'validated',
      },
      {
        id: 'assignment-santa-cruz',
        tenantId: 'cep',
        legalEntityId: 'entity-santa-cruz',
        staffId: 'teacher-shared',
        campusIds: ['campus-santa-cruz'],
        status: 'validated',
      },
      {
        id: 'assignment-sur',
        tenantId: 'cep',
        legalEntityId: 'entity-sur',
        staffId: 'teacher-shared',
        campusIds: ['campus-sur'],
        status: 'proposed',
      },
    ],
    accountingConnections: [],
  },
  courses: [{ id: 'course-shared', tenantId: 'cep' }],
  teachers: [{ id: 'teacher-shared', tenantId: 'cep' }],
  classrooms: [
    {
      id: 'classroom-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
    },
    {
      id: 'classroom-santa-cruz',
      tenantId: 'cep',
      legalEntityId: 'entity-santa-cruz',
      campusId: 'campus-santa-cruz',
    },
    {
      id: 'classroom-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
    },
  ],
  courseRuns: [
    {
      id: 'run-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      courseId: 'course-shared',
      campusId: 'campus-norte',
      classroomId: 'classroom-norte',
      staffAssignmentIds: ['assignment-norte'],
    },
    {
      id: 'run-santa-cruz',
      tenantId: 'cep',
      legalEntityId: 'entity-santa-cruz',
      courseId: 'course-shared',
      campusId: 'campus-santa-cruz',
      classroomId: 'classroom-santa-cruz',
      staffAssignmentIds: ['assignment-santa-cruz'],
    },
    {
      id: 'run-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      courseId: 'course-shared',
      campusId: 'campus-sur',
      classroomId: 'classroom-sur',
      staffAssignmentIds: ['assignment-sur'],
    },
  ],
  enrollments: [
    {
      id: 'enrollment-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      courseRunId: 'run-norte',
    },
  ],
  campaigns: [
    { id: 'campaign-norte', tenantId: 'cep', legalEntityId: 'entity-norte' },
    { id: 'campaign-sur', tenantId: 'cep', legalEntityId: 'entity-sur' },
  ],
  leads: [
    {
      id: 'lead-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      courseId: 'course-shared',
      campusId: 'campus-norte',
      campaignId: 'campaign-norte',
    },
  ],
  advertisingSpends: [
    {
      id: 'spend-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campaignId: 'campaign-norte',
    },
  ],
}

describe('CEP multi-entity operational resource ownership', () => {
  it('allows shared master courses and teachers through independent entity assignments', () => {
    expect(validateMultiEntityResourceOwnership(validResources)).toEqual([])
    expect(() => assertValidMultiEntityResourceOwnership(validResources)).not.toThrow()
  })

  it('fails closed when the underlying entity topology is invalid', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      topology: {
        ...validResources.topology,
        campusBindings: [
          ...validResources.topology.campusBindings,
          {
            id: 'binding-crossed',
            tenantId: 'cep',
            legalEntityId: 'entity-sur',
            campusId: 'campus-norte',
            status: 'proposed',
          },
        ],
      },
    }

    expect(() => assertValidMultiEntityResourceOwnership(input)).toThrow(MultiEntityTopologyError)
  })

  it('rejects a Norte course run using a Sur classroom', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      courseRuns: [
        {
          ...validResources.courseRuns[0]!,
          classroomId: 'classroom-sur',
        },
      ],
    }

    expect(validateMultiEntityResourceOwnership(input)).toContainEqual({
      code: 'classroom_entity_mismatch',
      recordType: 'courseRuns',
      recordId: 'run-norte',
      relatedId: 'classroom-sur',
    })
  })

  it('rejects an enrollment attributed to a different legal entity than its course run', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      enrollments: [
        {
          ...validResources.enrollments[0]!,
          legalEntityId: 'entity-sur',
        },
      ],
    }

    expect(validateMultiEntityResourceOwnership(input)).toContainEqual({
      code: 'course_run_entity_mismatch',
      recordType: 'enrollments',
      recordId: 'enrollment-norte',
      relatedId: 'run-norte',
    })
  })

  it('rejects cross-entity campus and campaign references on a lead', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      leads: [
        {
          ...validResources.leads[0]!,
          campusId: 'campus-sur',
          campaignId: 'campaign-sur',
        },
      ],
    }

    expect(validateMultiEntityResourceOwnership(input)).toEqual(
      expect.arrayContaining([
        {
          code: 'campus_out_of_entity',
          recordType: 'leads',
          recordId: 'lead-norte',
          relatedId: 'campus-sur',
        },
        {
          code: 'campaign_entity_mismatch',
          recordType: 'leads',
          recordId: 'lead-norte',
          relatedId: 'campaign-sur',
        },
      ])
    )
  })

  it('rejects advertising spend linked to another entity campaign', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      advertisingSpends: [
        {
          ...validResources.advertisingSpends[0]!,
          campaignId: 'campaign-sur',
        },
      ],
    }

    expect(validateMultiEntityResourceOwnership(input)).toContainEqual({
      code: 'campaign_entity_mismatch',
      recordType: 'advertisingSpends',
      recordId: 'spend-norte',
      relatedId: 'campaign-sur',
    })
  })

  it('rejects a course run using a teacher assignment from another entity and campus', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      courseRuns: [
        {
          ...validResources.courseRuns[0]!,
          staffAssignmentIds: ['assignment-sur'],
        },
      ],
    }

    expect(validateMultiEntityResourceOwnership(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'staff_assignment_entity_mismatch' }),
        expect.objectContaining({ code: 'staff_assignment_campus_mismatch' }),
      ])
    )
  })

  it('fails closed on missing references, tenant mismatch and duplicate IDs', () => {
    const input: MultiEntityOperationalResources = {
      ...validResources,
      courses: [validResources.courses[0]!, validResources.courses[0]!],
      classrooms: [
        {
          ...validResources.classrooms[0]!,
          tenantId: 'other-tenant',
          campusId: 'missing-campus',
        },
      ],
      courseRuns: [
        {
          ...validResources.courseRuns[0]!,
          courseId: 'missing-course',
          classroomId: 'missing-classroom',
          staffAssignmentIds: ['missing-assignment'],
        },
      ],
    }

    const issues = validateMultiEntityResourceOwnership(input)
    expect(issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'duplicate_record_id',
        'tenant_mismatch',
        'campus_missing',
        'course_missing',
        'classroom_missing',
        'staff_assignment_missing',
      ])
    )
    expect(() => assertValidMultiEntityResourceOwnership(input)).toThrow(
      MultiEntityResourceOwnershipError
    )
  })

  it('allows online course runs without campus or classroom but rejects a classroom without campus', () => {
    const onlineRun = {
      ...validResources.courseRuns[0]!,
      campusId: null,
      classroomId: null,
      staffAssignmentIds: [],
    }
    expect(
      validateMultiEntityResourceOwnership({ ...validResources, courseRuns: [onlineRun] })
    ).toEqual([])

    expect(
      validateMultiEntityResourceOwnership({
        ...validResources,
        courseRuns: [{ ...onlineRun, classroomId: 'classroom-norte' }],
      })
    ).toContainEqual({
      code: 'classroom_requires_campus',
      recordType: 'courseRuns',
      recordId: 'run-norte',
      relatedId: 'classroom-norte',
    })
  })

  it('returns only issue codes and record identifiers, never business payload fields', () => {
    const issues = validateMultiEntityResourceOwnership({
      ...validResources,
      leads: [{ ...validResources.leads[0]!, campaignId: 'missing-campaign' }],
    })

    expect(JSON.stringify(issues)).toBe(
      '[{"code":"campaign_missing","recordType":"leads","recordId":"lead-norte","relatedId":"missing-campaign"}]'
    )
  })
})
